import axios from 'axios';
import type {
  ApiResponse, JiraStory, AnalyzeStoryRequest, AnalyzedStory, StreamingCallbacks,
  RephraseRequest, RephraseResponse,
  RepoScanResponse,
  GenerateRecommendationsRequest, RecommendationResponse,
  ApplyChangesRequest, ApplyChangesResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const jiraApi = {
  fetchAssignedStories: async (): Promise<JiraStory[]> => {
    const response = await apiClient.get<ApiResponse<JiraStory[]>>('/jira/stories');
    return response.data.data;
  },

  fetchStoryByKey: async (key: string): Promise<JiraStory> => {
    const response = await apiClient.get<ApiResponse<JiraStory>>(`/jira/stories/${key}`);
    return response.data.data;
  },
};

export const analysisApi = {
  analyzeStory: async (request: AnalyzeStoryRequest): Promise<AnalyzedStory> => {
    const response = await apiClient.post<ApiResponse<AnalyzedStory>>('/analysis/analyze', request);
    return response.data.data;
  },

  analyzeStoryStreaming: (request: AnalyzeStoryRequest, callbacks: StreamingCallbacks): (() => void) => {
    const abortController = new AbortController();

    fetch(`${API_BASE_URL}/api/v1/analysis/analyze/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let eventName = '';
        let eventData = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              eventData = line.slice(5).trim();
            } else if (line === '' && eventName && eventData) {
              try {
                const parsed = JSON.parse(eventData);
                switch (eventName) {
                  case 'start':
                    callbacks.onStart?.(parsed);
                    break;
                  case 'section-start':
                    callbacks.onSectionStart?.(parsed.section, parsed.label);
                    break;
                  case 'section-complete':
                    callbacks.onSectionComplete?.(parsed.section, parsed.content);
                    break;
                  case 'complete':
                    callbacks.onComplete?.(parsed);
                    break;
                  case 'error':
                    callbacks.onError?.(parsed.message);
                    break;
                }
              } catch {
                // Skip malformed events
              }
              eventName = '';
              eventData = '';
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          callbacks.onError?.(err.message || 'Streaming failed');
        }
      });

    return () => abortController.abort();
  },

  getAllAnalyzedStories: async (): Promise<AnalyzedStory[]> => {
    const response = await apiClient.get<ApiResponse<AnalyzedStory[]>>('/analysis/stories');
    return response.data.data;
  },

  getAnalyzedStoryById: async (id: string): Promise<AnalyzedStory> => {
    const response = await apiClient.get<ApiResponse<AnalyzedStory>>(`/analysis/stories/${id}`);
    return response.data.data;
  },

  deleteAnalyzedStory: async (id: string): Promise<void> => {
    await apiClient.delete(`/analysis/stories/${id}`);
  },

  rephrase: async (request: RephraseRequest): Promise<RephraseResponse> => {
    const response = await apiClient.post<ApiResponse<RephraseResponse>>('/analysis/rephrase', request);
    return response.data.data;
  },
};

export const repoApi = {
  scanFolder: async (folderPath: string): Promise<RepoScanResponse> => {
    const response = await apiClient.post<ApiResponse<RepoScanResponse>>('/repos/scan', { folderPath });
    return response.data.data;
  },

  getCachedScan: async (folderPath: string): Promise<RepoScanResponse | null> => {
    const response = await apiClient.get<ApiResponse<RepoScanResponse>>('/repos/scan', {
      params: { folderPath },
    });
    return response.data.success ? response.data.data : null;
  },
};

export const recommendationApi = {
  generate: async (request: GenerateRecommendationsRequest): Promise<RecommendationResponse> => {
    const response = await apiClient.post<ApiResponse<RecommendationResponse>>('/recommendations/generate', request);
    return response.data.data;
  },
};

export const changesApi = {
  apply: async (request: ApplyChangesRequest): Promise<ApplyChangesResponse> => {
    const response = await apiClient.post<ApiResponse<ApplyChangesResponse>>('/changes/apply', request);
    return response.data.data;
  },
};
