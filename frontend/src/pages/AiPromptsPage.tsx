import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Save as SaveIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { colors, gradients } from '../theme/theme';
import { settingsApi } from '../services/settingsApi';
import type { PromptConfigRequest } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function AiPromptsPage() {
  const [copilotTemplate, setCopilotTemplate] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const promptConfig = await settingsApi.getPromptConfig();
        setCopilotTemplate(promptConfig.copilotTemplate ?? '');
      } catch {
        // Non-fatal — user can still fill in the fields
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    const payload: PromptConfigRequest = {
      copilotTemplate: copilotTemplate.trim(),
    };
    try {
      const updated = await settingsApi.updatePromptConfig(payload);
      setCopilotTemplate(updated.copilotTemplate);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} thickness={3} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 840 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              color: colors.onSurface,
              letterSpacing: '-0.02em',
            }}
          >
            AI Prompts
          </Typography>
        </Box>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem', ml: 7 }}>
          Customize the system prompt passed to the AI when generating GitHub Copilot instructions.
        </Typography>
      </Box>

      {/* Prompt Template Card */}
      <Box sx={{ ml: 7 }}>
        <Card
          sx={{
            border: `1px solid ${alpha(colors.primary, 0.15)}`,
            '&:hover': { boxShadow: `0 4px 24px ${alpha(colors.primary, 0.08)}` },
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <AutoAwesomeIcon sx={{ color: colors.primary, fontSize: 20 }} />
              <Typography
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: colors.onSurface,
                }}
              >
                Copilot Prompt Template
              </Typography>
            </Box>

            <Divider sx={{ mb: 2.5, borderColor: alpha(colors.outlineVariant, 0.4) }} />

            <Typography sx={{ fontSize: '0.9rem', color: colors.onSurfaceVariant, mb: 2 }}>
              The following variables will be dynamically injected from your Jira ticket components:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {['{title}', '{description}', '{acceptanceCriteria}', '{definitionOfDone}'].map((v) => (
                <Chip
                  key={v}
                  label={v}
                  size="small"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: alpha(colors.primary, 0.1),
                    color: colors.primary,
                    fontWeight: 700,
                  }}
                />
              ))}
            </Box>

            <TextField
              id="copilot-prompt-template"
              multiline
              minRows={15}
              maxRows={25}
              value={copilotTemplate}
              onChange={(e) => {
                setCopilotTemplate(e.target.value);
                setSaveStatus('idle');
              }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&:hover fieldset': { borderColor: alpha(colors.primary, 0.5) },
                  '&.Mui-focused fieldset': { borderColor: colors.primary },
                },
                '& label.Mui-focused': { color: colors.primary },
                '& .MuiInputBase-input': {
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                },
              }}
            />

            {saveStatus === 'saved' && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.85rem' }}>
                Prompt template saved successfully.
              </Alert>
            )}
            {saveStatus === 'error' && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.85rem' }}>
                Failed to save prompt template.
              </Alert>
            )}

            <Box sx={{ display: 'flex', mt: 3 }}>
              <Button
                id="save-prompt-settings"
                variant="contained"
                size="medium"
                startIcon={
                  saveStatus === 'saving' ? (
                    <CircularProgress size={16} sx={{ color: '#fff' }} />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={handleSave}
                disabled={saveStatus === 'saving' || !copilotTemplate.trim()}
                sx={{
                  background: gradients.primary,
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 3,
                  boxShadow: `0 2px 12px ${alpha(colors.primary, 0.35)}`,
                  '&:hover': {
                    boxShadow: `0 4px 20px ${alpha(colors.primary, 0.5)}`,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Template'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
