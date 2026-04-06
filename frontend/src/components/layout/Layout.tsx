import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Psychology as PsychologyIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { colors, gradients } from '../../theme/theme';

const SIDEBAR_WIDTH = 260;

const navItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/analyze', label: 'Analyze', icon: <PsychologyIcon /> },
  { path: '/history', label: 'History', icon: <HistoryIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: gradients.sidebar,
        color: '#fff',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 12px ${alpha(colors.primary, 0.4)}`,
          }}
        >
          <AnalyticsIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Story Analyzer
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: alpha('#fff', 0.5), letterSpacing: '0.05em' }}>
            AI-POWERED
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1.5, pt: 1 }}>
        <Typography
          sx={{
            px: 1.5,
            py: 1,
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: alpha('#fff', 0.35),
          }}
        >
          Menu
        </Typography>
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: '10px',
                  py: 1.25,
                  px: 1.5,
                  mx: 0,
                  transition: 'all 0.2s ease',
                  ...(isActive
                    ? {
                        bgcolor: alpha('#fff', 0.12),
                        backdropFilter: 'blur(8px)',
                        '&:hover': { bgcolor: alpha('#fff', 0.16) },
                      }
                    : {
                        bgcolor: 'transparent',
                        '&:hover': { bgcolor: alpha('#fff', 0.06) },
                      }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#fff' : alpha('#fff', 0.5),
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : alpha('#fff', 0.7),
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: colors.secondary,
                      boxShadow: `0 0 8px ${colors.secondary}`,
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Sidebar footer */}
      <Box sx={{ p: 2.5 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: alpha('#fff', 0.06),
            border: `1px solid ${alpha('#fff', 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: colors.primary,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              SA
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>
                Story Analyzer
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: alpha('#fff', 0.45) }}>
                v1.0
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.surface }}>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: SIDEBAR_WIDTH,
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              zIndex: 40,
            }}
          >
            {sidebarContent}
          </Box>
        </Box>
      )}

      {/* Mobile Drawer */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              border: 'none',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: alpha(colors.surfaceContainerLowest, 0.9),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${alpha(colors.outlineVariant, 0.5)}`,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, md: 64 }, px: { xs: 2, md: 3 } }}>
            {!isDesktop && (
              <IconButton
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ mr: 1.5, color: colors.onSurface }}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: colors.onSurface,
                }}
              >
                {navItems.find((n) => n.path === location.pathname)?.label ?? 'Story Analyzer'}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: colors.surfaceContainerLow,
            backgroundImage: gradients.glow,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 400px',
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
