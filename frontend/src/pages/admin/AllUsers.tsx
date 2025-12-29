import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { toast } from 'sonner';

type UserRole = 'CLIENT' | 'ADMIN' | 'AGENT' | 'EXPERT';

export const AllUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Stats
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const result = await endpoints.admin.getUserStats();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Users list
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, roleFilter, searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.isActive = statusFilter === 'ACTIVE';
      
      const result = await endpoints.admin.getAllUsers(params);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      endpoints.admin.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Rôle modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du rôle');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      endpoints.admin.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Statut modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du statut');
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    if (confirm(`Confirmer le changement de rôle vers ${newRole} ?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleStatusToggle = (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    if (confirm(`Confirmer ${action} cet utilisateur ?`)) {
      updateStatusMutation.mutate({ userId, isActive: !currentStatus });
    }
  };

  const roles: UserRole[] = ['CLIENT', 'ADMIN', 'AGENT', 'EXPERT'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des Utilisateurs</h1>
        <p className="text-gray-600">
          {usersData?.pagination.total || 0} utilisateurs au total
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">👥</div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {userStats?.total || 0}
          </h3>
          <p className="text-sm text-gray-600">Utilisateurs</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">✅</div>
            <span className="text-sm text-gray-500">Actifs</span>
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-1">
            {userStats?.active || 0}
          </h3>
          <p className="text-sm text-gray-600">
            {userStats?.inactive || 0} inactifs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🆕</div>
            <span className="text-sm text-gray-500">Nouveaux</span>
          </div>
          <h3 className="text-2xl font-bold text-blue-600 mb-1">
            {userStats?.newThisMonth || 0}
          </h3>
          <p className="text-sm text-gray-600">Ce mois-ci</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">👤</div>
            <span className="text-sm text-gray-500">Clients</span>
          </div>
          <h3 className="text-2xl font-bold text-purple-600 mb-1">
            {userStats?.byRole.CLIENT || 0}
          </h3>
          <p className="text-sm text-gray-600">
            {userStats?.byRole.ADMIN || 0} admins
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom ou email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les rôles</option>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
              <option value="AGENT">Agent</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {!usersData?.users || usersData.users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-gray-500">
            Essayez de modifier les filtres de recherche
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData.users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Sans nom'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={updateRoleMutation.isPending}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(user._id, (user as any).isActive || false)}
                      disabled={updateStatusMutation.isPending}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (user as any).isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors disabled:opacity-50`}
                    >
                      {(user as any).isActive ? '✓ Actif' : '✗ Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {usersData && usersData.pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {usersData.pagination.page} sur {usersData.pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= usersData.pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
