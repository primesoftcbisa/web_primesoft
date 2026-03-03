import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import { 
  FileText, 
  MapPin, 
  Ticket, 
  Sparkles,
  Loader2,
  Download,
  Search
} from 'lucide-react';
import { formatUSD, formatHa, formatDate, cn } from '@/src/lib/utils';
import IAChat from '@/src/pages/IAChat';

const EspacioCliente: React.FC = () => {
  const [activeTab, setActiveTab] = useState('propuestas');
  const { profile } = useAuth();

  const tabs = [
    { id: 'propuestas', label: 'Mis Propuestas', icon: FileText },
    { id: 'parcelas', label: 'Mis Parcelas', icon: MapPin },
    { id: 'vouchers', label: 'Mi Saldo Voucher', icon: Ticket },
    { id: 'ia', label: 'Chat IA', icon: Sparkles },
  ];

  return (
    <>
      <Breadcrumb pageName="Espacio del Cliente" />

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
          {activeTab === 'propuestas' && <MisPropuestas />}
          {activeTab === 'parcelas' && <MisParcelas />}
          {activeTab === 'vouchers' && <MiSaldoVoucher />}
          {activeTab === 'ia' && <IAChat />}
        </div>
      </div>
    </>
  );
};

const MisPropuestas = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Find client record for this user
      const { data: client } = await supabase.from('cliente').select('id').eq('usuario_cliente_id', user?.id).single();
      if (client) {
        const { data } = await supabase.from('propuesta').select('*').eq('cliente_id', client.id).order('created_at', { ascending: false });
        setData(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="px-4 py-4 font-medium text-black dark:text-white">Fecha</th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">SKU</th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">Tipo</th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">Total</th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={5} className="py-10 text-center text-bodydark2">Nenhuma proposta encontrada.</td></tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                <td className="px-4 py-5">{formatDate(item.fecha)}</td>
                <td className="px-4 py-5 font-mono text-xs">{item.sku}</td>
                <td className="px-4 py-5">{item.tipo}</td>
                <td className="px-4 py-5 font-bold">{formatUSD(item.total_general)}</td>
                <td className="px-4 py-5">
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    item.estado === 'Cancelado' ? "bg-meta-1/10 text-meta-1" : "bg-meta-3/10 text-meta-3"
                  )}>
                    {item.estado}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const MisParcelas = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: client } = await supabase.from('cliente').select('id').eq('usuario_cliente_id', user?.id).single();
      if (client) {
        const { data } = await supabase.from('parcela').select('*').eq('cliente_id', client.id).eq('estado', true);
        setData(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {loading ? (
        <div className="col-span-3 py-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>
      ) : data.length === 0 ? (
        <div className="col-span-3 py-10 text-center text-bodydark2">Nenhuma parcela encontrada.</div>
      ) : (
        data.map((item) => (
          <div key={item.id} className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="mb-2 font-semibold text-black dark:text-white">{item.nombre}</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-bodydark2">Área:</span>
              <span className="font-medium">{formatHa(item.area_ha)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const MiSaldoVoucher = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: client } = await supabase.from('cliente').select('id').eq('usuario_cliente_id', user?.id).single();
      if (client) {
        const { data: b } = await supabase.from('saldo_voucher_cliente').select('*').eq('cliente_id', client.id).maybeSingle();
        const { data: m } = await supabase.from('movimiento_voucher').select('*').eq('cliente_id', client.id).order('created_at', { ascending: false });
        setBalance(b);
        setMovements(m || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="max-w-xs rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-sm text-bodydark2">Saldo Atual Disponible</p>
        <h3 className="mt-1 text-3xl font-bold text-meta-3">{formatUSD(balance?.saldo_actual_usd || 0)}</h3>
      </div>

      <div>
        <h4 className="mb-4 font-semibold text-black dark:text-white">Historial de Movimientos</h4>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-3 text-xs font-medium uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-medium uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-sm">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{m.tipo}</td>
                  <td className={cn("px-4 py-3 text-sm font-bold", m.valor < 0 ? "text-meta-1" : "text-meta-3")}>
                    {formatUSD(m.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EspacioCliente;
