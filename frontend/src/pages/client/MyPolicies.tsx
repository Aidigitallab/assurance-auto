import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const MyPolicies = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-policies'],
    queryFn: async () => {
      const result = await endpoints.policies.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement de vos contrats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mes Contrats</h1>
        <p className="text-gray-600">
          {data?.total || 0} contrats au total
        </p>
      </div>

      {!data?.policies?.length ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun contrat pour le moment
          </h3>
          <p className="text-gray-500 mb-6">
            Vos contrats d'assurance apparaîtront ici après souscription
          </p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Voir les offres
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {data.policies.map((policy) => (
            <div key={policy._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Contrat {policy._id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Du {new Date(policy.startDate).toLocaleDateString('fr-FR')} au{' '}
                    {new Date(policy.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    policy.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : policy.status === 'EXPIRED'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {policy.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Produit</p>
                  <p className="font-medium">{policy.productCode}</p>
                </div>
                <div>
                  <p className="text-gray-500">Prime</p>
                  <p className="font-medium text-green-600">
                    {policy.amount?.toLocaleString('fr-FR')} XOF
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Méthode de paiement</p>
                  <p className="font-medium">{policy.paymentMethod}</p>
                </div>
                {policy.paymentReference && (
                  <div>
                    <p className="text-gray-500">Référence</p>
                    <p className="font-medium">{policy.paymentReference}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium">
                  📄 Voir les documents
                </button>
                <button className="px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors text-sm font-medium">
                  🔄 Renouveler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
