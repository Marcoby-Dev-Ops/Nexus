import React from 'react';
import { cn } from '@/lib/utils';

export interface Column {
  Header: string;
  accessor: string;
}

export interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

/**
 * Simple table component for 1.0
 */
const Table: React.FC<TableProps> = ({ columns, data, className }) => {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider"
              >
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50">
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                >
                  {row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table; 