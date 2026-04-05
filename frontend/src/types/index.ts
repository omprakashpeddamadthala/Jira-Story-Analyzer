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
  copilotPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export type AnalysisSectionKey = 'copilotPrompt';

export interface StreamingState {
  isStreaming: boolean;
  activeSection: AnalysisSectionKey | null;
  completedSections: AnalysisSectionKey[];
  sections: Partial<Record<AnalysisSectionKey, string>>;
  error: string | null;
  provider: string | null;
}

export interface StreamingCallbacks {
  onStart?: (data: { jiraKey: string; provider: string }) => void;
  onSectionStart?: (section: string, label: string) => void;
  onSectionComplete?: (section: string, content: string) => void;
  onComplete?: (data: { id: string; jiraKey: string; createdAt: string; updatedAt: string }) => void;
  onError?: (message: string) => void;
}
