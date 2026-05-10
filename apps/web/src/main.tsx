import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { ThemeProvider } from '@/providers/theme-provider'
import { QueryProvider } from '@/providers/query-provider'
import { AuthBootstrapProvider } from '@/providers/auth-bootstrap-provider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <AuthBootstrapProvider>
          <App />
        </AuthBootstrapProvider>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
