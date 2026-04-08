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
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Psychology as AnalyzeIcon,
  Stop as StopIcon,
  Psychology as PsychologyIcon,
  ChevronRight as ChevronIcon,
} from '@mui/icons-material';
import type { JiraStory, AnalyzeStoryRequest, AnalyzedStory, StreamingState, AnalysisSectionKey } from '../types';
import { analysisApi } from '../services/api';
import { colors, gradients } from '../theme/theme';
import RephrasePanel from './RephrasePanel';

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
  const selectedStoryAC = selectedStory?.acceptanceCriteria ?? '';

  useEffect(() => {
    if (selectedStoryKey) {
      setTitle(selectedStorySummary);
      setDescription(selectedStoryDesc);
      setAcceptanceCriteria(selectedStoryAC);
      setDefinitionOfDone('');
      setError(null);
    }
  }, [selectedStoryKey, selectedStorySummary, selectedStoryDesc, selectedStoryAC]);

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

    if (!title.trim() || !description.trim() || !acceptanceCriteria.trim()) {
      setError('Title, Description, and Acceptance Criteria are required');
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
      ...(definitionOfDone.trim() ? { definitionOfDone: definitionOfDone.trim() } : {}),
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
          definitionOfDone: request.definitionOfDone ?? '',
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
          border: `2px dashed ${alpha(colors.outlineVariant, 0.25)}`,
          bgcolor: alpha(colors.surfaceContainer, 0.5),
        }}
      >
        <CardContent>
          <Box textAlign="center" py={4}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '20px',
                bgcolor: alpha(colors.primary, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-8px)' },
                },
              }}
            >
              <PsychologyIcon
                sx={{
                  fontSize: 36,
                  color: colors.primary,
                }}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 700,
                color: colors.onSurface,
                mb: 0.75,
                fontSize: '1.2rem',
              }}
            >
              Ready to Analyze
            </Typography>
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem', maxWidth: 280, mx: 'auto' }}>
              Select a Jira story from the list to generate a Copilot prompt
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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(streaming.isStreaming && {
          boxShadow: `0 0 24px ${alpha(colors.primary, 0.15)}`,
          borderColor: alpha(colors.primary, 0.3),
        }),
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Breadcrumb header */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: colors.onSurfaceVariant,
              }}
            >
              Analyzer
            </Typography>
            <ChevronIcon sx={{ fontSize: 14, color: alpha(colors.onSurfaceVariant, 0.5) }} />
            <Chip
              label={selectedStory.key}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: alpha(colors.primary, 0.12),
                color: colors.primary,
              }}
            />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: colors.onSurface,
              lineHeight: 1.3,
              fontSize: '1.2rem',
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
            label="Definition of Done (Optional)"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            size="small"
            placeholder="Enter the definition of done for this story (optional)..."
            disabled={streaming.isStreaming}
          />

          {/* Rephrase with AI */}
          <RephrasePanel
            title={title}
            description={description}
            acceptanceCriteria={acceptanceCriteria}
            onUseRephrased={(t, d, ac) => {
              setTitle(t);
              setDescription(d);
              setAcceptanceCriteria(ac);
            }}
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
                sx={{ py: 1.2, borderRadius: '12px' }}
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
                  animation: 'fadeIn 0.4s ease-out',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(8px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    size={52}
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
                    <AnalyzeIcon sx={{ fontSize: 22, color: colors.primary }} />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.85rem' }}>
                  Generating prompt with {streaming.provider || 'AI'}...
                </Typography>
                <Typography variant="caption" sx={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
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
                mt: 0.5,
                background: gradients.primary,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: '12px',
                boxShadow: `0 4px 20px ${alpha(colors.primary, 0.25)}`,
                '&:hover': {
                  boxShadow: `0 8px 28px ${alpha(colors.primary, 0.35)}`,
                  '& .MuiSvgIcon-root': { transform: 'rotate(12deg)' },
                },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Analyze with AI
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
