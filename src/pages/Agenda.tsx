import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Search, 
  Loader2, 
  Check, 
  X,
  Clock,
  User,
  CheckCircle2,
  Circle,
  XCircle
} from 'lucide-react';
import { formatDate, cn } from '@/src/lib/utils';

const Agenda: React.FC = () => {
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
    fetchAgenda();
    fetchClientes();
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agenda')
      .select('*, cliente(nombre)')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    
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
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cliente?.nombre && item.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      tipo: formData.get('tipo'),
      fecha: formData.get('fecha'),
      hora: formData.get('hora'),
      cliente_id: formData.get('cliente_id') || null,
      estado: formData.get('estado'),
      vendedor_id: user?.id,
      created_by: user?.id
    };

    if (selectedItem) {
      if (profile?.perfil_acceso !== 'Admin' && selectedItem.created_by !== user?.id) {
        showMessage('Sem permissão para editar este compromisso.', 'error');
        return;
      }
      const { error } = await supabase.from('agenda').update(payload).eq('id', selectedItem.id);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Compromisso atualizado!', 'success');
        fetchAgenda();
        setIsModalOpen(false);
      }
    } else {
      const { error } = await supabase.from('agenda').insert([payload]);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Compromisso agendado!', 'success');
        fetchAgenda();
        setIsModalOpen(false);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Realizado': return <CheckCircle2 size={16} className="text-meta-3" />;
      case 'Cancelado': return <XCircle size={16} className="text-meta-1" />;
      default: return <Circle size={16} className="text-warning" />;
    }
  };

  return (
    <>
      <Breadcrumb pageName="Agenda" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <button className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-bodydark2" />
              </button>
              <input
                type="text"
                placeholder="Pesquisar compromissos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark xl:w-75"
              />
            </div>
            <button
              onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
            >
              <Plus size={18} />
              Nuevo Compromiso
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>
            ) : filteredData.length === 0 ? (
              <div className="py-10 text-center text-bodydark2">Nenhum compromisso agendado.</div>
            ) : (
              filteredData.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between rounded-sm border border-stroke p-4 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-primary/10 text-primary">
                      <span className="text-xs font-bold uppercase">{new Date(item.fecha).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(item.fecha).getDate() + 1}</span>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 font-semibold text-black dark:text-white">
                        {getStatusIcon(item.estado)}
                        {item.titulo}
                        <span className="rounded-full bg-gray-2 px-2 py-0.5 text-[10px] font-medium text-bodydark2 dark:bg-boxdark">
                          {item.tipo}
                        </span>
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bodydark2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {item.hora.substring(0, 5)}
                        </span>
                        {item.cliente && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {item.cliente.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                      className="hover:text-primary"
                      disabled={profile?.perfil_acceso !== 'Admin' && item.created_by !== user?.id}
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedItem ? "Editar Compromiso" : "Nuevo Compromiso"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Título</label>
              <input
                name="titulo"
                defaultValue={selectedItem?.titulo}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Tipo</label>
                <select
                  name="tipo"
                  defaultValue={selectedItem?.tipo || 'Visita Técnica'}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                >
                  <option value="Evaluación">Evaluación</option>
                  <option value="Reunión">Reunión</option>
                  <option value="Visita Técnica">Visita Técnica</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Estado</label>
                <select
                  name="estado"
                  defaultValue={selectedItem?.estado || 'Pendiente'}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Realizado">Realizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Hora</label>
                <input
                  name="hora"
                  type="time"
                  defaultValue={selectedItem?.hora || '08:00'}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Cliente (Opcional)</label>
              <select
                name="cliente_id"
                defaultValue={selectedItem?.cliente_id || ''}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="">Nenhum</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Descripción</label>
              <textarea
                name="descripcion"
                defaultValue={selectedItem?.descripcion}
                rows={3}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar Compromisso' : 'Agendar Compromisso'}
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

export default Agenda;
