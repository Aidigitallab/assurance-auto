import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type { VehicleDTO, CreateVehicleRequest } from '@/types/dto';

export const MyVehicles = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleDTO | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const result = await endpoints.vehicles.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleRequest) => endpoints.vehicles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Véhicule créé avec succès');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur création véhicule:', error);
      console.error('Response data:', error.response?.data);
      const message = error.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateVehicleRequest }) =>
      endpoints.vehicles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Véhicule modifié avec succès');
      setIsDialogOpen(false);
      setEditingVehicle(null);
    },
    onError: (error: any) => {
      console.error('❌ Erreur modification véhicule:', error);
      console.error('Response data:', error.response?.data);
      const message = error.response?.data?.message || 'Erreur lors de la modification';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => endpoints.vehicles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Véhicule supprimé');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateVehicleRequest = {
      plateNumber: formData.get('immatriculation') as string,
      brand: formData.get('marque') as string,
      model: formData.get('modele') as string,
      year: parseInt(formData.get('annee') as string),
      marketValue: parseFloat(formData.get('valeur') as string),
      usage: (formData.get('usage') as any) || 'PRIVATE',
    };

    console.log('📤 Sending vehicle data:', data);
    console.log('📋 Validation:', {
      plateNumber: typeof data.plateNumber,
      year: typeof data.year,
      marketValue: typeof data.marketValue,
      usage: data.usage,
    });

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Mes Véhicules</h1>
          <p className="text-gray-600">{data?.count || 0} véhicules enregistrés</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsDialogOpen(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Ajouter un véhicule
        </button>
      </div>

      {!data?.vehicles.length ? (
        <EmptyState
          icon="🚗"
          title="Aucun véhicule"
          description="Ajoutez votre premier véhicule pour commencer"
          action={{
            label: 'Ajouter un véhicule',
            onClick: () => setIsDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.vehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-gray-500 text-sm">{vehicle.plateNumber}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {vehicle.year}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Valeur</p>
                  <p className="font-medium">{vehicle.marketValue?.toLocaleString('fr-FR')} XOF</p>
                </div>
                <div>
                  <p className="text-gray-500">Usage</p>
                  <p className="font-medium">
                    {vehicle.usage === 'PRIVATE' ? 'Privé' : vehicle.usage === 'COMMERCIAL' ? 'Commercial' : 'Taxi'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingVehicle(vehicle);
                    setIsDialogOpen(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteConfirm(vehicle._id)}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Form */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Marque *</label>
                  <input
                    name="marque"
                    type="text"
                    required
                    defaultValue={editingVehicle?.brand}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Modèle *</label>
                  <input
                    name="modele"
                    type="text"
                    required
                    defaultValue={editingVehicle?.model}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Immatriculation *</label>
                  <input
                    name="immatriculation"
                    type="text"
                    required
                    defaultValue={editingVehicle?.plateNumber}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Année *</label>
                  <input
                    name="annee"
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    defaultValue={editingVehicle?.year}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valeur (XOF) *</label>
                  <input
                    name="valeur"
                    type="number"
                    required
                    min="0"
                    defaultValue={editingVehicle?.marketValue}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usage *</label>
                  <select
                    name="usage"
                    required
                    defaultValue={editingVehicle?.usage || 'PRIVATE'}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="PRIVATE">Privé</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="TAXI">Taxi</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingVehicle(null);
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Enregistrement...'
                    : editingVehicle
                    ? 'Modifier'
                    : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
        title="Supprimer le véhicule"
        message="Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible."
        confirmText="Supprimer"
        isDangerous
      />
    </div>
  );
};
