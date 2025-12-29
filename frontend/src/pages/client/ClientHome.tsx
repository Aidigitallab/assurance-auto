import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';
import { Link } from 'react-router-dom';

export const ClientHome = () => {
  const { data: quotesData } = useQuery({
    queryKey: ['my-quotes-count'],
    queryFn: async () => {
      const result = await endpoints.quotes.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: policiesData } = useQuery({
    queryKey: ['my-policies-count'],
    queryFn: async () => {
      const result = await endpoints.policies.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['my-vehicles-count'],
    queryFn: async () => {
      const result = await endpoints.vehicles.getAll();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Espace Client</h1>
        <p className="text-gray-600">Bienvenue sur votre espace personnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/client/devis" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">Mes Devis</h3>
          <p className="text-gray-600 mb-4">Consultez vos demandes de devis</p>
          <span className="text-3xl font-bold text-blue-600">
            {quotesData?.total || 0}
          </span>
        </Link>

        <Link to="/client/contrats" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">Mes Contrats</h3>
          <p className="text-gray-600 mb-4">Gérez vos contrats actifs</p>
          <span className="text-3xl font-bold text-green-600">
            {policiesData?.total || 0}
          </span>
        </Link>

        <Link to="/client/vehicles" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold mb-2">Mes Véhicules</h3>
          <p className="text-gray-600 mb-4">Vos véhicules assurés</p>
          <span className="text-3xl font-bold text-purple-600">
            {vehiclesData?.count || 0}
          </span>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🎉 Bienvenue dans votre espace !
        </h3>
        <p className="text-blue-800">
          Vous pouvez maintenant créer des devis, souscrire à des contrats et gérer vos véhicules.
        </p>
      </div>
    </div>
  );
};
