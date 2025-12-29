import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const MyQuotes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: async () => {
      const result = await endpoints.quotes.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement de vos devis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mes Devis</h1>
        <p className="text-gray-600">
          {data?.total || 0} devis au total
        </p>
      </div>

      {!data?.quotes?.length ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun devis pour le moment
          </h3>
          <p className="text-gray-500 mb-6">
            Commencez par créer un devis pour assurer votre véhicule
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Créer un devis
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {data.quotes.map((quote) => (
            <div key={quote._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Devis {quote._id.substring(0, 8)}
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Produit</p>
                  <p className="font-medium">{quote.productCode}</p>
                </div>
                <div>
                  <p className="text-gray-500">Montant</p>
                  <p className="font-medium text-blue-600">
                    {quote.amount?.toLocaleString('fr-FR')} XOF
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
