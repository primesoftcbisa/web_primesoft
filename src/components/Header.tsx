import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

const Header: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }> = ({ sidebarOpen, setSidebarOpen }) => {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* Hamburger Toggle */}
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="z-50 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <Menu />
          </button>
        </div>

        <div className="hidden sm:block">
          <form action="#" method="POST">
            <div className="relative">
              <button className="absolute left-0 top-1/2 -translate-y-1/2">
                <Search size={20} className="text-bodydark2" />
              </button>
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-full bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* Notification Menu */}
            <li>
              <button className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white">
                <Bell size={18} />
                <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1"></span>
              </button>
            </li>
          </ul>

          {/* User Area */}
          <div className="relative flex items-center gap-4">
            <div className="hidden text-right lg:block">
              <span className="block text-sm font-medium text-black dark:text-white">
                {profile?.nombre || 'Usuário'}
              </span>
              <span className="block text-xs font-medium text-bodydark2">
                {profile?.perfil_acceso || 'Acesso'}
              </span>
            </div>

            <span className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="text-gray-500" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
