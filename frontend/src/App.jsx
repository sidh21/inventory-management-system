import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, ThemeProvider, useAuth } from './context/AppContext';
import Layout          from './components/Layout';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Products        from './pages/Products';
import Suppliers       from './pages/Suppliers';
import Categories      from './pages/Categories';
import Stock           from './pages/Stock';
import PurchaseOrders  from './pages/PurchaseOrders';
import Reports         from './pages/Reports';
import UserManagement  from './pages/UserManagement';
import AuditLogs       from './pages/AuditLogs';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '13px', fontFamily: 'Plus Jakarta Sans, sans-serif' },
            }}
          />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index             element={<Dashboard />} />
              <Route path="products"   element={<Products />} />
              <Route path="stock"      element={<Stock />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="suppliers"  element={<Suppliers />} />
              <Route path="categories" element={<Categories />} />
              <Route path="reports"    element={<Reports />} />
              <Route path="users"      element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
              <Route path="audit-logs" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
