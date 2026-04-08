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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PlayArrow as ApplyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  DryCleaningOutlined as DryRunIcon,
} from '@mui/icons-material';
import type { ChangeItem, ApplyChangesResponse } from '../types';
import { changesApi } from '../services/api';
import { colors } from '../theme/theme';

interface ApplyChangesPanelProps {
  jiraKey: string;
  changes: ChangeItem[];
  onComplete?: (result: ApplyChangesResponse) => void;
}

export default function ApplyChangesPanel({ jiraKey, changes, onComplete }: ApplyChangesPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyChangesResponse | null>(null);
  const [dryRun, setDryRun] = useState(true);

  const handleApply = async () => {
    if (changes.length === 0) {
      setError('No changes to apply');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await changesApi.apply({
        jiraKey,
        changes,
        dryRun,
      });
      setResult(response);
      onComplete?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card sx={{ border: `1px solid ${alpha(colors.tertiary, 0.3)}` }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <ApplyIcon sx={{ color: colors.tertiary, fontSize: 22 }} />
              <Typography
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: colors.onSurface,
                }}
              >
                Apply Changes
              </Typography>
              <Chip
                label={`${changes.length} change${changes.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{ fontWeight: 600, bgcolor: alpha(colors.tertiary, 0.1), color: colors.tertiary }}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={loading}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <DryRunIcon sx={{ fontSize: 16, color: colors.onSurfaceVariant }} />
                  <Typography sx={{ fontSize: '0.78rem', color: colors.onSurfaceVariant }}>Dry Run</Typography>
                </Box>
              }
            />
          </Box>

          <Typography sx={{ fontSize: '0.82rem', color: colors.onSurfaceVariant, mb: 2 }}>
            {dryRun
              ? 'Preview what would change without modifying any files'
              : 'Apply changes directly to the codebase (creates a new branch)'}
          </Typography>

          <Button
            variant="contained"
            onClick={handleApply}
            disabled={loading || changes.length === 0}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ApplyIcon />}
            fullWidth
            sx={{
              py: 1.2,
              fontWeight: 700,
              borderRadius: '12px',
              background: dryRun
                ? `linear-gradient(135deg, ${colors.info} 0%, #42A5F5 100%)`
                : `linear-gradient(135deg, ${colors.success} 0%, #66BB6A 100%)`,
              color: '#fff',
            }}
          >
            {loading
              ? dryRun ? 'Running Dry Run...' : 'Applying Changes...'
              : dryRun ? 'Run Dry Run' : 'Apply Changes'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Fade in>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Fade>
      )}

      {result && (
        <Fade in timeout={400}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: colors.onSurface,
                  }}
                >
                  {result.dryRun ? 'Dry Run Results' : 'Apply Results'}
                </Typography>
                {result.dryRun && (
                  <Chip label="DRY RUN" size="small" sx={{ bgcolor: alpha(colors.info, 0.1), color: colors.info, fontWeight: 700 }} />
                )}
              </Box>

              {result.branchName && (
                <Typography sx={{ fontSize: '0.82rem', color: colors.onSurfaceVariant, mb: 1.5 }}>
                  Branch: <strong>{result.branchName}</strong>
                </Typography>
              )}

              {result.results.map((repoResult, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(repoResult.success ? colors.success : colors.error, 0.3)}`,
                    bgcolor: alpha(repoResult.success ? colors.success : colors.error, 0.04),
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    {repoResult.success ? (
                      <SuccessIcon sx={{ color: colors.success, fontSize: 18 }} />
                    ) : (
                      <ErrorIcon sx={{ color: colors.error, fontSize: 18 }} />
                    )}
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: colors.onSurface }}>
                      {repoResult.repo}
                    </Typography>
                    {repoResult.branchName && (
                      <Chip label={repoResult.branchName} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: colors.onSurfaceVariant,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                    }}
                  >
                    {repoResult.message}
                  </Typography>
                  {repoResult.modifiedFiles.length > 0 && (
                    <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.75}>
                      {repoResult.modifiedFiles.map((file) => (
                        <Chip key={file} label={file} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.62rem' }} />
                      ))}
                    </Box>
                  )}
                  {repoResult.commitHash && (
                    <Typography sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant, mt: 0.5 }}>
                      Commit: {repoResult.commitHash}
                    </Typography>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
}
