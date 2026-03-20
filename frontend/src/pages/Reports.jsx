import { useEffect, useState } from 'react';
import { reportsApi, downloadBlob } from '../services/api';
import { PageHeader, Spinner } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Download, TrendingUp, Package, DollarSign, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

export default function Reports() {
  const [inv, setInv]         = useState(null);
  const [stock, setStock]     = useState(null);
  const [days, setDays]       = useState(30);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([reportsApi.inventory(), reportsApi.stockMovements(days)])
      .then(([i, s]) => { setInv(i.data); setStock(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res  = type === 'products' ? await reportsApi.exportProducts() : await reportsApi.exportStockLogs();
      const name = type === 'products' ? `Products_${new Date().toISOString().slice(0,10)}.xlsx` : `StockLogs_${new Date().toISOString().slice(0,10)}.xlsx`;
      downloadBlob(res.data, name);
      toast.success('Downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  if (loading) return <Spinner />;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Inventory insights and data exports" />

      {/* Summary cards */}
      {inv && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label:'Total Products',   value: inv.summary.totalProducts,               icon: Package,      color:'text-blue-600',   bg:'bg-blue-50 dark:bg-blue-900/20' },
            { label:'Inventory Value',  value: fmt(inv.summary.totalValue),             icon: DollarSign,   color:'text-emerald-600', bg:'bg-emerald-50 dark:bg-emerald-900/20' },
            { label:'Low Stock',        value: inv.summary.lowStockCount,               icon: AlertTriangle,color:'text-amber-600',   bg:'bg-amber-50 dark:bg-amber-900/20' },
            { label:'Out of Stock',     value: inv.summary.outOfStockCount,             icon: TrendingUp,   color:'text-red-600',     bg:'bg-red-50 dark:bg-red-900/20' },
          ].map(c => (
            <div key={c.label} className="card p-4 sm:p-5 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                <c.icon size={18} className={c.color} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{c.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => handleExport('products')} disabled={exporting === 'products'} className="btn-primary">
          <Download size={16} />
          {exporting === 'products' ? 'Exporting…' : 'Export Products (.xlsx)'}
        </button>
        <button onClick={() => handleExport('stock')} disabled={exporting === 'stock'} className="btn-secondary">
          <Download size={16} />
          {exporting === 'stock' ? 'Exporting…' : 'Export Stock Logs (.xlsx)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Category breakdown pie */}
        {inv && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Inventory by Category</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inv.byCategory} dataKey="totalValue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {inv.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {inv.byCategory.map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-400">{c.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-info">{c.productCount} products</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(c.totalValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock movement chart */}
        {stock && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Stock Movements</h3>
              <select value={days} onChange={e => setDays(+e.target.value)} className="input w-auto py-1.5 text-xs">
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stock.daily} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="inQty"  name="Stock In"  fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="outQty" name="Stock Out" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-400">Total In</p>
                <p className="text-sm font-bold text-emerald-600">+{stock.totalIn}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-400">Total Out</p>
                <p className="text-sm font-bold text-red-500">-{stock.totalOut}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top products table */}
      {inv && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Products by Value</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">#</th>
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Price</th>
                <th className="table-header">Total Value</th>
              </tr></thead>
              <tbody>
                {inv.topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="table-cell"><span className="badge-info">{p.category}</span></td>
                    <td className="table-cell text-gray-600 dark:text-gray-400">{p.quantity}</td>
                    <td className="table-cell text-gray-600 dark:text-gray-400">{fmt(p.price)}</td>
                    <td className="table-cell font-bold text-gray-900 dark:text-gray-100">{fmt(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
