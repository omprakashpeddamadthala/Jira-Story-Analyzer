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
import { alpha } from '@mui/material/styles';
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  SmartToy as CopilotIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { AnalyzedStory, StreamingState } from '../types';
import { colors, gradients } from '../theme/theme';

interface AnalysisResultProps {
  result: AnalyzedStory | null;
  streamingState?: StreamingState;
}

function LoadingSkeleton() {
  return (
    <Box sx={{ pt: 2 }}>
      {[92, 78, 88, 45, 82, 72, 68, 90, 55, 78].map((width, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={`${width}%`}
          height={22}
          sx={{
            mb: i === 3 || i === 6 ? 2.5 : 0.5,
            bgcolor: alpha(colors.surfaceContainerHighest, 0.5),
            borderRadius: 1,
            animation: 'shimmer 2s ease-in-out infinite',
            animationDelay: `${i * 0.08}s`,
            '@keyframes shimmer': {
              '0%': { opacity: 0.25 },
              '50%': { opacity: 0.6 },
              '100%': { opacity: 0.25 },
            },
          }}
        />
      ))}
    </Box>
  );
}

const markdownStyles = {
  '& h1': {
    fontSize: '1.4rem',
    fontWeight: 700,
    fontFamily: '"Manrope", sans-serif',
    mt: 2.5,
    mb: 1.5,
    color: colors.onSurface,
    letterSpacing: '-0.02em',
  },
  '& h2': {
    fontSize: '1.2rem',
    fontWeight: 600,
    fontFamily: '"Manrope", sans-serif',
    mt: 3,
    mb: 1,
    color: colors.primary,
    pb: 0.75,
    borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.2)}`,
    letterSpacing: '-0.015em',
  },
  '& h3': {
    fontSize: '1.05rem',
    fontWeight: 600,
    fontFamily: '"Manrope", sans-serif',
    mt: 2,
    mb: 0.75,
    color: colors.onSurface,
    letterSpacing: '-0.01em',
  },
  '& p': {
    fontSize: '0.92rem',
    lineHeight: 1.8,
    mb: 1.5,
    color: colors.onSurfaceVariant,
  },
  '& ul, & ol': { pl: 3, mb: 1.5 },
  '& li': {
    fontSize: '0.92rem',
    lineHeight: 1.8,
    mb: 0.5,
    color: colors.onSurfaceVariant,
    '&::marker': { color: colors.primary },
  },
  '& code': {
    backgroundColor: alpha(colors.primaryContainer, 0.2),
    borderRadius: '6px',
    px: 0.8,
    py: 0.2,
    fontSize: '0.84rem',
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    color: colors.primary,
    border: `1px solid ${alpha(colors.primary, 0.1)}`,
  },
  '& pre': {
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurface,
    borderRadius: '12px',
    p: 2.5,
    overflow: 'auto',
    mb: 2,
    border: `1px solid ${alpha(colors.outlineVariant, 0.15)}`,
    '& code': {
      backgroundColor: 'transparent',
      color: 'inherit',
      p: 0,
      border: 'none',
    },
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    mb: 2,
    borderRadius: '8px',
    overflow: 'hidden',
    '& th, & td': {
      border: `1px solid ${alpha(colors.outlineVariant, 0.2)}`,
      p: 1.2,
      fontSize: '0.88rem',
      color: colors.onSurfaceVariant,
    },
    '& th': {
      backgroundColor: alpha(colors.surfaceContainerHigh, 0.8),
      fontWeight: 600,
      color: colors.onSurface,
      fontSize: '0.85rem',
    },
  },
  '& blockquote': {
    borderLeft: `3px solid ${colors.tertiary}`,
    pl: 2,
    ml: 0,
    my: 2,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    backgroundColor: alpha(colors.tertiaryContainer, 0.15),
    borderRadius: '0 10px 10px 0',
    py: 1,
    pr: 2,
  },
  '& hr': {
    my: 3,
    borderColor: alpha(colors.outlineVariant, 0.15),
    borderStyle: 'solid',
  },
  '& a': {
    color: colors.primary,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
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
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'visible',
          ...(isStreaming && {
            boxShadow: `0 0 32px ${alpha(colors.primary, 0.12)}`,
            borderColor: alpha(colors.primary, 0.25),
          }),
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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
              borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.15)}`,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  background: gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 2px 8px ${alpha(colors.primary, 0.3)}`,
                }}
              >
                <CopilotIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: colors.onSurface,
                    fontSize: '1rem',
                  }}
                >
                  Copilot Implementation Prompt
                </Typography>
                <Box display="flex" gap={0.75} mt={0.5} flexWrap="wrap">
                  {result && (
                    <Chip
                      label={result.jiraKey}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(colors.primary, 0.12),
                        color: colors.primary,
                        height: 24,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                  {streamingState?.provider && (
                    <Chip
                      label={streamingState.provider}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, height: 24, fontSize: '0.7rem' }}
                    />
                  )}
                  {result?.createdAt && (
                    <Chip
                      label={new Date(result.createdAt).toLocaleString()}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 24 }}
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
                size="small"
                sx={{
                  minWidth: 160,
                  py: 0.9,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  background: copied
                    ? `linear-gradient(135deg, ${colors.success} 0%, ${colors.successContainer} 100%)`
                    : gradients.primary,
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 4px 16px ${alpha(colors.primary, 0.3)}`,
                  },
                }}
              >
                {copied ? 'Copied!' : 'Copy Prompt'}
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
                p: { xs: 2, md: 3 },
                bgcolor: alpha(colors.surfaceContainerLow, 0.6),
                borderRadius: 3,
                border: `1px solid ${alpha(colors.outlineVariant, 0.12)}`,
                maxHeight: '70vh',
                overflow: 'auto',
              }}
            >
              <Box sx={markdownStyles}>
                <ReactMarkdown>{copilotContent}</ReactMarkdown>
              </Box>
            </Paper>
          ) : (
            <Box textAlign="center" py={5}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  bgcolor: alpha(colors.onSurfaceVariant, 0.06),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <CopilotIcon sx={{ fontSize: 28, color: alpha(colors.onSurfaceVariant, 0.4) }} />
              </Box>
              <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
                No Copilot prompt generated yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
}
