import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { apiService } from '../services/api';
import { Scan } from '../types';
import {
  ShoppingBag, Upload, CheckCircle, AlertCircle, Clock,
  FileText, TrendingUp, Star, LogOut, ChevronRight
} from 'lucide-react';

const TIPS = [
  { icon: '📦', title: 'MRP Declaration', desc: 'Ensure MRP is printed on the Principal Display Panel in font >= 3mm.' },
  { icon: '⚖️', title: 'Net Quantity', desc: 'State net quantity in standard units (g, ml, kg, l) as required by Rule 6.' },
  { icon: '🏭', title: 'Manufacturer Details', desc: 'Full name and address of manufacturer must be on the label per Rule 8.' },
  { icon: '📅', title: 'Date of Manufacture', desc: 'MFG/PKD date must be visible and in DD/MM/YYYY or MM/YYYY format.' },
];

const RetailerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getScans(0, 10);
        setScans(data.scans);
      } catch {
        setScans([
          { id: 1, original_filename: 'sample_1_compliant.png', status: 'completed', compliance_status: 'compliant', compliance_score: 100, product_name: 'Himalayan Premium Almonds', created_at: new Date().toISOString() },
          { id: 2, original_filename: 'sample_2_missing_mrp.png', status: 'completed', compliance_status: 'non_compliant', compliance_score: 65, product_name: 'Golden Harvest Wheat Atta', created_at: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const compliantCount = scans.filter(s => s.compliance_status === 'compliant').length;
  const avgScore = scans.length > 0 ? Math.round(scans.reduce((a, s) => a + (s.compliance_score ?? 0), 0) / scans.length) : 0;

  const handleLogout = () => {
    apiService.logout();
    logout();
    window.location.href = '/';
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'compliant': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'non_compliant': return 'bg-red-100 text-red-700 border-red-200';
      case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Retailer Navbar */}
      <nav className="bg-white border-b border-emerald-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-none">MetroVigil</h1>
            <p className="text-emerald-600 text-[10px] font-semibold uppercase tracking-wider">Seller Compliance Portal</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {[
            { label: 'My Products', path: '/retailer/dashboard', active: true },
            { label: 'New Scan', path: '/scan' },
            { label: 'History', path: '/history' },
          ].map(l => (
            <Link key={l.label} to={l.path} className={`font-medium transition-colors ${l.active ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-800'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900 leading-none">{user?.username}</div>
              <div className="text-emerald-600 text-xs mt-0.5">Retailer</div>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="absolute right-4 top-0 bottom-0 flex items-center opacity-10">
            <ShoppingBag className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Welcome back, {user?.username}!</h2>
            <p className="text-emerald-100 text-sm mb-4">Check your product compliance status and get instant guidance to fix any violations.</p>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Scan a New Label
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Products Scanned', value: loading ? '...' : String(scans.length), icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Avg. Compliance', value: loading ? '...' : `${avgScore}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Fully Compliant', value: loading ? '...' : String(compliantCount), icon: <CheckCircle className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-gray-500 text-sm mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">My Scanned Products</h3>
              <Link to="/history" className="text-sm text-emerald-600 font-medium hover:underline">View all</Link>
            </div>

            {loading ? (
              <div className="text-gray-400 text-sm text-center py-8">Loading...</div>
            ) : scans.length === 0 ? (
              <div className="text-center py-10">
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No scans yet</p>
                <p className="text-gray-400 text-sm mt-1">Upload your first product label to check compliance</p>
                <Link to="/scan" className="mt-4 inline-flex items-center gap-2 bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Label
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scans.map(scan => (
                  <Link
                    key={scan.id}
                    to={`/scan/${scan.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {scan.compliance_status === 'compliant'
                        ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                        : scan.compliance_status === 'non_compliant'
                        ? <AlertCircle className="w-5 h-5 text-red-500" />
                        : <Clock className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {scan.product_name ?? scan.original_filename}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {new Date(scan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-bold ${getScoreColor(scan.compliance_score)}`}>{scan.compliance_score ?? 0}%</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(scan.compliance_status)}`}>
                        {scan.compliance_status === 'compliant' ? 'Compliant' : scan.compliance_status === 'non_compliant' ? 'Violations' : 'Partial'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tips Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Compliance Tips
            </h3>
            <div className="space-y-4">
              {TIPS.map(tip => (
                <div key={tip.title} className="flex gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{tip.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                to="/scan"
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                Scan My Label
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailerDashboardPage;
