import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const AllPolicies = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Policy stats
  const { data: policyStats } = useQuery({
    queryKey: ['admin-policy-stats'],
    queryFn: async () => {
      const result = await endpoints.admin.getPolicyStats();
      console.log('📊 Policy stats response:', JSON.stringify(result, null, 2));
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Policies list - Use ADMIN endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['admin-policies', page, statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const result = await endpoints.admin.getAllPolicies(params);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des contrats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tous les Contrats</h1>
        <p className="text-gray-600">
          {data?.pagination?.total || 0} contrats au total
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl mb-2">📄</div>
          <h3 className="text-xl font-bold text-gray-800">
            {(policyStats as any)?.stats?.total || 0}
          </h3>
          <p className="text-sm text-gray-600">Total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl mb-2">✅</div>
          <h3 className="text-xl font-bold text-green-600">
            {(policyStats as any)?.stats?.active || 0}
          </h3>
          <p className="text-sm text-gray-600">Actifs</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl mb-2">⏱️</div>
          <h3 className="text-xl font-bold text-yellow-600">
            {(policyStats as any)?.paymentStats?.pending || 0}
          </h3>
          <p className="text-sm text-gray-600">En attente</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl mb-2">📅</div>
          <h3 className="text-xl font-bold text-orange-600">
            {(policyStats as any)?.stats?.expired || 0}
          </h3>
          <p className="text-sm text-gray-600">Expirés</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl mb-2">❌</div>
          <h3 className="text-xl font-bold text-red-600">
            {(policyStats as any)?.stats?.cancelled || 0}
          </h3>
          <p className="text-sm text-gray-600">Annulés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher (numéro de police)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Numéro de police..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              <option value="PENDING_PAYMENT">En attente paiement</option>
              <option value="ACTIVE">Actif</option>
              <option value="EXPIRED">Expiré</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {!data?.policies.length ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun contrat pour le moment
          </h3>
          <p className="text-gray-500">
            Les contrats créés apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.policies.map((policy) => (
                <tr key={policy._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(policy as any).policyNumber || policy._id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof policy.userId === 'string' 
                      ? policy.userId.substring(0, 8) + '...'
                      : (policy.userId as any)?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.productCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {policy.amount?.toLocaleString('fr-FR') || '0'} XOF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        policy.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : (policy.status as any) === 'PENDING_PAYMENT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : policy.status === 'EXPIRED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {policy.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.startDate ? new Date(policy.startDate).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.endDate ? new Date(policy.endDate).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination && data.pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {data.pagination.page} sur {data.pagination.pages}
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
              disabled={page >= data.pagination.pages}
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
