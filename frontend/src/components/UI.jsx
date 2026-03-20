import { X } from 'lucide-react';

/* ─── Modal — bottom sheet on mobile, centered on desktop ── */
export function Modal({ title, onClose, children, size = 'md' }) {
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };
  return (
    <div className="modal-overlay p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`modal-box ${widths[size]}`}>
        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="icon-btn hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={17} className="text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
        {sub && <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Page Header ───────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={22} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>
    </div>
  );
}

/* ─── Spinner ───────────────────────────────────────────── */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12 sm:py-16">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

/* ─── Search Input ──────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full sm:w-64">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </div>
  );
}

/* ─── Pagination ────────────────────────────────────────── */
export function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 1);
  const end   = Math.min(totalPages, start + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex flex-col xs:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[32px] min-w-[48px]">
          Prev
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[32px] min-w-[32px] ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[32px] min-w-[48px]">
          Next
        </button>
      </div>
    </div>
  );
}
