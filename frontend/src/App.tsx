import { useState, useCallback } from 'react';
import {
  AppBar,
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
  CssBaseline,
  Fade,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
  RocketLaunch as LogoIcon,
  Code as CodeIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import theme from './theme/theme';
import StoryList from './components/StoryList';
import StoryForm from './components/StoryForm';
import AnalysisResult from './components/AnalysisResult';
import AnalysisHistory from './components/AnalysisHistory';
import type { JiraStory, AnalyzedStory, StreamingState } from './types';

function App() {
  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedStory | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);

  const handleSelectStory = useCallback((story: JiraStory) => {
    setSelectedStory(story);
    setAnalysisResult(null);
    setStreamingState(null);
  }, []);

  const handleAnalysisComplete = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleSelectAnalysis = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
    setStreamingState(null);
  }, []);

  const handleStreamingUpdate = useCallback((state: StreamingState) => {
    setStreamingState(state);
  }, []);

  const showResults = analysisResult || (streamingState && (streamingState.isStreaming || streamingState.completedSections.length > 0));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Professional AppBar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #0747A6 0%, #6554C0 50%, #403294 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Toolbar sx={{ py: 0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <LogoIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontSize: '1.15rem',
              }}
            >
              Jira Story Analyzer
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.5,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <CodeIcon sx={{ fontSize: 16, opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                AI-Powered Copilot Prompt Generator
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container
          maxWidth="xl"
          sx={{
            mt: 3,
            mb: 3,
            flex: 1,
            animation: 'fadeIn 0.6s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Grid container spacing={3}>
            {/* Left Panel - Story List */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ height: 'calc(100vh - 180px)' }}>
                <StoryList
                  onSelectStory={handleSelectStory}
                  selectedStoryKey={selectedStory?.key ?? null}
                />
              </Box>
            </Grid>

            {/* Center Panel - Story Form */}
            <Grid size={{ xs: 12, md: 4 }}>
              <StoryForm
                selectedStory={selectedStory}
                onAnalysisComplete={handleAnalysisComplete}
                onStreamingUpdate={handleStreamingUpdate}
              />
            </Grid>

            {/* Right Panel - History */}
            <Grid size={{ xs: 12, md: 5 }}>
              <AnalysisHistory
                onSelectAnalysis={handleSelectAnalysis}
                refreshTrigger={refreshTrigger}
              />
            </Grid>

            {/* Full Width - Analysis Results */}
            {showResults && (
              <Grid size={{ xs: 12 }}>
                <Fade in timeout={600}>
                  <Box>
                    <AnalysisResult
                      result={analysisResult}
                      streamingState={streamingState ?? undefined}
                    />
                  </Box>
                </Fade>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2.5,
            px: 3,
            background: 'linear-gradient(135deg, #0747A6 0%, #6554C0 50%, #403294 100%)',
            color: 'white',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={0.8}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>
              Crafted with
            </Typography>
            <HeartIcon
              sx={{
                fontSize: 16,
                color: '#FF5630',
                animation: 'heartbeat 1.5s ease-in-out infinite',
                '@keyframes heartbeat': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.2)' },
                },
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>
              by
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                letterSpacing: '0.05em',
                background: 'linear-gradient(90deg, #4C9AFF, #998DD9, #FF5630)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Developer Thor Team
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', mt: 0.5 }}>
            Jira Story Analyzer &bull; AI-Powered Development Assistant
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
