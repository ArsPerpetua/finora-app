import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './lib/auth'
import Landing from './pages/Landing'

const AppHome = lazy(() => import('./pages/AppHome'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<p style={{ padding: 48, textAlign: 'center' }}>Memuat…</p>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privasi" element={<Privacy />} />
              <Route path="/syarat" element={<Terms />} />
              <Route path="/app/*" element={<AppHome />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
