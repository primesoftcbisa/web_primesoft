import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Users, 
  FileText, 
  Ticket, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Search, 
  Loader2, 
  Check, 
  X,
  UserPlus,
  UserMinus,
  ShoppingCart,
  Printer,
  Ban,
  ArrowRight
} from 'lucide-react';
import { formatUSD, formatPct, formatHa, cn, formatDate, formulas } from '@/src/lib/utils';

const CRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState('clientes');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const tabs = [
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['Admin', 'RTV'] },
    { id: 'propuestas', label: 'Propuestas', icon: FileText, roles: ['Admin', 'RTV'] },
    { id: 'vouchers', label: 'Vouchers', icon: Ticket, roles: ['Admin'] },
  ];

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const allowedTabs = tabs.filter(tab => tab.roles.includes(profile?.perfil_acceso));

  return (
    <>
      <Breadcrumb pageName="CRM" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap border-b border-stroke dark:border-strokedark">
          {allowedTabs.map((tab) => (
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
          {activeTab === 'clientes' && <ClientesTab showMessage={showMessage} />}
          {activeTab === 'propuestas' && <PropuestasTab showMessage={showMessage} />}
          {activeTab === 'vouchers' && <VouchersTab showMessage={showMessage} />}
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

// --- ABA 1: CLIENTES ---
const ClientesTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ruc && item.ruc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.ci && item.ci.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {
      tipo_persona: formData.get('tipo_persona'),
      ci: formData.get('ci'),
      ruc: formData.get('ruc'),
      nombre: formData.get('nombre'),
      fecha_nacimiento: formData.get('fecha_nacimiento') || null,
      estado_civil: formData.get('estado_civil'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
      email: formData.get('email'),
      nombre_contador: formData.get('nombre_contador'),
      telefono_contador: formData.get('telefono_contador'),
      fecha_inicio: formData.get('fecha_inicio') || null,
      area_propia_ha: parseFloat(formData.get('area_propia_ha') as string) || 0,
      area_alquilada_ha: parseFloat(formData.get('area_alquilada_ha') as string) || 0,
      vendedor_id: user?.id,
      estado: formData.get('estado') === 'on',
      created_by: user?.id
    };

    if (selectedItem) {
      if (profile?.perfil_acceso !== 'Admin' && selectedItem.created_by !== user?.id) {
        showMessage('Sem permissão para editar este cliente.', 'error');
        return;
      }
      const { error } = await supabase.from('cliente').update(payload).eq('id', selectedItem.id);
      if (error) showMessage(error.message, 'error');
      else {
        // Handle user inactivation if needed
        if (!payload.estado && selectedItem.usuario_cliente_id) {
          // In real app, call edge function to disable auth user
        }
        showMessage('Cliente atualizado!', 'success');
        fetchClientes();
        setIsModalOpen(false);
      }
    } else {
      // Create Auth User for Cliente
      const email = payload.email;
      const password = Math.random().toString(36).slice(-8); // Random initial password
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre: payload.nombre, perfil_acceso: 'Cliente' } }
      });

      if (authError) {
        showMessage('Erro ao criar usuário do cliente: ' + authError.message, 'error');
        return;
      }

      if (authData.user) {
        payload.usuario_cliente_id = authData.user.id;
        // Create profile
        await supabase.from('usuario').insert([{
          id: authData.user.id,
          nombre: payload.nombre,
          email: payload.email,
          perfil_acceso: 'Cliente',
          activo: true
        }]);
      }

      const { error } = await supabase.from('cliente').insert([payload]);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Cliente criado com sucesso!', 'success');
        fetchClientes();
        setIsModalOpen(false);
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'RUC/CI', 'Email', 'Teléfono', 'Estado'];
    const rows = filteredData.map(item => [
      item.nombre,
      item.tipo_persona,
      item.ruc || item.ci,
      item.email,
      item.telefono,
      item.estado ? 'Ativo' : 'Inativo'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <button className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={18} className="text-bodydark2" />
          </button>
          <input
            type="text"
            placeholder="Pesquisar por nome, RUC ou CI..."
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
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">RUC / CI</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Email</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Área Total</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-bodydark2">Nenhum registro encontrado.</td></tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5 font-medium text-black dark:text-white">{item.nombre}</td>
                  <td className="px-4 py-5">{item.ruc || item.ci}</td>
                  <td className="px-4 py-5">{item.email}</td>
                  <td className="px-4 py-5">{formatHa(item.area_propia_ha + item.area_alquilada_ha)}</td>
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
        title={selectedItem ? "Editar Cliente" : "Novo Cliente"}
        className="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Tipo Persona</label>
              <select
                name="tipo_persona"
                defaultValue={selectedItem?.tipo_persona || 'Fisica'}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="Fisica">Física</option>
                <option value="Juridica">Jurídica</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Nombre Completo / Razón Social</label>
              <input
                name="nombre"
                defaultValue={selectedItem?.nombre}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">CI (Cédula de Identidad)</label>
              <input
                name="ci"
                defaultValue={selectedItem?.ci}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">RUC</label>
              <input
                name="ruc"
                defaultValue={selectedItem?.ruc}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Fecha Nacimiento</label>
              <input
                name="fecha_nacimiento"
                type="date"
                defaultValue={selectedItem?.fecha_nacimiento}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Estado Civil</label>
              <select
                name="estado_civil"
                defaultValue={selectedItem?.estado_civil || 'Soltero'}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="Soltero">Solteiro(a)</option>
                <option value="Casado">Casado(a)</option>
                <option value="Divorciado">Divorciado(a)</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Teléfono</label>
              <input
                name="telefono"
                defaultValue={selectedItem?.telefono}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Dirección</label>
              <input
                name="direccion"
                defaultValue={selectedItem?.direccion}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={selectedItem?.email}
                required
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Nombre Contador</label>
              <input
                name="nombre_contador"
                defaultValue={selectedItem?.nombre_contador}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Teléfono Contador</label>
              <input
                name="telefono_contador"
                defaultValue={selectedItem?.telefono_contador}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Fecha Inicio</label>
              <input
                name="fecha_inicio"
                type="date"
                defaultValue={selectedItem?.fecha_inicio}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Área Propia (ha)</label>
              <input
                name="area_propia_ha"
                type="number"
                step="0.01"
                defaultValue={selectedItem?.area_propia_ha || 0}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Área Alquilada (ha)</label>
              <input
                name="area_alquilada_ha"
                type="number"
                step="0.01"
                defaultValue={selectedItem?.area_alquilada_ha || 0}
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
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar Cliente' : 'Criar Cliente'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// --- ABA 2: PROPUESTAS ---
const PropuestasTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form/Cart State
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [distribuidores, setDistribuidores] = useState<any[]>([]);
  
  const [header, setHeader] = useState<any>({
    sku: '',
    tipo: 'Presupuesto',
    cliente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Pendiente'
  });
  
  const [cart, setCart] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState<any>({
    producto_id: '',
    distribuidor_id: '',
    cantidad: 1,
    num_aplicaciones: 1,
    dosis_ha: 0,
    voucher_percent: 0,
    precio_producto: 0,
    precio_minimo: 0,
  });

  useEffect(() => {
    fetchPropuestas();
    fetchInitialData();
  }, []);

  const fetchPropuestas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('propuesta')
      .select('*, cliente(nombre)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const fetchInitialData = async () => {
    const { data: c } = await supabase.from('cliente').select('id, nombre').eq('estado', true);
    const { data: p } = await supabase.from('producto').select('*').eq('estado', true);
    const { data: d } = await supabase.from('distribuidor').select('*').eq('estado', true);
    setClientes(c || []);
    setProductos(p || []);
    setDistribuidores(d || []);
  };

  const addToCart = () => {
    if (!currentItem.producto_id || !currentItem.distribuidor_id) {
      showMessage('Selecione produto e distribuidor', 'error');
      return;
    }

    const prod = productos.find(p => p.id === currentItem.producto_id);
    if (currentItem.precio_producto < prod.precio_minimo) {
      showMessage('Preço abaixo do mínimo permitido!', 'error');
      return;
    }

    const areaTratada = formulas.propuesta.areaTratada(
      currentItem.cantidad,
      prod.contenido_empaque,
      currentItem.dosis_ha,
      currentItem.num_aplicaciones
    );

    const importeTotal = currentItem.cantidad * currentItem.precio_producto;
    const costoHa = areaTratada > 0 ? importeTotal / areaTratada : 0;

    const newItem = {
      ...currentItem,
      producto_nombre: prod.nombre,
      area_tratada: areaTratada,
      costo_ha: costoHa,
      importe_total: importeTotal,
      precio_minimo: prod.precio_minimo
    };

    setCart([...cart, newItem]);
    setCurrentItem({
      producto_id: '',
      distribuidor_id: '',
      cantidad: 1,
      num_aplicaciones: 1,
      dosis_ha: 0,
      voucher_percent: 0,
      precio_producto: 0,
      precio_minimo: 0,
    });
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    const totalItens = cart.length;
    const totalGeneral = cart.reduce((acc, item) => acc + item.importe_total, 0);
    const totalVoucher = header.tipo === 'Venta' 
      ? cart.reduce((acc, item) => acc + (item.importe_total * (item.voucher_percent / 100)), 0)
      : 0;
    
    return { totalItens, totalGeneral, totalVoucher };
  }, [cart, header.tipo]);

  const handleSave = async () => {
    if (!header.cliente_id || cart.length === 0) {
      showMessage('Preencha o cliente e adicione itens', 'error');
      return;
    }

    const proposalPayload = {
      ...header,
      ...totals,
      vendedor_id: user?.id,
      created_by: user?.id
    };

    const { data: prop, error } = await supabase.from('propuesta').insert([proposalPayload]).select().single();
    if (error) {
      showMessage(error.message, 'error');
      return;
    }

    const itemsPayload = cart.map(item => ({
      propuesta_id: prop.id,
      producto_id: item.producto_id,
      distribuidor_id: item.distribuidor_id,
      voucher_percent: item.voucher_percent,
      precio_minimo: item.precio_minimo,
      precio_producto: item.precio_producto,
      cantidad: item.cantidad,
      num_aplicaciones: item.num_aplicaciones,
      dosis_ha: item.dosis_ha,
      area_tratada: item.area_tratada,
      costo_ha: item.costo_ha,
      importe_total: item.importe_total
    }));

    const { error: itemsError } = await supabase.from('propuesta_item').insert(itemsPayload);
    if (itemsError) {
      showMessage(itemsError.message, 'error');
      return;
    }

    // If Venta, handle Voucher
    if (header.tipo === 'Venta' && totals.totalVoucher > 0) {
      await supabase.from('voucher').insert([{
        propuesta_id: prop.id,
        cliente_id: header.cliente_id,
        valor_total: totals.totalVoucher,
        estado: 'Generado'
      }]);

      // Update Balance
      const { data: balance } = await supabase.from('saldo_voucher_cliente').select('*').eq('cliente_id', header.cliente_id).maybeSingle();
      const newBalance = (balance?.saldo_actual_usd || 0) + totals.totalVoucher;
      
      if (balance) {
        await supabase.from('saldo_voucher_cliente').update({ saldo_actual_usd: newBalance }).eq('cliente_id', header.cliente_id);
      } else {
        await supabase.from('saldo_voucher_cliente').insert([{ cliente_id: header.cliente_id, saldo_actual_usd: newBalance }]);
      }

      // Record Movement
      await supabase.from('movimiento_voucher').insert([{
        cliente_id: header.cliente_id,
        tipo: 'Generado',
        valor: totals.totalVoucher,
        referencia_id: prop.id
      }]);
    }

    showMessage('Propuesta salva com sucesso!', 'success');
    fetchPropuestas();
    setIsModalOpen(false);
    setCart([]);
  };

  const handleCancel = async (prop: any) => {
    if (profile?.perfil_acceso !== 'Admin') {
      showMessage('Somente Admin pode cancelar vendas', 'error');
      return;
    }
    if (!confirm('Deseja cancelar esta proposta?')) return;

    const { error } = await supabase.from('propuesta').update({ estado: 'Cancelado' }).eq('id', prop.id);
    if (error) {
      showMessage(error.message, 'error');
      return;
    }

    if (prop.tipo === 'Venta' && prop.total_voucher > 0) {
      // Cancel Voucher
      await supabase.from('voucher').update({ estado: 'Cancelado' }).eq('propuesta_id', prop.id);
      
      // Update Balance
      const { data: balance } = await supabase.from('saldo_voucher_cliente').select('*').eq('cliente_id', prop.cliente_id).maybeSingle();
      const newBalance = (balance?.saldo_actual_usd || 0) - prop.total_voucher;
      await supabase.from('saldo_voucher_cliente').update({ saldo_actual_usd: newBalance }).eq('cliente_id', prop.cliente_id);

      // Record Movement
      await supabase.from('movimiento_voucher').insert([{
        cliente_id: prop.cliente_id,
        tipo: 'Cancelado',
        valor: -prop.total_voucher,
        referencia_id: prop.id
      }]);
    }

    showMessage('Propuesta cancelada!', 'success');
    fetchPropuestas();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <button className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={18} className="text-bodydark2" />
          </button>
          <input
            type="text"
            placeholder="Pesquisar propostas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark xl:w-75"
          />
        </div>
        <button
          onClick={() => { setSelectedItem(null); setIsModalOpen(true); setCart([]); }}
          className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <ShoppingCart size={18} />
          Nueva Propuesta
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">SKU</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Cliente</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Tipo</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Total</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-bodydark2">Nenhuma proposta encontrada.</td></tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-5">{item.cliente?.nombre}</td>
                  <td className="px-4 py-5">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      item.tipo === 'Venta' ? "bg-meta-3/10 text-meta-3" : "bg-primary/10 text-primary"
                    )}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-5 font-bold">{formatUSD(item.total_general)}</td>
                  <td className="px-4 py-5">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      item.estado === 'Cancelado' ? "bg-meta-1/10 text-meta-1" : "bg-warning/10 text-warning"
                    )}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <button title="Imprimir PDF" className="hover:text-primary">
                        <Printer size={18} />
                      </button>
                      {item.estado !== 'Cancelado' && (
                        <button 
                          onClick={() => handleCancel(item)}
                          title="Cancelar" 
                          className="hover:text-meta-1"
                        >
                          <Ban size={18} />
                        </button>
                      )}
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
        title="Nova Propuesta"
        className="max-w-6xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">SKU</label>
              <input
                value={header.sku}
                onChange={(e) => setHeader({ ...header, sku: e.target.value })}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tipo</label>
              <select
                value={header.tipo}
                onChange={(e) => setHeader({ ...header, tipo: e.target.value })}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="Presupuesto">Presupuesto</option>
                <option value="Venta">Venta</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Cliente</label>
              <select
                value={header.cliente_id}
                onChange={(e) => setHeader({ ...header, cliente_id: e.target.value })}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={header.fecha}
                onChange={(e) => setHeader({ ...header, fecha: e.target.value })}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
          </div>

          {/* Cart Entry */}
          <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
            <h4 className="mb-4 font-semibold">Adicionar Item</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium">Producto</label>
                <select
                  value={currentItem.producto_id}
                  onChange={(e) => {
                    const p = productos.find(x => x.id === e.target.value);
                    setCurrentItem({ 
                      ...currentItem, 
                      producto_id: e.target.value,
                      precio_producto: p?.precio_final || 0,
                      precio_minimo: p?.precio_minimo || 0
                    });
                  }}
                  className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                >
                  <option value="">Selecione...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({formatUSD(p.precio_final)})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Distribuidor</label>
                <select
                  value={currentItem.distribuidor_id}
                  onChange={(e) => setCurrentItem({ ...currentItem, distribuidor_id: e.target.value })}
                  className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                >
                  <option value="">Selecione...</option>
                  {distribuidores.map(d => <option key={d.id} value={d.id}>{d.distribuidor}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Precio Unitario (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentItem.precio_producto}
                  onChange={(e) => setCurrentItem({ ...currentItem, precio_producto: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Cantidad</label>
                <input
                  type="number"
                  value={currentItem.cantidad}
                  onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Num. Aplicaciones</label>
                <input
                  type="number"
                  value={currentItem.num_aplicaciones}
                  onChange={(e) => setCurrentItem({ ...currentItem, num_aplicaciones: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Dosis/ha</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentItem.dosis_ha}
                  onChange={(e) => setCurrentItem({ ...currentItem, dosis_ha: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                />
              </div>
              {header.tipo === 'Venta' && (
                <div>
                  <label className="mb-1 block text-xs font-medium">Voucher (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentItem.voucher_percent}
                    onChange={(e) => setCurrentItem({ ...currentItem, voucher_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-stroke bg-white px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                  />
                </div>
              )}
              <div className="flex items-end">
                <button
                  onClick={addToCart}
                  className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2 font-medium text-white hover:bg-opacity-90"
                >
                  <Plus size={18} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Cart Table */}
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-2 text-xs font-medium uppercase">Producto</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase">Cant.</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase">Área (ha)</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase">Costo/ha</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase">Importe</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase">Ação</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3 text-sm">{item.producto_nombre}</td>
                    <td className="px-4 py-3 text-sm">{item.cantidad}</td>
                    <td className="px-4 py-3 text-sm">{formatHa(item.area_tratada)}</td>
                    <td className="px-4 py-3 text-sm">{formatUSD(item.costo_ha)}</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatUSD(item.importe_total)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeFromCart(index)} className="text-meta-1 hover:text-opacity-70">
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-2 border-t border-stroke pt-4 dark:border-strokedark">
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-bodydark2">Itens:</span>
              <span className="font-bold">{totals.totalItens}</span>
            </div>
            {header.tipo === 'Venta' && (
              <div className="flex w-full max-w-xs justify-between text-meta-3">
                <span>Total Voucher:</span>
                <span className="font-bold">{formatUSD(totals.totalVoucher)}</span>
              </div>
            )}
            <div className="flex w-full max-w-xs justify-between border-t border-stroke pt-2 text-xl font-bold text-black dark:border-strokedark dark:text-white">
              <span>Total General:</span>
              <span>{formatUSD(totals.totalGeneral)}</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            Finalizar Propuesta
          </button>
        </div>
      </Modal>
    </div>
  );
};

// --- ABA 3: VOUCHERS ---
const VouchersTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const [balances, setBalances] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [releaseData, setReleaseData] = useState({
    percent: 0,
    value: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: b } = await supabase.from('saldo_voucher_cliente').select('*, cliente(nombre)');
    const { data: m } = await supabase.from('movimiento_voucher').select('*, cliente(nombre)').order('created_at', { ascending: false });
    setBalances(b || []);
    setMovements(m || []);
    setLoading(false);
  };

  const handleRelease = async () => {
    if (!selectedClient || releaseData.value <= 0) return;

    const newBalance = selectedClient.saldo_actual_usd - releaseData.value;
    if (newBalance < 0) {
      showMessage('Saldo insuficiente!', 'error');
      return;
    }

    // Update Balance
    const { error: bError } = await supabase.from('saldo_voucher_cliente').update({ saldo_actual_usd: newBalance }).eq('id', selectedClient.id);
    if (bError) {
      showMessage(bError.message, 'error');
      return;
    }

    // Record Movement
    await supabase.from('movimiento_voucher').insert([{
      cliente_id: selectedClient.cliente_id,
      tipo: 'Liberado',
      valor: -releaseData.value,
    }]);

    showMessage('Voucher liberado com sucesso!', 'success');
    fetchData();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Balances Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Saldos por Cliente</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {balances.map((b) => (
            <div key={b.id} className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-bodydark2">{b.cliente?.nombre}</p>
                  <h4 className="text-xl font-bold text-black dark:text-white">{formatUSD(b.saldo_actual_usd)}</h4>
                </div>
                <button
                  onClick={() => { setSelectedClient(b); setIsModalOpen(true); setReleaseData({ percent: 0, value: 0 }); }}
                  className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-opacity-90"
                >
                  Liberar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Movements Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">Histórico de Movimientos</h3>
          <button className="flex items-center gap-2 rounded border border-stroke px-4 py-2 text-sm font-medium hover:shadow-1 dark:border-strokedark">
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-3 text-xs font-medium uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-medium uppercase">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-sm">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{m.cliente?.nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      m.tipo === 'Generado' ? "bg-meta-3/10 text-meta-3" : 
                      m.tipo === 'Liberado' ? "bg-primary/10 text-primary" : "bg-meta-1/10 text-meta-1"
                    )}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className={cn("px-4 py-3 text-sm font-bold", m.valor < 0 ? "text-meta-1" : "text-meta-3")}>
                    {formatUSD(m.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Liberar Voucher - ${selectedClient?.cliente?.nombre}`}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-bodydark2">Saldo Atual: <span className="font-bold text-black dark:text-white">{formatUSD(selectedClient?.saldo_actual_usd)}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Porcentaje (%)</label>
              <input
                type="number"
                value={releaseData.percent}
                onChange={(e) => {
                  const p = parseFloat(e.target.value) || 0;
                  setReleaseData({ percent: p, value: (selectedClient?.saldo_actual_usd * p) / 100 });
                }}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Valor (USD)</label>
              <input
                type="number"
                value={releaseData.value}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setReleaseData({ value: v, percent: (v / selectedClient?.saldo_actual_usd) * 100 });
                }}
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
              />
            </div>
          </div>
          <div className="rounded bg-gray-2 p-3 dark:bg-meta-4">
            <p className="text-sm">Saldo Restante: <span className="font-bold">{formatUSD(selectedClient?.saldo_actual_usd - releaseData.value)}</span></p>
          </div>
          <button
            onClick={handleRelease}
            className="w-full rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          >
            Confirmar Liberación
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CRM;
