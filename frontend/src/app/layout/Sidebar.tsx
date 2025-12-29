import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    // Pour les pages "home" (racine), vérifier exactement
    if (path === '/client' || path === '/admin') {
      return location.pathname === path;
    }
    // Pour les autres pages, vérifier si le path commence par
    return location.pathname.startsWith(path);
  };

  const clientLinks = [
    { path: '/client', label: 'Accueil', icon: '🏠' },
    { path: '/client/vehicles', label: 'Mes Véhicules', icon: '🚗' },
    { path: '/client/products', label: 'Produits', icon: '📦' },
    { path: '/client/quotes', label: 'Créer un Devis', icon: '📋' },
    { path: '/client/policies', label: 'Mes Contrats', icon: '📄' },
    { path: '/client/claims', label: 'Sinistres', icon: '⚠️' },
    { path: '/client/notifications', label: 'Notifications', icon: '🔔' },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/devis', label: 'Tous les Devis', icon: '📋' },
    { path: '/admin/contrats', label: 'Tous les Contrats', icon: '📄' },
    { path: '/admin/sinistres', label: 'Sinistres', icon: '🔥' },
    { path: '/admin/produits', label: 'Produits', icon: '🏷️' },
    { path: '/admin/documents', label: 'Documents', icon: '📄' },
    { path: '/admin/audit-logs', label: 'Journal d\'audit', icon: '🔍' },
  ];

  const links = user?.role === 'CLIENT' ? clientLinks : adminLinks;

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">🚗 Assurance Auto</h1>
        <p className="text-sm text-gray-400 mt-1">
          {user?.role === 'CLIENT' ? 'Espace Client' : 'Espace Admin'}
        </p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive(link.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="mr-2">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          <p className="font-semibold text-white">
            {user?.name}
          </p>
          <p className="text-xs mt-1">{user?.email}</p>
          <p className="text-xs mt-1">
            <span className="inline-block px-2 py-1 rounded bg-blue-600 text-white">
              {user?.role}
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
};
