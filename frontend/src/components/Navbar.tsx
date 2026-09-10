import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Menu, X, LayoutDashboard, Scan, History,
  LogOut, Shield, ShoppingBag, Settings
} from 'lucide-react';
import { apiService } from '../services/api';

const ROLE_CONFIG = {
  officer: {
    label: 'Enforcement Officer',
    badge: 'bg-blue-700 text-blue-100 border-blue-600',
    icon: <Shield className="w-4 h-4" />,
    links: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'New Scan', path: '/scan', icon: Scan },
      { name: 'History', path: '/history', icon: History },
    ],
  },
  admin: {
    label: 'Administrator',
    badge: 'bg-violet-700 text-violet-100 border-violet-600',
    icon: <Settings className="w-4 h-4" />,
    links: [
      { name: 'Admin Panel', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'New Scan', path: '/scan', icon: Scan },
      { name: 'History', path: '/history', icon: History },
    ],
  },
  retailer: {
    label: 'Retailer',
    badge: 'bg-emerald-700 text-emerald-100 border-emerald-600',
    icon: <ShoppingBag className="w-4 h-4" />,
    links: [
      { name: 'My Products', path: '/retailer/dashboard', icon: LayoutDashboard },
      { name: 'New Scan', path: '/scan', icon: Scan },
      { name: 'History', path: '/history', icon: History },
    ],
  },
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    apiService.logout();
    logout();
    navigate('/');
  };

  const roleKey = user?.role ?? 'officer';
  const config = ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.officer;
  const navLinks = config.links;

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={navLinks[0].path} className="flex-shrink-0 flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg leading-tight tracking-wide">MetroVigil</h1>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">AI ENGINE</span>
                </div>
                <p className="text-xs text-blue-200 hidden sm:block">AI-Powered Legal Metrology Compliance Engine</p>
              </div>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.badge}`}>
                {config.icon}
                {config.label}
              </div>
              <div className="flex flex-col ml-1">
                <span className="text-sm font-medium leading-none">{user?.username}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800 focus:outline-none"
            >
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {link.name}
                </Link>
              );
            })}
            <div className="px-3 py-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold ${config.badge}`}>
                {config.icon}
                {config.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
