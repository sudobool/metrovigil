import React, { useState, useEffect } from 'react';
import { Scan } from '../types';
import ScanResultCard from '../components/ScanResultCard';
import { apiService } from '../services/api';
import { Filter, Search } from 'lucide-react';

const HistoryPage: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        try {
          const data = await apiService.getScans(0, 50, filter === 'all' ? undefined : filter);
          setScans(data.scans);
        } catch {
          console.log('Using mock data — backend not available');
          const mockScans: Scan[] = [
            { id: 1, original_filename: 'sample_1_compliant.png', product_name: 'Himalayan Premium Almonds (500g)', status: 'completed', compliance_status: 'compliant', compliance_score: 100, created_at: new Date().toISOString() },
            { id: 2, original_filename: 'sample_2_missing_mrp.png', product_name: 'Golden Harvest Wheat Atta (5kg)', status: 'completed', compliance_status: 'partial', compliance_score: 85, created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: 3, original_filename: 'sample_3_missing_mfg_address.png', product_name: 'Royal Taste Bhujia Namkeen (200g)', status: 'completed', compliance_status: 'partial', compliance_score: 85, created_at: new Date(Date.now() - 172800000).toISOString() },
            { id: 4, original_filename: 'sample_4_missing_origin_import.png', product_name: 'Swiss Luxury Chocolate Bar (100g)', status: 'completed', compliance_status: 'partial', compliance_score: 85, created_at: new Date(Date.now() - 259200000).toISOString() },
          ];
          setScans(mockScans);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [filter]);

  const filteredScans = scans.filter(scan => {
    const matchesFilter = filter === 'all' || scan.compliance_status === filter;
    const matchesSearch = (scan.product_name || scan.original_filename).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
          <p className="text-gray-500">View and manage all previous compliance checks.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg border bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="partial">Partial</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filteredScans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScans.map(scan => (
            <ScanResultCard key={scan.id} scan={scan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900">No scans found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
