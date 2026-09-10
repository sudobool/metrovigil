import React from 'react';
import { Violation } from '../types';
import { AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';


interface ViolationCardProps {
  violation: Violation;
}

const ViolationCard: React.FC<ViolationCardProps> = ({ violation }) => {
  const severityConfig = {
    critical: {
      color: 'border-red-500',
      bg: 'bg-red-50',
      icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800'
    },
    major: {
      color: 'border-orange-500',
      bg: 'bg-orange-50',
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    minor: {
      color: 'border-yellow-400',
      bg: 'bg-yellow-50',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800'
    }
  };

  const config = severityConfig[violation.severity] || severityConfig.minor;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4`}>
      <div className={`border-l-4 ${config.color} p-4 sm:p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${config.badge}`}>
                {violation.severity}
              </span>
              <span className="text-sm font-semibold text-gray-500">
                Rule {violation.rule_number}
              </span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {violation.rule_description}
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              {violation.details}
            </p>
          </div>
        </div>
        
        {violation.suggestion && (
          <div className="bg-blue-50 rounded-md p-3 flex items-start gap-3 mt-2 border border-blue-100">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Suggestion for Remediation</p>
              <p className="text-sm text-blue-800 mt-1">{violation.suggestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple AlertOctagon since it might not be in lucide-react standard
const AlertOctagon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default ViolationCard;
