import { StrictMode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import './index.css'
import App from './App'
import { appTheme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)
