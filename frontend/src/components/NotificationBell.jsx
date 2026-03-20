import { useEffect, useState, useRef } from 'react';
import { notificationsApi } from '../services/api';
import { Bell, X, CheckCheck, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_ICON = {
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  info:    <Info size={14} className="text-blue-500" />,
  success: <CheckCircle size={14} className="text-emerald-500" />,
  danger:  <XCircle size={14} className="text-red-500" />,
};

const TYPE_BG = {
  warning: 'bg-amber-50 dark:bg-amber-900/20',
  info:    'bg-blue-50 dark:bg-blue-900/20',
  success: 'bg-emerald-50 dark:bg-emerald-900/20',
  danger:  'bg-red-50 dark:bg-red-900/20',
};

export default function NotificationBell() {
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [count, setCount]   = useState(0);
  const ref                 = useRef(null);

  const loadCount = async () => {
    try { const r = await notificationsApi.unreadCount(); setCount(r.data.count); }
    catch {}
  };

  const loadAll = async () => {
    try { const r = await notificationsApi.getAll(); setNotifs(r.data); }
    catch {}
  };

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) loadAll();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifs(p => p.map(n => n.id === id ? { ...n, isRead:true } : n));
      setCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifs(p => p.map(n => ({ ...n, isRead:true })));
      setCount(0);
      toast.success('All marked as read');
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationsApi.delete(id);
      setNotifs(p => p.filter(n => n.id !== id));
      await loadCount();
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="icon-btn hover:bg-gray-100 dark:hover:bg-gray-700 relative"
      >
        <Bell size={18} className="text-gray-500 dark:text-gray-400" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
              {count > 0 && <span className="badge-danger text-[10px] py-0">{count} new</span>}
            </div>
            {count > 0 && (
              <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400">No notifications</p>
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!n.isRead ? TYPE_BG[n.type] || '' : ''}`}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
              >
                <div className="mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] || TYPE_ICON.info}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
