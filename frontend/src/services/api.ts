import axios from 'axios';
import type { ApiResponse, JiraStory, AnalyzeStoryRequest, AnalyzedStory } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
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
};
