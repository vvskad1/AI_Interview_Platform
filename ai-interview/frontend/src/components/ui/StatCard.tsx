import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  iconVariant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  className?: string;
}

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  iconVariant = 'primary',
  loading = false,
  className = ''
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp size={12} />;
      case 'negative':
        return <TrendingDown size={12} />;
      default:
        return <Minus size={12} />;
    }
  };

  if (loading) {
    return (
      <div className={`stat-card ${className}`}>
        <div className="animate-pulse">
          <div className="stat-header mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className={`stat-icon ${iconVariant} w-8 h-8 bg-gray-200 rounded-lg`}></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        {icon && (
          <div className={`stat-icon ${iconVariant}`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="stat-value">
        {formatValue(value)}
      </div>
      
      {change && (
        <div className={`stat-change ${change.type}`}>
          {getChangeIcon(change.type)}
          <span>
            {change.value > 0 && '+'}
            {change.value}%
          </span>
          {change.label && (
            <span className="text-gray-500 font-normal ml-1">
              {change.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`stats-grid ${className}`}>
      {children}
    </div>
  );
};

export { StatCard, StatsGrid };
export default StatCard;