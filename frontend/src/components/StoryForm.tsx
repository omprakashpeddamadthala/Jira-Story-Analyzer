import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  AutoAwesome as AnalyzeIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import type { JiraStory, AnalyzeStoryRequest, AnalyzedStory, StreamingState, AnalysisSectionKey } from '../types';
import { analysisApi } from '../services/api';

interface StoryFormProps {
  selectedStory: JiraStory | null;
  onAnalysisComplete: (result: AnalyzedStory) => void;
  onStreamingUpdate: (state: StreamingState) => void;
}

const SECTION_LABELS: Record<AnalysisSectionKey, string> = {
  simplifiedSummary: 'Summary',
  implementationPlan: 'Implementation Plan',
  apiContracts: 'API Contracts',
  testSuggestions: 'Test Cases',
  copilotPrompt: 'Copilot Prompt',
};

const ALL_SECTIONS: AnalysisSectionKey[] = ['simplifiedSummary', 'implementationPlan', 'apiContracts', 'testSuggestions', 'copilotPrompt'];

const initialStreamingState: StreamingState = {
  isStreaming: false,
  activeSection: null,
  completedSections: [],
  sections: {},
  error: null,
  provider: null,
};

export default function StoryForm({ selectedStory, onAnalysisComplete, onStreamingUpdate }: StoryFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<StreamingState>(initialStreamingState);
  const abortRef = useRef<(() => void) | null>(null);

  const selectedStoryKey = selectedStory?.key ?? null;
  const selectedStorySummary = selectedStory?.summary ?? '';
  const selectedStoryDesc = selectedStory?.description ?? '';

  useEffect(() => {
    if (selectedStoryKey) {
      setTitle(selectedStorySummary);
      setDescription(selectedStoryDesc);
      setAcceptanceCriteria('');
      setDefinitionOfDone('');
      setError(null);
    }
  }, [selectedStoryKey, selectedStorySummary, selectedStoryDesc]);

  useEffect(() => {
    onStreamingUpdate(streaming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const handleStop = () => {
    abortRef.current?.();
    abortRef.current = null;
    setStreaming((prev) => ({ ...prev, isStreaming: false, activeSection: null }));
  };

  const handleAnalyze = () => {
    if (!selectedStory) return;

    if (!title.trim() || !description.trim() || !acceptanceCriteria.trim() || !definitionOfDone.trim()) {
      setError('All fields are required');
      return;
    }

    setError(null);
    setStreaming({
      isStreaming: true,
      activeSection: null,
      completedSections: [],
      sections: {},
      error: null,
      provider: null,
    });

    const request: AnalyzeStoryRequest = {
      jiraKey: selectedStory.key,
      title: title.trim(),
      description: description.trim(),
      acceptanceCriteria: acceptanceCriteria.trim(),
      definitionOfDone: definitionOfDone.trim(),
    };

    const abort = analysisApi.analyzeStoryStreaming(request, {
      onStart: (data) => {
        setStreaming((prev) => ({ ...prev, provider: data.provider }));
      },
      onSectionStart: (section) => {
        setStreaming((prev) => ({
          ...prev,
          activeSection: section as AnalysisSectionKey,
        }));
      },
      onSectionComplete: (section, content) => {
        setStreaming((prev) => ({
          ...prev,
          activeSection: null,
          completedSections: [...prev.completedSections, section as AnalysisSectionKey],
          sections: { ...prev.sections, [section]: content },
        }));
      },
      onComplete: (data) => {
        setStreaming((prev) => ({ ...prev, isStreaming: false, activeSection: null }));
        abortRef.current = null;
        onAnalysisComplete({
          id: data.id,
          jiraKey: data.jiraKey,
          title: request.title,
          description: request.description,
          acceptanceCriteria: request.acceptanceCriteria,
          definitionOfDone: request.definitionOfDone,
          simplifiedSummary: '',
          implementationPlan: '',
          apiContracts: '',
          testSuggestions: '',
          copilotPrompt: '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      },
      onError: (message) => {
        setStreaming((prev) => ({ ...prev, isStreaming: false, activeSection: null, error: message }));
        setError(message);
        abortRef.current = null;
      },
    });

    abortRef.current = abort;
  };

  const progress = streaming.isStreaming
    ? (streaming.completedSections.length / ALL_SECTIONS.length) * 100
    : streaming.completedSections.length === ALL_SECTIONS.length
    ? 100
    : 0;

  if (!selectedStory) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <Box textAlign="center" py={4}>
            <AnalyzeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select a Jira story to get started
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Choose a story from the list to analyze it with AI
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Analyze Story: {selectedStory.key}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            variant="outlined"
            size="small"
            disabled={streaming.isStreaming}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            size="small"
            disabled={streaming.isStreaming}
          />

          <TextField
            label="Acceptance Criteria"
            value={acceptanceCriteria}
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            size="small"
            placeholder="Enter the acceptance criteria for this story..."
            disabled={streaming.isStreaming}
          />

          <TextField
            label="Definition of Done"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            variant="outlined"
            size="small"
            placeholder="Enter the definition of done for this story..."
            disabled={streaming.isStreaming}
          />

          {streaming.isStreaming ? (
            <Button
              variant="outlined"
              color="error"
              size="large"
              onClick={handleStop}
              startIcon={<StopIcon />}
              sx={{ mt: 1 }}
            >
              Stop Analysis
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleAnalyze}
              startIcon={<AnalyzeIcon />}
              sx={{ mt: 1 }}
            >
              Analyze Story
            </Button>
          )}

          {(streaming.isStreaming || streaming.completedSections.length > 0) && (
            <Box sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {streaming.isStreaming
                    ? `Analyzing with ${streaming.provider || 'AI'}...`
                    : 'Analysis complete'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {streaming.completedSections.length}/{ALL_SECTIONS.length} sections
                </Typography>
              </Box>
              <LinearProgress
                variant={streaming.activeSection ? 'indeterminate' : 'determinate'}
                value={progress}
                sx={{ height: 6, borderRadius: 3, mb: 1 }}
              />
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {ALL_SECTIONS.map((section) => {
                  const isComplete = streaming.completedSections.includes(section);
                  const isActive = streaming.activeSection === section;
                  return (
                    <Chip
                      key={section}
                      label={SECTION_LABELS[section]}
                      size="small"
                      color={isComplete ? 'success' : isActive ? 'primary' : 'default'}
                      variant={isComplete || isActive ? 'filled' : 'outlined'}
                      sx={{
                        fontSize: '0.7rem',
                        ...(isActive && {
                          animation: 'pulse 1.5s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.6 },
                          },
                        }),
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
