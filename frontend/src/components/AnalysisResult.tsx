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
  '& h1': { fontSize: '1.5rem', fontWeight: 700, mt: 2.5, mb: 1.5, color: '#1a1a2e' },
  '& h2': {
    fontSize: '1.25rem',
    fontWeight: 600,
    mt: 3,
    mb: 1,
    color: '#16213e',
    pb: 0.5,
    borderBottom: '2px solid',
    borderColor: 'secondary.light',
  },
  '& h3': { fontSize: '1.1rem', fontWeight: 600, mt: 2, mb: 0.5, color: '#0f3460' },
  '& p': { fontSize: '0.95rem', lineHeight: 1.8, mb: 1.5, color: '#333' },
  '& ul, & ol': { pl: 3, mb: 1.5 },
  '& li': { fontSize: '0.95rem', lineHeight: 1.8, mb: 0.5 },
  '& code': {
    backgroundColor: 'rgba(101, 84, 192, 0.08)',
    borderRadius: '4px',
    px: 0.8,
    py: 0.2,
    fontSize: '0.85rem',
    fontFamily: '"Fira Code", "Consolas", monospace',
    color: '#6554C0',
  },
  '& pre': {
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
    borderRadius: '10px',
    p: 2.5,
    overflow: 'auto',
    mb: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
      border: '1px solid #e0e0e0',
      p: 1.2,
      fontSize: '0.9rem',
    },
    '& th': { backgroundColor: '#f0f0f8', fontWeight: 600, color: '#333' },
  },
  '& blockquote': {
    borderLeft: '4px solid',
    borderColor: 'secondary.main',
    pl: 2,
    ml: 0,
    my: 2,
    color: 'text.secondary',
    fontStyle: 'italic',
    backgroundColor: 'rgba(101, 84, 192, 0.04)',
    borderRadius: '0 8px 8px 0',
    py: 1,
  },
  '& hr': { my: 3, borderColor: 'divider' },
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
                boxShadow: '0 0 24px rgba(101, 84, 192, 0.25)',
                border: '1px solid',
                borderColor: 'secondary.light',
              }
            : {
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                },
              }),
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2.5}
            sx={{
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #6554C0 0%, #0052CC 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CopilotIcon sx={{ color: 'white', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                  Copilot Implementation Prompt
                </Typography>
                <Box display="flex" gap={0.8} mt={0.5}>
                  {result && (
                    <Chip
                      label={result.jiraKey}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #0052CC 0%, #6554C0 100%)',
                        color: 'white',
                      }}
                    />
                  )}
                  {streamingState?.provider && (
                    <Chip
                      label={streamingState.provider}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                  {result?.createdAt && (
                    <Chip
                      label={new Date(result.createdAt).toLocaleString()}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
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
                  borderRadius: 2,
                  py: 1,
                  fontWeight: 700,
                  background: copied
                    ? 'linear-gradient(135deg, #36B37E 0%, #00875A 100%)'
                    : 'linear-gradient(135deg, #6554C0 0%, #403294 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(101, 84, 192, 0.4)',
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
                backgroundColor: '#FAFBFE',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'rgba(101, 84, 192, 0.12)',
                maxHeight: '70vh',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(101, 84, 192, 0.3)',
                  borderRadius: 3,
                },
              }}
            >
              <Box sx={markdownStyles}>
                <ReactMarkdown>{copilotContent}</ReactMarkdown>
              </Box>
            </Paper>
          ) : (
            <Box textAlign="center" py={4}>
              <CopilotIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No Copilot prompt generated yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
}
