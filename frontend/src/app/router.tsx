import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { AppLayout } from './layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ClientHome } from '@/pages/client/ClientHome';
import { MyVehicles } from '@/pages/client/MyVehicles';
import { Products } from '@/pages/client/Products';
import { ClientQuotes } from '@/pages/client/ClientQuotes';
import { ClientPolicies } from '@/pages/client/ClientPolicies';
import { PolicyDetail } from '@/pages/client/PolicyDetail';
import { PolicyDocuments } from '@/pages/client/PolicyDocuments';
import { ClientClaims } from '@/pages/client/ClientClaims';
import { ClaimDetail } from '@/pages/client/ClaimDetail';
import { Notifications } from '@/pages/client/Notifications';
import { MyQuotes } from '@/pages/client/MyQuotes';
import { MyPolicies } from '@/pages/client/MyPolicies';
import { AdminHome } from '@/pages/admin/AdminHome';
import { AllUsers } from '@/pages/admin/AllUsers';
import { AllQuotes } from '@/pages/admin/AllQuotes';
import { AllPolicies } from '@/pages/admin/AllPolicies';
import { AllClaims } from '@/pages/admin/AllClaims';
import { ClaimDetail as AdminClaimDetail } from '@/pages/admin/ClaimDetail';
import { AllProducts } from '@/pages/admin/AllProducts';
import { AllDocuments } from '@/pages/admin/AllDocuments';
import { AuditLogs } from '@/pages/admin/AuditLogs';
import { NotFound } from '@/pages/NotFound';
import { useAuthStore } from '@/auth/authStore';

// Composant pour rediriger vers la bonne page selon le rôle
const RoleBasedRedirect = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CLIENT') {
    return <Navigate to="/client" replace />;
  } else if (user.role === 'ADMIN' || user.role === 'AGENT' || user.role === 'EXPERT') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <RoleBasedRedirect />,
  },
  {
    path: '/client',
    element: (
      <RequireAuth>
        <RequireRole allowedRoles={['CLIENT']}>
          <AppLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <ClientHome />,
      },
      {
        path: 'vehicles',
        element: <MyVehicles />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'quotes',
        element: <ClientQuotes />,
      },
      {
        path: 'devis',
        element: <MyQuotes />,
      },
      {
        path: 'policies',
        element: <ClientPolicies />,
      },
      {
        path: 'policies/:id',
        element: <PolicyDetail />,
      },
      {
        path: 'policies/:id/documents',
        element: <PolicyDocuments />,
      },
      {
        path: 'contrats',
        element: <MyPolicies />,
      },
      {
        path: 'claims',
        element: <ClientClaims />,
      },
      {
        path: 'claims/:id',
        element: <ClaimDetail />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <RequireRole allowedRoles={['ADMIN', 'AGENT', 'EXPERT']}>
          <AppLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
      {
        path: 'utilisateurs',
        element: <AllUsers />,
      },
      {
        path: 'devis',
        element: <AllQuotes />,
      },
      {
        path: 'contrats',
        element: <AllPolicies />,
      },
      {
        path: 'sinistres',
        element: <AllClaims />,
      },
      {
        path: 'sinistres/:id',
        element: <AdminClaimDetail />,
      },
      {
        path: 'produits',
        element: <AllProducts />,
      },
      {
        path: 'documents',
        element: <AllDocuments />,
      },
      {
        path: 'audit-logs',
        element: <AuditLogs />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
