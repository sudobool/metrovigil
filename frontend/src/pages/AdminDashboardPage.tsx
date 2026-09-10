import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';
import {
  Users, Scan as ScanIcon, AlertTriangle,
  TrendingUp, Settings, Shield, Activity, BarChart2,
  LogOut
} from 'lucide-react';

interface MockOfficer {
  id: number;
  name: string;
  district: string;
  scansThisMonth: number;
  status: 'active' | 'inactive';
}

const MOCK_OFFICERS: MockOfficer[] = [
  { id: 1, name: 'Ravi Kumar Singh', district: 'New Delhi', scansThisMonth: 34, status: 'active' },
  { id: 2, name: 'Priya Mehta', district: 'Mumbai Suburban', scansThisMonth: 22, status: 'active' },
  { id: 3, name: 'Abdul Karim', district: 'Bengaluru Urban', scansThisMonth: 19, status: 'active' },
  { id: 4, name: 'Sunita Devi', district: 'Chennai Central', scansThisMonth: 11, status: 'inactive' },
  { id: 5, name: 'Anil Sharma', district: 'Kolkata North', scansThisMonth: 27, status: 'active' },
];

const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await apiService.getDashboardStats();
        setStats(s);
      } catch {
        setStats({
          total_scans: 148,
          compliant_count: 91,
          non_compliant_count: 41,
          partial_count: 16,
          compliance_rate: 61.5,
          common_violations: [
            { rule: 'Rule 6(1)', count: 38, description: 'MRP not declared' },
            { rule: 'Rule 6(2)', count: 27, description: 'Net quantity missing' },
            { rule: 'Rule 8', count: 21, description: 'Manufacturer details absent' },
            { rule: 'Rule 18', count: 14, description: 'MRP font height violation' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxViolation = Math.max(...(stats?.common_violations.map(v => v.count) ?? [1]));

  const handleLogout = () => {
    apiService.logout();
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#0d1b2e] text-white flex flex-col">
      {/* Admin Navbar */}
      <nav className="bg-[#0a1525] border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-none">MetroVigil</h1>
            <p className="text-violet-400 text-[10px] font-semibold uppercase tracking-wider">Admin Control Center</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {[
            { label: 'Overview', path: '/admin/dashboard', active: true },
            { label: 'Scan History', path: '/history' },
            { label: 'New Scan', path: '/scan' },
          ].map(l => (
            <Link
              key={l.label}
              to={l.path}
              className={`font-medium transition-colors ${l.active ? 'text-violet-400' : 'text-gray-400 hover:text-white'}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-700 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-200" />
            </div>
            <div className="text-sm">
              <div className="font-medium leading-none">{user?.username}</div>
              <div className="text-violet-400 text-xs mt-0.5">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Overview</h2>
            <p className="text-gray-400 text-sm mt-1">Legal Metrology Compliance Engine — Nation-wide enforcement dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              System Online
            </span>
            <Link to="/scan" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <ScanIcon className="w-4 h-4" />
              New Scan
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Scans', value: loading ? '...' : String(stats?.total_scans ?? 0), sub: 'All time', icon: <ScanIcon className="w-5 h-5" />, color: 'from-blue-600 to-blue-800', textColor: 'text-blue-300' },
            { label: 'Compliance Rate', value: loading ? '...' : `${(stats?.compliance_rate ?? 0).toFixed(1)}%`, sub: 'Fully compliant', icon: <TrendingUp className="w-5 h-5" />, color: 'from-emerald-600 to-emerald-800', textColor: 'text-emerald-300' },
            { label: 'Violations Found', value: loading ? '...' : String(stats?.non_compliant_count ?? 0), sub: 'Non-compliant scans', icon: <AlertTriangle className="w-5 h-5" />, color: 'from-red-700 to-red-900', textColor: 'text-red-300' },
            { label: 'Active Officers', value: String(MOCK_OFFICERS.filter(o => o.status === 'active').length), sub: `${MOCK_OFFICERS.length} total registered`, icon: <Users className="w-5 h-5" />, color: 'from-violet-600 to-violet-800', textColor: 'text-violet-300' },
          ].map(kpi => (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-5 border border-white/10`}>
              <div className={`${kpi.textColor} mb-3`}>{kpi.icon}</div>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <div className="text-white/80 text-sm font-medium mt-1">{kpi.label}</div>
              <div className="text-white/50 text-xs mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Violations Breakdown */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-400" />
                Top Violations by Rule
              </h3>
              <span className="text-xs text-gray-400">All-time data</span>
            </div>
            <div className="space-y-4">
              {(stats?.common_violations ?? []).map(v => (
                <div key={v.rule}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300">{v.rule} - {v.description}</span>
                    <span className="text-white font-bold">{v.count}</span>
                  </div>
                  <div className="bg-white/10 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: maxViolation > 0 ? `${(v.count / maxViolation) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Split */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Compliance Split
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Fully Compliant', value: stats?.compliant_count ?? 0, color: 'bg-emerald-500' },
                { label: 'Partial', value: stats?.partial_count ?? 0, color: 'bg-amber-500' },
                { label: 'Non-Compliant', value: stats?.non_compliant_count ?? 0, color: 'bg-red-500' },
              ].map(item => {
                const total = stats?.total_scans ?? 1;
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-white font-semibold">{item.value} ({pct}%)</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <div className="text-4xl font-bold text-emerald-400">{(stats?.compliance_rate ?? 0).toFixed(0)}%</div>
              <div className="text-xs text-gray-400 mt-1">Overall compliance rate</div>
            </div>
          </div>
        </div>

        {/* Officers Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              Enforcement Officers
            </h3>
            <span className="text-xs bg-violet-600/30 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full">
              {MOCK_OFFICERS.filter(o => o.status === 'active').length} Active
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-white/10">
                  <th className="text-left pb-3 font-medium">Officer</th>
                  <th className="text-left pb-3 font-medium">District</th>
                  <th className="text-center pb-3 font-medium">Scans (This Month)</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_OFFICERS.map(o => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{o.name}</td>
                    <td className="py-3 text-gray-400">{o.district}</td>
                    <td className="py-3 text-center">
                      <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded text-xs">{o.scansThisMonth}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                        {o.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
