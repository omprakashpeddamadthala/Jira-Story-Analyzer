import { createTheme, alpha } from '@mui/material/styles';

// Refined dark color palette with improved contrast and depth
const colors = {
  // Core surfaces - deeper, richer blues
  surface: '#0a0e1a',
  surfaceContainerLowest: '#060a14',
  surfaceContainerLow: '#0f1524',
  surfaceContainer: '#141b2e',
  surfaceContainerHigh: '#1c2438',
  surfaceContainerHighest: '#252d42',
  surfaceBright: '#2a3350',
  surfaceVariant: '#1e2740',

  // Text colors - better contrast ratios
  onSurface: '#e8ecf4',
  onSurfaceVariant: '#9ba4b8',

  // Primary - vibrant blue accent
  primary: '#6ea8fe',
  primaryContainer: '#1a56db',
  onPrimary: '#001a40',
  onPrimaryContainer: '#cddcff',
  primaryFixed: '#3b82f6',

  // Secondary - subtle cool gray-blue
  secondary: '#94a3b8',
  secondaryContainer: '#334155',
  onSecondary: '#1e293b',
  onSecondaryContainer: '#cbd5e1',

  // Tertiary - warm amber accent
  tertiary: '#fbbf24',
  tertiaryContainer: '#92400e',
  onTertiary: '#451a03',
  onTertiaryContainer: '#fde68a',

  // Success - emerald
  success: '#34d399',
  successContainer: '#065f46',

  // Error
  error: '#f87171',
  errorContainer: '#7f1d1d',

  // Borders and outlines
  outline: '#475569',
  outlineVariant: '#334155',

  // Inverse
  inverseSurface: '#e2e8f0',
  inverseOnSurface: '#1e293b',
  inversePrimary: '#1d4ed8',
};

// Shared gradient definitions
const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryFixed} 100%)`,
  surface: `linear-gradient(180deg, ${colors.surfaceContainer} 0%, ${colors.surfaceContainerLow} 100%)`,
  glow: `radial-gradient(ellipse at 50% 0%, ${alpha(colors.primary, 0.08)} 0%, transparent 60%)`,
  cardHover: `linear-gradient(135deg, ${alpha(colors.primary, 0.04)} 0%, transparent 100%)`,
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      light: colors.onPrimaryContainer,
      dark: colors.primaryContainer,
      contrastText: colors.onPrimary,
    },
    secondary: {
      main: colors.secondary,
      light: colors.onSecondaryContainer,
      dark: colors.secondaryContainer,
      contrastText: colors.onSecondary,
    },
    error: {
      main: colors.error,
      dark: colors.errorContainer,
    },
    success: {
      main: colors.success,
      dark: colors.successContainer,
    },
    warning: {
      main: colors.tertiary,
      dark: colors.tertiaryContainer,
    },
    background: {
      default: colors.surface,
      paper: colors.surfaceContainer,
    },
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
    },
    divider: alpha(colors.outlineVariant, 0.4),
    action: {
      hover: alpha(colors.primary, 0.06),
      selected: alpha(colors.primary, 0.1),
      focus: alpha(colors.primary, 0.12),
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.025em' },
    h3: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600, letterSpacing: '-0.005em' },
    body1: { lineHeight: 1.7, letterSpacing: '-0.005em' },
    body2: { lineHeight: 1.6, letterSpacing: '-0.005em' },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 600, letterSpacing: '0.01em' },
    caption: { letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.08em', fontWeight: 600, fontSize: '0.7rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        html: {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: colors.surface,
          color: colors.onSurface,
          minHeight: '100vh',
          overflowX: 'hidden',
        },
        '::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          background: alpha(colors.outlineVariant, 0.5),
          borderRadius: 3,
        },
        '::selection': {
          backgroundColor: alpha(colors.primary, 0.3),
          color: colors.onSurface,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceContainer,
          backgroundImage: 'none',
          borderRadius: 16,
          border: `1px solid ${alpha(colors.outlineVariant, 0.2)}`,
          boxShadow: `0 2px 12px ${alpha('#000', 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 8px 32px ${alpha('#000', 0.28)}`,
            borderColor: alpha(colors.outlineVariant, 0.3),
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 20px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:focus-visible': {
            outline: `2px solid ${colors.primary}`,
            outlineOffset: 2,
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 4px 16px ${alpha(colors.primaryContainer, 0.4)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: alpha(colors.outlineVariant, 0.5),
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: alpha(colors.primary, 0.06),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: alpha(colors.surfaceContainerLow, 0.6),
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: alpha(colors.outlineVariant, 0.3),
              transition: 'border-color 0.2s ease',
            },
            '&:hover fieldset': {
              borderColor: alpha(colors.outline, 0.6),
            },
            '&.Mui-focused': {
              backgroundColor: alpha(colors.surfaceContainerLow, 0.8),
              boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.15)}`,
              '& fieldset': {
                borderColor: colors.primary,
                borderWidth: 1,
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.onSurfaceVariant,
            '&.Mui-focused': {
              color: colors.primary,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          fontSize: '0.72rem',
          letterSpacing: '-0.01em',
          height: 26,
        },
        outlined: {
          borderColor: alpha(colors.outlineVariant, 0.4),
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary, 0.1),
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.14),
            },
          },
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.05),
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(colors.outlineVariant, 0.2),
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
        },
        standardError: {
          backgroundColor: alpha(colors.error, 0.08),
          borderColor: alpha(colors.error, 0.2),
          color: colors.error,
        },
        standardSuccess: {
          backgroundColor: alpha(colors.success, 0.08),
          borderColor: alpha(colors.success, 0.2),
          color: colors.success,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.surfaceContainerHighest,
          border: `1px solid ${alpha(colors.outlineVariant, 0.3)}`,
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          boxShadow: `0 4px 16px ${alpha('#000', 0.3)}`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.08),
          },
        },
      },
    },
  },
});

export { colors, gradients };
export default theme;
