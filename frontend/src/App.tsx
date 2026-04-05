import { useState, useCallback } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  CssBaseline,
  Fade,
  useMediaQuery,
} from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import {
  Analytics as AnalyticsIcon,
  GridView as GridViewIcon,
  Psychology as PsychologyIcon,
  Terminal as TerminalIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  QueryStats as QueryStatsIcon,
  ContentCopy as ContentCopyIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import theme, { colors } from './theme/theme';
import StoryList from './components/StoryList';
import StoryForm from './components/StoryForm';
import AnalysisResult from './components/AnalysisResult';
import AnalysisHistory from './components/AnalysisHistory';
import type { JiraStory, AnalyzedStory, StreamingState } from './types';

const SIDEBAR_WIDTH = 256;

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
      {/* TopAppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: colors.surface,
          borderBottom: 'none',
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnalyticsIcon sx={{ color: colors.primary }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: colors.primary,
                fontSize: '1.15rem',
              }}
            >
              Story Analyzer
            </Typography>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
            {navItems.map((item) => (
              <Typography
                key={item.id}
                component="a"
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); setActiveNav(item.id); }}
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: activeNav === item.id ? 700 : 400,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  color: activeNav === item.id ? colors.primary : colors.onSurfaceVariant,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { color: colors.primary },
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SearchIcon sx={{ color: colors.onSurfaceVariant, cursor: 'pointer', '&:hover': { color: colors.primary }, transition: 'color 0.2s' }} />
            <NotificationsIcon sx={{ color: colors.onSurfaceVariant, cursor: 'pointer', '&:hover': { color: colors.primary }, transition: 'color 0.2s' }} />
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* NavigationDrawer (Desktop) */}
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
              bgcolor: `${colors.surfaceBright}99`,
              backdropFilter: 'blur(20px)',
              borderRight: `1px solid ${colors.outlineVariant}15`,
              borderRadius: '0 16px 16px 0',
              boxShadow: '0 20px 40px rgba(0, 13, 39, 0.4)',
              zIndex: 40,
            }}
          >
            {/* Profile section */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${colors.outlineVariant}15` }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: colors.surfaceContainerHighest,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary,
                  fontWeight: 800,
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: '0.9rem',
                }}
              >
                DT
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: colors.onSurface }}>
                  Developer Thor
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant }}>
                  Analytical Architect
                </Typography>
              </Box>
            </Box>

            {/* Nav items */}
            <Box component="nav" sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {navItems.map((item) => (
                <Box
                  key={item.id}
                  component="a"
                  href="#"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); setActiveNav(item.id); }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    ...(activeNav === item.id
                      ? {
                          bgcolor: colors.primary,
                          color: colors.surface,
                          boxShadow: '0 4px 16px rgba(171, 199, 255, 0.25)',
                          '& .MuiSvgIcon-root': { color: colors.surface },
                        }
                      : {
                          color: colors.onSurfaceVariant,
                          '&:hover': {
                            bgcolor: colors.surfaceContainerHigh,
                            color: colors.onSurface,
                          },
                        }),
                  }}
                >
                  {item.icon}
                  <Typography sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            ml: isDesktop ? `${SIDEBAR_WIDTH}px` : 0,
            p: { xs: 2, md: 4, lg: 6 },
            mb: isMobile ? 10 : 0,
            bgcolor: colors.surfaceContainerLow,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              animation: 'fadeIn 0.5s ease-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Top row: Story list + Form side by side */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box sx={{ height: { xs: 'auto', md: 'calc(100vh - 200px)' } }}>
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

            {/* Footer Action Area */}
            <Box
              sx={{
                pt: 6,
                pb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                borderTop: `1px solid ${colors.outlineVariant}15`,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
                    Crafted with
                  </Typography>
                  <HeartIcon
                    sx={{
                      fontSize: 14,
                      color: colors.tertiary,
                      animation: 'heartbeat 1.5s ease-in-out infinite',
                      '@keyframes heartbeat': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.2)' },
                      },
                    }}
                  />
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>by</Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryContainer} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Developer Thor Team
                  </Typography>
                </Box>
                <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.75rem', opacity: 0.6 }}>
                  AI-Powered Copilot Prompt Generator
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* BottomNavBar (Mobile) */}
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
            px: 2,
            pb: 3,
            pt: 1,
            bgcolor: colors.surfaceContainerLow,
            borderTop: `1px solid ${colors.outlineVariant}15`,
            boxShadow: '0 -8px 32px rgba(0, 13, 39, 0.5)',
            borderRadius: '16px 16px 0 0',
          }}
        >
          {[
            { id: 'projects', label: 'Dashboard', icon: <DashboardIcon /> },
            { id: 'analyzer', label: 'Analyze', icon: <QueryStatsIcon /> },
            { id: 'prompts', label: 'Output', icon: <ContentCopyIcon /> },
          ].map((item) => (
            <Box
              key={item.id}
              component="a"
              href="#"
              onClick={(e: React.MouseEvent) => { e.preventDefault(); setActiveNav(item.id); }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                py: 1,
                borderRadius: 2,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                '&:active': { transform: 'scale(0.9)' },
                ...(activeNav === item.id
                  ? {
                      bgcolor: colors.surfaceVariant,
                      color: colors.primary,
                    }
                  : {
                      color: colors.onSurfaceVariant,
                      '&:hover': { color: colors.onSurface },
                    }),
              }}
            >
              {item.icon}
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
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
