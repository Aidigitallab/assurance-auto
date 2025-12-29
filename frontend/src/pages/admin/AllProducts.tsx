import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { ProductForm } from './ProductForm';

interface ProductGuarantee {
  code: string;
  label: string;
  description: string;
  required: boolean;
}

interface ProductOption {
  code: string;
  label: string;
  description: string;
  price: number;
}

interface Product {
  _id: string;
  code: string;
  name: string;
  description: string;
  guarantees: ProductGuarantee[];
  options: ProductOption[];
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
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const AllProducts = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const result = await endpoints.admin.getAllProducts();
      if (!result.success) throw new Error(result.message);
      // API returns {count, products: [...]}
      return (result.data as any)?.products || [];
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: 'ACTIVE' | 'INACTIVE' }) => {
      const result = await endpoints.admin.updateProductStatus(productId, newStatus);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      console.log('📦 Creating product with data:', productData);
      const result = await endpoints.admin.createProduct(productData);
      console.log('📦 Create product result:', result);
      if (!result.success) {
        console.error('❌ Product creation failed:', result.message);
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      console.error('❌ Product creation error:', error);
      alert(`Erreur lors de la création du produit: ${error.message}`);
    },
  });

  const handleCreateProduct = (data: any) => {
    createProductMutation.mutate(data);
  };

  // Ensure products is an array
  const productsList = Array.isArray(products) ? products : [];

  // Filter products
  const filteredProducts = productsList.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const stats = {
    all: productsList.length || 0,
    active: productsList.filter((p) => p.status === 'ACTIVE').length || 0,
    inactive: productsList.filter((p) => p.status === 'INACTIVE').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">🏷️ Gestion des Produits</h1>
            <p className="text-purple-100">{stats.all} produit(s) au total</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            ➕ Créer un produit
          </button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          📊 Tous ({stats.all})
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-green-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          ✅ Actifs ({stats.active})
        </button>
        <button
          onClick={() => setStatusFilter('INACTIVE')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            statusFilter === 'INACTIVE'
              ? 'bg-gray-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          🔒 Inactifs ({stats.inactive})
        </button>
      </div>

      {/* Products list */}
      <div className="space-y-4">
        {filteredProducts?.map((product: Product) => (
          <div key={product._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      📋 {product.code}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${STATUS_COLORS[product.status as keyof typeof STATUS_COLORS]}`}>
                      {product.status === 'ACTIVE' ? '✅ ACTIF' : '🔒 INACTIF'}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">{product.name}</h4>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold mb-1">Garanties :</p>
                  <div className="flex flex-wrap gap-2">
                    {product.guarantees.map((g: ProductGuarantee, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium"
                      >
                        {g.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-semibold mb-1">Options :</p>
                  <div className="flex flex-wrap gap-2">
                    {product.options.map((o: ProductOption, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md font-medium"
                      >
                        {o.label} (+{(o.price / 100).toLocaleString('fr-FR')} XOF)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">💰 Tarif de base</p>
                  <p className="font-bold text-purple-900">
                    {(product.pricing.baseRate / 100).toLocaleString('fr-FR')} XOF
                  </p>
                  <p className="text-xs text-gray-500">+ {product.pricing.vehicleValueRate}% valeur véhicule</p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">🔻 Franchise</p>
                  <p className="font-bold text-orange-900">
                    {product.franchise.type === 'FIXED'
                      ? `${(product.franchise.amount / 100).toLocaleString('fr-FR')} XOF`
                      : `${product.franchise.amount}%`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.franchise.type === 'FIXED' ? 'Montant fixe' : 'Pourcentage'}
                  </p>
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">✅ Éligibilité</p>
                  <p className="font-bold text-indigo-900">
                    {product.eligibility.minVehicleYear} - {product.eligibility.maxVehicleYear}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.eligibility.allowedCategories.join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                    if (
                      confirm(
                        `Voulez-vous ${newStatus === 'ACTIVE' ? 'activer' : 'désactiver'} le produit "${product.name}" ?`
                      )
                    ) {
                      toggleStatusMutation.mutate({ productId: product._id, newStatus });
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    product.status === 'ACTIVE'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  disabled={toggleStatusMutation.isPending}
                >
                  {product.status === 'ACTIVE' ? '🔒 Désactiver' : '✅ Activer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">Aucun produit trouvé.</p>
        </div>
      )}

      {/* Create Product Modal */}
      <ProductForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProduct}
        isLoading={createProductMutation.isPending}
      />
    </div>
  );
};
