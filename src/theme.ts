import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true
    sm: true
    md: true
    lg: true
    xl: false
  }
}

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#09111f',
      paper: 'rgba(12, 24, 42, 0.88)',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 375,
      md: 720,
      lg: 1024,
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 4vw, 3.5rem)',
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          backgroundColor: '#09111f',
        },
        body: {
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
        },
        '#root': {
          minHeight: '100vh',
        },
        'button, [role="button"], input, textarea, select': {
          touchAction: 'manipulation',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: false,
      },
      styleOverrides: {
        root: {
          minHeight: 48,
          minWidth: 48,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(18px)',
          backgroundImage:
            'linear-gradient(145deg, rgba(30, 136, 229, 0.12), rgba(255, 152, 0, 0.08))',
        },
      },
    },
  },
})
