import { useEffect, useState, useCallback } from 'react';
import { purchaseOrdersApi, suppliersApi, productsApi } from '../services/api';
import { Modal, PageHeader, EmptyState, Spinner, Pagination } from '../components/UI';
import { useAuth } from '../context/AppContext';
import { ShoppingCart, Plus, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS = { Pending:'badge-warning', Received:'badge-success', Cancelled:'badge-danger' };

export default function PurchaseOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ supplierId:'', notes:'', items:[{ productId:'', quantity:'', unitCost:'' }] });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await purchaseOrdersApi.getAll({ status: statusFilter || undefined, page, pageSize: 10 }); setOrders(r.data.items); setTotal(r.data.total); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    suppliersApi.getAll().then(r => setSuppliers(r.data.filter(s => s.isActive)));
    productsApi.getAll({ pageSize: 200 }).then(r => setProducts(r.data.items));
  }, []);

  const openView = async (id) => { const r = await purchaseOrdersApi.getById(id); setSelected(r.data); setModal('view'); };
  const addItem  = () => setForm(p => ({ ...p, items:[...p.items,{ productId:'', quantity:'', unitCost:'' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items:p.items.filter((_,idx) => idx!==i) }));
  const updateItem = (i, field, val) => setForm(p => { const items=[...p.items]; items[i]={...items[i],[field]:val}; return {...p,items}; });

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await purchaseOrdersApi.create({ supplierId:parseInt(form.supplierId), notes:form.notes, items:form.items.map(i=>({ productId:parseInt(i.productId), quantity:parseInt(i.quantity), unitCost:parseFloat(i.unitCost) })) });
      toast.success('Order created!');
      setModal(null); setForm({ supplierId:'', notes:'', items:[{ productId:'', quantity:'', unitCost:'' }] }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleReceive = async (id) => {
    if (!confirm('Mark as received? Stock will be updated.')) return;
    try { await purchaseOrdersApi.receive(id); toast.success('Order received, stock updated!'); load(); setModal(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    try { await purchaseOrdersApi.cancel(id); toast.success('Order cancelled'); load(); setModal(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const totalCalc = form.items.reduce((s,i) => s+(parseFloat(i.quantity)||0)*(parseFloat(i.unitCost)||0), 0);

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle={`${total} orders`}
        action={isAdmin && <button onClick={() => setModal('add')} className="btn-primary"><Plus size={16}/>New Order</button>} />

      {/* Status filter tabs — scrollable on mobile */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {['','Pending','Received','Cancelled'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${statusFilter===s ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders" description="Create a purchase order to restock products." />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Order #</th>
                  <th className="table-header">Supplier</th>
                  <th className="table-header">Items</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell"><span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{o.orderNumber}</span></td>
                      <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{o.supplierName}</td>
                      <td className="table-cell text-gray-500">{o.items?.length||0}</td>
                      <td className="table-cell font-bold text-gray-900 dark:text-gray-100">{fmt(o.totalAmount)}</td>
                      <td className="table-cell"><span className={STATUS[o.status]}>{o.status}</span></td>
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">{new Date(o.orderDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</td>
                      <td className="table-cell"><div className="flex gap-1">
                        <button onClick={() => openView(o.id)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Eye size={14}/></button>
                        {isAdmin && o.status==='Pending' && <>
                          <button onClick={() => handleReceive(o.id)} className="icon-btn hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><CheckCircle size={14}/></button>
                          <button onClick={() => handleCancel(o.id)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><XCircle size={14}/></button>
                        </>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map(o => (
                <div key={o.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-1">{o.orderNumber}</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{o.supplierName}</p>
                    </div>
                    <span className={STATUS[o.status]}>{o.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-gray-900 dark:text-white">{fmt(o.totalAmount)}</p>
                      <p className="text-xs text-gray-400">{o.items?.length||0} items · {new Date(o.orderDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openView(o.id)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Eye size={16}/></button>
                      {isAdmin && o.status==='Pending' && <>
                        <button onClick={() => handleReceive(o.id)} className="icon-btn hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><CheckCircle size={16}/></button>
                        <button onClick={() => handleCancel(o.id)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><XCircle size={16}/></button>
                      </>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageSize={10} total={total} onPage={setPage} />
          </>
        )}
      </div>

      {/* View Modal */}
      {modal==='view' && selected && (
        <Modal title={selected.orderNumber} onClose={() => setModal(null)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="label block">Supplier</span><span className="font-semibold text-gray-800 dark:text-gray-200">{selected.supplierName}</span></div>
              <div><span className="label block">Status</span><span className={STATUS[selected.status]}>{selected.status}</span></div>
              <div><span className="label block">Date</span><span className="text-gray-700 dark:text-gray-300">{new Date(selected.orderDate).toLocaleDateString('en-IN')}</span></div>
              <div><span className="label block">Total</span><span className="font-bold text-gray-900 dark:text-white">{fmt(selected.totalAmount)}</span></div>
            </div>
            {selected.notes && <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">{selected.notes}</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Unit Cost</th>
                  <th className="table-header">Subtotal</th>
                </tr></thead>
                <tbody>
                  {selected.items?.map(i => (
                    <tr key={i.id}>
                      <td className="table-cell">{i.productName}</td>
                      <td className="table-cell">{i.quantity}</td>
                      <td className="table-cell">{fmt(i.unitCost)}</td>
                      <td className="table-cell font-semibold">{fmt(i.quantity*i.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isAdmin && selected.status==='Pending' && (
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button onClick={() => handleReceive(selected.id)} className="btn-primary flex-1 justify-center"><CheckCircle size={16}/>Mark Received</button>
                <button onClick={() => handleCancel(selected.id)} className="btn-danger">Cancel Order</button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {modal==='add' && (
        <Modal title="New Purchase Order" onClose={() => setModal(null)} size="xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Supplier *</label>
                <select className="input" required value={form.supplierId} onChange={e => setForm(p=>({...p,supplierId:e.target.value}))}>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Optional notes" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Order Items *</label>
                <button type="button" onClick={addItem} className="btn-secondary py-1.5 px-3 text-xs"><Plus size={13}/>Add Item</button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <select className="input flex-1 text-sm py-2" required value={item.productId} onChange={e => updateItem(i,'productId',e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input className="input w-full sm:w-24 text-sm py-2" type="number" min="1" required placeholder="Qty" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} />
                      <input className="input w-full sm:w-28 text-sm py-2" type="number" min="0" step="0.01" required placeholder="Unit Cost" value={item.unitCost} onChange={e => updateItem(i,'unitCost',e.target.value)} />
                      {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex-shrink-0"><Trash2 size={15}/></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {totalCalc > 0 && (
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Order Total</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{fmt(totalCalc)}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Creating…' : 'Create Order'}</button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
