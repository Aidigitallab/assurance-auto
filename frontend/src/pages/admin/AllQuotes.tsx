import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export const AllQuotes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: async () => {
      const result = await endpoints.admin.getAllQuotes({ page: 1, limit: 50 });
      console.log('📊 Admin quotes data:', result);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des devis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tous les Devis</h1>
        <p className="text-gray-600">
          {data?.pagination?.total || 0} devis au total
        </p>
      </div>

      {!data?.quotes.length ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun devis pour le moment
          </h3>
          <p className="text-gray-500">
            Les devis créés apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.quotes.map((quote) => (
                <tr key={quote._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {quote._id?.substring(0, 8) || 'N/A'}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof quote.userId === 'string' ? quote.userId.substring(0, 8) + '...' : 
                     (quote.userId as any)?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quote.productCode || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.amount?.toLocaleString('fr-FR') || '0'} XOF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        quote.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : quote.status === 'ACCEPTED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
