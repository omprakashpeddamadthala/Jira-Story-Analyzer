import { useState, useCallback } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  CssBaseline,
  Fade,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import { alpha, ThemeProvider, useTheme } from '@mui/material/styles';
import {
  Analytics as AnalyticsIcon,
  GridView as GridViewIcon,
  Psychology as PsychologyIcon,
  Terminal as TerminalIcon,
  Dashboard as DashboardIcon,
  QueryStats as QueryStatsIcon,
  ContentCopy as ContentCopyIcon,
  Favorite as HeartIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import theme, { colors, gradients } from './theme/theme';
import StoryList from './components/StoryList';
import StoryForm from './components/StoryForm';
import AnalysisResult from './components/AnalysisResult';
import AnalysisHistory from './components/AnalysisHistory';
import type { JiraStory, AnalyzedStory, StreamingState } from './types';

const SIDEBAR_WIDTH = 260;

function AppContent() {
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedStory | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);
  const [activeNav, setActiveNav] = useState('analyzer');

  const handleSelectStory = useCallback((story: JiraStory) => {
    setSelectedStory(story);
    setAnalysisResult(null);
    setStreamingState(null);
  }, []);

  const handleAnalysisComplete = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleSelectAnalysis = useCallback((result: AnalyzedStory) => {
    setAnalysisResult(result);
    setStreamingState(null);
  }, []);

  const handleStreamingUpdate = useCallback((state: StreamingState) => {
    setStreamingState(state);
  }, []);

  const showResults = analysisResult || (streamingState && (streamingState.isStreaming || streamingState.completedSections.length > 0));

  const navItems = [
    { id: 'projects', label: 'Projects', icon: <GridViewIcon /> },
    { id: 'analyzer', label: 'Analyzer', icon: <PsychologyIcon /> },
    { id: 'prompts', label: 'Prompts', icon: <TerminalIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: colors.surface }}>
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(colors.surface, 0.85),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.12)}`,
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, minHeight: { xs: 56, md: 64 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 12px ${alpha(colors.primary, 0.3)}`,
              }}
            >
              <AnalyticsIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: colors.onSurface,
                fontSize: '1.1rem',
              }}
            >
              Story<Box component="span" sx={{ color: colors.primary }}>Analyzer</Box>
            </Typography>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => (
              <Box
                key={item.id}
                component="button"
                onClick={() => setActiveNav(item.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: activeNav === item.id ? 600 : 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  bgcolor: activeNav === item.id ? alpha(colors.primary, 0.12) : 'transparent',
                  color: activeNav === item.id ? colors.primary : colors.onSurfaceVariant,
                  '&:hover': {
                    bgcolor: activeNav === item.id ? alpha(colors.primary, 0.16) : alpha(colors.onSurfaceVariant, 0.08),
                    color: activeNav === item.id ? colors.primary : colors.onSurface,
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 18,
                    opacity: activeNav === item.id ? 1 : 0.7,
                  },
                }}
              >
                {item.icon}
                {item.label}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              sx={{
                color: colors.onSurfaceVariant,
                border: `1px solid ${alpha(colors.outlineVariant, 0.2)}`,
                width: 36,
                height: 36,
              }}
            >
              <SparkleIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar (Desktop) */}
        {isDesktop && (
          <Box
            component="aside"
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              position: 'fixed',
              top: 64,
              left: 0,
              height: 'calc(100vh - 64px)',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: alpha(colors.surfaceContainer, 0.7),
              backdropFilter: 'blur(20px)',
              borderRight: `1px solid ${alpha(colors.outlineVariant, 0.12)}`,
              zIndex: 40,
            }}
          >
            {/* Profile section */}
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.12)}` }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${colors.primaryContainer} 0%, ${alpha(colors.primary, 0.3)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary,
                  fontWeight: 800,
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: '0.85rem',
                  border: `1px solid ${alpha(colors.primary, 0.2)}`,
                }}
              >
                DT
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: colors.onSurface, lineHeight: 1.3 }}>
                  Developer Thor
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, lineHeight: 1.3 }}>
                  Analytical Architect
                </Typography>
              </Box>
            </Box>

            {/* Nav items */}
            <Box component="nav" sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 0.5,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: colors.onSurfaceVariant,
                  opacity: 0.7,
                }}
              >
                Navigation
              </Typography>
              {navItems.map((item) => (
                <Box
                  key={item.id}
                  component="button"
                  onClick={() => setActiveNav(item.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: '10px',
                    border: 'none',
                    width: '100%',
                    textDecoration: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.85rem',
                    ...(activeNav === item.id
                      ? {
                          bgcolor: alpha(colors.primary, 0.12),
                          color: colors.primary,
                          fontWeight: 600,
                          boxShadow: `inset 3px 0 0 ${colors.primary}`,
                          '& .MuiSvgIcon-root': { color: colors.primary },
                        }
                      : {
                          bgcolor: 'transparent',
                          color: colors.onSurfaceVariant,
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: alpha(colors.onSurfaceVariant, 0.06),
                            color: colors.onSurface,
                          },
                        }),
                  }}
                >
                  {item.icon}
                  {item.label}
                </Box>
              ))}
            </Box>

            {/* Sidebar footer */}
            <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(colors.outlineVariant, 0.12)}` }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: alpha(colors.primary, 0.06),
                  border: `1px solid ${alpha(colors.primary, 0.1)}`,
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.primary, mb: 0.5 }}>
                  AI-Powered Analysis
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: colors.onSurfaceVariant, lineHeight: 1.5 }}>
                  Transform Jira stories into actionable Copilot prompts
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            ml: isDesktop ? `${SIDEBAR_WIDTH}px` : 0,
            p: { xs: 2, sm: 3, md: 4, lg: 5 },
            mb: isMobile ? 10 : 0,
            bgcolor: colors.surfaceContainerLow,
            minHeight: 'calc(100vh - 64px)',
            backgroundImage: gradients.glow,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 400px',
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Page header */}
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: colors.onSurface,
                  fontSize: { xs: '1.4rem', md: '1.7rem' },
                  mb: 0.5,
                }}
              >
                Story Analyzer
              </Typography>
              <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
                Select a Jira story, refine details, and generate implementation prompts
              </Typography>
            </Box>

            {/* Top row: Story list + Form side by side */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box sx={{ height: { xs: 'auto', md: 'calc(100vh - 240px)' } }}>
                <StoryList
                  onSelectStory={handleSelectStory}
                  selectedStoryKey={selectedStory?.key ?? null}
                />
              </Box>
              <StoryForm
                selectedStory={selectedStory}
                onAnalysisComplete={handleAnalysisComplete}
                onStreamingUpdate={handleStreamingUpdate}
              />
            </Box>

            {/* Analysis History */}
            <AnalysisHistory
              onSelectAnalysis={handleSelectAnalysis}
              refreshTrigger={refreshTrigger}
            />

            {/* Analysis Results */}
            {showResults && (
              <Fade in timeout={600}>
                <Box>
                  <AnalysisResult
                    result={analysisResult}
                    streamingState={streamingState ?? undefined}
                  />
                </Box>
              </Fade>
            )}

            {/* Footer */}
            <Box
              sx={{
                pt: 4,
                pb: 3,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3,
                borderTop: `1px solid ${alpha(colors.outlineVariant, 0.12)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: alpha(colors.onSurfaceVariant, 0.6), fontSize: '0.8rem' }}>
                  Crafted with
                </Typography>
                <HeartIcon
                  sx={{
                    fontSize: 13,
                    color: colors.error,
                    animation: 'heartbeat 2s ease-in-out infinite',
                    '@keyframes heartbeat': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.15)' },
                    },
                  }}
                />
                <Typography sx={{ color: alpha(colors.onSurfaceVariant, 0.6), fontSize: '0.8rem' }}>by</Typography>
                <Typography
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: colors.primary,
                  }}
                >
                  Developer Thor Team
                </Typography>
              </Box>
              <Typography sx={{ color: alpha(colors.onSurfaceVariant, 0.4), fontSize: '0.72rem' }}>
                AI-Powered Copilot Prompt Generator
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation (Mobile) */}
      {isMobile && (
        <Box
          component="nav"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: 50,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            px: 1,
            py: 1,
            bgcolor: alpha(colors.surfaceContainer, 0.9),
            backdropFilter: 'blur(16px)',
            borderTop: `1px solid ${alpha(colors.outlineVariant, 0.12)}`,
            boxShadow: `0 -4px 24px ${alpha('#000', 0.3)}`,
          }}
        >
          {[
            { id: 'projects', label: 'Dashboard', icon: <DashboardIcon /> },
            { id: 'analyzer', label: 'Analyze', icon: <QueryStatsIcon /> },
            { id: 'prompts', label: 'Output', icon: <ContentCopyIcon /> },
          ].map((item) => (
            <Box
              key={item.id}
              component="button"
              onClick={() => setActiveNav(item.id)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2.5,
                py: 1,
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:active': { transform: 'scale(0.92)' },
                ...(activeNav === item.id
                  ? {
                      bgcolor: alpha(colors.primary, 0.12),
                      color: colors.primary,
                    }
                  : {
                      bgcolor: 'transparent',
                      color: colors.onSurfaceVariant,
                    }),
                '& .MuiSvgIcon-root': {
                  fontSize: 22,
                },
              }}
            >
              {item.icon}
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  mt: 0.25,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
