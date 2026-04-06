import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Fade,
} from '@mui/material';
import { colors } from '../theme/theme';
import StoryList from '../components/StoryList';
import StoryForm from '../components/StoryForm';
import AnalysisResult from '../components/AnalysisResult';
import type { JiraStory, AnalyzedStory, StreamingState } from '../types';

export default function AnalyzePage() {
  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedStory | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);

  const handleSelectStory = useCallback((story: JiraStory) => {
    setSelectedStory(story);
    setAnalysisResult(null);
    setStreamingState(null);
  }, []);

  const handleAnalysisComplete = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
  }, []);

  const handleStreamingUpdate = useCallback((state: StreamingState) => {
    setStreamingState(state);
  }, []);

  const showResults = analysisResult || (streamingState && (streamingState.isStreaming || streamingState.completedSections.length > 0));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: colors.onSurface,
            fontSize: { xs: '1.4rem', md: '1.7rem' },
            mb: 0.5,
          }}
        >
          Analyze Story
        </Typography>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
          Select a Jira story, refine details, and generate an implementation prompt
        </Typography>
      </Box>

      {/* Story List + Form */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <Box sx={{ height: { xs: 'auto', md: 'calc(100vh - 240px)' } }}>
          <StoryList
            onSelectStory={handleSelectStory}
            selectedStoryKey={selectedStory?.key ?? null}
          />
        </Box>
        <StoryForm
          selectedStory={selectedStory}
          onAnalysisComplete={handleAnalysisComplete}
          onStreamingUpdate={handleStreamingUpdate}
        />
      </Box>

      {/* Analysis Results */}
      {showResults && (
        <Fade in timeout={600}>
          <Box>
            <AnalysisResult
              result={analysisResult}
              streamingState={streamingState ?? undefined}
            />
          </Box>
        </Fade>
      )}
    </Box>
  );
}
