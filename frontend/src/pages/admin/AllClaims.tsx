import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { Link } from 'react-router-dom';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: 'Reçu', color: 'bg-blue-100 text-blue-800' },
  UNDER_REVIEW: { label: 'En examen', color: 'bg-yellow-100 text-yellow-800' },
  NEED_MORE_INFO: { label: 'Info manquantes', color: 'bg-orange-100 text-orange-800' },
  EXPERT_ASSIGNED: { label: 'Expert assigné', color: 'bg-purple-100 text-purple-800' },
  IN_REPAIR: { label: 'En réparation', color: 'bg-indigo-100 text-indigo-800' },
  SETTLED: { label: 'Réglé', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
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

export const AllClaims = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Fetch all claims
  const { data, isLoading } = useQuery({
    queryKey: ['admin-claims', page, statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const result = await endpoints.admin.getAllClaims(params);
      console.log('📊 Claims API Response:', result);
      if (result.success) {
        console.log('📊 Claims Data:', result.data);
        console.log('📊 Total claims:', (result.data as any)?.total);
        console.log('📊 Claims array:', (result.data as any)?.claims);
      }
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const claims = (data as any)?.claims || [];
  console.log('📊 Claims to display:', claims.length);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des sinistres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Gestion des Sinistres</h1>
        <p className="text-orange-100">
          {(data as any)?.total || 0} sinistres au total
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-xl shadow-md transition-all ${
            statusFilter === '' 
              ? 'bg-gray-700 text-white scale-105' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-xl font-bold">{(data as any)?.total || 0}</h3>
          <p className="text-sm">Tous</p>
        </button>

        {Object.entries(STATUS_LABELS).map(([status, { label, color }]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-4 rounded-xl shadow-md transition-all ${
              statusFilter === status 
                ? `${color} scale-105 ring-2 ring-offset-2` 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">
              {status === 'RECEIVED' && '🆕'}
              {status === 'UNDER_REVIEW' && '🔍'}
              {status === 'NEED_MORE_INFO' && '❓'}
              {status === 'EXPERT_ASSIGNED' && '👨‍🔧'}
              {status === 'IN_REPAIR' && '🔧'}
              {status === 'SETTLED' && '✅'}
              {status === 'REJECTED' && '❌'}
            </div>
            <h3 className="text-xl font-bold">
              {claims.filter((c: any) => c.status === status).length}
            </h3>
            <p className="text-sm">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Numéro de contrat, client, véhicule..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([status, { label }]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Claims List */}
      {claims && claims.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {claims.map((claim: any) => (
            <div
              key={claim._id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_LABELS[claim.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[claim.status]?.label || claim.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{claim._id.slice(-6)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {INCIDENT_TYPES[claim.incident?.type] || claim.incident?.type}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Client</p>
                        <p className="font-medium text-gray-900">
                          {claim.owner?.firstName} {claim.owner?.lastName}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Contrat</p>
                        <p className="font-medium text-gray-900">
                          {(claim.policy as any)?.policyNumber || claim.policy?._id?.slice(-6)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Véhicule</p>
                        <p className="font-medium text-gray-900">
                          {claim.vehicle?.brand} {claim.vehicle?.model}
                        </p>
                        <p className="text-xs text-gray-500">{claim.vehicle?.plateNumber}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Date incident</p>
                        <p className="font-medium text-gray-900">
                          {new Date(claim.incident?.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {claim.incident?.location && (
                      <div className="mt-3 text-sm">
                        <p className="text-gray-500">Lieu</p>
                        <p className="text-gray-900">📍 {claim.incident.location}</p>
                      </div>
                    )}

                    {claim.expert && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md font-medium">
                          👨‍🔧 Expert: {claim.expert.firstName} {claim.expert.lastName}
                        </span>
                      </div>
                    )}

                    {claim.attachments && claim.attachments.length > 0 && (
                      <div className="mt-3 text-sm text-gray-500">
                        📎 {claim.attachments.length} pièce(s) jointe(s)
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link
                      to={`/admin/sinistres/${claim._id}`}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                    >
                      Voir détails
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {claim.incident?.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {claim.incident.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>Créé le {new Date(claim.createdAt).toLocaleString('fr-FR')}</span>
                  <span>Mis à jour le {new Date(claim.updatedAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun sinistre trouvé</h3>
          <p className="text-gray-600">
            {statusFilter || searchTerm
              ? 'Aucun sinistre ne correspond à vos critères de recherche.'
              : 'Aucun sinistre n\'a été déclaré pour le moment.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && (data as any).pages && (data as any).pages > 1 && (
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {(data as any).page || 1} sur {(data as any).pages} ({(data as any).total || 0} sinistres)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= ((data as any).pages || 1)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
