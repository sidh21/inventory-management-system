import { useEffect, useState, useCallback } from 'react';
import { auditLogsApi } from '../services/api';
import { PageHeader, EmptyState, Spinner, Pagination } from '../components/UI';
import { ClipboardList } from 'lucide-react';

const ACTION_BADGE = {
  CREATE: 'badge-success',
  UPDATE: 'badge-info',
  DELETE: 'badge-danger',
  LOGIN:  'badge-gray',
};

export default function AuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity]   = useState('');
  const [action, setAction]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await auditLogsApi.getAll({ entity: entity || undefined, action: action || undefined, page, pageSize: 20 });
      setLogs(r.data.items); setTotal(r.data.total);
    } finally { setLoading(false); }
  }, [entity, action, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle={`${total} entries — full activity trail`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All entities</option>
          {['Product','User','Supplier','Category','PurchaseOrder','Stock'].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All actions</option>
          {['CREATE','UPDATE','DELETE','LOGIN'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No audit logs" description="Actions will be tracked here." />
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Action</th>
                  <th className="table-header">Entity</th>
                  <th className="table-header">Entity ID</th>
                  <th className="table-header">Performed By</th>
                  <th className="table-header">IP Address</th>
                  <th className="table-header">Date & Time</th>
                </tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell">
                        <span className={ACTION_BADGE[log.action] || 'badge-gray'}>{log.action}</span>
                      </td>
                      <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{log.entity}</td>
                      <td className="table-cell">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{log.entityId || '—'}</span>
                      </td>
                      <td className="table-cell text-gray-600 dark:text-gray-400">{log.performedBy}</td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-gray-500">{log.ipAddress}</span>
                      </td>
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map(log => (
                <div key={log.id} className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={ACTION_BADGE[log.action] || 'badge-gray'}>{log.action}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{log.entity}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">by {log.performedBy} · {log.ipAddress}</p>
                </div>
              ))}
            </div>

            <Pagination page={page} pageSize={20} total={total} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
