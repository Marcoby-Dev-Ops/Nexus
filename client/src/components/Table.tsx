import React from 'react';
import type { ReactNode } from 'react';
import PropTypes from 'prop-types';

/**
 * @interface TableColumn
 * @description Table column definition for the Table component.
 */
export interface TableColumn<T> {
  header: string;
  accessor: keyof T;
}

/**
 * @interface TableProps
 * @description Props for the Table component.
 */
export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
}

/**
 * @name Table
 * @description A table component for displaying tabular data.
 * @param {TableProps<T>} props - The props for the component.
 * @returns {React.ReactElement} The rendered Table component.
 */
export function Table<T extends object>({ columns, data, className = '' }: TableProps<T>): React.ReactElement {
  return (
    <table className={`min-w-full divide-y divide-border ${className}`}>
      <thead className="bg-muted">
        <tr>
          {columns.map((col) => (
            <th key={col.header} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-background divide-y divide-border">
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.header} className="px-4 py-2 whitespace-nowrap">{row[col.accessor] as ReactNode}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      accessor: PropTypes.string.isRequired,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  className: PropTypes.string,
};

export default Table; 