import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { ThemeProvider } from '@/providers/theme-provider'
import { QueryProvider } from '@/providers/query-provider'
import { AuthBootstrapProvider } from '@/providers/auth-bootstrap-provider'
import { SiteAppearanceProvider } from '@/providers/site-appearance-provider'
import { ToastProvider } from '@/providers/toast-provider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <SiteAppearanceProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthBootstrapProvider>
              <App />
            </AuthBootstrapProvider>
          </ToastProvider>
        </ThemeProvider>
      </SiteAppearanceProvider>
    </QueryProvider>
  </StrictMode>,
)
