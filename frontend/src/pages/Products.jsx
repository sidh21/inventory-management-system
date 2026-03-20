import { useEffect, useState, useCallback } from 'react';
import { productsApi, categoriesApi, suppliersApi } from '../services/api';
import { Modal, PageHeader, EmptyState, Spinner, SearchInput, Pagination } from '../components/UI';
import { useAuth } from '../context/AppContext';
import { Plus, Edit2, Trash2, Package, AlertTriangle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', sku:'', description:'', price:'', quantity:'', reorderLevel:10, categoryId:'', supplierId:'', isActive:true };

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [lowStock, setLowStock]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ search, categoryId: catFilter || undefined, lowStock: lowStock || undefined, page, pageSize: 10 });
      setProducts(res.data.items); setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [search, catFilter, lowStock, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data));
    suppliersApi.getAll().then(r => setSuppliers(r.data));
  }, []);

  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p) => { setSelected(p); setForm({ name:p.name, sku:p.sku||'', description:p.description||'', price:p.price, quantity:p.quantity, reorderLevel:p.reorderLevel, categoryId:p.categoryId, supplierId:p.supplierId||'', isActive:p.isActive }); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity), reorderLevel: parseInt(form.reorderLevel), categoryId: parseInt(form.categoryId), supplierId: form.supplierId ? parseInt(form.supplierId) : null };
      if (modal === 'add') { await productsApi.create(payload); toast.success('Product created!'); }
      else { await productsApi.update(selected.id, payload); toast.success('Product updated!'); }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Archive "${p.name}"?`)) return;
    try { await productsApi.delete(p.id); toast.success('Archived'); load(); }
    catch { toast.error('Error'); }
  };

  const f = (v) => setForm(prev => ({ ...prev, ...v }));

  return (
    <div>
      <PageHeader
        title="Products" subtitle={`${total} products`}
        action={isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} />
            <span className="hidden xs:inline">Add Product</span>
            <span className="xs:hidden">Add</span>
          </button>
        )}
      />

      {/* Search + filter row */}
      <div className="flex gap-2 mb-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search products..." />
        <button onClick={() => setShowFilters(!showFilters)}
          className={`icon-btn border flex-shrink-0 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
          <Filter size={16} />
        </button>
      </div>

      {/* Collapsible filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="input w-auto flex-1 min-w-[140px]">
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer px-1">
            <input type="checkbox" checked={lowStock} onChange={e => { setLowStock(e.target.checked); setPage(1); }} className="rounded w-4 h-4" />
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            Low stock only
          </label>
        </div>
      )}

      {/* Products table */}
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : products.length === 0 ? (
          <EmptyState icon={Package} title="No products found" description="Add your first product or adjust your filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">SKU</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Price</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header">Status</th>
                  {isAdmin && <th className="table-header">Actions</th>}
                </tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</p>
                          {p.supplierName && <p className="text-xs text-gray-400 mt-0.5">{p.supplierName}</p>}
                        </div>
                      </td>
                      <td className="table-cell"><span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{p.sku || '—'}</span></td>
                      <td className="table-cell"><span className="badge-info">{p.categoryName}</span></td>
                      <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${p.isLowStock ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{p.quantity}</span>
                          {p.isLowStock && <AlertTriangle size={12} className="text-amber-500" />}
                        </div>
                        <p className="text-[10px] text-gray-400">Min: {p.reorderLevel}</p>
                      </td>
                      <td className="table-cell">
                        {p.isActive ? <span className="badge-success">Active</span> : <span className="badge-gray">Archived</span>}
                      </td>
                      {isAdmin && (
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete(p)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {products.map(p => (
                <div key={p.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                      {p.isLowStock && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="badge-info">{p.categoryName}</span>
                      {p.isActive ? <span className="badge-success">Active</span> : <span className="badge-gray">Archived</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">₹{Number(p.price).toLocaleString('en-IN')}</span>
                        <span className={`text-xs font-semibold ${p.isLowStock ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                          Stock: {p.quantity}
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={15}/></button>
                          <button onClick={() => handleDelete(p)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={15}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} pageSize={10} total={total} onPage={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={closeModal} size="lg">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Product Name *</label>
              <input className="input" required value={form.name} onChange={e => f({ name:e.target.value })} placeholder="e.g. HP Laptop 15" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">SKU</label>
                <input className="input" value={form.sku} onChange={e => f({ sku:e.target.value })} placeholder="HP-LAP-001" />
              </div>
              <div>
                <label className="label">Price (₹) *</label>
                <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={e => f({ price:e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="label">{modal === 'add' ? 'Initial Stock *' : 'Reorder Level *'}</label>
                <input className="input" type="number" min="0" required value={modal === 'add' ? form.quantity : form.reorderLevel} onChange={e => f(modal === 'add' ? { quantity:e.target.value } : { reorderLevel:e.target.value })} />
              </div>
              {modal === 'add' && (
                <div>
                  <label className="label">Reorder Level</label>
                  <input className="input" type="number" min="0" value={form.reorderLevel} onChange={e => f({ reorderLevel:e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Category *</label>
                <select className="input" required value={form.categoryId} onChange={e => f({ categoryId:e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Supplier</label>
                <select className="input" value={form.supplierId} onChange={e => f({ supplierId:e.target.value })}>
                  <option value="">No supplier</option>
                  {suppliers.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => f({ description:e.target.value })} placeholder="Optional description" />
            </div>
            {modal === 'edit' && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => f({ isActive:e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active product</span>
              </label>
            )}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                {saving ? 'Saving…' : modal === 'add' ? 'Create Product' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
