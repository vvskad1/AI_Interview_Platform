import React from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  rowKey?: keyof T | ((record: T) => string | number);
  onRowClick?: (record: T, index: number) => void;
  className?: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  onSort,
  sortKey,
  sortDirection,
  rowKey = 'id',
  onRowClick,
  className = ''
}: TableProps<T>) => {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index;
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortKey === key && sortDirection === 'asc') {
      direction = 'desc';
    }
    onSort(key, direction);
  };

  const getCellValue = (record: T, column: Column<T>) => {
    const key = column.key as keyof T;
    return record[key];
  };

  if (loading) {
    return (
      <div className={`table-container ${className}`}>
        <div className="loading">
          <div className="spinner spinner-lg" />
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`table-container ${className}`}>
        <EmptyState
          title="No Data"
          description={emptyText}
        />
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                style={{ width: column.width }}
                className={column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  {column.sortable && (
                    <div className="flex flex-col ml-2">
                      <ChevronUp 
                        size={12} 
                        className={`
                          ${sortKey === column.key && sortDirection === 'asc' 
                            ? 'text-primary' 
                            : 'text-gray-300'
                          }
                        `} 
                      />
                      <ChevronDown 
                        size={12} 
                        className={`
                          -mt-1
                          ${sortKey === column.key && sortDirection === 'desc' 
                            ? 'text-primary' 
                            : 'text-gray-300'
                          }
                        `} 
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <tr
              key={getRowKey(record, index)}
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(record, index)}
            >
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {column.render 
                    ? column.render(getCellValue(record, column), record, index)
                    : getCellValue(record, column)
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <MoreHorizontal size={48} />,
  title = 'No Data',
  description = 'There is no data to display.',
  action
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export { Table, EmptyState };
export type { Column, TableProps };
export default Table;