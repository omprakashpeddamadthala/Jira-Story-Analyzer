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
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Lightbulb as RecommendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as ApproveIcon,
  CancelOutlined as RejectIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { RecommendationResponse, ChangeRecommendation, RepoScanResponse, ChangeItem } from '../types';
import { recommendationApi } from '../services/api';
import { colors, gradients } from '../theme/theme';

interface RecommendationPanelProps {
  title: string;
  description: string;
  acceptanceCriteria: string;
  jiraKey?: string;
  scanResult: RepoScanResponse | null;
  onApprove?: (changes: ChangeItem[]) => void;
}

export default function RecommendationPanel({
  title,
  description,
  acceptanceCriteria,
  jiraKey,
  scanResult,
  onApprove,
}: RecommendationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set());
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!scanResult) {
      setError('Please scan a folder first');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setApprovedIndices(new Set());
    setRejectedIndices(new Set());

    try {
      const response = await recommendationApi.generate({
        title: title.trim(),
        description: description.trim(),
        acceptanceCriteria: acceptanceCriteria.trim(),
        folderPath: scanResult.folderPath,
        jiraKey,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const toggleApprove = (index: number) => {
    setApprovedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        setRejectedIndices((r) => { const n = new Set(r); n.delete(index); return n; });
      }
      return next;
    });
  };

  const toggleReject = (index: number) => {
    setRejectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        setApprovedIndices((a) => { const n = new Set(a); n.delete(index); return n; });
      }
      return next;
    });
  };

  const handleApproveAll = () => {
    if (!result || !onApprove) return;
    const approved = result.changes
      .filter((_, i) => approvedIndices.has(i))
      .map((change) => {
        const repoInfo = scanResult?.repositories.find((r) => r.name === change.repo);
        return {
          repo: change.repo,
          repoPath: repoInfo?.path ?? '',
          files: change.files,
          patch: change.patch,
          rationale: change.rationale,
        };
      });
    onApprove(approved);
  };

  const approvedCount = approvedIndices.size;
  const canApply = approvedCount > 0 && onApprove;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading || !scanResult || !title.trim()}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RecommendIcon />}
        sx={{
          py: 1.3,
          background: gradients.primary,
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.92rem',
          borderRadius: '12px',
          boxShadow: `0 4px 20px ${alpha(colors.primary, 0.25)}`,
        }}
      >
        {loading ? 'Generating Recommendations...' : 'Generate Recommendations'}
      </Button>

      {error && (
        <Fade in>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Fade>
      )}

      {result && (
        <Fade in timeout={500}>
          <Card sx={{ border: `1px solid ${alpha(colors.primary, 0.2)}` }}>
            <CardContent sx={{ p: 3 }}>
              {/* Summary */}
              <Box mb={2}>
                <Typography
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: colors.onSurface,
                    mb: 1,
                  }}
                >
                  Recommendations Summary
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', color: colors.onSurfaceVariant, lineHeight: 1.7 }}>
                  {result.summary}
                </Typography>
              </Box>

              {/* Impacted Repos */}
              {result.impactedRepos.length > 0 && (
                <Box mb={2}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: colors.onSurfaceVariant, mb: 0.5 }}>
                    Impacted Repositories
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {result.impactedRepos.map((repo) => (
                      <Chip key={repo} label={repo} size="small" sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, fontWeight: 600 }} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Changes */}
              <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: colors.onSurfaceVariant, mb: 1 }}>
                Changes ({result.changes.length})
              </Typography>
              {result.changes.map((change, index) => (
                <ChangeCard
                  key={index}
                  change={change}
                  approved={approvedIndices.has(index)}
                  rejected={rejectedIndices.has(index)}
                  onApprove={() => toggleApprove(index)}
                  onReject={() => toggleReject(index)}
                />
              ))}

              {/* Apply Button */}
              {canApply && (
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleApproveAll}
                    sx={{
                      background: `linear-gradient(135deg, ${colors.success} 0%, #66BB6A 100%)`,
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: '12px',
                      py: 1.2,
                      px: 3,
                    }}
                  >
                    Apply {approvedCount} Approved Change{approvedCount !== 1 ? 's' : ''}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
}

function ChangeCard({
  change,
  approved,
  rejected,
  onApprove,
  onReject,
}: {
  change: ChangeRecommendation;
  approved: boolean;
  rejected: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const riskColor = change.risk === 'high' ? colors.error : change.risk === 'medium' ? colors.tertiary : colors.success;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(
          approved ? colors.success : rejected ? colors.error : colors.outlineVariant,
          approved || rejected ? 0.4 : 0.5
        )}`,
        bgcolor: alpha(
          approved ? colors.success : rejected ? colors.error : colors.surfaceContainer,
          approved || rejected ? 0.04 : 0.3
        ),
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          <CodeIcon sx={{ color: colors.primary, fontSize: 18 }} />
          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: colors.onSurface }}>
            {change.repo}
          </Typography>
          <Chip
            icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
            label={change.risk}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: alpha(riskColor, 0.1),
              color: riskColor,
            }}
          />
        </Box>
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={onApprove} sx={{ color: approved ? colors.success : colors.onSurfaceVariant }}>
            <ApproveIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onReject} sx={{ color: rejected ? colors.error : colors.onSurfaceVariant }}>
            <RejectIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Typography sx={{ fontSize: '0.82rem', color: colors.onSurfaceVariant, mt: 0.5 }}>
        {change.rationale}
      </Typography>

      <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
        {change.files.map((file) => (
          <Chip key={file} label={file} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
        ))}
      </Box>

      <Collapse in={expanded}>
        {change.patch && (
          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              p: 2,
              bgcolor: colors.surfaceContainerLow,
              borderRadius: 2,
              border: `1px solid ${alpha(colors.outlineVariant, 0.3)}`,
              overflow: 'auto',
              maxHeight: 300,
            }}
          >
            <Typography
              component="pre"
              sx={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '0.78rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: colors.onSurface,
                m: 0,
              }}
            >
              {change.patch}
            </Typography>
          </Paper>
        )}
      </Collapse>
    </Paper>
  );
}
