import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { AutoAwesome as AnalyzeIcon } from '@mui/icons-material';
import type { JiraStory, AnalyzeStoryRequest, AnalyzedStory } from '../types';
import { analysisApi } from '../services/api';

interface StoryFormProps {
  selectedStory: JiraStory | null;
  onAnalysisComplete: (result: AnalyzedStory) => void;
}

export default function StoryForm({ selectedStory, onAnalysisComplete }: StoryFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStory) {
      setTitle(selectedStory.summary || '');
      setDescription(selectedStory.description || '');
      setAcceptanceCriteria('');
      setDefinitionOfDone('');
      setError(null);
    }
  }, [selectedStory]);

  const handleAnalyze = async () => {
    if (!selectedStory) return;

    if (!title.trim() || !description.trim() || !acceptanceCriteria.trim() || !definitionOfDone.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: AnalyzeStoryRequest = {
        jiraKey: selectedStory.key,
        title: title.trim(),
        description: description.trim(),
        acceptanceCriteria: acceptanceCriteria.trim(),
        definitionOfDone: definitionOfDone.trim(),
      };

      const result = await analysisApi.analyzeStory(request);
      onAnalysisComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze story');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStory) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <Box textAlign="center" py={4}>
            <AnalyzeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select a Jira story to get started
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Choose a story from the list to analyze it with AI
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Analyze Story: {selectedStory.key}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            variant="outlined"
            size="small"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            size="small"
          />

          <TextField
            label="Acceptance Criteria"
            value={acceptanceCriteria}
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            size="small"
            placeholder="Enter the acceptance criteria for this story..."
          />

          <TextField
            label="Definition of Done"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            variant="outlined"
            size="small"
            placeholder="Enter the definition of done for this story..."
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleAnalyze}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AnalyzeIcon />}
            sx={{ mt: 1 }}
          >
            {loading ? 'Analyzing with AI...' : 'Analyze Story'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
