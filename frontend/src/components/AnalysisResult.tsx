import { useState } from 'react';
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
} from '@mui/material';
import {
  Summarize as SummaryIcon,
  ListAlt as PlanIcon,
  Api as ApiIcon,
  BugReport as TestIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import type { AnalyzedStory } from '../types';

interface AnalysisResultProps {
  result: AnalyzedStory | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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

function ContentBlock({ content }: { content: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        backgroundColor: '#FAFBFC',
        maxHeight: '60vh',
        overflow: 'auto',
      }}
    >
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <CopyButton text={content} />
      </Box>
      <Typography
        variant="body2"
        component="pre"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: '"Fira Code", "Consolas", monospace',
          fontSize: '0.85rem',
          lineHeight: 1.6,
        }}
      >
        {content}
      </Typography>
    </Paper>
  );
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const [tabValue, setTabValue] = useState(0);

  if (!result) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6">Analysis Results</Typography>
            <Box display="flex" gap={1} mt={0.5}>
              <Chip label={result.jiraKey} size="small" color="primary" />
              <Chip
                label={new Date(result.createdAt).toLocaleString()}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SummaryIcon />} label="Summary" iconPosition="start" />
          <Tab icon={<PlanIcon />} label="Implementation Plan" iconPosition="start" />
          <Tab icon={<ApiIcon />} label="API Contracts" iconPosition="start" />
          <Tab icon={<TestIcon />} label="Test Cases" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ContentBlock content={result.simplifiedSummary} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ContentBlock content={result.implementationPlan} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ContentBlock content={result.apiContracts} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ContentBlock content={result.testSuggestions} />
        </TabPanel>
      </CardContent>
    </Card>
  );
}
