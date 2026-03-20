import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { Package, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@inventory.com', password: 'Admin@123' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/40 mb-4">
            <Package size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">InvenTrack</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inventory Management System</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@inventory.com"
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Demo credentials</p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/70 font-mono">admin@inventory.com / Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
