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
  LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  FolderOpen as FolderIcon,
  Search as ScanIcon,
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

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {scanResult.repositories.map((repo) => (
                  <RepoInfoCard key={repo.name} repo={repo} />
                ))}
              </Box>

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
    <Card
      sx={{
        borderRadius: '12px',
        border: `1px solid ${alpha(colors.outlineVariant, 0.5)}`,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <CodeIcon sx={{ color: colors.primary, fontSize: 20 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: colors.onSurface, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {repo.name}
          </Typography>
        </Box>

        {/* Languages & Frameworks */}
        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
          {repo.languages.map((lang) => (
            <Chip key={lang} label={lang} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(colors.primary, 0.08), color: colors.primary, fontWeight: 600 }} />
          ))}
          {repo.frameworks.map((fw) => (
            <Chip key={fw} label={fw} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          ))}
        </Box>

        {/* Stats */}
        <Box display="flex" gap={2} mb={1}>
          <Typography sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant }}>
            <FileIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
            {repo.totalFiles} files
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant }}>
            <FolderIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
            {repo.totalDirectories} dirs
          </Typography>
        </Box>

        {/* Details */}
        <Box display="flex" flexDirection="column" gap={0.5}>
          <DetailRow label="Path" value={repo.path} />
          <DetailRow label="Pkg Mgr" value={repo.packageManager} />
          {repo.keyModules.length > 0 && (
            <DetailRow label="Modules" value={repo.keyModules.slice(0, 3).join(', ') + (repo.keyModules.length > 3 ? ` +${repo.keyModules.length - 3}` : '')} />
          )}
        </Box>
      </CardContent>
    </Card>
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
