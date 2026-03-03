import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import Modal from '@/src/components/Modal';
import { 
  Truck, 
  Package, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Search, 
  Loader2, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Percent
} from 'lucide-react';
import { formatUSD, formatPct, cn, formulas } from '@/src/lib/utils';

const CATEGORIAS = ['Semillas', 'Fertilizantes', 'Defensivos', 'Otros'];
const UNIDADES = ['Litro', 'Kg', 'mL', 'g'];
const CULTURAS = ['Soja', 'Maiz', 'Trigo'];

const Productos: React.FC = () => {
  const [activeTab, setActiveTab] = useState('distribuidor');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'distribuidor', label: 'Distribuidor', icon: Truck },
    { id: 'producto', label: 'Producto', icon: Package },
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
      <Breadcrumb pageName="Productos" />

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
          {activeTab === 'distribuidor' && <DistribuidorTab showMessage={showMessage} />}
          {activeTab === 'producto' && <ProductoTab showMessage={showMessage} />}
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

// --- ABA 1: DISTRIBUIDOR ---
const DistribuidorTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDistribuidores();
  }, []);

  const fetchDistribuidores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('distribuidor')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.fabricante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.distribuidor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      fabricante: formData.get('fabricante'),
      distribuidor: formData.get('distribuidor'),
      estado: formData.get('estado') === 'on',
      created_by: user?.id
    };

    if (selectedItem) {
      if (profile?.perfil_acceso !== 'Admin' && selectedItem.created_by !== user?.id) {
        showMessage('Sem permissão para editar este registro.', 'error');
        return;
      }
      const { error } = await supabase.from('distribuidor').update(payload).eq('id', selectedItem.id);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Distribuidor atualizado!', 'success');
        fetchDistribuidores();
        setIsModalOpen(false);
      }
    } else {
      const { error } = await supabase.from('distribuidor').insert([payload]);
      if (error) showMessage(error.message, 'error');
      else {
        showMessage('Distribuidor criado!', 'success');
        fetchDistribuidores();
        setIsModalOpen(false);
      }
    }
  };

  const handleDelete = async (id: string, createdBy: string) => {
    if (profile?.perfil_acceso !== 'Admin' && createdBy !== user?.id) {
      showMessage('Sem permissão para excluir este registro.', 'error');
      return;
    }
    if (!confirm('Deseja excluir este distribuidor?')) return;
    const { error } = await supabase.from('distribuidor').delete().eq('id', id);
    if (error) showMessage(error.message, 'error');
    else {
      showMessage('Distribuidor excluído!', 'success');
      fetchDistribuidores();
    }
  };

  const exportCSV = () => {
    const headers = ['Fabricante', 'Distribuidor', 'Estado', 'Criado em'];
    const rows = filteredData.map(item => [
      item.fabricante,
      item.distribuidor,
      item.estado ? 'Ativo' : 'Inativo',
      item.created_at
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `distribuidores_${new Date().toISOString().split('T')[0]}.csv`;
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
            placeholder="Pesquisar..."
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
            Novo Distribuidor
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">Fabricante</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Distribuidor</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={4} className="py-10 text-center text-bodydark2">Nenhum registro encontrado.</td></tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5">{item.fabricante}</td>
                  <td className="px-4 py-5">{item.distribuidor}</td>
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
                      <button 
                        onClick={() => handleDelete(item.id, item.created_by)}
                        className="hover:text-meta-1"
                        disabled={profile?.perfil_acceso !== 'Admin' && item.created_by !== user?.id}
                      >
                        <Trash size={18} />
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
        title={selectedItem ? "Editar Distribuidor" : "Novo Distribuidor"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Fabricante</label>
            <input
              name="fabricante"
              defaultValue={selectedItem?.fabricante}
              required
              className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Distribuidor</label>
            <input
              name="distribuidor"
              defaultValue={selectedItem?.distribuidor}
              required
              className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              name="estado"
              type="checkbox"
              defaultChecked={selectedItem ? selectedItem.estado : true}
              className="h-5 w-5 rounded border-stroke"
            />
            <label className="text-black dark:text-white">Ativo</label>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar' : 'Criar Distribuidor'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// --- ABA 2: PRODUCTO ---
const ProductoTab: React.FC<{ showMessage: (m: string, t: 'success' | 'error') => void }> = ({ showMessage }) => {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [distribuidores, setDistribuidores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formValues, setFormValues] = useState<any>({
    sku: '',
    categoria: CATEGORIAS[0],
    nombre: '',
    fabricante: '',
    culturas: [],
    composicion: '',
    unidad_medida: UNIDADES[0],
    contenido_empaque: 0,
    precio_compra: 0,
    margen_pct: 0,
    costo_operacional_pct: 0,
    costo_financiero_pct: 0,
    bonificacion_vendedor_pct: 0,
    bonificacion_cliente_pct: 0,
    voucher_impacto_pct: 0,
    precio_minimo: 0,
    estado: true,
    distribuidores_ids: []
  });

  useEffect(() => {
    fetchProductos();
    fetchDistribuidores();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('producto')
      .select('*, producto_distribuidor(distribuidor_id)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setData(data || []);
    setLoading(false);
  };

  const fetchDistribuidores = async () => {
    const { data } = await supabase.from('distribuidor').select('*').eq('estado', true);
    setDistribuidores(data || []);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Calculated Fields
  const calculated = useMemo(() => {
    const precioVenta = formulas.producto.precioVenta(formValues.precio_compra, formValues.margen_pct);
    const totalPct = formulas.producto.totalPct(
      formValues.costo_operacional_pct,
      formValues.costo_financiero_pct,
      formValues.bonificacion_vendedor_pct,
      formValues.bonificacion_cliente_pct,
      formValues.voucher_impacto_pct
    );
    const totalEnElCosto = formulas.producto.totalEnElCosto(precioVenta, totalPct);
    const precioFinal = formulas.producto.precioFinal(precioVenta, totalEnElCosto);

    return { precioVenta, totalEnElCosto, precioFinal };
  }, [formValues]);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setSelectedItem(item);
      setFormValues({
        ...item,
        distribuidores_ids: item.producto_distribuidor?.map((pd: any) => pd.distribuidor_id) || []
      });
    } else {
      setSelectedItem(null);
      setFormValues({
        sku: '',
        categoria: CATEGORIAS[0],
        nombre: '',
        fabricante: '',
        culturas: [],
        composicion: '',
        unidad_medida: UNIDADES[0],
        contenido_empaque: 0,
        precio_compra: 0,
        margen_pct: 0,
        costo_operacional_pct: 0,
        costo_financiero_pct: 0,
        bonificacion_vendedor_pct: 0,
        bonificacion_cliente_pct: 0,
        voucher_impacto_pct: 0,
        precio_minimo: 0,
        estado: true,
        distribuidores_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formValues,
      precio_venta: calculated.precioVenta,
      total_en_el_costo: calculated.totalEnElCosto,
      precio_final: calculated.precioFinal,
      created_by: user?.id
    };

    // Remove the helper field before saving to DB
    const { distribuidores_ids, producto_distribuidor, ...dbPayload } = payload;

    if (selectedItem) {
      if (profile?.perfil_acceso !== 'Admin' && selectedItem.created_by !== user?.id) {
        showMessage('Sem permissão para editar este registro.', 'error');
        return;
      }
      const { error } = await supabase.from('producto').update(dbPayload).eq('id', selectedItem.id);
      if (error) {
        showMessage(error.message, 'error');
        return;
      }
      
      // Update relationships
      await supabase.from('producto_distribuidor').delete().eq('producto_id', selectedItem.id);
      if (distribuidores_ids.length > 0) {
        await supabase.from('producto_distribuidor').insert(
          distribuidores_ids.map((id: string) => ({ producto_id: selectedItem.id, distribuidor_id: id }))
        );
      }
      
      showMessage('Producto atualizado!', 'success');
    } else {
      const { data: newProd, error } = await supabase.from('producto').insert([dbPayload]).select().single();
      if (error) {
        showMessage(error.message, 'error');
        return;
      }

      if (distribuidores_ids.length > 0) {
        await supabase.from('producto_distribuidor').insert(
          distribuidores_ids.map((id: string) => ({ producto_id: newProd.id, distribuidor_id: id }))
        );
      }
      
      showMessage('Producto criado!', 'success');
    }

    fetchProductos();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, createdBy: string) => {
    if (profile?.perfil_acceso !== 'Admin' && createdBy !== user?.id) {
      showMessage('Sem permissão para excluir este registro.', 'error');
      return;
    }
    if (!confirm('Deseja excluir este produto?')) return;
    const { error } = await supabase.from('producto').delete().eq('id', id);
    if (error) showMessage(error.message, 'error');
    else {
      showMessage('Producto excluído!', 'success');
      fetchProductos();
    }
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
            placeholder="Pesquisar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark xl:w-75"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <Plus size={18} />
          Novo Producto
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">SKU</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Categoría</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Precio Final</th>
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
                  <td className="px-4 py-5 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-5">{item.nombre}</td>
                  <td className="px-4 py-5">{item.categoria}</td>
                  <td className="px-4 py-5 font-medium text-black dark:text-white">{formatUSD(item.precio_final)}</td>
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
                        onClick={() => handleOpenModal(item)}
                        className="hover:text-primary"
                        disabled={profile?.perfil_acceso !== 'Admin' && item.created_by !== user?.id}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.created_by)}
                        className="hover:text-meta-1"
                        disabled={profile?.perfil_acceso !== 'Admin' && item.created_by !== user?.id}
                      >
                        <Trash size={18} />
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
        title={selectedItem ? "Editar Producto" : "Novo Producto"}
        className="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-8">
          {/* SEÇÃO 1: INFO GENERALES */}
          <div>
            <div className="mb-4 flex items-center gap-2 border-b border-stroke pb-2 dark:border-strokedark">
              <Info size={18} className="text-primary" />
              <h4 className="font-semibold text-black dark:text-white">Informações Gerais</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">SKU</label>
                <input
                  value={formValues.sku}
                  onChange={(e) => setFormValues({ ...formValues, sku: e.target.value })}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Nombre</label>
                <input
                  value={formValues.nombre}
                  onChange={(e) => setFormValues({ ...formValues, nombre: e.target.value })}
                  required
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Fabricante</label>
                <input
                  value={formValues.fabricante}
                  onChange={(e) => setFormValues({ ...formValues, fabricante: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Categoría</label>
                <select
                  value={formValues.categoria}
                  onChange={(e) => setFormValues({ ...formValues, categoria: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Unidad de Medida</label>
                <select
                  value={formValues.unidad_medida}
                  onChange={(e) => setFormValues({ ...formValues, unidad_medida: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                >
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Contenido Empaque</label>
                <input
                  type="number"
                  step="0.01"
                  value={formValues.contenido_empaque}
                  onChange={(e) => setFormValues({ ...formValues, contenido_empaque: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Culturas</label>
                <div className="flex flex-wrap gap-3">
                  {CULTURAS.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formValues.culturas.includes(c)}
                        onChange={(e) => {
                          const newCulturas = e.target.checked 
                            ? [...formValues.culturas, c]
                            : formValues.culturas.filter((item: string) => item !== c);
                          setFormValues({ ...formValues, culturas: newCulturas });
                        }}
                        className="h-4 w-4 rounded border-stroke"
                      />
                      <span className="text-sm">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Estado</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formValues.estado}
                    onChange={(e) => setFormValues({ ...formValues, estado: e.target.checked })}
                    className="h-5 w-5 rounded border-stroke"
                  />
                  <span className="text-sm">{formValues.estado ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Distribuidores Vinculados</label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {distribuidores.map(d => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer rounded border border-stroke p-2 hover:bg-gray-2 dark:border-strokedark">
                      <input
                        type="checkbox"
                        checked={formValues.distribuidores_ids.includes(d.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...formValues.distribuidores_ids, d.id]
                            : formValues.distribuidores_ids.filter((id: string) => id !== d.id);
                          setFormValues({ ...formValues, distribuidores_ids: newIds });
                        }}
                        className="h-4 w-4 rounded border-stroke"
                      />
                      <span className="text-xs truncate">{d.distribuidor}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: COMPOSIÇÃO DE PREÇO */}
          <div>
            <div className="mb-4 flex items-center gap-2 border-b border-stroke pb-2 dark:border-strokedark">
              <DollarSign size={18} className="text-primary" />
              <h4 className="font-semibold text-black dark:text-white">Composição de Preço</h4>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Precio Compra (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.precio_compra}
                      onChange={(e) => setFormValues({ ...formValues, precio_compra: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Margem (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.margen_pct}
                      onChange={(e) => setFormValues({ ...formValues, margen_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Costo Operacional (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.costo_operacional_pct}
                      onChange={(e) => setFormValues({ ...formValues, costo_operacional_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Costo Financiero (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.costo_financiero_pct}
                      onChange={(e) => setFormValues({ ...formValues, costo_financiero_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Bonif. Vendedor (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.bonificacion_vendedor_pct}
                      onChange={(e) => setFormValues({ ...formValues, bonificacion_vendedor_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Bonif. Cliente (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.bonificacion_cliente_pct}
                      onChange={(e) => setFormValues({ ...formValues, bonificacion_cliente_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Voucher Impacto (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.voucher_impacto_pct}
                      onChange={(e) => setFormValues({ ...formValues, voucher_impacto_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-bodydark2">Precio Mínimo (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.precio_minimo}
                      onChange={(e) => setFormValues({ ...formValues, precio_minimo: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Results */}
              <div className="rounded-sm bg-gray-2 p-6 dark:bg-meta-4">
                <h5 className="mb-4 text-sm font-semibold uppercase text-bodydark2">Resultados Calculados</h5>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-strokedark">
                    <span className="text-sm">Precio Venta</span>
                    <span className="font-bold text-black dark:text-white">{formatUSD(calculated.precioVenta)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-strokedark">
                    <span className="text-sm">Total en el Costo</span>
                    <span className="font-bold text-black dark:text-white">{formatUSD(calculated.totalEnElCosto)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-primary">Precio Final</span>
                    <span className="text-2xl font-bold text-primary">{formatUSD(calculated.precioFinal)}</span>
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-2 rounded border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <p>Os valores calculados são baseados nas fórmulas travadas do PRD e são atualizados em tempo real conforme você altera os inputs.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-primary p-4 font-medium text-white hover:bg-opacity-90"
          >
            {selectedItem ? 'Atualizar Producto' : 'Criar Producto'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Productos;
