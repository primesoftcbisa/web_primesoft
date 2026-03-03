import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Map, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronLeft,
  Sprout,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';

const Sidebar: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { pathname } = location;

  const menuGroups = [
    {
      name: 'MENU',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'RTV'] },
        { name: 'Ajustes', path: '/ajustes', icon: Settings, roles: ['Admin'] },
        { name: 'Productos', path: '/productos', icon: Package, roles: ['Admin', 'RTV'] },
        { name: 'CRM', path: '/crm', icon: Users, roles: ['Admin', 'RTV'] },
        { name: 'Parcelas', path: '/parcelas', icon: Map, roles: ['Admin', 'RTV'] },
        { name: 'Zafras', path: '/zafras', icon: Sprout, roles: ['Admin', 'RTV'] },
        { name: 'Monitoreo', path: '/monitoreo', icon: Activity, roles: ['Admin', 'RTV'] },
        { name: 'Agenda', path: '/agenda', icon: Calendar, roles: ['Admin', 'RTV'] },
        { name: 'IA Chat', path: '/ia', icon: MessageSquare, roles: ['Admin', 'RTV'] },
        { name: 'Espacio Cliente', path: '/espacio-cliente', icon: FileText, roles: ['Cliente'] },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'absolute left-0 top-0 z-50 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">CBISA</span>
        </NavLink>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="block lg:hidden"
        >
          <ChevronLeft className="text-white" />
        </button>
      </div>

      {/* SIDEBAR MENU */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                {group.name}
              </h3>

              <ul className="mb-6 flex flex-col gap-1.5">
                {group.items
                  .filter((item) => item.roles.includes(profile?.perfil_acceso))
                  .map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-meta-4',
                            isActive && 'bg-meta-4'
                          )
                        }
                      >
                        <item.icon size={18} />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* LOGOUT */}
      <div className="mt-auto p-6">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-meta-4"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
