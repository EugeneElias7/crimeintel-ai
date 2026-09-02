import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  width?: string;
  className?: string;
}

interface TableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}: TableProps<T>) {
  return (
    <div className="gradient-border overflow-x-auto rounded-xl bg-white">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-violet-50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap ${col.className || ''} ${
                  col.sortable ? 'cursor-pointer select-none transition-colors hover:text-indigo-600' : ''
                }`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-gray-400">
                      {sortBy === col.key ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={(item as any).id as string || idx}
                className={`${
                  onRowClick
                    ? 'cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/50'
                    : ''
                } ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} style={col.width ? { width: col.width, minWidth: col.width } : undefined} className={`px-4 py-4 text-sm text-gray-700 ${col.className || ''} ${col.key === 'actions' || col.key === 'id_proof' ? 'whitespace-nowrap' : ''}`}>
                    {col.render ? col.render(item) : (item[col.key] as ReactNode) ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
