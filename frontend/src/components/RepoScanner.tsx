import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  FolderOpen as FolderIcon,
  Search as ScanIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import type { RepoScanResponse, RepoInfo } from '../types';
import { repoApi } from '../services/api';
import { colors, gradients } from '../theme/theme';

interface RepoScannerProps {
  onScanComplete?: (result: RepoScanResponse) => void;
}

export default function RepoScanner({ onScanComplete }: RepoScannerProps) {
  const [folderPath, setFolderPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<RepoScanResponse | null>(null);

  const handleScan = async () => {
    if (!folderPath.trim()) {
      setError('Please enter a folder path');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // On first scan, check cache to avoid redundant work.
      // If results already exist (re-scan), always perform a fresh scan.
      if (!scanResult) {
        const cached = await repoApi.getCachedScan(folderPath.trim());
        if (cached) {
          setScanResult(cached);
          onScanComplete?.(cached);
          return;
        }
      }

      const result = await repoApi.scanFolder(folderPath.trim());
      setScanResult(result);
      onScanComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Scan Input Card */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${alpha(colors.primary, 0.3)}`,
              }}
            >
              <FolderIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: colors.onSurface,
                }}
              >
                Repository Scanner
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: colors.onSurfaceVariant }}>
                Provide a folder path containing repositories to scan
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1.5} alignItems="flex-start">
            <TextField
              label="Folder Path"
              placeholder="/path/to/your/repos"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleScan}
              disabled={loading || !folderPath.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ScanIcon />}
              sx={{
                minWidth: 130,
                py: 1,
                background: gradients.primary,
                color: '#fff',
                fontWeight: 600,
                borderRadius: '10px',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Scanning...' : scanResult ? 'Re-scan' : 'Scan'}
            </Button>
          </Box>

          {loading && (
            <Box mt={2}>
              <LinearProgress sx={{ borderRadius: 1 }} />
              <Typography sx={{ mt: 1, fontSize: '0.8rem', color: colors.onSurfaceVariant, textAlign: 'center' }}>
                Scanning repositories...
              </Typography>
            </Box>
          )}

          {error && (
            <Fade in>
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </Fade>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResult && (
        <Fade in timeout={500}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <StorageIcon sx={{ color: colors.primary, fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: colors.onSurface,
                    }}
                  >
                    Scan Results
                  </Typography>
                </Box>
                <Chip
                  label={`${scanResult.totalRepos} repositories`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(colors.primary, 0.12),
                    color: colors.primary,
                  }}
                />
              </Box>

              <Typography sx={{ fontSize: '0.82rem', color: colors.onSurfaceVariant, mb: 2 }}>
                Folder: {scanResult.folderPath}
              </Typography>

              {scanResult.repositories.map((repo) => (
                <RepoInfoCard key={repo.name} repo={repo} />
              ))}

              {scanResult.repositories.length === 0 && (
                <Box textAlign="center" py={3}>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.88rem' }}>
                    No repositories found in the specified folder
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
}

function RepoInfoCard({ repo }: { repo: RepoInfo }) {
  return (
    <Accordion
      sx={{
        mb: 1,
        '&:before': { display: 'none' },
        borderRadius: '12px !important',
        border: `1px solid ${alpha(colors.outlineVariant, 0.5)}`,
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ px: 2, py: 0.5 }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flex={1}>
          <CodeIcon sx={{ color: colors.primary, fontSize: 20 }} />
          <Box flex={1}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: colors.onSurface }}>
              {repo.name}
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
              {repo.languages.map((lang) => (
                <Chip key={lang} label={lang} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
              ))}
              {repo.frameworks.map((fw) => (
                <Chip key={fw} label={fw} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              ))}
            </Box>
          </Box>
          <Box textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant }}>
              {repo.totalFiles} files · {repo.totalDirectories} dirs
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0 }}>
        <Box display="flex" flexDirection="column" gap={1}>
          <DetailRow label="Path" value={repo.path} />
          <DetailRow label="Package Manager" value={repo.packageManager} />
          {repo.entryPoints.length > 0 && (
            <DetailRow label="Entry Points" value={repo.entryPoints.join(', ')} />
          )}
          {repo.keyModules.length > 0 && (
            <DetailRow label="Key Modules" value={repo.keyModules.join(', ')} />
          )}
          {repo.structure && (
            <>
              {repo.structure.topLevelDirs.length > 0 && (
                <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, minWidth: 90 }}>
                    Directories:
                  </Typography>
                  {repo.structure.topLevelDirs.map((dir) => (
                    <Chip
                      key={dir}
                      icon={<FolderIcon sx={{ fontSize: '14px !important' }} />}
                      label={dir}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.68rem' }}
                    />
                  ))}
                </Box>
              )}
              {repo.structure.topLevelFiles.length > 0 && (
                <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, minWidth: 90 }}>
                    Files:
                  </Typography>
                  {repo.structure.topLevelFiles.map((file) => (
                    <Chip
                      key={file}
                      icon={<FileIcon sx={{ fontSize: '14px !important' }} />}
                      label={file}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.68rem' }}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" gap={1} alignItems="baseline">
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, minWidth: 90 }}>
        {label}:
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: colors.onSurface, wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Box>
  );
}
