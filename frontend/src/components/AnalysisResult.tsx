import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tab,
  Tabs,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  Summarize as SummaryIcon,
  ListAlt as PlanIcon,
  Api as ApiIcon,
  BugReport as TestIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { AnalyzedStory, StreamingState, AnalysisSectionKey } from '../types';

interface AnalysisResultProps {
  result: AnalyzedStory | null;
  streamingState?: StreamingState;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const SECTION_KEYS: AnalysisSectionKey[] = ['simplifiedSummary', 'implementationPlan', 'apiContracts', 'testSuggestions'];

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
      <IconButton size="small" onClick={handleCopy}>
        {copied ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

function StreamingSkeleton() {
  return (
    <Box sx={{ pt: 1 }}>
      <Skeleton variant="text" width="90%" height={24} />
      <Skeleton variant="text" width="75%" height={24} />
      <Skeleton variant="text" width="85%" height={24} />
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="text" width="70%" height={24} />
    </Box>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <Fade in timeout={600}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          backgroundColor: '#FAFBFC',
          maxHeight: '60vh',
          overflow: 'auto',
        }}
      >
        <Box display="flex" justifyContent="flex-end" mb={0.5}>
          <CopyButton text={content} />
        </Box>
        <Box
          sx={{
            '& h1': { fontSize: '1.4rem', fontWeight: 700, mt: 2, mb: 1 },
            '& h2': { fontSize: '1.2rem', fontWeight: 600, mt: 2, mb: 1 },
            '& h3': { fontSize: '1.05rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
            '& p': { fontSize: '0.9rem', lineHeight: 1.7, mb: 1 },
            '& ul, & ol': { pl: 3, mb: 1 },
            '& li': { fontSize: '0.9rem', lineHeight: 1.7, mb: 0.3 },
            '& code': {
              backgroundColor: 'rgba(0,0,0,0.06)',
              borderRadius: '4px',
              px: 0.8,
              py: 0.2,
              fontSize: '0.82rem',
              fontFamily: '"Fira Code", "Consolas", monospace',
            },
            '& pre': {
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: '8px',
              p: 2,
              overflow: 'auto',
              mb: 1.5,
              '& code': {
                backgroundColor: 'transparent',
                color: 'inherit',
                p: 0,
              },
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              mb: 1.5,
              '& th, & td': {
                border: '1px solid #ddd',
                p: 1,
                fontSize: '0.85rem',
              },
              '& th': { backgroundColor: '#f5f5f5', fontWeight: 600 },
            },
            '& blockquote': {
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              color: 'text.secondary',
              fontStyle: 'italic',
            },
            '& hr': { my: 2, borderColor: 'divider' },
            animation: 'fadeInUp 0.5s ease-out',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      </Paper>
    </Fade>
  );
}

export default function AnalysisResult({ result, streamingState }: AnalysisResultProps) {
  const [tabValue, setTabValue] = useState(0);

  const isStreaming = streamingState?.isStreaming ?? false;
  const streamSections = streamingState?.sections ?? {};
  const completedSections = useMemo(() => streamingState?.completedSections ?? [], [streamingState?.completedSections]);
  const activeSection = streamingState?.activeSection ?? null;
  const completedCount = completedSections.length;

  // Auto-switch to the latest completed section's tab during streaming
  const autoTabIndex = useMemo(() => {
    if (completedCount > 0) {
      const latestSection = completedSections[completedCount - 1];
      const idx = SECTION_KEYS.indexOf(latestSection);
      if (idx >= 0) return idx;
    }
    return null;
  }, [completedCount, completedSections]);

  // Use auto tab when streaming, manual tab otherwise
  const effectiveTab = autoTabIndex !== null && isStreaming ? autoTabIndex : tabValue;

  // Determine content source: streaming sections or result from history
  const getContent = (key: AnalysisSectionKey): string | null => {
    if (streamSections[key]) return streamSections[key] as string;
    if (result) return result[key] || null;
    return null;
  };

  const isSectionLoading = (key: AnalysisSectionKey): boolean => {
    return isStreaming && activeSection === key;
  };

  const isSectionAvailable = (key: AnalysisSectionKey): boolean => {
    return !!getContent(key) || isSectionLoading(key);
  };

  const hasAnyContent = SECTION_KEYS.some((key) => getContent(key)) || isStreaming;

  if (!hasAnyContent && !result) {
    return null;
  }

  return (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        ...(isStreaming && {
          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.3)',
        }),
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6">
              Analysis Results
              {isStreaming && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    ml: 1,
                    animation: 'blink 1s ease-in-out infinite',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.2 },
                    },
                  }}
                />
              )}
            </Typography>
            <Box display="flex" gap={1} mt={0.5}>
              {result && <Chip label={result.jiraKey} size="small" color="primary" />}
              {streamingState?.provider && (
                <Chip label={streamingState.provider} size="small" variant="outlined" color="secondary" />
              )}
              {result?.createdAt && (
                <Chip
                  label={new Date(result.createdAt).toLocaleString()}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Tabs
          value={effectiveTab}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<SummaryIcon />}
            label="Summary"
            iconPosition="start"
            disabled={!isSectionAvailable('simplifiedSummary')}
          />
          <Tab
            icon={<PlanIcon />}
            label="Implementation Plan"
            iconPosition="start"
            disabled={!isSectionAvailable('implementationPlan')}
          />
          <Tab
            icon={<ApiIcon />}
            label="API Contracts"
            iconPosition="start"
            disabled={!isSectionAvailable('apiContracts')}
          />
          <Tab
            icon={<TestIcon />}
            label="Test Cases"
            iconPosition="start"
            disabled={!isSectionAvailable('testSuggestions')}
          />
        </Tabs>

        {SECTION_KEYS.map((key, idx) => (
          <TabPanel key={key} value={effectiveTab} index={idx}>
            {isSectionLoading(key) ? (
              <StreamingSkeleton />
            ) : getContent(key) ? (
              <MarkdownContent content={getContent(key) as string} />
            ) : null}
          </TabPanel>
        ))}
      </CardContent>
    </Card>
  );
}
