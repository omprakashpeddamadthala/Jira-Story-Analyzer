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
  Collapse,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PlayArrow as ApplyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  DryCleaningOutlined as DryRunIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CompareArrows as DiffIcon,
  InsertDriveFileOutlined as FileIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import type { ChangeItem, ApplyChangesResponse, FileChange } from '../types';
import { changesApi } from '../services/api';
import { colors } from '../theme/theme';

interface ApplyChangesPanelProps {
  jiraKey: string;
  storyTitle?: string;
  changes: ChangeItem[];
  onComplete?: (result: ApplyChangesResponse) => void;
}

export default function ApplyChangesPanel({ jiraKey, storyTitle, changes, onComplete }: ApplyChangesPanelProps) {
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
        storyTitle,
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

              {/* Summary counts */}
              {(() => {
                const successCount = result.results.filter(r => r.success && r.modifiedFiles.length > 0).length;
                const failCount = result.results.filter(r => !r.success).length;
                const noChangeCount = result.results.filter(r => r.success && r.modifiedFiles.length === 0).length;
                return (
                  <Box display="flex" gap={1.5} mb={2}>
                    {successCount > 0 && (
                      <Chip
                        icon={<SuccessIcon sx={{ fontSize: '16px !important' }} />}
                        label={`${successCount} succeeded`}
                        size="small"
                        sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, fontWeight: 600 }}
                      />
                    )}
                    {failCount > 0 && (
                      <Chip
                        icon={<ErrorIcon sx={{ fontSize: '16px !important' }} />}
                        label={`${failCount} failed`}
                        size="small"
                        sx={{ bgcolor: alpha(colors.error, 0.1), color: colors.error, fontWeight: 600 }}
                      />
                    )}
                    {noChangeCount > 0 && (
                      <Chip
                        icon={<WarningIcon sx={{ fontSize: '16px !important' }} />}
                        label={`${noChangeCount} no changes`}
                        size="small"
                        sx={{ bgcolor: alpha(colors.tertiary, 0.1), color: colors.tertiary, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                );
              })()}

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

                  {/* Status message with appropriate styling */}
                  {!repoResult.success && (
                    <Alert
                      severity="error"
                      variant="outlined"
                      sx={{ mt: 1, mb: 1, py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}
                    >
                      {repoResult.message}
                    </Alert>
                  )}
                  {repoResult.success && repoResult.modifiedFiles.length === 0 && (
                    <Alert
                      severity="warning"
                      variant="outlined"
                      sx={{ mt: 1, mb: 1, py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}
                    >
                      {repoResult.message || 'No files were modified. The AI-generated file paths may not match the actual repository structure.'}
                    </Alert>
                  )}
                  {repoResult.success && repoResult.modifiedFiles.length > 0 && (
                    <Typography
                      sx={{ fontSize: '0.8rem', color: colors.success, mt: 0.5, fontWeight: 500 }}
                    >
                      {repoResult.message}
                    </Typography>
                  )}

                  {/* Modified files list */}
                  {repoResult.modifiedFiles.length > 0 && (
                    <Box mt={1}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: colors.onSurfaceVariant, mb: 0.5 }}>
                        Modified Files ({repoResult.modifiedFiles.length})
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {repoResult.modifiedFiles.map((file) => (
                          <Chip
                            key={file}
                            icon={<FileIcon sx={{ fontSize: '14px !important' }} />}
                            label={file}
                            size="small"
                            variant="outlined"
                            sx={{ height: 24, fontSize: '0.68rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {repoResult.commitHash && (
                    <Typography sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant, mt: 0.75 }}>
                      Commit: <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }}>{repoResult.commitHash}</code>
                    </Typography>
                  )}

                  {/* Code Diff View */}
                  {repoResult.fileChanges && repoResult.fileChanges.length > 0 && (
                    <Box mt={1.5}>
                      <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                        <DiffIcon sx={{ fontSize: 16, color: colors.primary }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: colors.primary }}>
                          Code Changes ({repoResult.fileChanges.length} file{repoResult.fileChanges.length !== 1 ? 's' : ''})
                        </Typography>
                      </Box>
                      {repoResult.fileChanges.map((fc, fcIdx) => (
                        <FileDiffView key={fcIdx} fileChange={fc} />
                      ))}
                    </Box>
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

/** Side-by-side / inline diff viewer for a single file. */
function FileDiffView({ fileChange }: { fileChange: FileChange }) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const tabValue = viewMode === 'side-by-side' ? 0 : 1;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setViewMode(newValue === 0 ? 'side-by-side' : 'inline');
  };

  const originalLines = (fileChange.originalContent || '').split('\n');
  const modifiedLines = (fileChange.modifiedContent || '').split('\n');

  // Simple line-level diff: compute which lines changed
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  return (
    <Box
      sx={{
        mb: 1,
        border: `1px solid ${alpha(colors.outlineVariant, 0.4)}`,
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1.5,
          py: 0.75,
          bgcolor: alpha(colors.surfaceContainer, 0.5),
          borderBottom: expanded ? `1px solid ${alpha(colors.outlineVariant, 0.3)}` : 'none',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: colors.onSurface,
          }}
        >
          {fileChange.filePath}
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {/* View mode tabs */}
        <Box sx={{ borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.2)}` }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              minHeight: 32,
              '& .MuiTab-root': { minHeight: 32, py: 0, fontSize: '0.7rem', textTransform: 'none' },
            }}
          >
            <Tab label="Side by Side" />
            <Tab label="Inline" />
          </Tabs>
        </Box>

        {viewMode === 'side-by-side' ? (
          /* Side-by-side view */
          <Box display="flex" sx={{ overflow: 'auto', maxHeight: 500 }}>
            {/* Original */}
            <Box flex={1} sx={{ borderRight: `1px solid ${alpha(colors.outlineVariant, 0.3)}`, minWidth: 0 }}>
              <Box
                sx={{
                  px: 1,
                  py: 0.5,
                  bgcolor: alpha(colors.error, 0.06),
                  borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.2)}`,
                }}
              >
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: colors.error }}>Original</Typography>
              </Box>
              <Box component="pre" sx={diffCodeStyle}>
                {originalLines.map((line, i) => {
                  const changed = i < modifiedLines.length ? line !== modifiedLines[i] : true;
                  return (
                    <Box
                      key={i}
                      component="div"
                      sx={{
                        display: 'flex',
                        bgcolor: changed ? alpha(colors.error, 0.08) : 'transparent',
                        '&:hover': { bgcolor: alpha(colors.onSurface, 0.04) },
                      }}
                    >
                      <Box component="span" sx={lineNumStyle}>{i + 1}</Box>
                      <Box component="span" sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            {/* Modified */}
            <Box flex={1} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  px: 1,
                  py: 0.5,
                  bgcolor: alpha(colors.success, 0.06),
                  borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.2)}`,
                }}
              >
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: colors.success }}>Modified</Typography>
              </Box>
              <Box component="pre" sx={diffCodeStyle}>
                {modifiedLines.map((line, i) => {
                  const changed = i < originalLines.length ? line !== originalLines[i] : true;
                  return (
                    <Box
                      key={i}
                      component="div"
                      sx={{
                        display: 'flex',
                        bgcolor: changed ? alpha(colors.success, 0.08) : 'transparent',
                        '&:hover': { bgcolor: alpha(colors.onSurface, 0.04) },
                      }}
                    >
                      <Box component="span" sx={lineNumStyle}>{i + 1}</Box>
                      <Box component="span" sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        ) : (
          /* Inline diff view */
          <Box sx={{ overflow: 'auto', maxHeight: 500 }}>
            <Box component="pre" sx={diffCodeStyle}>
              {Array.from({ length: maxLines }).map((_, i) => {
                const orig = i < originalLines.length ? originalLines[i] : undefined;
                const mod = i < modifiedLines.length ? modifiedLines[i] : undefined;
                const same = orig === mod;

                if (same) {
                  return (
                    <Box key={i} component="div" sx={{ display: 'flex' }}>
                      <Box component="span" sx={lineNumStyle}>{i + 1}</Box>
                      <Box component="span" sx={{ px: 0.5, color: '#888' }}> </Box>
                      <Box component="span" sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{orig}</Box>
                    </Box>
                  );
                }

                return (
                  <Box key={i} component="div">
                    {orig !== undefined && (
                      <Box
                        component="div"
                        sx={{
                          display: 'flex',
                          bgcolor: alpha(colors.error, 0.1),
                        }}
                      >
                        <Box component="span" sx={lineNumStyle}>{i + 1}</Box>
                        <Box component="span" sx={{ px: 0.5, color: colors.error, fontWeight: 700 }}>-</Box>
                        <Box component="span" sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{orig}</Box>
                      </Box>
                    )}
                    {mod !== undefined && (
                      <Box
                        component="div"
                        sx={{
                          display: 'flex',
                          bgcolor: alpha(colors.success, 0.1),
                        }}
                      >
                        <Box component="span" sx={lineNumStyle}>{i + 1}</Box>
                        <Box component="span" sx={{ px: 0.5, color: colors.success, fontWeight: 700 }}>+</Box>
                        <Box component="span" sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{mod}</Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}

const diffCodeStyle = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: '0.72rem',
  lineHeight: 1.7,
  m: 0,
  p: 0,
  overflow: 'auto',
} as const;

const lineNumStyle = {
  display: 'inline-block',
  width: 40,
  minWidth: 40,
  textAlign: 'right' as const,
  pr: 1,
  color: '#999',
  userSelect: 'none' as const,
  fontSize: '0.65rem',
} as const;
