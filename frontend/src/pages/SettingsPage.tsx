import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  WifiFind as TestIcon,
  CheckCircle as CheckIcon,
  Cancel as ErrorIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Key as KeyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { colors, gradients } from '../theme/theme';
import { settingsApi } from '../services/settingsApi';
import type { JiraConfigRequest, ConnectionTestResult } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

export default function SettingsPage() {
  // Jira State
  const [baseUrl, setBaseUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [maskedToken, setMaskedToken] = useState('');
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');
  
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const [loading, setLoading] = useState(true);

  // Load current config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const jiraConfig = await settingsApi.getJiraConfig();
        setBaseUrl(jiraConfig.baseUrl ?? '');
        setEmail(jiraConfig.email ?? '');
        setMaskedToken(jiraConfig.apiTokenMasked ?? '');
        setTokenConfigured(jiraConfig.tokenConfigured);
      } catch {
        // Non-fatal — user can still fill in the fields
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSaveJira = async () => {
    setSaveStatus('saving');
    setSaveError('');
    const payload: JiraConfigRequest = {
      baseUrl: baseUrl.trim(),
      email: email.trim(),
      ...(apiToken.trim() ? { apiToken: apiToken.trim() } : {}),
    };
    try {
      const updated = await settingsApi.saveJiraConfig(payload);
      setMaskedToken(updated.apiTokenMasked ?? '');
      setTokenConfigured(updated.tokenConfigured);
      setApiToken(''); // clear plain-text field after save
      setSaveStatus('saved');
      setTestStatus('idle'); // reset test after save
      setTestResult(null);
    } catch (err: unknown) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  const handleTestJira = async () => {
    setTestStatus('testing');
    setTestResult(null);
    try {
      const payload: JiraConfigRequest = {
        baseUrl: baseUrl.trim(),
        email: email.trim(),
        ...(apiToken.trim() ? { apiToken: apiToken.trim() } : {}),
      };
      const result = await settingsApi.testJiraConnection(payload);
      setTestResult(result);
      setTestStatus(result.success ? 'success' : 'failed');
    } catch {
      setTestStatus('failed');
      setTestResult({ success: false, error: 'Network error – backend unreachable' });
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
            <SettingsIcon sx={{ color: '#fff', fontSize: 20 }} />
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
            Settings
          </Typography>
        </Box>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem', ml: 7 }}>
          Configure your Jira connection settings.
        </Typography>
      </Box>

      <Box sx={{ ml: 7 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card
              sx={{
                border: `1px solid ${alpha(colors.primary, 0.15)}`,
                '&:hover': { boxShadow: `0 4px 24px ${alpha(colors.primary, 0.08)}` },
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <LinkIcon sx={{ color: colors.primary, fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: colors.onSurface,
                    }}
                  >
                    Jira Credentials
                  </Typography>
                  {tokenConfigured && (
                    <Chip
                      label="Configured"
                      size="small"
                      sx={{
                        ml: 'auto',
                        bgcolor: alpha('#4CAF50', 0.12),
                        color: '#4CAF50',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        height: 24,
                      }}
                    />
                  )}
                </Box>

                <Divider sx={{ mb: 2.5, borderColor: alpha(colors.outlineVariant, 0.4) }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    id="jira-base-url"
                    label="Jira Base URL"
                    placeholder="https://your-team.atlassian.net"
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl(e.target.value); setSaveStatus('idle'); }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ color: colors.onSurfaceVariant, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />

                  <TextField
                    id="jira-email"
                    label="Jira Email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSaveStatus('idle'); }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: colors.onSurfaceVariant, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />

                  <TextField
                    id="jira-api-token"
                    label="API Token"
                    placeholder={tokenConfigured ? maskedToken || 'Enter new token to replace' : 'Paste your Atlassian API token'}
                    type={showToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => { setApiToken(e.target.value); setSaveStatus('idle'); }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    helperText={
                      tokenConfigured && !apiToken
                        ? `Current token: ${maskedToken} — leave blank to keep it`
                        : 'Generate at: id.atlassian.com → Security → API tokens'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon sx={{ color: colors.onSurfaceVariant, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            id="toggle-token-visibility"
                            size="small"
                            onClick={() => setShowToken((v) => !v)}
                            edge="end"
                          >
                            {showToken ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                </Box>

                {testStatus !== 'idle' && testResult && (
                  <Box sx={{ mt: 2 }}>
                    {testStatus === 'success' && (
                      <Alert severity="success" icon={<CheckIcon fontSize="inherit" />} sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
                        Connected as <strong>{testResult.displayName}</strong> ({testResult.email})
                      </Alert>
                    )}
                    {testStatus === 'failed' && (
                      <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />} sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
                        {testResult.error || 'Connection failed — check your credentials'}
                      </Alert>
                    )}
                  </Box>
                )}

                {saveStatus === 'saved' && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.85rem' }}>
                    Settings saved successfully.
                  </Alert>
                )}
                {saveStatus === 'error' && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.85rem' }}>
                    {saveError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                  <Button
                    id="test-jira-connection"
                    variant="outlined"
                    size="medium"
                    startIcon={testStatus === 'testing' ? <CircularProgress size={16} /> : <TestIcon />}
                    onClick={handleTestJira}
                    disabled={testStatus === 'testing' || !baseUrl || !email}
                    sx={{
                      borderColor: alpha(colors.primary, 0.4),
                      color: colors.primary,
                      fontWeight: 600,
                      borderRadius: '10px',
                      '&:hover': { borderColor: colors.primary, bgcolor: alpha(colors.primary, 0.06) },
                    }}
                  >
                    {testStatus === 'testing' ? 'Testing…' : 'Test Connection'}
                  </Button>

                  <Button
                    id="save-jira-settings"
                    variant="contained"
                    size="medium"
                    startIcon={saveStatus === 'saving' ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
                    onClick={handleSaveJira}
                    disabled={saveStatus === 'saving' || !baseUrl || !email}
                    sx={{
                      background: gradients.primary,
                      fontWeight: 700,
                      borderRadius: '10px',
                      px: 3,
                      boxShadow: `0 2px 12px ${alpha(colors.primary, 0.35)}`,
                      '&:hover': { boxShadow: `0 4px 20px ${alpha(colors.primary, 0.5)}`, transform: 'translateY(-1px)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {saveStatus === 'saving' ? 'Saving…' : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ border: `1px solid ${alpha(colors.outlineVariant, 0.4)}`, bgcolor: alpha(colors.surfaceContainerLow, 0.5) }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: colors.onSurface, mb: 1 }}>
                  💡 How to get an Atlassian API token
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: colors.onSurfaceVariant, lineHeight: 1.7 }}>
                  1. Go to <strong>id.atlassian.com</strong> → Log in → Profile icon → <strong>Manage your account</strong><br />
                  2. Navigate to <strong>Security</strong> → <strong>Create and manage API tokens</strong><br />
                  3. Click <strong>Create API token</strong>, give it a label, and copy the generated token.<br />
                  4. Paste it above and click <strong>Save Settings</strong>.
                </Typography>
              </CardContent>
            </Card>
          </Box>
      </Box>
    </Box>
  );
}

// ── shared field style ─────────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    '&:hover fieldset': { borderColor: alpha(colors.primary, 0.5) },
    '&.Mui-focused fieldset': { borderColor: colors.primary },
  },
  '& label.Mui-focused': { color: colors.primary },
};
