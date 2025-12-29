import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';
import { useState } from 'react';

export const Notifications = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const result = await endpoints.notifications.getAll({ page, limit: 10 });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => endpoints.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => endpoints.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600">
            {data?.unreadCount || 0} non lues sur {data?.total || 0}
          </p>
        </div>
        {(data?.unreadCount || 0) > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {!data?.notifications.length ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucune notification
          </h3>
          <p className="text-gray-500">
            Vous n'avez pas encore de notifications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.read && markAsReadMutation.mutate(notif._id)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-colors ${
                !notif.read ? 'border-l-4 border-blue-600 bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-lg font-semibold ${!notif.read ? 'text-blue-800' : 'text-gray-800'}`}>
                  {notif.title}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className={`text-sm ${!notif.read ? 'text-blue-700' : 'text-gray-600'}`}>
                {notif.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
