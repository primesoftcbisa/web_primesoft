import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-boxdark">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle size={64} className="text-meta-1" />
        <h1 className="text-4xl font-bold text-black dark:text-white">404</h1>
        <p className="text-lg text-bodydark2">
          Página não encontrada ou acesso negado.
        </p>
        <Link
          to="/"
          className="mt-4 rounded-md bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
