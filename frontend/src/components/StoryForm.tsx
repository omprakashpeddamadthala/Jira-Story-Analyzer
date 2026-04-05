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
  Psychology as AnalyzeIcon,
  Stop as StopIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import type { JiraStory, AnalyzeStoryRequest, AnalyzedStory, StreamingState, AnalysisSectionKey } from '../types';
import { analysisApi } from '../services/api';
import { colors } from '../theme/theme';

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
          bgcolor: colors.surfaceContainer,
          border: `2px dashed ${colors.outlineVariant}40`,
        }}
      >
        <CardContent>
          <Box textAlign="center" py={4}>
            <PsychologyIcon
              sx={{
                fontSize: 72,
                color: colors.primary,
                mb: 2,
                opacity: 0.6,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 700,
                color: colors.onSurface,
                mb: 1,
              }}
            >
              Ready to Analyze
            </Typography>
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
              Select a Jira story to generate a Copilot prompt
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
          boxShadow: `0 0 24px ${colors.primaryContainer}40`,
          border: `1px solid ${colors.primary}30`,
        }),
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Breadcrumb-like header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: colors.onSurfaceVariant,
              }}
            >
              Analyzer
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: colors.onSurfaceVariant }}>{'>'}</Typography>
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: colors.primary,
              }}
            >
              {selectedStory.key}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: colors.onSurface,
              lineHeight: 1.3,
              fontSize: '1.3rem',
            }}
          >
            {title || selectedStory.summary}
          </Typography>
        </Box>

        {error && (
          <Fade in>
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                sx={{ py: 1.2 }}
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
                    sx={{ color: colors.primary }}
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
                    <AnalyzeIcon sx={{ fontSize: 24, color: colors.primary }} />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 600 }}>
                  Generating Copilot Prompt with {streaming.provider || 'AI'}...
                </Typography>
                <Typography variant="caption" sx={{ color: colors.onSurfaceVariant }}>
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
              startIcon={<PsychologyIcon sx={{ transition: 'transform 0.2s' }} />}
              sx={{
                py: 1.5,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryContainer} 100%)`,
                color: colors.onPrimary,
                fontWeight: 700,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                boxShadow: `0 4px 20px ${colors.primary}30`,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 8px 28px ${colors.primary}40`,
                  '& .MuiSvgIcon-root': { transform: 'rotate(12deg)' },
                },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Analyze with OpenAI
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
