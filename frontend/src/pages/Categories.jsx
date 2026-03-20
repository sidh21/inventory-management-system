import { useEffect, useState, useCallback } from 'react';
import { categoriesApi } from '../services/api';
import { Modal, PageHeader, EmptyState, Spinner } from '../components/UI';
import { useAuth } from '../context/AppContext';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const { isAdmin } = useAuth();
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ name:'', description:'' });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await categoriesApi.getAll(); setCats(r.data); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ name:'', description:'' }); setModal('add'); };
  const openEdit = (c) => { setSelected(c); setForm({ name:c.name, description:c.description||'' }); setModal('edit'); };
  const close    = () => { setModal(null); setSelected(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await categoriesApi.create(form); toast.success('Category created!'); }
      else { await categoriesApi.update(selected.id, form); toast.success('Updated!'); }
      close(); load();
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await categoriesApi.delete(c.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete — has products'); }
  };

  const COLORS = ['blue','purple','green','amber','red','pink'];
  const colorClasses = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    pink:   'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle={`${cats.length} categories`}
        action={isAdmin && <button onClick={openAdd} className="btn-primary"><Plus size={16}/>Add</button>} />

      {loading ? <Spinner /> : cats.length === 0 ? (
        <EmptyState icon={Tag} title="No categories" description="Create your first product category." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cats.map((c, i) => {
            const color = colorClasses[COLORS[i % COLORS.length]];
            return (
              <div key={c.id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Tag size={17} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={14}/></button>
                      <button onClick={() => handleDelete(c)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{c.name}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2">{c.description || 'No description'}</p>
                <span className="badge-info">{c.productCount} products</span>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={close} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Electronics" /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} /></div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : modal === 'add' ? 'Create' : 'Save'}</button>
              <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
