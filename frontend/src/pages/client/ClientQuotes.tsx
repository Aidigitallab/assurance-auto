import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { endpoints } from '@/api/endpoints';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import type { CreateQuoteRequest, CreatePolicyRequest } from '@/types/dto';

export const ClientQuotes = () => {
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(!!searchParams.get('productCode'));
  const [subscribingQuote, setSubscribingQuote] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const result = await endpoints.quotes.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const result = await endpoints.vehicles.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isCreating,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateQuoteRequest) => endpoints.quotes.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis créé avec succès');
      setIsCreating(false);
      if (result.success && result.data) {
        console.log('✅ Devis créé:', result.data);
      }
    },
    onError: (error: any) => {
      console.error('❌ Erreur création devis:', error);
      console.error('Response data:', error.response?.data);
      const message = error.response?.data?.message || 'Erreur lors de la création du devis';
      toast.error(message);
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: CreatePolicyRequest) => endpoints.policies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Souscription réussie ! Police créée.');
      setSubscribingQuote(null);
      navigate('/client/policies');
    },
    onError: (error: any) => {
      console.error('❌ Erreur souscription:', error);
      console.error('Response data:', error.response?.data);
      const message = error.response?.data?.message || 'Erreur lors de la souscription';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Collect selected options
    const selectedOptions: string[] = [];
    const checkboxes = e.currentTarget.querySelectorAll('input[name="options"]:checked');
    checkboxes.forEach((cb) => selectedOptions.push((cb as HTMLInputElement).value));
    
    const data: CreateQuoteRequest = {
      vehicleId: formData.get('vehicleId') as string,
      productCode: formData.get('productCode') as any,
      selectedOptionCodes: selectedOptions.length > 0 ? selectedOptions as any[] : undefined,
    };

    console.log('📤 Sending quote data:', data);
    createMutation.mutate(data);
  };

  const handleSubscribeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subscribingQuote) return;

    const formData = new FormData(e.currentTarget);
    const data: CreatePolicyRequest = {
      quoteId: subscribingQuote,
      startDate: formData.get('startDate') as string,
      duration: parseInt(formData.get('duration') as string),
      paymentMethod: formData.get('paymentMethod') as any,
    };

    console.log('📤 Sending subscription:', data);
    subscribeMutation.mutate(data);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Créer un devis</h1>
          <p className="text-gray-600">Remplissez les informations pour obtenir un devis</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Véhicule *</label>
              <select
                name="vehicleId"
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sélectionnez un véhicule</option>
                {vehicles?.vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.brand} {v.model} - {v.plateNumber}
                  </option>
                ))}
              </select>
              {!vehicles?.vehicles.length && (
                <p className="text-sm text-orange-600 mt-1">
                  Vous devez d'abord <Link to="/client/vehicles" className="underline">ajouter un véhicule</Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Produit d'assurance *</label>
              <select
                name="productCode"
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Choisir un produit</option>
                <option value="TIERS">Responsabilité Civile (Tiers)</option>
                <option value="TIERS_PLUS">Tiers Plus</option>
                <option value="TOUS_RISQUES">Tous Risques</option>
              </select>
            </div>

            <div>
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
                disabled={createMutation.isPending || !vehicles?.vehicles.length}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer le devis'}
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
          <h1 className="text-3xl font-bold text-gray-800">Mes Devis</h1>
          <p className="text-gray-600">{data?.total || 0} devis au total</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Créer un devis
        </button>
      </div>

      {!data?.quotes?.length ? (
        <EmptyState
          icon="📋"
          title="Aucun devis"
          description="Créez votre premier devis pour assurer un véhicule"
          action={{
            label: 'Créer un devis',
            onClick: () => setIsCreating(true),
          }}
        />
      ) : (
        <div className="grid gap-6">
          {data.quotes.map((quote) => (
            <div key={quote._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Devis {quote._id.substring(0, 8)}...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    quote.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : quote.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {quote.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Produit</p>
                  <p className="font-medium">{quote.productCode}</p>
                </div>
                <div>
                  <p className="text-gray-500">Montant</p>
                  <p className="font-medium text-blue-600 text-lg">
                    {quote.amount?.toLocaleString('fr-FR')} XOF
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Véhicule</p>
                  <p className="font-medium">
                    {quote.vehicle ? `${quote.vehicle.brand} ${quote.vehicle.model}` : 
                     typeof quote.vehicleId === 'string' ? quote.vehicleId.substring(0, 8) + '...' : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Expire le</p>
                  <p className="font-medium">
                    {quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
              </div>
              {quote.status === 'PENDING' && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => setSubscribingQuote(quote._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    💳 Souscrire
                  </button>
                </div>
              )}
              {quote.status === 'ACCEPTED' && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => setSubscribingQuote(quote._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                  >
                    ✅ Souscrire maintenant
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de souscription */}
      {subscribingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Souscrire au devis</h2>
            <p className="text-gray-600 mb-6">Finalisez votre souscription en remplissant les informations ci-dessous</p>
            
            <form onSubmit={handleSubscribeSubmit} className="space-y-4">
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
                  onClick={() => setSubscribingQuote(null)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {subscribeMutation.isPending ? 'Souscription...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
