import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { apiService } from '../services/api';
import { Shield, ShoppingBag, Settings, Lock, User as UserIcon, Eye, EyeOff, ChevronRight } from 'lucide-react';

type RoleKey = 'officer' | 'retailer' | 'admin';

interface RoleConfig {
  key: RoleKey;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  activeBg: string;
  badgeColor: string;
  demoUser: string;
  demoPass: string;
}

const ROLES: RoleConfig[] = [
  {
    key: 'admin',
    label: 'Administrator',
    subtitle: 'System Control',
    description: 'Full access — user management, analytics & system configuration',
    icon: <Settings className="w-7 h-7" />,
    accentColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    activeBg: 'bg-violet-600',
    badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
    demoUser: 'admin',
    demoPass: 'admin123',
  },
  {
    key: 'officer',
    label: 'Enforcement Officer',
    subtitle: 'Field Operations',
    description: 'Conduct compliance scans, generate enforcement reports & manage cases',
    icon: <Shield className="w-7 h-7" />,
    accentColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    activeBg: 'bg-[#1e3a5f]',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    demoUser: 'officer',
    demoPass: 'officer123',
  },
  {
    key: 'retailer',
    label: 'Retailer / Seller',
    subtitle: 'Seller Portal',
    description: 'Check your product compliance, upload labels & get remediation guidance',
    icon: <ShoppingBag className="w-7 h-7" />,
    accentColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    activeBg: 'bg-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    demoUser: 'retailer',
    demoPass: 'retailer123',
  },
];

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('officer');
  const [username, setUsername] = useState('officer');
  const [password, setPassword] = useState('officer123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const activeRole = ROLES.find(r => r.key === selectedRole)!;

  const handleRoleSelect = (role: RoleConfig) => {
    setSelectedRole(role.key);
    setUsername(role.demoUser);
    setPassword(role.demoPass);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await apiService.login(username.trim(), password, selectedRole);
      login(response.user);
      // Route based on the role the server actually assigned, not just
      // whichever tile was selected in the UI.
      if (response.user.role === 'admin') navigate('/admin/dashboard');
      else if (response.user.role === 'retailer') navigate('/retailer/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Login failed. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-[#0d2340] via-[#1e3a5f] to-[#0f1d2f] flex-col justify-between p-10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full border-2 border-white"></div>
          <div className="absolute top-32 left-20 w-48 h-48 rounded-full border border-white"></div>
          <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full border-2 border-amber-400"></div>
          <div className="absolute bottom-20 right-20 w-56 h-56 rounded-full border border-amber-400"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
              <span className="text-2xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-2xl tracking-tight">MetroVigil</h1>
              <p className="text-amber-400 text-xs font-semibold tracking-wider uppercase">AI Compliance Engine</p>
            </div>
          </div>

          <div className="space-y-1 mt-12">
            <h2 className="text-white text-4xl font-bold leading-tight">
              AI-Powered Legal<br />Metrology Compliance
            </h2>
            <p className="text-blue-200 text-lg mt-3 leading-relaxed">
              Automated enforcement of Legal Metrology (Packaged Commodities) Rules, 2011
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: '🔍', text: 'AI-powered PDP & OCR label scanning' },
            { icon: '📋', text: 'Rules 6, 7, 8 & 18 automated validation' },
            { icon: '📄', text: 'Instant PDF/DOCX compliance reports' },
            { icon: '📊', text: 'Real-time enforcement analytics' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 text-blue-100">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm">{f.text}</span>
            </div>
          ))}

          <div className="pt-6 border-t border-white/10">
            <p className="text-blue-300 text-xs">Ministry of Consumer Affairs, Food & Public Distribution</p>
            <p className="text-blue-400 text-xs mt-1">Smart India Hackathon 2026 | Problem Statement SIH26035</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="text-3xl">⚖️</span>
            <div>
              <h1 className="text-[#1e3a5f] font-extrabold text-xl">MetroVigil</h1>
              <p className="text-amber-600 text-xs font-semibold">AI-Powered Legal Metrology Compliance Engine</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in to your portal</h2>
            <p className="text-gray-500 text-sm mt-1">Select your role to access the appropriate dashboard</p>
          </div>

          {/* Role Selector Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {ROLES.map(role => {
              const isActive = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? `${role.activeBg} text-white border-transparent shadow-lg scale-105`
                      : `bg-white ${role.borderColor} text-gray-700 hover:${role.bgColor} hover:border-opacity-70`
                  }`}
                >
                  <div className={`mb-2 ${isActive ? 'text-white' : role.accentColor}`}>
                    {role.icon}
                  </div>
                  <span className="text-xs font-bold leading-tight">{role.label}</span>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {role.subtitle}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Role description */}
          <div className={`mb-6 px-4 py-3 rounded-lg border ${activeRole.bgColor} ${activeRole.borderColor}`}>
            <p className={`text-sm font-medium ${activeRole.accentColor}`}>{activeRole.description}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username / Official ID
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all bg-white text-sm"
                  placeholder="Enter your ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all bg-white text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 font-bold rounded-lg transition-all flex justify-center items-center gap-2 text-white shadow-sm ${
                loading ? 'opacity-70 cursor-not-allowed bg-gray-400' : `${activeRole.activeBg} hover:opacity-90`
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>Login <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Ministry of Consumer Affairs, Govt. of India • Smart India Hackathon 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;



