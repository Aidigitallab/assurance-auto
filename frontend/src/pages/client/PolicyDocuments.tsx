import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const PolicyDocuments = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['policy-documents', id],
    queryFn: async () => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.policies.getDocuments(id);
      console.log('📝 Documents data:', result);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: !!id,
  });

  const handleDownload = async (doc: any, filename: string) => {
    try {
      const docId = doc._id || doc.id;
      console.log('📥 Downloading document:', { doc, docId, filename });
      
      if (!docId) {
        alert('ID du document manquant');
        return;
      }
      
      // Utiliser l'API endpoint qui gère l'auth automatiquement
      const blob = await endpoints.documents.download(docId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert(`Erreur lors du téléchargement: ${(error as Error).message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const documentTypes = {
    ATTESTATION: { name: 'Attestation d\'assurance', icon: '📋', color: 'blue' },
    CONTRACT: { name: 'Contrat d\'assurance', icon: '📄', color: 'green' },
    RECEIPT: { name: 'Reçu de paiement', icon: '🧾', color: 'purple' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={() => navigate(`/client/policies/${id}`)}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Retour au contrat
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Documents du contrat</h1>
        <p className="text-gray-600">{data?.documents.length || 0} documents disponibles</p>
      </div>

      {!data?.documents.length ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun document
          </h3>
          <p className="text-gray-500">
            Les documents seront générés automatiquement
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {data.documents.map((doc) => {
            const type = documentTypes[doc.type as keyof typeof documentTypes] || {
              name: doc.type,
              icon: '📄',
              color: 'gray',
            };

            return (
              <div key={doc._id || (doc as any).id || Math.random()} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className={`text-5xl mb-4 text-center`}>{type.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
                  {type.name}
                </h3>
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>Taille: {doc.size ? (doc.size / 1024).toFixed(2) : '0'} KB</p>
                  <p>Créé: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  {doc._id && <p className="text-xs text-gray-400">ID: {doc._id.substring(0, 8)}...</p>}
                </div>
                <button
                  onClick={() => handleDownload(doc, `${type.name}.pdf`)}
                  className={`w-full px-4 py-2 bg-${type.color}-600 text-white rounded-lg hover:bg-${type.color}-700 font-medium`}
                >
                  ⬇️ Télécharger
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
