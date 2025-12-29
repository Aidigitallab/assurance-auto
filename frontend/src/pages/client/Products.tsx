import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import type { ProductDTO } from '@/types/dto';

export const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const result = await endpoints.products.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
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
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Nos Produits d'Assurance</h1>
        <p className="text-gray-600">{data?.count || 0} formules disponibles</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.products.map((product) => (
          <div
            key={product._id}
            onClick={() => setSelectedProduct(product)}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                product.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {product.active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{product.description}</p>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">À partir de</p>
              <p className="text-2xl font-bold text-blue-600">
                {product.pricing?.baseRate?.toLocaleString('fr-FR')} XOF
              </p>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Voir les détails
            </button>
          </div>
        ))}
      </div>

      {/* Modal détail produit */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                <p className="text-gray-600 mt-1">{selectedProduct.code}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600">{selectedProduct.description}</p>
              </div>

              {/* Garanties */}
              {selectedProduct.guarantees && selectedProduct.guarantees.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Garanties incluses</h3>
                  <div className="grid gap-3">
                    {selectedProduct.guarantees.map((guarantee, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <h4 className="font-medium">{guarantee.label}</h4>
                          {guarantee.required && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Obligatoire</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              {selectedProduct.options && selectedProduct.options.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Options disponibles</h3>
                  <div className="grid gap-3">
                    {selectedProduct.options.map((option, idx) => (
                      <div key={idx} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{option.label}</h4>
                        </div>
                        <span className="text-gray-700 font-semibold">
                          +{option.price?.toLocaleString('fr-FR')} XOF
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarification */}
              {selectedProduct.pricing && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Tarification</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de base</span>
                      <span className="font-semibold">
                        {selectedProduct.pricing.baseRate?.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux sur valeur véhicule</span>
                      <span className="font-semibold">{selectedProduct.pricing.vehicleValueRate}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Franchise */}
              {selectedProduct.franchise && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Franchise</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      <strong>Montant :</strong> {selectedProduct.franchise.amount?.toLocaleString('fr-FR')} XOF
                    </p>
                    <p className="text-yellow-700 text-sm mt-2">
                      Type: {selectedProduct.franchise.type}
                    </p>
                  </div>
                </div>
              )}

              {/* Eligibilité */}
              {selectedProduct.eligibility && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Conditions d'éligibilité</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <ul className="space-y-1 text-blue-800 text-sm">
                      {selectedProduct.eligibility.minVehicleYear !== undefined && (
                        <li>• Véhicule année minimum: {selectedProduct.eligibility.minVehicleYear}</li>
                      )}
                      {selectedProduct.eligibility.maxVehicleYear !== undefined && (
                        <li>• Véhicule année maximum: {selectedProduct.eligibility.maxVehicleYear}</li>
                      )}
                      {selectedProduct.eligibility.allowedCategories && selectedProduct.eligibility.allowedCategories.length > 0 && (
                        <li>• Catégories autorisées: {selectedProduct.eligibility.allowedCategories.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    // Navigate to quote creation with this product
                    window.location.href = `/client/quotes?productCode=${selectedProduct.code}`;
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Créer un devis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
