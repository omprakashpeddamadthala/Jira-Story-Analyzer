import axios from 'axios';
import type { ApiResponse, JiraConfigRequest, JiraConfigResponse, ConnectionTestResult, PromptConfigRequest, PromptConfigResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export const settingsApi = {
  getJiraConfig: async (): Promise<JiraConfigResponse> => {
    const response = await apiClient.get<ApiResponse<JiraConfigResponse>>('/settings/jira');
    return response.data.data;
  },

  saveJiraConfig: async (config: JiraConfigRequest): Promise<JiraConfigResponse> => {
    const response = await apiClient.put<ApiResponse<JiraConfigResponse>>('/settings/jira', config);
    return response.data.data;
  },

  testJiraConnection: async (config: JiraConfigRequest): Promise<ConnectionTestResult> => {
    const response = await apiClient.post<ApiResponse<ConnectionTestResult>>('/jira/test-connection', config);
    return response.data.data;
  },

  getPromptConfig: async (): Promise<PromptConfigResponse> => {
    const response = await apiClient.get<ApiResponse<PromptConfigResponse>>('/settings/prompts');
    return response.data.data;
  },

  updatePromptConfig: async (config: PromptConfigRequest): Promise<PromptConfigResponse> => {
    const response = await apiClient.put<ApiResponse<PromptConfigResponse>>('/settings/prompts', config);
    return response.data.data;
  },
};
