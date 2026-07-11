import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-color)]">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>

      <div className="glass max-w-lg w-full rounded-3xl p-10 text-center relative z-10 animate-[slideIn_0.5s_ease-out]">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Compass className="w-24 h-24 text-[var(--accent)] animate-[spin_10s_linear_infinite]" />
          </div>
        </div>

        <h1 className="text-8xl font-black text-[var(--text-color)] mb-4 tracking-tighter">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-[var(--text-color)] mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
          Oops! It seems you've ventured into uncharted territory. The page you are looking for has been moved, deleted, or possibly never existed.
        </p>

        <button
          onClick={() => navigate('/')}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black bg-[var(--accent)] rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_var(--accent)] active:scale-95"
        >
          <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
          <Home className="w-5 h-5 mr-2" />
          <span className="relative">Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
