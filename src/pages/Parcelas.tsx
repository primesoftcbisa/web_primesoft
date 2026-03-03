import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Map as MapIcon, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Search, 
  Loader2, 
  Check, 
  X,
  MapPin,
  Maximize2
} from 'lucide-react';
import { formatHa, cn } from '@/src/lib/utils';

const Parcelas: React.FC = () => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParcelas();
    fetchClientes();
  }, []);

  const fetchParcelas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parcela')
      .select('*, cliente(nombre)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const fetchClientes = async () => {
    const { data } = await supabase.from('cliente').select('id, nombre').eq('estado', true);
    setClientes(data || []);
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
      (item.cliente?.nombre && item.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nombre: formData.get('nombre'),
      area_ha: parseFloat(formData.get('area_ha') as string) || 0,
      cliente_id: formData.get('cliente_id'),
      coordenadas: formData.get('coordenadas'),
      estado: formData.get('estado') === 'on',
      created_by: user?.id
    };

    if (selectedItem) {
      if (profile?.perfil_acceso !== 'Admin' && selectedItem.created_by !== user?.id) {
        showMessage('Sem permissão para editar esta parcela.', 'error');
        return;
      }
      const { error } = await supabase.from('parcela').update(payload).eq('id', selectedItem.id);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Parcela atualizada!', 'success');
        fetchParcelas();
        setIsModalOpen(false);
      }
    } else {
      const { error } = await supabase.from('parcela').insert([payload]);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Parcela criada com sucesso!', 'success');
        fetchParcelas();
        setIsModalOpen(false);
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Cliente', 'Área (ha)', 'Estado'];
    const rows = filteredData.map(item => [
      item.nombre,
      item.cliente?.nombre,
      item.area_ha,
      item.estado ? 'Ativo' : 'Inativo'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `parcelas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
      <Breadcrumb pageName="Parcelas" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <button className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-bodydark2" />
              </button>
              <input
                type="text"
                placeholder="Pesquisar parcelas..."
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
              <button
                onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
              >
                <Plus size={18} />
                Nueva Parcela
              </button>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Cliente</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Área (ha)</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-bodydark2">Nenhuma parcela encontrada.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-5 font-medium text-black dark:text-white">{item.nombre}</td>
                      <td className="px-4 py-5">{item.cliente?.nombre}</td>
                      <td className="px-4 py-5">{formatHa(item.area_ha)}</td>
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
                            disabled={profile?.perfil_acceso !== 'Admin' && item.created_by !== user?.id}
                          >
                            <Edit size={18} />
                          </button>
                          <button className="hover:text-primary" title="Ver no Mapa">
                            <MapPin size={18} />
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
        title={selectedItem ? "Editar Parcela" : "Nueva Parcela"}
        className="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Nombre de la Parcela</label>
              <input
                name="nombre"
                defaultValue={selectedItem?.nombre}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Cliente</label>
              <select
                name="cliente_id"
                defaultValue={selectedItem?.cliente_id || ''}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Área (ha)</label>
              <input
                name="area_ha"
                type="number"
                step="0.01"
                defaultValue={selectedItem?.area_ha || 0}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
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
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Coordenadas (JSON/WKT)</label>
              <div className="relative">
                <textarea
                  name="coordenadas"
                  defaultValue={selectedItem?.coordenadas}
                  rows={4}
                  placeholder='Ex: {"lat": -25.3, "lng": -57.6}'
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
                <button 
                  type="button"
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-gray-2 px-2 py-1 text-xs hover:bg-stroke dark:bg-meta-4"
                >
                  <Maximize2 size={12} />
                  Abrir Mapa
                </button>
              </div>
              <p className="mt-1 text-xs text-bodydark2">Integração com Google Maps para desenho de polígonos em breve.</p>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar Parcela' : 'Criar Parcela'}
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

export default Parcelas;
