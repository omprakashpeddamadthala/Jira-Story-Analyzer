import { createTheme } from '@mui/material/styles';

// Material Design 3 dark color tokens from the design template
const colors = {
  surface: '#001230',
  surfaceContainerLowest: '#000d27',
  surfaceContainerLow: '#041b3c',
  surfaceContainer: '#091f41',
  surfaceContainerHigh: '#152a4b',
  surfaceContainerHighest: '#213557',
  surfaceBright: '#26395c',
  onSurface: '#d7e2ff',
  onSurfaceVariant: '#c3c6d6',
  primary: '#abc7ff',
  primaryContainer: '#0058b6',
  onPrimary: '#002f66',
  onPrimaryContainer: '#bfd3ff',
  secondary: '#b9c8dd',
  secondaryContainer: '#3c4a5c',
  onSecondary: '#243142',
  onSecondaryContainer: '#abb9cf',
  tertiary: '#ffb59b',
  tertiaryContainer: '#a33500',
  onTertiary: '#5b1a00',
  onTertiaryContainer: '#ffc6b2',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  outline: '#8d90a0',
  outlineVariant: '#434654',
  inverseSurface: '#d7e2ff',
  inverseOnSurface: '#1d3052',
  inversePrimary: '#005cbd',
  surfaceVariant: '#213557',
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
    background: {
      default: colors.surface,
      paper: colors.surfaceContainer,
    },
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
    },
    divider: colors.outlineVariant,
    action: {
      hover: 'rgba(171, 199, 255, 0.08)',
      selected: 'rgba(171, 199, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 800 },
    h3: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.surface,
          color: colors.onSurface,
          minHeight: '100vh',
        },
        '::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          background: colors.outlineVariant,
          borderRadius: 3,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceContainer,
          backgroundImage: 'none',
          borderRadius: 16,
          border: `1px solid ${colors.outlineVariant}15`,
          boxShadow: '0 2px 12px rgba(0, 13, 39, 0.3)',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 13, 39, 0.4)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 88, 182, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: colors.surfaceContainerLow,
            transition: 'box-shadow 0.2s ease',
            '& fieldset': {
              borderColor: colors.outlineVariant,
            },
            '&:hover fieldset': {
              borderColor: colors.outline,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${colors.primaryContainer}40`,
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.onSurfaceVariant,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 20,
          fontSize: '0.7rem',
          letterSpacing: '-0.02em',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: `${colors.primary}18`,
            '&:hover': {
              backgroundColor: `${colors.primary}24`,
            },
          },
          '&:hover': {
            backgroundColor: colors.surfaceContainerHigh,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: `${colors.outlineVariant}30`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
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
  },
});

export { colors };
export default theme;
