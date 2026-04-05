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
import { Delete as DeleteIcon, History as HistoryIcon } from '@mui/icons-material';
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
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 1 }}>
        {error}
      </Alert>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={3}>
            <HistoryIcon sx={{ fontSize: 48, color: colors.outlineVariant, mb: 1 }} />
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
              No analysis history yet
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ pb: 1 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: colors.primary,
          }}
        >
          Analysis History ({analyses.length})
        </Typography>
      </CardContent>
      <Divider />
      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
        {analyses.map((analysis) => (
          <ListItemButton key={analysis.id} onClick={() => onSelectAnalysis(analysis)}>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={analysis.jiraKey}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: `${colors.primary}20`,
                      color: colors.primary,
                      border: `1px solid ${colors.primary}30`,
                    }}
                  />
                  <Typography variant="body2" noWrap sx={{ color: colors.onSurface }}>
                    {analysis.title}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography variant="caption" sx={{ color: colors.onSurfaceVariant }}>
                  {new Date(analysis.createdAt).toLocaleString()}
                </Typography>
              }
            />
            <Tooltip title="Delete">
              <IconButton size="small" onClick={(e) => handleDelete(analysis.id, e)} sx={{ color: colors.error }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
