import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Search, 
  Loader2, 
  Check, 
  X
} from 'lucide-react';
import { formatDate, cn } from '@/src/lib/utils';

const Zafras: React.FC = () => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.perfil_acceso === 'Admin';

  useEffect(() => {
    fetchZafras();
  }, []);

  const fetchZafras = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('zafra')
      .select('*')
      .order('fecha_inicio', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cultura.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      nombre: formData.get('nombre'),
      cultura: formData.get('cultura'),
      fecha_inicio: formData.get('fecha_inicio'),
      fecha_fin: formData.get('fecha_fin'),
      estado: formData.get('estado') === 'on',
      created_by: user?.id
    };

    if (selectedItem) {
      const { error } = await supabase.from('zafra').update(payload).eq('id', selectedItem.id);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Zafra atualizada!', 'success');
        fetchZafras();
        setIsModalOpen(false);
      }
    } else {
      const { error } = await supabase.from('zafra').insert([payload]);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Zafra criada com sucesso!', 'success');
        fetchZafras();
        setIsModalOpen(false);
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Cultura', 'Inicio', 'Fin', 'Estado'];
    const rows = filteredData.map(item => [
      item.nombre,
      item.cultura,
      item.fecha_inicio,
      item.fecha_fin,
      item.estado ? 'Ativo' : 'Inativo'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zafras_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
      <Breadcrumb pageName="Zafras" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <button className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-bodydark2" />
              </button>
              <input
                type="text"
                placeholder="Pesquisar zafras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark xl:w-75"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 rounded border border-stroke px-4 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              >
                <Download size={18} />
                Exportar
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
                >
                  <Plus size={18} />
                  Nueva Zafra
                </button>
              )}
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Cultura</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Inicio</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Fin</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-bodydark2">Nenhuma zafra encontrada.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-5 font-medium text-black dark:text-white">{item.nombre}</td>
                      <td className="px-4 py-5">{item.cultura}</td>
                      <td className="px-4 py-5">{formatDate(item.fecha_inicio)}</td>
                      <td className="px-4 py-5">{formatDate(item.fecha_fin)}</td>
                      <td className="px-4 py-5">
                        <span className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          item.estado ? "bg-meta-3/10 text-meta-3" : "bg-meta-1/10 text-meta-1"
                        )}>
                          {item.estado ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                            className="hover:text-primary"
                            disabled={!isAdmin}
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedItem ? "Editar Zafra" : "Nueva Zafra"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Nombre (Ex: Zafra 24/25)</label>
              <input
                name="nombre"
                defaultValue={selectedItem?.nombre}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Cultura</label>
              <select
                name="cultura"
                defaultValue={selectedItem?.cultura || 'Soja'}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="Soja">Soja</option>
                <option value="Maiz">Maiz</option>
                <option value="Trigo">Trigo</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Fecha Inicio</label>
                <input
                  name="fecha_inicio"
                  type="date"
                  defaultValue={selectedItem?.fecha_inicio}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Fecha Fin</label>
                <input
                  name="fecha_fin"
                  type="date"
                  defaultValue={selectedItem?.fecha_fin}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  name="estado"
                  type="checkbox"
                  defaultChecked={selectedItem ? selectedItem.estado : true}
                  className="h-5 w-5 rounded border-stroke"
                />
                <span className="text-sm font-medium text-black dark:text-white">Ativo</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar Zafra' : 'Criar Zafra'}
          </button>
        </form>
      </Modal>

      {/* Toast Notifications */}
      {success && (
        <div className="fixed bottom-4 right-4 z-9999 flex items-center gap-2 rounded-sm bg-meta-3 px-6 py-4 text-white shadow-lg">
          <Check size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 z-9999 flex items-center gap-2 rounded-sm bg-meta-1 px-6 py-4 text-white shadow-lg">
          <X size={20} />
          {error}
        </div>
      )}
    </>
  );
};

export default Zafras;
