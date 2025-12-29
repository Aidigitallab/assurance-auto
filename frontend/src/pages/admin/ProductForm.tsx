import { useState } from 'react';

interface ProductFormData {
  code: string;
  name: string;
  description: string;
  guarantees: Array<{
    code: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  options: Array<{
    code: string;
    label: string;
    description: string;
    price: number;
  }>;
  franchise: {
    amount: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  pricing: {
    baseRate: number;
    vehicleValueRate: number;
  };
  eligibility: {
    minVehicleYear: number;
    maxVehicleYear: number;
    allowedCategories: string[];
  };
  status: 'ACTIVE' | 'INACTIVE';
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ProductFormData>;
}

export const ProductForm = ({ isOpen, onClose, onSubmit, isLoading, initialData }: ProductFormProps) => {
  const defaultData: ProductFormData = {
    code: '',
    name: '',
    description: '',
    guarantees: [],
    options: [],
    franchise: { amount: 0, type: 'FIXED' },
    pricing: { baseRate: 0, vehicleValueRate: 0 },
    eligibility: { minVehicleYear: 2000, maxVehicleYear: 2025, allowedCategories: [] },
    status: 'INACTIVE',
  };

  const [formData, setFormData] = useState<ProductFormData>({
    ...defaultData,
    ...initialData,
  });

  const [newGuarantee, setNewGuarantee] = useState({ code: '', label: '', description: '', required: false });
  const [newOption, setNewOption] = useState({ code: '', label: '', description: '', price: 0 });
  const [categoryInput, setCategoryInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addGuarantee = () => {
    if (newGuarantee.code && newGuarantee.label) {
      setFormData({
        ...formData,
        guarantees: [...formData.guarantees, newGuarantee],
      });
      setNewGuarantee({ code: '', label: '', description: '', required: false });
    }
  };

  const removeGuarantee = (index: number) => {
    setFormData({
      ...formData,
      guarantees: formData.guarantees.filter((_, i) => i !== index),
    });
  };

  const addOption = () => {
    if (newOption.code && newOption.label) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption],
      });
      setNewOption({ code: '', label: '', description: '', price: 0 });
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const addCategory = () => {
    if (categoryInput && !formData.eligibility.allowedCategories.includes(categoryInput)) {
      setFormData({
        ...formData,
        eligibility: {
          ...formData.eligibility,
          allowedCategories: [...formData.eligibility.allowedCategories, categoryInput],
        },
      });
      setCategoryInput('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData({
      ...formData,
      eligibility: {
        ...formData.eligibility,
        allowedCategories: formData.eligibility.allowedCategories.filter((c) => c !== category),
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? '✏️ Modifier le produit' : '➕ Créer un nouveau produit'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <select
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner un code</option>
                  <option value="TIERS">TIERS</option>
                  <option value="TIERS_PLUS">TIERS_PLUS</option>
                  <option value="TOUS_RISQUES">TOUS_RISQUES</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Assurance au Tiers"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Description du produit..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="INACTIVE">Inactif</option>
                <option value="ACTIVE">Actif</option>
              </select>
            </div>
          </div>

          {/* Guarantees */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Garanties</h3>
            <div className="space-y-2">
              {formData.guarantees.map((g, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{g.label} ({g.code})</div>
                    <div className="text-sm text-gray-600">{g.description}</div>
                    {g.required && <span className="text-xs text-blue-600">Obligatoire</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGuarantee(i)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newGuarantee.code}
                onChange={(e) => setNewGuarantee({ ...newGuarantee, code: e.target.value })}
                placeholder="Code"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                value={newGuarantee.label}
                onChange={(e) => setNewGuarantee({ ...newGuarantee, label: e.target.value })}
                placeholder="Libellé"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                value={newGuarantee.description}
                onChange={(e) => setNewGuarantee({ ...newGuarantee, description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={newGuarantee.required}
                    onChange={(e) => setNewGuarantee({ ...newGuarantee, required: e.target.checked })}
                  />
                  <span className="text-sm">Obligatoire</span>
                </label>
                <button
                  type="button"
                  onClick={addGuarantee}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Options</h3>
            <div className="space-y-2">
              {formData.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{o.label} ({o.code})</div>
                    <div className="text-sm text-gray-600">{o.description}</div>
                    <div className="text-sm text-green-600">+{(o.price / 100).toLocaleString()} XOF</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newOption.code}
                onChange={(e) => setNewOption({ ...newOption, code: e.target.value })}
                placeholder="Code"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                value={newOption.label}
                onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                placeholder="Libellé"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                value={newOption.description}
                onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newOption.price}
                  onChange={(e) => setNewOption({ ...newOption, price: parseInt(e.target.value) * 100 })}
                  placeholder="Prix"
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ➕
                </button>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tarification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarif de base (XOF) *</label>
                <input
                  type="number"
                  required
                  value={formData.pricing.baseRate / 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, baseRate: parseInt(e.target.value) * 100 },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taux valeur véhicule (%) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.pricing.vehicleValueRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, vehicleValueRate: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Franchise */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Franchise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.franchise.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      franchise: { ...formData.franchise, type: e.target.value as 'FIXED' | 'PERCENTAGE' },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="FIXED">Montant fixe</option>
                  <option value="PERCENTAGE">Pourcentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant {formData.franchise.type === 'FIXED' ? '(XOF)' : '(%)'} *
                </label>
                <input
                  type="number"
                  required
                  value={
                    formData.franchise.type === 'FIXED'
                      ? formData.franchise.amount / 100
                      : formData.franchise.amount
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      franchise: {
                        ...formData.franchise,
                        amount:
                          formData.franchise.type === 'FIXED'
                            ? parseInt(e.target.value) * 100
                            : parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Éligibilité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année min du véhicule *</label>
                <input
                  type="number"
                  required
                  value={formData.eligibility.minVehicleYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibility: { ...formData.eligibility, minVehicleYear: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année max du véhicule *</label>
                <input
                  type="number"
                  required
                  value={formData.eligibility.maxVehicleYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibility: { ...formData.eligibility, maxVehicleYear: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégories autorisées</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.eligibility.allowedCategories.map((cat, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-2">
                    {cat}
                    <button type="button" onClick={() => removeCategory(cat)} className="text-indigo-600 hover:text-indigo-800">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="CAR">CAR (Voiture)</option>
                  <option value="MOTORBIKE">MOTORBIKE (Moto)</option>
                  <option value="TRUCK">TRUCK (Camion)</option>
                </select>
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={!categoryInput}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
