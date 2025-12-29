import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { endpoints } from '@/api/endpoints';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import type { CreateClaimRequest } from '@/types/dto';

export const ClientClaims = () => {
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(!!searchParams.get('policyId'));
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const result = await endpoints.claims.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: policies } = useQuery({
    queryKey: ['policies-for-claims'],
    queryFn: async () => {
      const result = await endpoints.policies.getAll({ status: 'ACTIVE' });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isCreating,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData | CreateClaimRequest) => endpoints.claims.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Sinistre déclaré avec succès');
      setIsCreating(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur déclaration sinistre:', error);
      console.error('Response data:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      
      const errors = error.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        errors.forEach((err: any) => {
          console.error('Error object:', JSON.stringify(err, null, 2));
          console.error(`Field: ${err.field || err.path}, Message: ${err.message || err.msg}`);
        });
      }
      
      const message = error.response?.data?.message || 'Erreur lors de la déclaration';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formDataOriginal = new FormData(form);

    // Créer un nouveau FormData avec la notation bracket pour incident
    const formData = new FormData();
    formData.append('policyId', formDataOriginal.get('policyId') as string);
    formData.append('incident[date]', formDataOriginal.get('incidentDate') as string);
    formData.append('incident[type]', formDataOriginal.get('incidentType') as string);
    formData.append('incident[description]', formDataOriginal.get('description') as string);
    formData.append('incident[location]', formDataOriginal.get('location') as string || '');
    
    const estimatedAmount = formDataOriginal.get('estimatedAmount');
    if (estimatedAmount) {
      formData.append('estimatedAmount', estimatedAmount as string);
    }

    console.log('📤 Sending claim FormData:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    createMutation.mutate(formData as any);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Déclarer un sinistre</h1>
          <p className="text-gray-600">Remplissez les informations de l'incident</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Contrat concerné *</label>
              <select
                name="policyId"
                required
                defaultValue={searchParams.get('policyId') || ''}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sélectionnez un contrat</option>
                {policies?.policies.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.productCode} - {p._id.substring(0, 8)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date de l'incident *</label>
                <input
                  name="incidentDate"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type d'incident *</label>
                <select
                  name="incidentType"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sélectionnez</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="THEFT">Vol</option>
                  <option value="FIRE">Incendie</option>
                  <option value="VANDALISM">Vandalisme</option>
                  <option value="NATURAL_DISASTER">Catastrophe naturelle</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description détaillée *</label>
              <textarea
                name="description"
                required
                rows={5}
                placeholder="Décrivez les circonstances de l'incident..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Lieu de l'incident</label>
              <input
                name="location"
                type="text"
                placeholder="Adresse ou localisation"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Montant estimé des dommages (XOF)</label>
              <input
                name="estimatedAmount"
                type="number"
                min="0"
                placeholder="Optionnel"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Après la création, vous pourrez ajouter des pièces justificatives
                (photos, constats, etc.) sur la page de détail du sinistre.
              </p>
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
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? 'Déclaration...' : 'Déclarer le sinistre'}
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
          <h1 className="text-3xl font-bold text-gray-800">Mes Sinistres</h1>
          <p className="text-gray-600">{data?.total || 0} sinistres déclarés</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
        >
          + Déclarer un sinistre
        </button>
      </div>

      {!data?.claims?.length ? (
        <EmptyState
          icon="⚠️"
          title="Aucun sinistre"
          description="Vous n'avez déclaré aucun sinistre pour le moment"
          action={{
            label: 'Déclarer un sinistre',
            onClick: () => setIsCreating(true),
          }}
        />
      ) : (
        <div className="grid gap-6">
          {data.claims.map((claim) => (
            <div key={claim._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Sinistre {claim._id.substring(0, 8)}...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Incident du {new Date(claim.incident.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    claim.status === 'PENDING'
                      ? 'bg-blue-100 text-blue-800'
                      : claim.status === 'UNDER_REVIEW'
                      ? 'bg-yellow-100 text-yellow-800'
                      : claim.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : claim.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {claim.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{claim.incident.type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lieu</p>
                  <p className="font-medium">{claim.incident.location}</p>
                </div>
                {claim.estimatedAmount && (
                  <div>
                    <p className="text-gray-500">Montant estimé</p>
                    <p className="font-medium text-orange-600">
                      {claim.estimatedAmount.toLocaleString('fr-FR')} XOF
                    </p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">{claim.incident.description}</p>
              <div className="flex gap-2 pt-4 border-t">
                <Link
                  to={`/client/claims/${claim._id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Voir détails
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
