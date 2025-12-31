import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  RECEIVED: { label: 'Reçu', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🆕' },
  UNDER_REVIEW: { label: 'En examen', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🔍' },
  NEED_MORE_INFO: { label: 'Info manquantes', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '❓' },
  EXPERT_ASSIGNED: { label: 'Expert assigné', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '👨‍🔧' },
  IN_REPAIR: { label: 'En réparation', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '🔧' },
  SETTLED: { label: 'Réglé', color: 'bg-green-100 text-green-800 border-green-200', icon: '✅' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800 border-red-200', icon: '❌' },
};

const INCIDENT_TYPES: Record<string, string> = {
  ACCIDENT: 'Accident',
  THEFT: 'Vol',
  FIRE: 'Incendie',
  NATURAL_DISASTER: 'Catastrophe naturelle',
  VANDALISM: 'Vandalisme',
  GLASS_DAMAGE: 'Bris de glace',
  OTHER: 'Autre',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['UNDER_REVIEW', 'NEED_MORE_INFO', 'REJECTED'],
  UNDER_REVIEW: ['NEED_MORE_INFO', 'EXPERT_ASSIGNED', 'SETTLED', 'REJECTED'],
  NEED_MORE_INFO: ['UNDER_REVIEW', 'REJECTED'],
  EXPERT_ASSIGNED: ['IN_REPAIR', 'SETTLED', 'REJECTED'],
  IN_REPAIR: ['SETTLED', 'REJECTED'],
  SETTLED: [],
  REJECTED: [],
};

export const ClaimDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [noteContent, setNoteContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [expertId, setExpertId] = useState('');

  // Fetch claim details
  const { data: claim, isLoading } = useQuery({
    queryKey: ['admin-claim', id],
    queryFn: async () => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.admin.getClaimById(id);
      console.log('📋 Claim API Response:', result);
      if (!result.success) throw new Error(result.message);
      console.log('📋 Claim Data:', result.data);
      return (result.data as any).claim || result.data;
    },
    enabled: !!id,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.admin.updateClaimStatus(id, status, note);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour du statut');
    },
  });

  // Assign expert mutation
  const assignExpertMutation = useMutation({
    mutationFn: async ({ expertId, note }: { expertId: string; note?: string }) => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.admin.assignExpert(id, expertId, note);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      toast.success('Expert assigné avec succès');
      setExpertId('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'assignation de l\'expert');
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ content, isInternal }: { content: string; isInternal: boolean }) => {
      if (!id) throw new Error('ID manquant');
      const result = await endpoints.admin.addClaimNote(id, content, isInternal);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim', id] });
      toast.success('Note ajoutée avec succès');
      setNoteContent('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'ajout de la note');
    },
  });

  const handleStatusChange = (newStatus: string) => {
    const note = prompt('Note (optionnelle) :');
    updateStatusMutation.mutate({ status: newStatus, note: note || undefined });
  };

  const handleAssignExpert = () => {
    if (!expertId) {
      toast.error('Veuillez entrer l\'ID de l\'expert');
      return;
    }
    const note = prompt('Note (optionnelle) :');
    assignExpertMutation.mutate({ expertId, note: note || undefined });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) {
      toast.error('Veuillez entrer le contenu de la note');
      return;
    }
    addNoteMutation.mutate({ content: noteContent, isInternal: isInternalNote });
  };

  // Check loading and error states first
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <p className="ml-3 text-gray-600">Chargement du sinistre...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sinistre non trouvé</h2>
        <Link to="/admin/sinistres" className="text-orange-600 hover:text-orange-700">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const availableTransitions = STATUS_TRANSITIONS[claim.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link
              to="/admin/sinistres"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la liste
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Sinistre #{claim._id?.slice(-6) || 'N/A'}
            </h1>
          </div>
          <div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${STATUS_LABELS[claim.status]?.color || 'bg-gray-100 text-gray-800'}`}>
              <span className="mr-2">{STATUS_LABELS[claim.status]?.icon}</span>
              {STATUS_LABELS[claim.status]?.label || claim.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <h2 className="text-xl font-bold">Détails de l'incident</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type d'incident</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {INCIDENT_TYPES[claim.incident?.type] || claim.incident?.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de l'incident</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {claim.incident?.date ? new Date(claim.incident.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              {claim.incident?.location && (
                <div>
                  <p className="text-sm text-gray-500">Lieu</p>
                  <p className="text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {claim.incident?.location}
                  </p>
                </div>
              )}

              {claim.incident?.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {claim.incident?.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client & Policy Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h3 className="text-lg font-bold text-blue-900">Client</h3>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-semibold text-gray-900">
                    {claim.owner?.name || `${claim.owner?.firstName} ${claim.owner?.lastName}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{claim.owner?.email}</p>
                </div>
                {claim.owner?.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="text-gray-900">{claim.owner?.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Policy */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                <h3 className="text-lg font-bold text-purple-900">Contrat</h3>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Numéro</p>
                  <p className="font-semibold text-gray-900">
                    {claim.policy?.policyNumber || claim.policy?._id?.slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    claim.policy?.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {claim.policy?.status}
                  </span>
                </div>
                {claim.policy?.startDate && (
                  <div>
                    <p className="text-sm text-gray-500">Période</p>
                    <p className="text-gray-900 text-sm">
                      {claim.policy?.startDate && new Date(claim.policy.startDate).toLocaleDateString('fr-FR')} - 
                      {claim.policy?.endDate && new Date(claim.policy.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900">Véhicule concerné</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Marque</p>
                  <p className="font-semibold text-gray-900">{claim.vehicle?.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Modèle</p>
                  <p className="font-semibold text-gray-900">{claim.vehicle?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Année</p>
                  <p className="font-semibold text-gray-900">{claim.vehicle?.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Immatriculation</p>
                  <p className="font-semibold text-gray-900">{claim.vehicle?.plateNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {claim.attachments && claim.attachments.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <h3 className="text-lg font-bold text-green-900">
                  Pièces jointes ({claim.attachments?.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {claim.attachments?.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={`http://localhost:5000${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                    >
                      <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.uploadedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {claim.history && claim.history.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Historique des statuts</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {claim.history?.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg ${STATUS_LABELS[entry.status]?.color || 'bg-gray-100'}`}>
                          {STATUS_LABELS[entry.status]?.icon || '📝'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">
                            {STATUS_LABELS[entry.status]?.label || entry.status}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.changedAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Par {entry.changedBy?.firstName} {entry.changedBy?.lastName} ({entry.changedBy?.role})
                        </p>
                        {entry.note && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">📝 {entry.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {claim.notes && claim.notes.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
                <h3 className="text-lg font-bold text-yellow-900">Notes</h3>
              </div>
              <div className="p-6 space-y-4">
                {claim.notes?.map((note: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      note.isInternal 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900">
                        {note.author?.firstName} {note.author?.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        {note.isInternal && (
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">
                            🔒 Interne
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Change Status */}
          {availableTransitions.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <h3 className="text-lg font-bold">Changer le statut</h3>
              </div>
              <div className="p-6 space-y-3">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updateStatusMutation.isPending}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${STATUS_LABELS[status]?.color} border-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{STATUS_LABELS[status]?.icon}</span>
                      {STATUS_LABELS[status]?.label}
                    </span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Expert Info */}
          {claim.expert && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-purple-500 text-white">
                <h3 className="text-lg font-bold">Expert assigné</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                    👨‍🔧
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {claim.expert?.firstName} {claim.expert?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{claim.expert?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Metadata */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Informations</h3>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Créé le</p>
                <p className="font-medium text-gray-900">
                  {claim.createdAt && new Date(claim.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dernière modification</p>
                <p className="font-medium text-gray-900">
                  {claim.updatedAt && new Date(claim.updatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Identifiant</p>
                <p className="font-mono text-xs text-gray-900">
                  {claim._id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
