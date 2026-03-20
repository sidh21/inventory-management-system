import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../services/api';
import { Modal, PageHeader, EmptyState, Spinner } from '../components/UI';
import { useAuth } from '../context/AppContext';
import { Plus, Edit2, Trash2, Users, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', email:'', password:'', role:'Staff' };

export default function UserManagement() {
  const { user: me, isAdmin } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await usersApi.getAll(); setUsers(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (u) => { setSelected(u); setForm({ name:u.name, email:u.email, password:'', role:u.role }); setModal('edit'); };
  const close    = () => { setModal(null); setSelected(null); };
  const f        = (v) => setForm(p => ({ ...p, ...v }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') {
        await usersApi.register(form);
        toast.success('User created!');
      } else {
        await usersApi.update(selected.id, { name: form.name, role: form.role, password: form.password || undefined });
        toast.success('User updated!');
      }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (u.email === me?.email) { toast.error("Can't delete your own account"); return; }
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try { await usersApi.delete(u.id); toast.success('User deleted'); load(); }
    catch { toast.error('Error deleting user'); }
  };

  const roleColor = (role) => role === 'Admin' ? 'badge-danger' : 'badge-info';

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users`}
        action={<button onClick={openAdd} className="btn-primary"><Plus size={16}/>Add User</button>}
      />

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : users.length === 0 ? (
          <EmptyState icon={Users} title="No users" description="Add your first user." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Actions</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{u.name}</span>
                          {u.email === me?.email && <span className="badge-gray text-[10px]">You</span>}
                        </div>
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="table-cell">
                        <span className={roleColor(u.role)}>
                          {u.role === 'Admin' ? <Shield size={11}/> : <User size={11}/>}
                          {u.role}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(u)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={14}/></button>
                          {u.email !== me?.email && (
                            <button onClick={() => handleDelete(u)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(u => (
                <div key={u.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{u.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                      {u.email === me?.email && <span className="badge-gray text-[10px]">You</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <span className={`${roleColor(u.role)} mt-1 inline-flex`}>{u.role}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="icon-btn hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit2 size={15}/></button>
                    {u.email !== me?.email && (
                      <button onClick={() => handleDelete(u)} className="icon-btn hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={15}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add User' : 'Edit User'} onClose={close} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.name} onChange={e => f({ name:e.target.value })} placeholder="John Doe" />
            </div>
            {modal === 'add' && (
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" required value={form.email} onChange={e => f({ email:e.target.value })} placeholder="john@company.com" />
              </div>
            )}
            <div>
              <label className="label">{modal === 'add' ? 'Password *' : 'New Password (leave blank to keep)'}</label>
              <input className="input" type="password" required={modal === 'add'} value={form.password} onChange={e => f({ password:e.target.value })} placeholder={modal === 'add' ? 'Min 6 characters' : 'Leave blank to keep current'} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => f({ role:e.target.value })}>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Admin: full access · Staff: view + stock adjustments only
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                {saving ? 'Saving…' : modal === 'add' ? 'Create User' : 'Save Changes'}
              </button>
              <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
