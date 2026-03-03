import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import DefaultLayout from '@/src/components/DefaultLayout';
import Login from '@/src/pages/Login';
import NotFound from '@/src/pages/NotFound';
import Ajustes from '@/src/pages/Ajustes';
import Productos from '@/src/pages/Productos';
import CRM from '@/src/pages/CRM';
import Parcelas from '@/src/pages/Parcelas';
import Zafras from '@/src/pages/Zafras';
import Monitoreo from '@/src/pages/Monitoreo';
import Agenda from '@/src/pages/Agenda';
import IAChat from '@/src/pages/IAChat';
import EspacioCliente from '@/src/pages/EspacioCliente';
import { Loader2, Check, X, Users } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, profile, loading, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 rounded-full bg-yellow-100 p-3 text-yellow-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black">Configuração Necessária</h2>
        <p className="mt-2 max-w-md text-gray-600">
          Por favor, configure as variáveis de ambiente do Supabase (URL e Anon Key) no painel de segredos do Google AI Studio para começar.
        </p>
        <div className="mt-6 rounded-md bg-gray-100 p-4 text-left text-xs font-mono">
          <p className="font-bold mb-2">Debug Info:</p>
          <p>URL Detectada: {process.env.VITE_SUPABASE_URL ? '✅ Sim' : '❌ Não'}</p>
          <p>Key Detectada: {process.env.VITE_SUPABASE_ANON_KEY ? '✅ Sim' : '❌ Não'}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          Recarregar Página
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.perfil_acceso)) {
    return <Navigate to="/404" replace />;
  }

  return <DefaultLayout>{children}</DefaultLayout>;
};

const Dashboard = () => {
  const [status, setStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');
  const { isConfigured } = useAuth();

  React.useEffect(() => {
    async function checkConnection() {
      if (!isConfigured) return;
      try {
        // Try to fetch a single row from a public table or just check health
        const { error } = await supabase.from('empresa').select('id').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows", which is fine
           console.error('Supabase connection error:', error);
           setStatus('error');
        } else {
          setStatus('connected');
        }
      } catch (err) {
        console.error('Connection test failed:', err);
        setStatus('error');
      }
    }
    checkConnection();
  }, [isConfigured]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bodydark2">Status do Sistema:</span>
          {status === 'checking' && (
            <span className="flex items-center gap-1 text-sm text-warning">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
            </span>
          )}
          {status === 'connected' && (
            <span className="flex items-center gap-1 text-sm text-meta-3">
              <Check className="h-4 w-4" /> Conectado ao Supabase
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-sm text-meta-1">
              <X className="h-4 w-4" /> Erro de Conexão
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {/* Placeholder cards for stats */}
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <Users className="text-primary" size={22} />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">0</h4>
              <span className="text-sm font-medium">Clientes Ativos</span>
            </div>
          </div>
        </div>
        {/* Add more cards as needed */}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/404" element={<NotFound />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ajustes"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Ajustes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/productos"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <Productos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/crm"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <CRM />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parcelas"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <Parcelas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/zafras"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <Zafras />
              </ProtectedRoute>
            }
          />

          <Route
            path="/monitoreo"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <Monitoreo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agenda"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <Agenda />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ia"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'RTV']}>
                <IAChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/espacio-cliente"
            element={
              <ProtectedRoute allowedRoles={['Cliente']}>
                <EspacioCliente />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
