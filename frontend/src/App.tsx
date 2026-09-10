import { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from './types';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RetailerDashboardPage from './pages/RetailerDashboardPage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import ReportViewPage from './pages/ReportViewPage';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

function getDefaultRoute(user: User | null): string {
  if (!user) return '/';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'retailer') return '/retailer/dashboard';
  return '/dashboard';
}

// Officer/shared — standard MetroVigil Navbar layout
const OfficerProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f0f4f8] p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

// Admin / Retailer — manage their own navbar
const StandaloneProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return <Outlet />;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/" element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <LoginPage />} />

        {/* Admin - dark control center */}
        <Route element={<StandaloneProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>

        {/* Retailer - green seller portal */}
        <Route element={<StandaloneProtectedRoute />}>
          <Route path="/retailer/dashboard" element={<RetailerDashboardPage />} />
        </Route>

        {/* Officer + shared routes - standard MetroVigil Navbar */}
        <Route element={<OfficerProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/scan/:id" element={<ReportViewPage />} />
        </Route>

        <Route path="*" element={<Navigate to={getDefaultRoute(user)} replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
