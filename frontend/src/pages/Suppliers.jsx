// ─── SUPPLIERS ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { suppliersApi } from '../services/api';
import { Modal, PageHeader, EmptyState, Spinner, SearchInput } from '../components/UI';
import { useAuth } from '../context/AppContext';
import { Plus, Edit2, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_S = { name:'', email:'', phone:'', address:'', isActive:true };

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY_S);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await suppliersApi.getAll(); setSuppliers(r.data); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(EMPTY_S); setModal('add'); };
  const openEdit = (s) => { setSelected(s); setForm({ name:s.name, email:s.email||'', phone:s.phone||'', address:s.address||'', isActive:s.isActive }); setModal('edit'); };
  const close    = () => { setModal(null); setSelected(null); };
  const f        = (v) => setForm(p => ({ ...p, ...v }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await suppliersApi.create(form); toast.success('Supplier added!'); }
      else { await suppliersApi.update(selected.id, form); toast.success('Updated!'); }
      close(); load();
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Deactivate "${s.name}"?`)) return;
    try { await suppliersApi.delete(s.id); toast.success('Deactivated'); load(); }
    catch { toast.error('Error'); }
  };

  return (
    <div>
      <PageHeader title="Suppliers" subtitle={`${filtered.length} suppliers`}
        action={isAdmin && <button onClick={openAdd} className="btn-primary"><Plus size={16}/>Add</button>} />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." /></div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No suppliers" description="Add your first supplier." />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Status</th>
                  {isAdmin && <th className="table-header">Actions</th>}
                </tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{s.name}</td>
                      <td className="table-cell text-gray-500">{s.email || '—'}</td>
                      <td className="table-cell text-gray-500">{s.phone || '—'}</td>
                      <td className="table-cell">{s.isActive ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}</td>
                      {isAdmin && <td className="table-cell"><div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(s)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14}/></button>
                      </div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(s => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.name}</p>
                      {s.isActive ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}
                    </div>
                    {isAdmin && <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={15}/></button>
                      <button onClick={() => handleDelete(s)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={15}/></button>
                    </div>}
                  </div>
                  <div className="space-y-1 mt-2">
                    {s.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12}/>{s.email}</div>}
                    {s.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12}/>{s.phone}</div>}
                    {s.address && <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={12}/>{s.address}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Supplier' : 'Edit Supplier'} onClose={close}>
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="label">Company Name *</label><input className="input" required value={form.name} onChange={e => f({ name:e.target.value })} placeholder="ABC Technologies" /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => f({ email:e.target.value })} placeholder="contact@company.com" /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => f({ phone:e.target.value })} placeholder="+91 98765 43210" /></div>
            <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e => f({ address:e.target.value })} /></div>
            {modal === 'edit' && <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => f({ isActive:e.target.checked })} className="w-4 h-4 rounded"/><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span></label>}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : modal === 'add' ? 'Add Supplier' : 'Save'}</button>
              <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
