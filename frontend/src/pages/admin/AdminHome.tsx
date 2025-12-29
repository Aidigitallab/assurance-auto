
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { Link } from 'react-router-dom';

export const AdminHome = () => {
  // Fetch KPIs directly from /admin/dashboard/kpis
  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const result = await endpoints.admin.getKpis();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Fetch dashboard data for trends and products
  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const result = await endpoints.admin.getDashboard();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const result = await endpoints.admin.getUserStats();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: policyStats } = useQuery({
    queryKey: ['admin-policy-stats'],
    queryFn: async () => {
      const result = await endpoints.admin.getPolicyStats();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Fetch documents stats
  const { data: documentsData } = useQuery({
    queryKey: ['admin-document-stats-v2'], // Changed key to force refetch
    queryFn: async () => {
      const result = await endpoints.admin.getDocumentStats();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // L'API retourne {stats: [{type, count, totalSize}]}
      // On doit transformer en {totalDocuments, attestations, contracts, receipts}
      const stats = (result.data as any).stats || [];
      
      const transformed = {
        totalDocuments: stats.reduce((sum: number, s: any) => sum + s.count, 0),
        attestations: stats.find((s: any) => s.type === 'ATTESTATION')?.count || 0,
        contracts: stats.find((s: any) => s.type === 'CONTRACT')?.count || 0,
        receipts: stats.find((s: any) => s.type === 'RECEIPT')?.count || 0,
      };
      
      return transformed;
    },
  });

  // Fetch products stats
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-stats'],
    queryFn: async () => {
      const result = await endpoints.admin.getAllProducts();
      if (!result.success) throw new Error(result.message);
      // API returns {count, products: [...]}
      const products = (result.data as any)?.products || [];
      return {
        totalProducts: products.length,
        activeProducts: products.filter((p: any) => p.status === 'ACTIVE').length,
      };
    },
  });

  // Use KPIs directly from the API response
  const kpisRaw = kpisData as any;
  
  // Extract nested kpis structure - may be in kpis OR directly in data
  const kpis = kpisRaw?.kpis || kpisRaw || {};
  
  // Extract other dashboard data
  const trends = (dashboardData as any)?.trends || [];
  const popularProducts = (dashboardData as any)?.popularProducts || [];

  const isLoading = kpisLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Tableau de bord Administrateur</h1>
        <p className="text-blue-100">Vue d'ensemble complète de la plateforme d'assurance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users Card */}
        <Link to="/admin/utilisateurs" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Utilisateurs</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {(kpis?.users?.total || userStats?.total || 0).toLocaleString('fr-FR')}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                <span className="text-green-600 font-semibold">{kpis?.users?.active || userStats?.active || 0}</span> actifs
              </span>
              <span className="text-blue-600 font-medium">+{userStats?.newThisMonth || 0} ce mois</span>
            </div>
          </div>
        </Link>

        {/* Policies Card */}
        <Link to="/admin/contrats" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contrats</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {(kpis?.policies?.total || (policyStats as any)?.stats?.total || 0).toLocaleString('fr-FR')}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                <span className="text-green-600 font-semibold">{kpis?.policies?.active || (policyStats as any)?.stats?.active || 0}</span> actifs
              </span>
              <span className="text-orange-600 font-medium">{kpis?.policies?.expired || (policyStats as any)?.stats?.expired || 0} expirés</span>
            </div>
          </div>
        </Link>

        {/* Quotes Card */}
        <Link to="/admin/devis" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Devis</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {(kpis?.quotes?.total || 0).toLocaleString('fr-FR')}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                <span className="text-green-600 font-semibold">{kpis?.quotes?.accepted || 0}</span> acceptés
              </span>
              <span className="text-blue-600 font-medium">{kpis?.quotes?.conversionRate || 0}% conversion</span>
            </div>
          </div>
        </Link>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-100 uppercase tracking-wide">Revenus totaux</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              {(kpis?.financials?.totalPremium || 0).toLocaleString('fr-FR')} <span className="text-xl">XOF</span>
            </h3>
            <div className="text-green-100 text-sm">
              <span className="font-semibold">{(kpis?.financials?.totalPremium || 0).toLocaleString('fr-FR')} XOF</span> total
            </div>
          </div>
        </div>

        {/* Claims Card */}
        <Link to="/admin/sinistres" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sinistres</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {(kpis?.claims?.total || 0).toLocaleString('fr-FR')}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-600 font-medium">{kpis?.claims?.pending || 0} en cours</span>
              <span className="text-green-600 font-medium">{kpis?.claims?.settled || 0} réglés</span>
            </div>
          </div>
        </Link>

        {/* Products Card */}
        <Link to="/admin/produits" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Produits</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {productsData?.totalProducts || 0}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                <span className="text-green-600 font-semibold">{productsData?.activeProducts || 0}</span> actifs
              </span>
              <span className="text-gray-600 font-medium">{(productsData?.totalProducts || 0) - (productsData?.activeProducts || 0)} inactifs</span>
            </div>
          </div>
        </Link>

        {/* Documents Card */}
        <Link to="/admin/documents" className="block">
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Documents</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {documentsData?.totalDocuments || 0}
              </h3>
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-gray-600">
                  <span className="text-green-600 font-semibold">{documentsData?.attestations || 0}</span> attestations
                </span>
                <span className="text-gray-600">
                  <span className="text-blue-600 font-semibold">{documentsData?.contracts || 0}</span> contrats • <span className="text-purple-600 font-semibold">{documentsData?.receipts || 0}</span> reçus
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Tendances */}
      {trends && trends.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Tendances mensuelles</h2>
            <p className="text-sm text-gray-500 mt-1">Évolution des contrats, revenus et sinistres</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nouveaux Contrats</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Revenus</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sinistres</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trends.map((trend: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {trend.month}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {trend.newPolicies || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {((trend.revenue || 0) / 100).toLocaleString('fr-FR')} XOF
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          {trend.claims || 0}
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Produits populaires */}
      {popularProducts && popularProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Produits les plus populaires</h2>
            <p className="text-sm text-gray-500 mt-1">Classement par nombre de souscriptions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code produit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom du produit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Souscriptions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Revenus générés</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popularProducts.map((product: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                        {product.productCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{product.productName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {product.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {product.revenue?.toLocaleString('fr-FR')} XOF
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Actions rapides</h2>
          <p className="text-sm text-gray-500 mt-1">Accès direct aux fonctionnalités principales</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/utilisateurs"
              className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-300 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-500 rounded-full group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-lg">Gérer les utilisateurs</p>
              <p className="text-sm text-gray-600 mt-1">Consulter et modifier les comptes</p>
            </Link>
            <Link
              to="/admin/devis"
              className="group p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-200 hover:border-yellow-300 rounded-xl transition-all duration-300 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-yellow-500 rounded-full group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-lg">Voir les devis</p>
              <p className="text-sm text-gray-600 mt-1">Consulter toutes les demandes</p>
            </Link>
            <Link
              to="/admin/audit-logs"
              className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 hover:border-purple-300 rounded-xl transition-all duration-300 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-purple-500 rounded-full group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-lg">Journal d'audit</p>
              <p className="text-sm text-gray-600 mt-1">Historique des actions</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
