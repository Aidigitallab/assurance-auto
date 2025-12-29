import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { endpoints } from '@/api/endpoints';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type { CreatePolicyRequest, RenewPolicyRequest, CancelPolicyRequest } from '@/types/dto';

export const ClientPolicies = () => {
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(!!searchParams.get('quoteId'));
  const [renewingPolicy, setRenewingPolicy] = useState<string | null>(null);
  const [cancellingPolicy, setCancellingPolicy] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const result = await endpoints.policies.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes-for-policy'],
    queryFn: async () => {
      const result = await endpoints.quotes.getAll(); // Tous les devis (PENDING et ACCEPTED)
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isCreating,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePolicyRequest) => endpoints.policies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Contrat créé avec succès');
      setIsCreating(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur création contrat:', error);
      console.error('Response data:', error.response?.data);
      const message = error.response?.data?.message || 'Erreur lors de la création du contrat';
      toast.error(message);
    },
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenewPolicyRequest }) =>
      endpoints.policies.renew(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Contrat renouvelé avec succès');
      setRenewingPolicy(null);
    },
    onError: () => toast.error('Erreur lors du renouvellement'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelPolicyRequest }) =>
      endpoints.policies.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Contrat annulé');
      setCancellingPolicy(null);
    },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreatePolicyRequest = {
      quoteId: formData.get('quoteId') as string,
      startDate: formData.get('startDate') as string,
      duration: parseInt(formData.get('duration') as string),
      paymentMethod: formData.get('paymentMethod') as any,
    };

    console.log('📤 Sending policy subscription:', data);
    console.log('📋 Types validation:', {
      quoteId: typeof data.quoteId,
      startDate: typeof data.startDate,
      duration: typeof data.duration,
      paymentMethod: typeof data.paymentMethod,
    });

    createMutation.mutate(data);
  };

  const handleRenewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!renewingPolicy) return;

    const formData = new FormData(e.currentTarget);
    const data: RenewPolicyRequest = {
      paymentMethod: formData.get('paymentMethod') as string,
      paymentReference: formData.get('paymentReference') as string || undefined,
    };

    renewMutation.mutate({ id: renewingPolicy, data });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Souscrire à un contrat</h1>
          <p className="text-gray-600">Finalisez votre souscription</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Devis *</label>
              <select
                name="quoteId"
                required
                defaultValue={searchParams.get('quoteId') || ''}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sélectionnez un devis</option>
                {quotes?.quotes.map((q) => (
                  <option key={q._id} value={q._id}>
                    [{q.status}] {q.productCode} - {q.amount?.toLocaleString('fr-FR')} XOF
                    {q.vehicle ? ` - ${q.vehicle.brand} ${q.vehicle.model}` : ''}
                  </option>
                ))}
              </select>
              {!quotes?.quotes.length && (
                <p className="text-sm text-orange-600 mt-1">
                  Vous devez d'abord créer un devis
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date de début *</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Durée *</label>
                <select
                  name="duration"
                  required
                  defaultValue="12"
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="6">6 mois</option>
                  <option value="12">12 mois (1 an)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Méthode de paiement *</label>
              <select
                name="paymentMethod"
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sélectionnez une méthode</option>
                <option value="CARD">Carte bancaire</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="CASH">Espèces</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Souscrire'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mes Contrats</h1>
          <p className="text-gray-600">{data?.total || 0} contrats au total</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          + Souscrire
        </button>
      </div>

      {!data?.policies?.length ? (
        <EmptyState
          icon="📄"
          title="Aucun contrat"
          description="Souscrivez à votre premier contrat d'assurance"
          action={{
            label: 'Souscrire maintenant',
            onClick: () => setIsCreating(true),
          }}
        />
      ) : (
        <div className="grid gap-6">
          {data.policies.map((policy) => (
            <div key={policy._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Contrat {policy._id.substring(0, 8)}...
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
                      : policy.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {policy.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Produit</p>
                  <p className="font-medium">{policy.productCode}</p>
                </div>
                <div>
                  <p className="text-gray-500">Prime</p>
                  <p className="font-medium text-green-600 text-lg">
                    {policy.amount?.toLocaleString('fr-FR')} XOF
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Paiement</p>
                  <p className="font-medium">{policy.paymentMethod}</p>
                </div>
                {policy.paymentReference && (
                  <div>
                    <p className="text-gray-500">Référence</p>
                    <p className="font-medium">{policy.paymentReference}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Link
                  to={`/client/policies/${policy._id}`}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium"
                >
                  Voir détails
                </Link>
                <Link
                  to={`/client/policies/${policy._id}/documents`}
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 font-medium"
                >
                  📄 Documents
                </Link>
                {policy.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => setRenewingPolicy(policy._id)}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 font-medium"
                    >
                      🔄 Renouveler
                    </button>
                    <button
                      onClick={() => setCancellingPolicy(policy._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renew Dialog */}
      {renewingPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Renouveler le contrat</h3>
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Méthode de paiement *</label>
                <select
                  name="paymentMethod"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="CARD">Carte bancaire</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="CASH">Espèces</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Référence</label>
                <input
                  name="paymentReference"
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRenewingPolicy(null)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={renewMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Renouveler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancellingPolicy}
        onClose={() => setCancellingPolicy(null)}
        onConfirm={() => {
          if (cancellingPolicy) {
            cancelMutation.mutate({
              id: cancellingPolicy,
              data: { reason: 'Demande client' },
            });
          }
        }}
        title="Annuler le contrat"
        message="Êtes-vous sûr de vouloir annuler ce contrat ? Cette action est irréversible."
        confirmText="Annuler le contrat"
        isDangerous
      />
    </div>
  );
};
