import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Landing from './pages/Landing'

const AppHome = lazy(() => import('./pages/AppHome'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<p style={{ padding: 48, textAlign: 'center' }}>Memuat…</p>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app/*" element={<AppHome />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
