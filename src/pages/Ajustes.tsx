import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Building2, 
  History, 
  Users, 
  Link as LinkIcon, 
  Plus, 
  Edit, 
  Trash, 
  Download,
  Search,
  Loader2,
  Check,
  X,
  Key
} from 'lucide-react';
import { formatUSD, formatPct, formatDate, cn } from '@/src/lib/utils';

const Ajustes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tabs: empresa, cbot, usuario, integraciones
  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'cbot', label: 'CBOT (Histórico)', icon: History },
    { id: 'usuario', label: 'Usuários', icon: Users },
    { id: 'integraciones', label: 'Integrações', icon: LinkIcon },
  ];

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  return (
    <>
      <Breadcrumb pageName="Ajustes" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap border-b border-stroke dark:border-strokedark">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium hover:text-primary ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-bodydark2'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'empresa' && <EmpresaTab showMessage={showMessage} />}
          {activeTab === 'cbot' && <CBOTTab showMessage={showMessage} />}
          {activeTab === 'usuario' && <UsuarioTab showMessage={showMessage} />}
          {activeTab === 'integraciones' && <IntegracionesTab showMessage={showMessage} />}
        </div>
      </div>

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

// --- ABA 1: EMPRESA ---
const EmpresaTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmpresa();
  }, []);

  const fetchEmpresa = async () => {
    const { data, error } = await supabase.from('empresa').select('*').limit(1).maybeSingle();
    if (error) console.error(error);
    setEmpresa(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      ruc: formData.get('ruc'),
      direccion: formData.get('direccion'),
      telefono: formData.get('telefono'),
      logo_url: formData.get('logo_url'),
    };

    const { error } = empresa?.id 
      ? await supabase.from('empresa').update(payload).eq('id', empresa.id)
      : await supabase.from('empresa').insert([payload]);

    if (error) showMessage(error.message, 'error');
    else {
      showMessage('Empresa salva com sucesso!', 'success');
      fetchEmpresa();
      setIsModalOpen(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">Dados da Empresa</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <Edit size={18} />
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-sm border border-stroke p-4 dark:border-strokedark">
          <p className="text-sm text-bodydark2 mb-1">RUC</p>
          <p className="font-medium text-black dark:text-white">{empresa?.ruc || '-'}</p>
        </div>
        <div className="rounded-sm border border-stroke p-4 dark:border-strokedark">
          <p className="text-sm text-bodydark2 mb-1">Endereço</p>
          <p className="font-medium text-black dark:text-white">{empresa?.direccion || '-'}</p>
        </div>
        <div className="rounded-sm border border-stroke p-4 dark:border-strokedark">
          <p className="text-sm text-bodydark2 mb-1">Telefone</p>
          <p className="font-medium text-black dark:text-white">{empresa?.telefono || '-'}</p>
        </div>
        <div className="rounded-sm border border-stroke p-4 dark:border-strokedark">
          <p className="text-sm text-bodydark2 mb-1">Logo URL</p>
          <p className="font-medium text-black dark:text-white">{empresa?.logo_url || '-'}</p>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Empresa">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-2.5 block text-black dark:text-white">RUC</label>
            <input
              name="ruc"
              defaultValue={empresa?.ruc}
              required
              className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Endereço</label>
            <input
              name="direccion"
              defaultValue={empresa?.direccion}
              className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Telefone</label>
            <input
              name="telefono"
              defaultValue={empresa?.telefono}
              className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Logo URL</label>
            <input
              name="logo_url"
              defaultValue={empresa?.logo_url}
              className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          >
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  );
};

// --- ABA 2: CBOT ---
const CBOTTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cultura: '', start: '', end: '' });

  useEffect(() => {
    fetchCBOT();
  }, [filters]);

  const fetchCBOT = async () => {
    let query = supabase.from('cbot').select('*').order('fecha', { ascending: false });
    if (filters.cultura) query = query.eq('cultura', filters.cultura);
    if (filters.start) query = query.gte('fecha', filters.start);
    if (filters.end) query = query.lte('fecha', filters.end);

    const { data, error } = await query;
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Cultura', 'Fecha', 'Vencimiento', 'CTR', 'Cierre', 'Simulacion', 'Variacion', 'Alto', 'Bajo', 'Apertura', 'Costo', 'Precio Bolsa Sim', 'Precio Bolsa'];
    const rows = data.map(item => [
      item.cultura,
      item.fecha,
      item.vencimiento,
      item.ctr,
      item.cierre,
      item.simulacion,
      item.variacion,
      item.alto,
      item.bajo,
      item.apertura,
      item.costo,
      item.precio_bolsa_simulacion,
      item.precio_bolsa
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cbot_historico_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filters.cultura}
            onChange={(e) => setFilters({ ...filters, cultura: e.target.value })}
            className="rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
          >
            <option value="">Todas as Culturas</option>
            <option value="Soja">Soja</option>
            <option value="Maiz">Maiz</option>
            <option value="Trigo">Trigo</option>
          </select>
          <input
            type="date"
            value={filters.start}
            onChange={(e) => setFilters({ ...filters, start: e.target.value })}
            className="rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
          />
          <input
            type="date"
            value={filters.end}
            onChange={(e) => setFilters({ ...filters, end: e.target.value })}
            className="rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
          />
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded bg-success px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">Cultura</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Fecha</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Cierre</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Simulación</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Variación</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Alto/Bajo</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Precio Bolsa</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-bodydark2">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5">{item.cultura}</td>
                  <td className="px-4 py-5">{formatDate(item.fecha)}</td>
                  <td className="px-4 py-5">{formatUSD(item.cierre)}</td>
                  <td className="px-4 py-5">{formatUSD(item.simulacion)}</td>
                  <td className="px-4 py-5">{formatUSD(item.variacion)}</td>
                  <td className="px-4 py-5">
                    {formatUSD(item.alto)} / {formatUSD(item.bajo)}
                  </td>
                  <td className="px-4 py-5">{formatUSD(item.precio_bolsa)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- ABA 3: USUARIO ---
const UsuarioTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase.from('usuario').select('*').order('nombre');
    if (error) console.error(error);
    setUsuarios(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nombre = formData.get('nombre') as string;
    const perfil = formData.get('perfil_acceso') as any;
    const ci = formData.get('ci') as string;
    const telefono = formData.get('telefono') as string;
    const activo = formData.get('activo') === 'on';

    if (selectedUser) {
      // Update
      const { error } = await supabase
        .from('usuario')
        .update({ nombre, perfil_acceso: perfil, ci, telefono, activo })
        .eq('id', selectedUser.id);
      
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Usuário atualizado!', 'success');
        fetchUsuarios();
        setIsModalOpen(false);
      }
    } else {
      // Create Auth User + Profile
      // Note: In a real app, this would be an Edge Function to handle auth.admin.createUser
      // For this demo, we'll simulate the flow or use standard signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre, perfil_acceso: perfil } }
      });

      if (authError) showMessage(authError.message, 'error');
      else if (authData.user) {
        const { error: profileError } = await supabase.from('usuario').insert([{
          id: authData.user.id,
          nombre,
          email,
          perfil_acceso: perfil,
          ci,
          telefono,
          activo: true
        }]);
        
        if (profileError) showMessage(profileError.message, 'error');
        else {
          showMessage('Usuário criado com sucesso!', 'success');
          fetchUsuarios();
          setIsModalOpen(false);
        }
      }
    }
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showMessage(error.message, 'error');
    else showMessage('Email de reset enviado!', 'success');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">Gestão de Usuários</h3>
        <button
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">Nome</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Email</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Perfil</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Status</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : (
              usuarios.map((user) => (
                <tr key={user.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5">{user.nombre}</td>
                  <td className="px-4 py-5">{user.email}</td>
                  <td className="px-4 py-5">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      user.perfil_acceso === 'Admin' ? "bg-meta-3/10 text-meta-3" : 
                      user.perfil_acceso === 'RTV' ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    )}>
                      {user.perfil_acceso}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    {user.activo ? (
                      <span className="text-meta-3">Ativo</span>
                    ) : (
                      <span className="text-meta-1">Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setSelectedUser(user); setIsModalOpen(true); }} className="hover:text-primary">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleResetPassword(user.email)} title="Reset Senha" className="hover:text-warning">
                        <Key size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedUser ? "Editar Usuário" : "Novo Usuário"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-2.5 block text-black dark:text-white">Nome Completo</label>
              <input
                name="nombre"
                defaultValue={selectedUser?.nombre}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">CI / Documento</label>
              <input
                name="ci"
                defaultValue={selectedUser?.ci}
                className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">Telefone</label>
              <input
                name="telefono"
                defaultValue={selectedUser?.telefono}
                className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-black dark:text-white">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={selectedUser?.email}
                required
                disabled={!!selectedUser}
                className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark disabled:bg-gray"
              />
            </div>
            {!selectedUser && (
              <div className="col-span-2">
                <label className="mb-2.5 block text-black dark:text-white">Senha Inicial</label>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
            )}
            <div>
              <label className="mb-2.5 block text-black dark:text-white">Perfil</label>
              <select
                name="perfil_acceso"
                defaultValue={selectedUser?.perfil_acceso || 'RTV'}
                className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="Admin">Admin</option>
                <option value="RTV">RTV</option>
                <option value="Cliente">Cliente</option>
              </select>
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  name="activo"
                  type="checkbox"
                  defaultChecked={selectedUser ? selectedUser.activo : true}
                  className="h-5 w-5 rounded border-stroke"
                />
                <span className="text-black dark:text-white">Ativo</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          >
            {selectedUser ? 'Atualizar' : 'Criar Usuário'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// --- ABA 4: INTEGRAÇÕES ---
const IntegracionesTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const [integ, setInteg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInteg();
  }, []);

  const fetchInteg = async () => {
    const { data, error } = await supabase.from('integraciones').select('*').limit(1).maybeSingle();
    if (error) console.error(error);
    setInteg(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      api_google_maps_secret_ref: formData.get('google_ref'),
      api_openai_secret_ref: formData.get('openai_ref'),
    };

    const { error } = integ?.id 
      ? await supabase.from('integraciones').update(payload).eq('id', integ.id)
      : await supabase.from('integraciones').insert([payload]);

    if (error) showMessage(error.message, 'error');
    else {
      showMessage('Integrações salvas!', 'success');
      fetchInteg();
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-semibold text-black dark:text-white mb-6">Configurações de API</h3>
      <p className="mb-6 text-bodydark2">
        Insira apenas as referências dos segredos (Secret Refs). As chaves reais devem ser configuradas no painel do Supabase/Edge Functions.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="mb-2.5 block text-black dark:text-white">Google Maps Secret Ref</label>
          <input
            name="google_ref"
            defaultValue={integ?.api_google_maps_secret_ref}
            placeholder="ex: GOOGLE_MAPS_KEY"
            className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
          />
        </div>
        <div>
          <label className="mb-2.5 block text-black dark:text-white">OpenAI Secret Ref</label>
          <input
            name="openai_ref"
            defaultValue={integ?.api_openai_secret_ref}
            placeholder="ex: OPENAI_API_KEY"
            className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-primary px-10 py-3 font-medium text-white hover:bg-opacity-90"
        >
          Salvar Integrações
        </button>
      </form>
    </div>
  );
};

export default Ajustes;
