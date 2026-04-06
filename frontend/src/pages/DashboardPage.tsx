import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Psychology as PsychologyIcon,
  History as HistoryIcon,
  Assignment as StoryIcon,
  TrendingUp as TrendingIcon,
  ArrowForward as ArrowIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { colors, gradients } from '../theme/theme';
import type { JiraStory, AnalyzedStory } from '../types';
import { jiraApi, analysisApi } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<JiraStory[]>([]);
  const [analyses, setAnalyses] = useState<AnalyzedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [storiesData, analysesData] = await Promise.allSettled([
          jiraApi.fetchAssignedStories(),
          analysisApi.getAllAnalyzedStories(),
        ]);
        if (storiesData.status === 'fulfilled') setStories(storiesData.value);
        if (analysesData.status === 'fulfilled') setAnalyses(analysesData.value);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Assigned Stories',
      value: stories.length,
      icon: <StoryIcon />,
      color: colors.primary,
      bgColor: alpha(colors.primary, 0.08),
      borderColor: alpha(colors.primary, 0.2),
    },
    {
      title: 'Analyses Done',
      value: analyses.length,
      icon: <TrendingIcon />,
      color: colors.secondary,
      bgColor: alpha(colors.secondary, 0.08),
      borderColor: alpha(colors.secondary, 0.2),
    },
    {
      title: 'AI Model',
      value: 'GPT-4o',
      icon: <SparkleIcon />,
      color: '#7E57C2',
      bgColor: alpha('#7E57C2', 0.08),
      borderColor: alpha('#7E57C2', 0.2),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} thickness={3} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Hero Section */}
      <Card
        sx={{
          background: gradients.hero,
          border: 'none',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&:hover': { boxShadow: `0 8px 32px ${alpha(colors.primary, 0.2)}` },
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ maxWidth: 600 }}>
            <Chip
              label="AI-Powered"
              size="small"
              sx={{
                mb: 2,
                bgcolor: alpha('#fff', 0.18),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.72rem',
                backdropFilter: 'blur(4px)',
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 800,
                color: '#fff',
                mb: 1,
                fontSize: { xs: '1.5rem', md: '1.8rem' },
                letterSpacing: '-0.03em',
              }}
            >
              Welcome to Story Analyzer
            </Typography>
            <Typography
              sx={{
                color: alpha('#fff', 0.8),
                fontSize: '0.95rem',
                mb: 3,
                lineHeight: 1.6,
              }}
            >
              Transform your Jira stories into actionable implementation prompts
              powered by AI. Get started by selecting a story to analyze.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowIcon />}
              onClick={() => navigate('/analyze')}
              sx={{
                bgcolor: '#fff',
                color: colors.primary,
                fontWeight: 700,
                px: 3,
                py: 1.2,
                borderRadius: '12px',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.92),
                  boxShadow: `0 4px 20px ${alpha('#000', 0.15)}`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Start Analyzing
            </Button>
          </Box>
          {/* Decorative circles */}
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: alpha('#fff', 0.06),
              display: { xs: 'none', md: 'block' },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -60,
              right: 80,
              width: 140,
              height: 140,
              borderRadius: '50%',
              bgcolor: alpha('#fff', 0.04),
              display: { xs: 'none', md: 'block' },
            }}
          />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Grid container spacing={2.5}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.title}>
            <Card
              sx={{
                border: `1px solid ${stat.borderColor}`,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${alpha(stat.color, 0.12)}`,
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        color: colors.onSurfaceVariant,
                        mb: 0.5,
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Manrope", sans-serif',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                        color: colors.onSurface,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '14px',
                      bgcolor: stat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: alpha(colors.primary, 0.3),
              },
            }}
            onClick={() => navigate('/analyze')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    background: gradients.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PsychologyIcon sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: colors.onSurface,
                      mb: 0.5,
                    }}
                  >
                    Analyze a Story
                  </Typography>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Select a Jira story and generate an AI-powered implementation prompt for GitHub Copilot.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: alpha(colors.secondary, 0.3),
              },
            }}
            onClick={() => navigate('/history')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    bgcolor: alpha(colors.secondary, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <HistoryIcon sx={{ color: colors.secondary, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: colors.onSurface,
                      mb: 0.5,
                    }}
                  >
                    View History
                  </Typography>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Browse your previously analyzed stories and view generated prompts.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Analyses */}
      {analyses.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: colors.onSurface,
                }}
              >
                Recent Analyses
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/history')}
                sx={{ fontSize: '0.8rem' }}
              >
                View All
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {analyses.slice(0, 3).map((analysis) => (
                <Box
                  key={analysis.id}
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: colors.surfaceContainerLow,
                    border: `1px solid ${alpha(colors.outlineVariant, 0.4)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: colors.surfaceContainer,
                      borderColor: alpha(colors.primary, 0.2),
                    },
                  }}
                  onClick={() => navigate('/history')}
                >
                  <Chip
                    label={analysis.jiraKey}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(colors.primary, 0.1),
                      color: colors.primary,
                      height: 26,
                      fontSize: '0.72rem',
                    }}
                  />
                  <Typography
                    noWrap
                    sx={{ flex: 1, fontSize: '0.88rem', color: colors.onSurface }}
                  >
                    {analysis.title}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant, flexShrink: 0 }}
                  >
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
