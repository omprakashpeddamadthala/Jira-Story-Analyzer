import { useState, useCallback } from 'react';
import {
  AppBar,
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
  CssBaseline,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { AutoAwesome as LogoIcon } from '@mui/icons-material';
import theme from './theme/theme';
import StoryList from './components/StoryList';
import StoryForm from './components/StoryForm';
import AnalysisResult from './components/AnalysisResult';
import AnalysisHistory from './components/AnalysisHistory';
import type { JiraStory, AnalyzedStory } from './types';

function App() {
  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedStory | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectStory = useCallback((story: JiraStory) => {
    setSelectedStory(story);
    setAnalysisResult(null);
  }, []);

  const handleAnalysisComplete = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleSelectAnalysis = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <LogoIcon sx={{ mr: 1.5 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Jira Story Analyzer
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              AI-Powered Development Assistant
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3, mb: 3, flex: 1 }}>
          <Grid container spacing={3}>
            {/* Left Panel - Story List */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ height: 'calc(100vh - 150px)' }}>
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
            {analysisResult && (
              <Grid size={{ xs: 12 }}>
                <AnalysisResult result={analysisResult} />
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
