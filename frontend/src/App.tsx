import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { useQueryClient } from '@tanstack/react-query';

import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import DocumentPage from './pages/DocumentPage';
import ChatPage from './pages/ChatPage';
import LoansPage from './pages/LoansPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DocumentManagementPage from './pages/DocumentManagementPage';
import DocumentFormPage from './pages/DocumentFormPage';
import UserManagementPage from './pages/UserManagementPage';
import LoanManagementPage from './pages/LoanManagementPage';
import Layout from './components/Layout';
import { UserRole } from './types';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  
  if (requireAdmin && user?.role === UserRole.READER) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const { isEcoMode } = useSettingsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Inject/remove .eco-mode class on body
    if (isEcoMode) {
      document.body.classList.add('eco-mode');
    } else {
      document.body.classList.remove('eco-mode');
    }

    // Update React Query defaults
    queryClient.setDefaultOptions({
      queries: {
        refetchOnWindowFocus: !isEcoMode,
        refetchOnReconnect: !isEcoMode,
      },
    });
  }, [isEcoMode, queryClient]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* User Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
        <Route path="/document/:id" element={<ProtectedRoute><DocumentPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><LoansPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin/Librarian Routes */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><DocumentManagementPage /></ProtectedRoute>} />
        <Route path="/admin/documents/new" element={<ProtectedRoute requireAdmin><DocumentFormPage /></ProtectedRoute>} />
        <Route path="/admin/documents/edit/:id" element={<ProtectedRoute requireAdmin><DocumentFormPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><UserManagementPage /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute requireAdmin><LoanManagementPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
