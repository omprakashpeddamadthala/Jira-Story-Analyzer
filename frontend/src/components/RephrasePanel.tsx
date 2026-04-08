import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Chip,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AutoFixHigh as RephraseIcon,
  Check as CheckIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import type { RephraseResponse } from '../types';
import { analysisApi } from '../services/api';
import { colors, gradients } from '../theme/theme';

interface RephrasePanelProps {
  title: string;
  description: string;
  acceptanceCriteria: string;
  onUseRephrased: (title: string, description: string, ac: string) => void;
  disabled?: boolean;
}

export default function RephrasePanel({
  title,
  description,
  acceptanceCriteria,
  onUseRephrased,
  disabled,
}: RephrasePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RephraseResponse | null>(null);

  const handleRephrase = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analysisApi.rephrase({
        title: title.trim(),
        description: description.trim(),
        acceptanceCriteria: acceptanceCriteria.trim(),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rephrase story');
    } finally {
      setLoading(false);
    }
  };

  const handleUseRephrased = () => {
    if (result) {
      onUseRephrased(result.rephrasedTitle, result.rephrasedDescription, result.rephrasedAcceptanceCriteria);
      setResult(null);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        onClick={handleRephrase}
        disabled={loading || disabled || !title.trim() || !description.trim()}
        startIcon={loading ? <CircularProgress size={16} /> : <RephraseIcon />}
        sx={{
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.82rem',
          py: 0.8,
          borderColor: alpha(colors.secondary, 0.5),
          color: colors.secondary,
          '&:hover': {
            borderColor: colors.secondary,
            bgcolor: alpha(colors.secondary, 0.04),
          },
        }}
      >
        {loading ? 'Rephrasing...' : 'Rephrase with AI'}
      </Button>

      {error && (
        <Fade in>
          <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Fade>
      )}

      {result && (
        <Fade in timeout={400}>
          <Card
            sx={{
              mt: 2,
              border: `1px solid ${alpha(colors.secondary, 0.3)}`,
              bgcolor: alpha(colors.secondaryContainer, 0.08),
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CompareIcon sx={{ color: colors.secondary, fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: colors.onSurface,
                    }}
                  >
                    AI Rephrased Version
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleUseRephrased}
                  startIcon={<CheckIcon />}
                  sx={{
                    background: gradients.primary,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: '10px',
                    py: 0.7,
                  }}
                >
                  Use Rephrased
                </Button>
              </Box>

              <ComparisonRow label="Title" original={result.originalTitle} rephrased={result.rephrasedTitle} />
              <Divider sx={{ my: 1.5 }} />
              <ComparisonRow label="Description" original={result.originalDescription} rephrased={result.rephrasedDescription} />
              <Divider sx={{ my: 1.5 }} />
              <ComparisonRow label="Acceptance Criteria" original={result.originalAcceptanceCriteria} rephrased={result.rephrasedAcceptanceCriteria} />
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
}

function ComparisonRow({ label, original, rephrased }: { label: string; original: string; rephrased: string }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: colors.onSurfaceVariant, mb: 0.75 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(colors.error, 0.04),
            border: `1px solid ${alpha(colors.error, 0.12)}`,
          }}
        >
          <Chip label="Original" size="small" sx={{ mb: 0.75, height: 20, fontSize: '0.65rem', bgcolor: alpha(colors.error, 0.1), color: colors.error }} />
          <Typography sx={{ fontSize: '0.84rem', lineHeight: 1.6, color: colors.onSurfaceVariant, whiteSpace: 'pre-wrap' }}>
            {original}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(colors.success, 0.04),
            border: `1px solid ${alpha(colors.success, 0.12)}`,
          }}
        >
          <Chip label="Rephrased" size="small" sx={{ mb: 0.75, height: 20, fontSize: '0.65rem', bgcolor: alpha(colors.success, 0.1), color: colors.success }} />
          <Typography sx={{ fontSize: '0.84rem', lineHeight: 1.6, color: colors.onSurface, whiteSpace: 'pre-wrap' }}>
            {rephrased}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
