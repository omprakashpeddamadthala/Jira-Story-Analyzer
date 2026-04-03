export interface JiraStory {
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  storyType: string;
}

export interface AnalyzeStoryRequest {
  jiraKey: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  definitionOfDone: string;
}

export interface AnalyzedStory {
  id: string;
  jiraKey: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  definitionOfDone: string;
  simplifiedSummary: string;
  implementationPlan: string;
  apiContracts: string;
  testSuggestions: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
