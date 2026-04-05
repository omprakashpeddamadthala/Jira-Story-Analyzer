import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  AutoAwesome as AnalyzeIcon,
  Stop as StopIcon,
  RocketLaunch as RocketIcon,
} from '@mui/icons-material';
import type { JiraStory, AnalyzeStoryRequest, AnalyzedStory, StreamingState, AnalysisSectionKey } from '../types';
import { analysisApi } from '../services/api';

interface StoryFormProps {
  selectedStory: JiraStory | null;
  onAnalysisComplete: (result: AnalyzedStory) => void;
  onStreamingUpdate: (state: StreamingState) => void;
}

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

  if (!selectedStory) {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '2px dashed',
          borderColor: 'divider',
        }}
      >
        <CardContent>
          <Box textAlign="center" py={4}>
            <RocketIcon
              sx={{
                fontSize: 72,
                color: 'primary.light',
                mb: 2,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Ready to Analyze
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select a Jira story from the left panel to generate a Copilot prompt
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        ...(streaming.isStreaming && {
          boxShadow: '0 0 20px rgba(101, 84, 192, 0.2)',
          border: '1px solid',
          borderColor: 'secondary.light',
        }),
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AnalyzeIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Analyze: {selectedStory.key}
          </Typography>
        </Box>

        {error && (
          <Fade in>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          </Fade>
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            variant="outlined"
            size="small"
            disabled={streaming.isStreaming}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            label="Acceptance Criteria"
            value={acceptanceCriteria}
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            variant="outlined"
            size="small"
            placeholder="Enter the acceptance criteria for this story..."
            disabled={streaming.isStreaming}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            label="Definition of Done"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            fullWidth
            required
            multiline
            rows={2}
            variant="outlined"
            size="small"
            placeholder="Enter the definition of done for this story..."
            disabled={streaming.isStreaming}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {streaming.isStreaming ? (
            <Box>
              <Button
                variant="outlined"
                color="error"
                size="large"
                fullWidth
                onClick={handleStop}
                startIcon={<StopIcon />}
                sx={{ borderRadius: 2, py: 1.2 }}
              >
                Stop Analysis
              </Button>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1.5}
                mt={3}
                sx={{
                  animation: 'fadeIn 0.5s ease-out',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    size={56}
                    thickness={3}
                    sx={{
                      color: 'secondary.main',
                      animation: 'spin 1.5s linear infinite',
                      '@keyframes spin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <AnalyzeIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
                  </Box>
                </Box>
                <Typography variant="body2" color="secondary.main" fontWeight={600}>
                  Generating Copilot Prompt with {streaming.provider || 'AI'}...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Analyzing story and building implementation guidance
                </Typography>
              </Box>
            </Box>
          ) : (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleAnalyze}
              startIcon={<RocketIcon />}
              sx={{
                borderRadius: 2,
                py: 1.2,
                background: 'linear-gradient(135deg, #6554C0 0%, #0052CC 100%)',
                fontWeight: 700,
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #403294 0%, #0747A6 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(101, 84, 192, 0.4)',
                },
              }}
            >
              Generate Copilot Prompt
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
