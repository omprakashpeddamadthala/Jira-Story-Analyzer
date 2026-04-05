import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  History as HistoryIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import type { AnalyzedStory } from '../types';
import { analysisApi } from '../services/api';
import { colors } from '../theme/theme';

interface AnalysisHistoryProps {
  onSelectAnalysis: (result: AnalyzedStory) => void;
  refreshTrigger: number;
}

export default function AnalysisHistory({ onSelectAnalysis, refreshTrigger }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<AnalyzedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, [refreshTrigger]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analysisApi.getAllAnalyzedStories();
      setAnalyses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await analysisApi.deleteAnalyzedStory(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analysis');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={3} gap={1.5}>
            <CircularProgress size={20} thickness={3} />
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
              Loading history...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: alpha(colors.onSurfaceVariant, 0.06),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <HistoryIcon sx={{ fontSize: 26, color: alpha(colors.onSurfaceVariant, 0.35) }} />
            </Box>
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem', fontWeight: 500 }}>
              No analysis history yet
            </Typography>
            <Typography sx={{ color: alpha(colors.onSurfaceVariant, 0.6), fontSize: '0.75rem', mt: 0.5 }}>
              Analyzed stories will appear here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ fontSize: 20, color: colors.onSurfaceVariant }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.onSurface,
              }}
            >
              Analysis History
            </Typography>
          </Box>
          <Chip
            label={analyses.length}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: alpha(colors.primary, 0.12),
              color: colors.primary,
              height: 24,
              minWidth: 32,
            }}
          />
        </Box>
      </CardContent>
      <Divider />
      <List sx={{ maxHeight: 320, overflow: 'auto', py: 0.5 }}>
        {analyses.map((analysis) => (
          <ListItemButton
            key={analysis.id}
            onClick={() => onSelectAnalysis(analysis)}
            sx={{ py: 1.25 }}
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={analysis.jiraKey}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(colors.primary, 0.12),
                      color: colors.primary,
                      height: 24,
                      fontSize: '0.7rem',
                    }}
                  />
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ color: colors.onSurface, fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    {analysis.title}
                  </Typography>
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                  <TimeIcon sx={{ fontSize: 13, color: alpha(colors.onSurfaceVariant, 0.6) }} />
                  <Typography variant="caption" sx={{ color: alpha(colors.onSurfaceVariant, 0.7), fontSize: '0.72rem' }}>
                    {new Date(analysis.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
            <Tooltip title="Delete analysis" arrow>
              <IconButton
                size="small"
                onClick={(e) => handleDelete(analysis.id, e)}
                sx={{
                  color: alpha(colors.error, 0.7),
                  '&:hover': {
                    color: colors.error,
                    bgcolor: alpha(colors.error, 0.08),
                  },
                }}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
