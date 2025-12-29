import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { Pagination } from '@/components/ui/Pagination';
import type { AuditLogDTO } from '@/types/dto';

export const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    entityId: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLogDTO | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const result = await endpoints.auditLogs.getAll(params);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: async () => {
      const result = await endpoints.auditLogs.getStats();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      entityId: '',
      userId: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Journal d'audit</h1>
        <p className="text-gray-600">{data?.total || 0} entrées au total</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalLogs}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">👤</div>
            <p className="text-sm text-gray-500">Utilisateurs uniques</p>
            <p className="text-3xl font-bold text-blue-600">{stats.byUser?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm text-gray-500">Actions uniques</p>
            <p className="text-3xl font-bold text-purple-600">{Object.keys(stats.byAction || {}).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm text-gray-500">Types d'entités</p>
            <p className="text-3xl font-bold text-green-600">{Object.keys(stats.byEntity || {}).length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Toutes</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type d'entité</label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Tous</option>
              <option value="USER">USER</option>
              <option value="VEHICLE">VEHICLE</option>
              <option value="QUOTE">QUOTE</option>
              <option value="POLICY">POLICY</option>
              <option value="CLAIM">CLAIM</option>
              <option value="DOCUMENT">DOCUMENT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ID Entité</label>
            <input
              type="text"
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
              placeholder="ID de l'entité"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ID Utilisateur</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="ID de l'utilisateur"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.logs.map((log) => (
                <tr
                  key={log._id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action === 'CREATE'
                          ? 'bg-green-100 text-green-800'
                          : log.action === 'UPDATE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.action === 'DELETE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{log.entity?.type || 'N/A'}</p>
                      <p className="text-gray-500 text-xs">{log.entity?.id?.substring(0, 8) || 'N/A'}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.metadata?.ip && <div>IP: {log.metadata.ip}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}

      {/* Drawer Detail Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
          <div className="bg-white w-full md:w-1/3 h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Détail du log</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">{selectedLog._id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Action</p>
                <p className="font-medium">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Utilisateur</p>
                <p className="font-medium">{selectedLog.user?.email || 'N/A'}</p>
                {selectedLog.user?.role && (
                  <p className="text-xs text-gray-500">Rôle: {selectedLog.user.role}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Type d'entité</p>
                <p className="font-medium">{selectedLog.entity?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Entité</p>
                <p className="font-medium">{selectedLog.entity?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Timestamp</p>
                <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString('fr-FR')}</p>
              </div>
              {selectedLog.metadata && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Métadonnées</p>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.changes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Changements</p>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
