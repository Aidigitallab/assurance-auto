import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { DocumentDTO, DocumentType } from '@/types/dto';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const DOCUMENT_TYPES: { value: DocumentType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Tous', icon: '📄' },
  { value: 'ATTESTATION', label: 'Attestations', icon: '✅' },
  { value: 'CONTRACT', label: 'Contrats', icon: '📜' },
  { value: 'RECEIPT', label: 'Reçus', icon: '🧾' },
  { value: 'CLAIM_ATTACHMENT', label: 'Sinistres', icon: '📎' },
  { value: 'OTHER', label: 'Autres', icon: '📋' },
];

const TYPE_COLORS: Record<DocumentType, string> = {
  ATTESTATION: 'bg-green-100 text-green-800 border-green-200',
  CONTRACT: 'bg-blue-100 text-blue-800 border-blue-200',
  RECEIPT: 'bg-purple-100 text-purple-800 border-purple-200',
  CLAIM_ATTACHMENT: 'bg-orange-100 text-orange-800 border-orange-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const AllDocuments = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentDTO | null>(null);
  const pageSize = 20;

  // Fetch documents
  const { data, isLoading } = useQuery({
    queryKey: ['admin-documents', typeFilter, currentPage],
    queryFn: async () => {
      const result = await endpoints.admin.getAllDocuments({
        type: typeFilter === 'all' ? undefined : typeFilter,
        page: currentPage,
        limit: pageSize,
      });
      console.log('📄 Documents response:', result);
      if (!result.success) throw new Error(result.message);
      
      // L'API retourne {count, total, page, pages, limit, documents}
      // On transforme pour correspondre à notre interface
      const apiData = result.data as any;
      return {
        documents: apiData.documents || [],
        total: apiData.total || apiData.count || 0,
        page: apiData.page || 1,
        totalPages: apiData.pages || 1,
      };
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const result = await endpoints.admin.deleteDocument(documentId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-document-stats'] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
  });

  const documents: DocumentDTO[] = data?.documents || [];
  const totalPages = data?.totalPages || 1;

  // Calculate stats
  const stats = DOCUMENT_TYPES.filter(t => t.value !== 'all').map(type => ({
    ...type,
    count: documents.filter((d: DocumentDTO) => d.type === type.value).length,
  }));

  const handleDelete = (document: DocumentDTO) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete._id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (document: DocumentDTO) => {
    try {
      const blob = await endpoints.documents.download(document._id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Gestion des Documents</h1>
        <p className="text-gray-600">
          Gérez tous les documents générés par le système (attestations, contrats, reçus)
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.value} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {DOCUMENT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              setTypeFilter(type.value);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors border-2 ${
              typeFilter === type.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Documents table */}
      {documents.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Aucun document trouvé"
          description={`Aucun document ${typeFilter !== 'all' ? `de type ${typeFilter}` : ''} n'a été trouvé.`}
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom du fichier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document: DocumentDTO) => (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                            TYPE_COLORS[document.type as keyof typeof TYPE_COLORS]
                          }`}
                        >
                          {DOCUMENT_TYPES.find(t => t.value === document.type)?.icon} {document.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{document.filename}</div>
                        <div className="text-xs text-gray-500">{document.mimeType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{document.entityType || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {document.entityId ? `${document.entityId.slice(0, 8)}...` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(document.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownload(document)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Télécharger"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleDelete(document)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer le document "${documentToDelete?.filename}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
      />
    </div>
  );
};
