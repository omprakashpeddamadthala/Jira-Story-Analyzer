import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Fade,
} from '@mui/material';
import { colors } from '../theme/theme';
import AnalysisHistory from '../components/AnalysisHistory';
import AnalysisResult from '../components/AnalysisResult';
import type { AnalyzedStory } from '../types';

export default function HistoryPage() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalyzedStory | null>(null);
  const [refreshTrigger] = useState(0);

  const handleSelectAnalysis = useCallback((result: AnalyzedStory) => {
    setSelectedAnalysis(result);
  }, []);

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
          Analysis History
        </Typography>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
          Browse and review your previously analyzed stories
        </Typography>
      </Box>

      {/* History List */}
      <AnalysisHistory
        onSelectAnalysis={handleSelectAnalysis}
        refreshTrigger={refreshTrigger}
      />

      {/* Selected Analysis Result */}
      {selectedAnalysis && (
        <Fade in timeout={600}>
          <Box>
            <AnalysisResult result={selectedAnalysis} />
          </Box>
        </Fade>
      )}
    </Box>
  );
}
