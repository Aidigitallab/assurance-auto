import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const ClaimDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: async () => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.claims.getById(id);
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

  if (!data) {
    return <div className="text-center py-12">Sinistre non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={() => navigate('/client/claims')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Retour aux sinistres
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Détail du sinistre</h1>
            <p className="text-gray-600">ID: {data._id}</p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${
              data.status === 'PENDING'
                ? 'bg-blue-100 text-blue-800'
                : data.status === 'UNDER_REVIEW'
                ? 'bg-yellow-100 text-yellow-800'
                : data.status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : data.status === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {data.status}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Informations de l'incident</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Type d'incident</p>
              <p className="font-medium">{data.incident?.type || 'Non spécifié'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de l'incident</p>
              <p className="font-medium">
                {new Date(data.incident?.date || new Date()).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lieu</p>
              <p className="font-medium">{data.incident?.location || 'Non spécifié'}</p>
            </div>
            {data.estimatedAmount && (
              <div>
                <p className="text-sm text-gray-500">Montant estimé</p>
                <p className="font-medium text-xl text-orange-600">
                  {data.estimatedAmount.toLocaleString('fr-FR')} XOF
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Traitement</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="font-medium">{data.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Créé le</p>
              <p className="font-medium">
                {new Date(data.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{data.incident?.description || 'Aucune description'}</p>
      </div>

      {/* Communication */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Communication</h2>
        <p className="text-gray-500 text-center py-8">Aucun message pour le moment</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Gardez cette page à jour pour suivre le traitement de votre sinistre.
        </p>
      </div>
    </div>
  );
};
