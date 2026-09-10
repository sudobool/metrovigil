import React from 'react';

interface ComplianceScoreProps {
  score: number | null;
  status: 'compliant' | 'non_compliant' | 'partial' | null;
  size?: 'sm' | 'md' | 'lg';
}

const ComplianceScore: React.FC<ComplianceScoreProps> = ({ score, status, size = 'md' }) => {
  const displayScore = score ?? 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  let color = 'text-gray-300';
  let statusText = 'Unknown';
  let emoji = '❓';

  if (status === 'compliant') {
    color = 'text-emerald-500';
    statusText = 'Compliant';
    emoji = '✅';
  } else if (status === 'non_compliant') {
    color = 'text-red-500';
    statusText = 'Non-Compliant';
    emoji = '❌';
  } else if (status === 'partial') {
    color = 'text-amber-500';
    statusText = 'Partially Compliant';
    emoji = '⚠️';
  }

  const dimensions = {
    sm: { width: 80, stroke: 6, text: 'text-xl' },
    md: { width: 120, stroke: 8, text: 'text-3xl' },
    lg: { width: 160, stroke: 10, text: 'text-4xl' },
  };

  const { width, stroke, text } = dimensions[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width, height: width }}>
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-100"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${text} text-gray-700`}>
            {score !== null ? `${Math.round(score)}%` : 'N/A'}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <span className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          {statusText} {emoji}
        </span>
      </div>
    </div>
  );
};

export default ComplianceScore;
