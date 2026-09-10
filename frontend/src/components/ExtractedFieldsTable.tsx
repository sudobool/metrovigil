import React from 'react';
import { ExtractedField } from '../types';
import { Check, X } from 'lucide-react';

interface ExtractedFieldsTableProps {
  fields: ExtractedField[];
}

const formatFieldName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ExtractedFieldsTable: React.FC<ExtractedFieldsTableProps> = ({ fields }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Field Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Extracted Value
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rule Ref
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fields.map((field, index) => (
            <tr key={field.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatFieldName(field.field_name)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {field.field_value ? (
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-800 break-words max-w-xs block">
                    {field.field_value}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">Not found</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {field.is_present ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <Check className="w-4 h-4" /> Present
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                    <X className="w-4 h-4" /> Missing
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${field.confidence > 80 ? 'bg-emerald-500' : field.confidence > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${field.confidence}%` }}
                    ></div>
                  </div>
                  <span>{Math.round(field.confidence)}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                  Rule {field.rule_reference}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExtractedFieldsTable;
