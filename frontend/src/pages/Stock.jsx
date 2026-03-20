import { useEffect, useState, useCallback } from 'react';
import { stockApi, productsApi } from '../services/api';
import { Modal, PageHeader, EmptyState, Spinner, Pagination } from '../components/UI';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_BADGE = { IN: 'badge-success', OUT: 'badge-danger', ADJUSTMENT: 'badge-warning' };

export default function Stock() {
  const [logs, setLogs]         = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ productId:'', quantity:'', type:'IN', note:'' });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await stockApi.getLogs({ page, pageSize: 15 }); setLogs(r.data.items); setTotal(r.data.total); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { productsApi.getAll({ pageSize: 200 }).then(r => setProducts(r.data.items)); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await stockApi.adjust({ productId: parseInt(form.productId), quantity: parseInt(form.quantity), type: form.type, note: form.note });
      toast.success('Stock adjusted!');
      setModal(false); setForm({ productId:'', quantity:'', type:'IN', note:'' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Stock Movements" subtitle={`${total} log entries`}
        action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={16}/>Adjust</button>} />

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : logs.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No movements" description="Stock adjustments will appear here." />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Note</th>
                  <th className="table-header">By</th>
                  <th className="table-header">Date</th>
                </tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{log.productName}</td>
                      <td className="table-cell"><span className={TYPE_BADGE[log.type]}>{log.type}</span></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          {log.type === 'IN' ? <ArrowUpRight size={14} className="text-emerald-500"/> : <ArrowDownRight size={14} className="text-red-500"/>}
                          <span className={`font-bold text-sm ${log.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{log.quantity > 0 ? '+':''}{log.quantity}</span>
                        </div>
                      </td>
                      <td className="table-cell text-gray-500 max-w-[180px] truncate">{log.note || '—'}</td>
                      <td className="table-cell text-gray-500 text-xs">{log.createdBy}</td>
                      <td className="table-cell text-gray-500 whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-900/20' : log.type === 'OUT' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    {log.type === 'IN' ? <ArrowUpRight size={15} className="text-emerald-600"/> : log.type === 'OUT' ? <ArrowDownRight size={15} className="text-red-500"/> : <RefreshCw size={14} className="text-amber-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{log.productName}</p>
                    <p className="text-xs text-gray-400 truncate">{log.note || log.createdBy} · {new Date(log.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short'})}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-bold ${log.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{log.quantity > 0 ? '+':''}{log.quantity}</span>
                    <div><span className={`${TYPE_BADGE[log.type]} text-[10px]`}>{log.type}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageSize={15} total={total} onPage={setPage} />
          </>
        )}
      </div>

      {modal && (
        <Modal title="Adjust Stock" onClose={() => setModal(false)} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Product *</label>
              <select className="input" required value={form.productId} onChange={e => setForm(p=>({...p,productId:e.target.value}))}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Movement Type *</label>
              <div className="flex gap-4">
                {['IN','OUT','ADJUSTMENT'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value={t} checked={form.type===t} onChange={e => setForm(p=>({...p,type:e.target.value}))} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input className="input" type="number" min="1" required value={form.quantity} onChange={e => setForm(p=>({...p,quantity:e.target.value}))} placeholder="Enter quantity" />
            </div>
            <div>
              <label className="label">Note</label>
              <input className="input" value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} placeholder="Reason for adjustment" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Adjust Stock'}</button>
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
