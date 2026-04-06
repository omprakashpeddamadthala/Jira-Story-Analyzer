import { createTheme, alpha } from '@mui/material/styles';

// Professional light color palette - clean, modern with indigo/violet accents
const colors = {
  // Core surfaces
  surface: '#fafbfd',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f4f6fa',
  surfaceContainer: '#eef1f7',
  surfaceContainerHigh: '#e4e8f0',
  surfaceContainerHighest: '#d8dde8',
  surfaceBright: '#ffffff',
  surfaceVariant: '#e8ecf4',

  // Text colors
  onSurface: '#1a1d2e',
  onSurfaceVariant: '#5f6577',

  // Primary - indigo/violet
  primary: '#5C6BC0',
  primaryContainer: '#C5CAE9',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#1A237E',
  primaryFixed: '#3F51B5',
  primaryDark: '#3949AB',

  // Secondary - teal
  secondary: '#26A69A',
  secondaryContainer: '#B2DFDB',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#004D40',

  // Tertiary - amber
  tertiary: '#FF8F00',
  tertiaryContainer: '#FFE082',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#E65100',

  // Success - green
  success: '#43A047',
  successContainer: '#C8E6C9',

  // Error - red
  error: '#E53935',
  errorContainer: '#FFCDD2',

  // Info - light blue
  info: '#039BE5',
  infoContainer: '#B3E5FC',

  // Borders and outlines
  outline: '#c2c7d4',
  outlineVariant: '#dce0ea',

  // Inverse
  inverseSurface: '#2d3142',
  inverseOnSurface: '#f0f2f8',
  inversePrimary: '#9fa8da',
};

// Shared gradient definitions
const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, #7E57C2 100%)`,
  hero: `linear-gradient(135deg, ${colors.primary} 0%, #7E57C2 50%, #AB47BC 100%)`,
  surface: `linear-gradient(180deg, ${colors.surfaceContainerLow} 0%, ${colors.surface} 100%)`,
  glow: `radial-gradient(ellipse at 50% 0%, ${alpha(colors.primary, 0.06)} 0%, transparent 60%)`,
  cardHover: `linear-gradient(135deg, ${alpha(colors.primary, 0.03)} 0%, transparent 100%)`,
  sidebar: `linear-gradient(180deg, ${colors.inverseSurface} 0%, #1a1f35 100%)`,
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      light: colors.primaryContainer,
      dark: colors.primaryDark,
      contrastText: colors.onPrimary,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryContainer,
      dark: '#00897B',
      contrastText: colors.onSecondary,
    },
    error: {
      main: colors.error,
      light: colors.errorContainer,
    },
    success: {
      main: colors.success,
      light: colors.successContainer,
    },
    warning: {
      main: colors.tertiary,
      light: colors.tertiaryContainer,
    },
    info: {
      main: colors.info,
      light: colors.infoContainer,
    },
    background: {
      default: colors.surface,
      paper: colors.surfaceContainerLowest,
    },
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
    },
    divider: alpha(colors.outlineVariant, 0.7),
    action: {
      hover: alpha(colors.primary, 0.04),
      selected: alpha(colors.primary, 0.08),
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
          background: alpha(colors.outline, 0.4),
          borderRadius: 3,
        },
        '::selection': {
          backgroundColor: alpha(colors.primary, 0.15),
          color: colors.onSurface,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceContainerLowest,
          backgroundImage: 'none',
          borderRadius: 16,
          border: `1px solid ${alpha(colors.outlineVariant, 0.6)}`,
          boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 1px 2px ${alpha('#000', 0.02)}`,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha('#000', 0.08)}, 0 2px 4px ${alpha('#000', 0.04)}`,
            borderColor: alpha(colors.outline, 0.5),
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
          boxShadow: `0 1px 3px ${alpha(colors.primary, 0.2)}`,
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: alpha(colors.outline, 0.6),
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: alpha(colors.primary, 0.04),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: colors.surfaceContainerLowest,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: alpha(colors.outline, 0.4),
              transition: 'border-color 0.2s ease',
            },
            '&:hover fieldset': {
              borderColor: alpha(colors.outline, 0.7),
            },
            '&.Mui-focused': {
              backgroundColor: colors.surfaceContainerLowest,
              boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.1)}`,
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
          borderColor: alpha(colors.outline, 0.4),
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
            backgroundColor: alpha(colors.primary, 0.08),
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.12),
            },
          },
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.04),
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(colors.outlineVariant, 0.6),
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
          backgroundColor: alpha(colors.error, 0.06),
          borderColor: alpha(colors.error, 0.15),
          color: colors.error,
        },
        standardSuccess: {
          backgroundColor: alpha(colors.success, 0.06),
          borderColor: alpha(colors.success, 0.15),
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
          backgroundColor: colors.inverseSurface,
          color: colors.inverseOnSurface,
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          boxShadow: `0 4px 16px ${alpha('#000', 0.15)}`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.06),
          },
        },
      },
    },
  },
});

export { colors, gradients };
export default theme;
