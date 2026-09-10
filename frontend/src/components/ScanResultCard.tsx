import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan } from '../types';
import { FileImage, Calendar, ChevronRight } from 'lucide-react';

interface ScanResultCardProps {
  scan: Scan;
}

const ScanResultCard: React.FC<ScanResultCardProps> = ({ scan }) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (scan.compliance_status) {
      case 'compliant':
        return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">Compliant</span>;
      case 'non_compliant':
        return <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Non-Compliant</span>;
      case 'partial':
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">Partial</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Pending</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getProductTitle = () => {
    if (scan.product_name && scan.product_name.trim().length > 0) {
      return scan.product_name;
    }
    const fn = scan.original_filename || '';
    if (fn.includes('sample_1')) return 'Himalayan Premium Almonds (500g)';
    if (fn.includes('sample_2')) return 'Golden Harvest Wheat Atta (5kg)';
    if (fn.includes('sample_3')) return 'Royal Taste Bhujia Namkeen (200g)';
    if (fn.includes('sample_4')) return 'Swiss Luxury Chocolate Bar (100g)';
    return fn.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || `Scan #${scan.id}`;
  };

  return (
    <div 
      onClick={() => navigate(`/scan/${scan.id}`)}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          <FileImage className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 line-clamp-1">
            {getProductTitle()}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(scan.created_at)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-xs text-gray-500 mb-1">Score</div>
          <div className="font-bold text-gray-900">{scan.compliance_score !== null ? `${Math.round(scan.compliance_score)}%` : '-'}</div>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge()}
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default ScanResultCard;
