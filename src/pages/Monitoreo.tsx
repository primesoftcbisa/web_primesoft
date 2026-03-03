import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Search, 
  Loader2, 
  Check, 
  X,
  Camera,
  Brain,
  FileText,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { formatDate, cn } from '@/src/lib/utils';

const Monitoreo: React.FC = () => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [clientes, setClientes] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [zafras, setZafras] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');

  useEffect(() => {
    fetchMonitoreos();
    fetchInitialData();
  }, []);

  const fetchMonitoreos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monitoreo')
      .select('*, cliente(nombre), parcela(nombre), zafra(nombre)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const fetchInitialData = async () => {
    const { data: c } = await supabase.from('cliente').select('id, nombre').eq('estado', true);
    const { data: z } = await supabase.from('zafra').select('id, nombre').eq('estado', true);
    setClientes(c || []);
    setZafras(z || []);
  };

  useEffect(() => {
    if (selectedCliente) {
      supabase.from('parcela').select('id, nombre').eq('cliente_id', selectedCliente).eq('estado', true)
        .then(({ data }) => setParcelas(data || []));
    } else {
      setParcelas([]);
    }
  }, [selectedCliente]);

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
      (item.cliente?.nombre && item.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.parcela?.nombre && item.parcela.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      cliente_id: formData.get('cliente_id'),
      parcela_id: formData.get('parcela_id'),
      zafra_id: formData.get('zafra_id'),
      fecha: formData.get('fecha'),
      cultura: formData.get('cultura'),
      etapa_fenologica: formData.get('etapa_fenologica'),
      area_evaluada_ha: parseFloat(formData.get('area_evaluada_ha') as string) || 0,
      observaciones: formData.get('observaciones'),
      vendedor_id: user?.id,
      created_by: user?.id
    };

    if (selectedItem) {
      if (profile?.perfil_acceso !== 'Admin' && selectedItem.created_by !== user?.id) {
        showMessage('Sem permissão para editar este monitoramento.', 'error');
        return;
      }
      const { error } = await supabase.from('monitoreo').update(payload).eq('id', selectedItem.id);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Monitoramento atualizado!', 'success');
        fetchMonitoreos();
        setIsModalOpen(false);
      }
    } else {
      const { error } = await supabase.from('monitoreo').insert([payload]);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Monitoramento criado!', 'success');
        fetchMonitoreos();
        setIsModalOpen(false);
      }
    }
  };

  return (
    <>
      <Breadcrumb pageName="Monitoreo" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <button className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-bodydark2" />
              </button>
              <input
                type="text"
                placeholder="Pesquisar monitoramentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark xl:w-75"
              />
            </div>
            <button
              onClick={() => { setSelectedItem(null); setIsModalOpen(true); setSelectedCliente(''); }}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
            >
              <Plus size={18} />
              Nuevo Monitoreo
            </button>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Fecha</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Cliente</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Parcela</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Cultura</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Etapa</th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-bodydark2">Nenhum monitoramento encontrado.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-5">{formatDate(item.fecha)}</td>
                      <td className="px-4 py-5 font-medium text-black dark:text-white">{item.cliente?.nombre}</td>
                      <td className="px-4 py-5">{item.parcela?.nombre}</td>
                      <td className="px-4 py-5">{item.cultura}</td>
                      <td className="px-4 py-5">{item.etapa_fenologica}</td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { setSelectedItem(item); setIsModalOpen(true); setSelectedCliente(item.cliente_id); }}
                            className="hover:text-primary"
                            disabled={profile?.perfil_acceso !== 'Admin' && item.created_by !== user?.id}
                          >
                            <Edit size={18} />
                          </button>
                          <button className="hover:text-primary" title="Ver Detalhes">
                            <ChevronRight size={18} />
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
        title={selectedItem ? "Editar Monitoreo" : "Nuevo Monitoreo"}
        className="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Cliente</label>
              <select
                name="cliente_id"
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Parcela</label>
              <select
                name="parcela_id"
                defaultValue={selectedItem?.parcela_id || ''}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="">Selecione...</option>
                {parcelas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Zafra</label>
              <select
                name="zafra_id"
                defaultValue={selectedItem?.zafra_id || ''}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="">Selecione...</option>
                {zafras.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Fecha</label>
              <input
                name="fecha"
                type="date"
                defaultValue={selectedItem?.fecha || new Date().toISOString().split('T')[0]}
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
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Etapa Fenológica</label>
              <input
                name="etapa_fenologica"
                defaultValue={selectedItem?.etapa_fenologica}
                placeholder="Ex: V3, R1..."
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Área Evaluada (ha)</label>
              <input
                name="area_evaluada_ha"
                type="number"
                step="0.01"
                defaultValue={selectedItem?.area_evaluada_ha || 0}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Observaciones</label>
              <textarea
                name="observaciones"
                defaultValue={selectedItem?.observaciones}
                rows={3}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
            <h4 className="mb-4 flex items-center gap-2 font-semibold">
              <Camera size={18} />
              Fotos de Campo
            </h4>
            <div className="flex flex-wrap gap-4">
              <button type="button" className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded border border-dashed border-primary text-primary hover:bg-primary/5">
                <Plus size={20} />
                <span className="text-xs">Upload</span>
              </button>
              <p className="text-xs text-bodydark2">Integração com Supabase Storage em breve.</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar Monitoramento' : 'Salvar Evaluación'}
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

export default Monitoreo;
