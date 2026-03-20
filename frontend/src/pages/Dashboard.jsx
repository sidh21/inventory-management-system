import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { StatCard, Spinner, PageHeader } from '../components/UI';
import { Package, Users, ShoppingCart, TrendingDown, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your inventory" />

      {/* Stats — 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="Products"    value={data.totalProducts}  icon={Package}     color="blue" />
        <StatCard label="Low Stock"   value={data.lowStockCount}  icon={TrendingDown} color="red"   sub="Need reorder" />
        <StatCard label="Suppliers"   value={data.totalSuppliers} icon={Users}        color="purple" />
        <StatCard label="Pending POs" value={data.pendingOrders}  icon={ShoppingCart} color="amber" />
      </div>

      {/* Total value — full width */}
      <div className="card p-4 sm:p-5 mb-4 sm:mb-6 flex items-center gap-4">
        <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Total Inventory Value</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white truncate">{fmt(data.totalInventoryValue)}</p>
        </div>
      </div>

      {/* Bottom section — stacked on mobile, 2 col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Low stock */}
        <div className="card">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Low Stock Items</h3>
            </div>
            <span className="badge-warning">{data.lowStockCount}</span>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">All levels healthy</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {data.lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 sm:px-5 py-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 truncate">{item.categoryName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-500">{item.quantity} left</p>
                    <p className="text-xs text-gray-400">Min: {item.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
            ) : data.recentActivity.map((log, i) => (
              <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${log.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  {log.type === 'IN'
                    ? <ArrowUpRight size={13} className="text-emerald-600" />
                    : <ArrowDownRight size={13} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{log.productName}</p>
                  <p className="text-[10px] text-gray-400 truncate">by {log.createdBy}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${log.type === 'IN' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {log.type === 'IN' ? '+' : ''}{log.quantity}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
