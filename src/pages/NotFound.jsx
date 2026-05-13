import { Link } from 'react-router-dom';
import { Ghost } from 'lucide-react';
import { MetaTags } from '../components/ui';

const NotFound = () => {
  return (
    <>
      <MetaTags
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to CramBuddy AI for AI-powered study tools."
      />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <Ghost className="w-24 h-24 text-accent/50 mb-8 animate-bounce" />
        <h1 className="text-6xl font-heading font-bold mb-4">404</h1>
        <h2 className="text-2xl font-medium mb-6">Looks like you're lost.</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          But your exam prep doesn't have to be. Let's get you back on track to acing that test.
        </p>
        <Link
          to="/"
          className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-accent/25"
        >
          Go Home
        </Link>
      </div>
    </>
  );
};

export default NotFound;
