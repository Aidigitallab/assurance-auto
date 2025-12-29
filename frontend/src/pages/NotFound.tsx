import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4">Page non trouvée</h2>
        <p className="text-gray-600 mt-2">La page que vous recherchez n'existe pas.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};
