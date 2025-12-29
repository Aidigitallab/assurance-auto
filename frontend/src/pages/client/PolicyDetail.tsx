import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const PolicyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.policies.getById(id);
      console.log('📋 Policy data:', result);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur: {(error as Error).message}</p>
        <button onClick={() => navigate('/client/policies')} className="mt-4 text-blue-600 hover:underline">
          ← Retour aux contrats
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12">Contrat non trouvé</div>;
  }

  const policy = (data as any).policy || data; // Support both formats

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={() => navigate('/client/policies')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Retour aux contrats
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Détail du contrat</h1>
            <p className="text-gray-600">ID: {policy._id || 'N/A'}</p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${
              policy.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : policy.status === 'EXPIRED'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {policy.status || 'N/A'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Produit</p>
              <p className="font-medium">
                {policy.productCode === 'TIERS' ? 'Responsabilité Civile (Tiers)' :
                 policy.productCode === 'TIERS_PLUS' ? 'Tiers Plus' :
                 policy.productCode === 'TOUS_RISQUES' ? 'Tous Risques' : policy.productCode || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prime</p>
              <p className="font-medium text-xl text-green-600">
                {policy.amount?.toLocaleString('fr-FR') || '0'} XOF
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Période</p>
              <p className="font-medium">
                {policy.startDate && policy.endDate ? (
                  `Du ${new Date(policy.startDate).toLocaleDateString('fr-FR')} au ${new Date(policy.endDate).toLocaleDateString('fr-FR')}`
                ) : 'Non défini'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Paiement</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Méthode</p>
              <p className="font-medium">
                {policy.paymentMethod === 'CARD' ? 'Carte bancaire' :
                 policy.paymentMethod === 'BANK_TRANSFER' ? 'Virement bancaire' :
                 policy.paymentMethod === 'CASH' ? 'Espèces' : policy.paymentMethod || 'N/A'}
              </p>
            </div>
            {policy.paymentReference && (
              <div>
                <p className="text-sm text-gray-500">Référence</p>
                <p className="font-medium">{policy.paymentReference}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Date de création</p>
              <p className="font-medium">
                {policy.createdAt ? new Date(policy.createdAt).toLocaleString('fr-FR') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/client/policies/${id}/documents`)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            📄 Voir les documents
          </button>
          <button
            onClick={() => navigate(`/client/claims?policyId=${id}`)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          >
            ⚠️ Déclarer un sinistre
          </button>
        </div>
      </div>
    </div>
  );
};
