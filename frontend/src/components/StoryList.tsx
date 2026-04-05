import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Alert,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  BugReport as BugIcon,
  Assignment as StoryIcon,
  CheckCircle as TaskIcon,
} from '@mui/icons-material';
import type { JiraStory } from '../types';
import { jiraApi } from '../services/api';
import { colors } from '../theme/theme';

interface StoryListProps {
  onSelectStory: (story: JiraStory) => void;
  selectedStoryKey: string | null;
}

const priorityColor = (priority: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  switch (priority?.toLowerCase()) {
    case 'highest':
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
    case 'lowest':
      return 'success';
    default:
      return 'default';
  }
};

const statusColor = (status: string): 'primary' | 'success' | 'warning' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'in progress':
      return 'primary';
    case 'done':
      return 'success';
    case 'in review':
      return 'warning';
    default:
      return 'default';
  }
};

const getStoryIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'bug':
      return <BugIcon fontSize="small" sx={{ color: colors.error }} />;
    case 'task':
      return <TaskIcon fontSize="small" sx={{ color: colors.primary }} />;
    default:
      return <StoryIcon fontSize="small" sx={{ color: colors.secondary }} />;
  }
};

export default function StoryList({ onSelectStory, selectedStoryKey }: StoryListProps) {
  const [stories, setStories] = useState<JiraStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jiraApi.fetchAssignedStories();
      setStories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(
    (story) =>
      story.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          Assigned Stories ({stories.length})
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: colors.onSurfaceVariant }} />
              </InputAdornment>
            ),
          }}
        />
      </CardContent>
      <Divider />
      <List sx={{ overflow: 'auto', flex: 1 }}>
        {filteredStories.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {searchTerm ? 'No stories match your search' : 'No assigned stories found'}
            </Typography>
          </Box>
        ) : (
          filteredStories.map((story) => (
            <ListItemButton
              key={story.key}
              selected={selectedStoryKey === story.key}
              onClick={() => onSelectStory(story)}
              sx={{
                borderLeft: selectedStoryKey === story.key
                  ? `3px solid ${colors.primary}`
                  : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStoryIcon(story.storyType)}
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.primary }}>
                      {story.key}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box mt={0.5}>
                    <Typography variant="body2" noWrap sx={{ mb: 0.5, color: colors.onSurface }}>
                      {story.summary}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      <Chip label={story.status} size="small" color={statusColor(story.status)} variant="outlined" />
                      {story.priority && (
                        <Chip
                          label={story.priority}
                          size="small"
                          color={priorityColor(story.priority)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItemButton>
          ))
        )}
      </List>
    </Card>
  );
}
