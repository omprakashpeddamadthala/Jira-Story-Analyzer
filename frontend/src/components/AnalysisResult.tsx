import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  SmartToy as CopilotIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { AnalyzedStory, StreamingState } from '../types';
import { colors } from '../theme/theme';

interface AnalysisResultProps {
  result: AnalyzedStory | null;
  streamingState?: StreamingState;
}

function LoadingSkeleton() {
  return (
    <Box
      sx={{
        pt: 2,
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {[90, 75, 85, 60, 80, 70, 65, 90, 50, 75].map((width, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={`${width}%`}
          height={24}
          sx={{
            mb: i === 3 || i === 6 ? 2 : 0.5,
            bgcolor: `${colors.surfaceContainerHighest}80`,
            animation: 'shimmer 1.8s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
            '@keyframes shimmer': {
              '0%': { opacity: 0.3 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 0.3 },
            },
          }}
        />
      ))}
    </Box>
  );
}

const markdownStyles = {
  '& h1': {
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: '"Manrope", sans-serif',
    mt: 2.5,
    mb: 1.5,
    color: colors.onSurface,
  },
  '& h2': {
    fontSize: '1.25rem',
    fontWeight: 600,
    fontFamily: '"Manrope", sans-serif',
    mt: 3,
    mb: 1,
    color: colors.primary,
    pb: 0.5,
    borderBottom: `2px solid ${colors.outlineVariant}30`,
  },
  '& h3': {
    fontSize: '1.1rem',
    fontWeight: 600,
    fontFamily: '"Manrope", sans-serif',
    mt: 2,
    mb: 0.5,
    color: colors.onSurface,
  },
  '& p': { fontSize: '0.95rem', lineHeight: 1.8, mb: 1.5, color: colors.onSurfaceVariant },
  '& ul, & ol': { pl: 3, mb: 1.5 },
  '& li': { fontSize: '0.95rem', lineHeight: 1.8, mb: 0.5, color: colors.onSurfaceVariant },
  '& code': {
    backgroundColor: `${colors.primaryContainer}30`,
    borderRadius: '4px',
    px: 0.8,
    py: 0.2,
    fontSize: '0.85rem',
    fontFamily: '"Fira Code", "Consolas", monospace',
    color: colors.primary,
  },
  '& pre': {
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface,
    borderRadius: '12px',
    p: 2.5,
    overflow: 'auto',
    mb: 2,
    border: `1px solid ${colors.outlineVariant}30`,
    '& code': {
      backgroundColor: 'transparent',
      color: 'inherit',
      p: 0,
    },
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    mb: 2,
    '& th, & td': {
      border: `1px solid ${colors.outlineVariant}40`,
      p: 1.2,
      fontSize: '0.9rem',
      color: colors.onSurfaceVariant,
    },
    '& th': {
      backgroundColor: colors.surfaceContainerHigh,
      fontWeight: 600,
      color: colors.onSurface,
    },
  },
  '& blockquote': {
    borderLeft: `4px solid ${colors.tertiary}`,
    pl: 2,
    ml: 0,
    my: 2,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    backgroundColor: `${colors.tertiaryContainer}15`,
    borderRadius: '0 8px 8px 0',
    py: 1,
  },
  '& hr': { my: 3, borderColor: `${colors.outlineVariant}30` },
  animation: 'slideUp 0.6s ease-out',
  '@keyframes slideUp': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

export default function AnalysisResult({ result, streamingState }: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);

  const isStreaming = streamingState?.isStreaming ?? false;
  const streamSections = streamingState?.sections ?? {};
  const activeSection = streamingState?.activeSection ?? null;

  const copilotContent: string | null =
    (streamSections.copilotPrompt as string) || result?.copilotPrompt || null;

  const isLoading = isStreaming && activeSection === 'copilotPrompt';
  const hasContent = !!copilotContent || isLoading;

  if (!hasContent && !result) {
    return null;
  }

  const handleCopy = async () => {
    if (!copilotContent) return;
    try {
      await navigator.clipboard.writeText(copilotContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <Fade in timeout={500}>
      <Card
        sx={{
          transition: 'all 0.4s ease',
          overflow: 'visible',
          ...(isStreaming
            ? {
                boxShadow: `0 0 32px ${colors.primaryContainer}40`,
                border: `1px solid ${colors.primary}30`,
              }
            : {}),
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2.5}
            flexWrap="wrap"
            gap={2}
            sx={{
              pb: 2,
              borderBottom: `1px solid ${colors.outlineVariant}20`,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryContainer} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CopilotIcon sx={{ color: colors.onPrimary, fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: colors.onSurface,
                  }}
                >
                  Copilot Implementation Prompt
                </Typography>
                <Box display="flex" gap={0.8} mt={0.5}>
                  {result && (
                    <Chip
                      label={result.jiraKey}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: `${colors.primary}20`,
                        color: colors.primary,
                        border: `1px solid ${colors.primary}30`,
                      }}
                    />
                  )}
                  {streamingState?.provider && (
                    <Chip
                      label={streamingState.provider}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, borderColor: colors.outlineVariant, color: colors.onSurfaceVariant }}
                    />
                  )}
                  {result?.createdAt && (
                    <Chip
                      label={new Date(result.createdAt).toLocaleString()}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', borderColor: colors.outlineVariant, color: colors.onSurfaceVariant }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {copilotContent && (
              <Button
                variant="contained"
                startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                onClick={handleCopy}
                sx={{
                  minWidth: 180,
                  py: 1,
                  fontWeight: 700,
                  background: copied
                    ? 'linear-gradient(135deg, #36B37E 0%, #00875A 100%)'
                    : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryContainer} 100%)`,
                  color: colors.onPrimary,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 16px ${colors.primary}40`,
                  },
                }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Full Prompt'}
              </Button>
            )}
          </Box>

          {/* Content */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : copilotContent ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: colors.surfaceContainerLow,
                borderRadius: 3,
                border: `1px solid ${colors.outlineVariant}20`,
                maxHeight: '70vh',
                overflow: 'auto',
              }}
            >
              <Box sx={markdownStyles}>
                <ReactMarkdown>{copilotContent}</ReactMarkdown>
              </Box>
            </Paper>
          ) : (
            <Box textAlign="center" py={4}>
              <CopilotIcon sx={{ fontSize: 48, color: colors.outlineVariant, mb: 1 }} />
              <Typography sx={{ color: colors.onSurfaceVariant }}>
                No Copilot prompt generated yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
}
