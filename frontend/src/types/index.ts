export interface JiraStory {
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  storyType: string;
  acceptanceCriteria?: string;
}

export interface AnalyzeStoryRequest {
  jiraKey: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  definitionOfDone?: string;
}

export interface AnalyzedStory {
  id: string;
  jiraKey: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  definitionOfDone?: string;
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

export interface JiraConfigRequest {
  baseUrl: string;
  email: string;
  /** Blank = keep existing token */
  apiToken?: string;
  /** Jira project key (e.g. "SCRUM"). Empty = all projects. */
  projectKey?: string;
  /** Custom field ID for acceptance criteria (e.g. "customfield_10028"). */
  acceptanceCriteriaField?: string;
}

export interface JiraConfigResponse {
  baseUrl: string;
  email: string;
  apiTokenMasked: string;
  tokenConfigured: boolean;
  projectKey: string;
  acceptanceCriteriaField: string;
}

export interface ConnectionTestResult {
  success: boolean;
  displayName?: string;
  email?: string;
  error?: string;
}

export interface PromptConfigRequest {
  copilotTemplate: string;
}

export interface PromptConfigResponse {
  copilotTemplate: string;
}

// --- Rephrase types ---
export interface RephraseRequest {
  title: string;
  description: string;
  acceptanceCriteria: string;
}

export interface RephraseResponse {
  originalTitle: string;
  originalDescription: string;
  originalAcceptanceCriteria: string;
  rephrasedTitle: string;
  rephrasedDescription: string;
  rephrasedAcceptanceCriteria: string;
  /** Full consolidated refined story output (markdown). */
  refinedStory?: string;
}

// --- Repository scanning types ---
export interface RepoScanRequest {
  folderPath: string;
}

export interface DirectoryStructure {
  name: string;
  topLevelDirs: string[];
  topLevelFiles: string[];
}

export interface RepoInfo {
  name: string;
  path: string;
  languages: string[];
  frameworks: string[];
  packageManager: string;
  entryPoints: string[];
  keyModules: string[];
  structure: DirectoryStructure;
  totalFiles: number;
  totalDirectories: number;
  sourceFiles?: string[];
}

export interface RepoScanResponse {
  folderPath: string;
  totalRepos: number;
  repositories: RepoInfo[];
}

// --- Recommendation types ---
export interface GenerateRecommendationsRequest {
  title: string;
  description: string;
  acceptanceCriteria: string;
  folderPath: string;
  jiraKey?: string;
  /** Full rephrased/refined story text (markdown). When provided, the backend
   *  uses this instead of the raw title/description/acceptanceCriteria fields. */
  rephrasedStory?: string;
}

export interface FileModification {
  filePath: string;
  action: 'modify' | 'create' | 'delete';
  searchContent?: string;
  replaceContent?: string;
}

export interface ChangeRecommendation {
  repo: string;
  files: string[];
  rationale: string;
  risk: string;
  patch?: string;
  fileModifications?: FileModification[];
}

export interface RecommendationResponse {
  summary: string;
  jiraKey?: string;
  impactedRepos: string[];
  changes: ChangeRecommendation[];
}

// --- Apply changes types ---
export interface ChangeItem {
  repo: string;
  repoPath: string;
  files: string[];
  patch?: string;
  rationale: string;
  fileModifications?: FileModification[];
}

export interface ApplyChangesRequest {
  jiraKey: string;
  storyTitle?: string;
  changes: ChangeItem[];
  dryRun: boolean;
}

export interface FileChange {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
}

export interface RepoResult {
  repo: string;
  repoPath: string;
  success: boolean;
  branchName?: string;
  commitHash?: string;
  message: string;
  modifiedFiles: string[];
  fileChanges?: FileChange[];
}

export interface ApplyChangesResponse {
  dryRun: boolean;
  branchName: string;
  results: RepoResult[];
}
