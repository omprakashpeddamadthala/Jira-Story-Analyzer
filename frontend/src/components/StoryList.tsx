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
import { alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  BugReport as BugIcon,
  Assignment as StoryIcon,
  CheckCircle as TaskIcon,
  Inbox as EmptyIcon,
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
      return <TaskIcon fontSize="small" sx={{ color: colors.success }} />;
    default:
      return <StoryIcon fontSize="small" sx={{ color: colors.primary }} />;
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
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={6}>
          <CircularProgress size={36} thickness={3} />
          <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
            Loading stories...
          </Typography>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: colors.onSurface,
            }}
          >
            Assigned Stories
          </Typography>
          <Chip
            label={stories.length}
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
        <TextField
          fullWidth
          size="small"
          placeholder="Search by key or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: colors.onSurfaceVariant, fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </CardContent>
      <Divider />
      <List sx={{ overflow: 'auto', flex: 1, py: 0.5 }}>
        {filteredStories.length === 0 ? (
          <Box py={5} textAlign="center">
            <EmptyIcon sx={{ fontSize: 40, color: alpha(colors.onSurfaceVariant, 0.3), mb: 1 }} />
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
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
                py: 1.25,
                borderLeft: selectedStoryKey === story.key
                  ? `3px solid ${colors.primary}`
                  : '3px solid transparent',
              }}
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStoryIcon(story.storyType)}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: selectedStoryKey === story.key ? colors.primary : colors.onSurface,
                        fontFamily: '"Manrope", sans-serif',
                        fontSize: '0.82rem',
                      }}
                    >
                      {story.key}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box mt={0.5}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        mb: 0.75,
                        color: colors.onSurfaceVariant,
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {story.summary}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      <Chip
                        label={story.status}
                        size="small"
                        color={statusColor(story.status)}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.68rem' }}
                      />
                      {story.priority && (
                        <Chip
                          label={story.priority}
                          size="small"
                          color={priorityColor(story.priority)}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.68rem' }}
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
