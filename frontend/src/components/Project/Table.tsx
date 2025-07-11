import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  FilterFn,
  PaginationState,
  Updater,
} from '@tanstack/react-table';
import { usePaginationContext } from '../../contexts/PaginationContext';

/**
 * Generic props interface for the Table component
 */
interface TableProps<T> {
  /** Array of data objects to display in the table */
  data: T[];
  /** Column definitions that specify structure and behavior of table columns */
  columns: ColumnDef<T>[];
  /** Number of rows to display per page with default value */
  pageSize?: number;
}

/**
 * Custom fuzzy filter function for searching across table data.
 * Performs case-insensitive substring matching on table cell values.
 * 
 * @param row - Table row object containing cell data
 * @param columnId - Identifier for the column being filtered
 * @param value - Search term entered by user
 * @param addMeta - Function to add metadata to the filter (unused)
 * @returns Boolean indicating whether the row matches the search criteria
 */
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = row.getValue(columnId);
  return itemRank ? itemRank.toString().toLowerCase().includes(value.toLowerCase()) : false;
};

/**
 * Reusable table component with advanced features including sorting, filtering, and pagination.
 * Built on TanStack Table library with custom styling and responsive design.
 * Integrates with pagination context to maintain state across component re-renders.
 * Features global search, column sorting, and pagination controls with accessibility support.
 * 
 * @param props - Configuration object containing data, columns, and page size
 * @returns JSX element containing fully-featured data table with controls
 */
export function Table<T>({ data, columns, pageSize = 10 }: TableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  
  /** Use pagination context to maintain page state across table instances */
  const { projectPageIndex, setProjectPageIndex } = usePaginationContext();

  /**
   * Main table instance configuration with all features enabled.
   * Handles state management, event handlers, and model generation for the table.
   */
  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: projectPageIndex,
        pageSize: pageSize,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const newPaginationState = typeof updater === 'function' 
        ? updater({ pageIndex: projectPageIndex, pageSize })
        : updater;
      setProjectPageIndex(newPaginationState.pageIndex);
    },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  /** Calculate pagination display values for user feedback */
  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  const showPagination = totalPages > 1;

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search all columns..."
        />
      </div>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      <span className="text-gray-400">
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing{' '}
          {showPagination 
            ? `${currentPage * pageSize + 1} to ${Math.min((currentPage + 1) * pageSize, table.getFilteredRowModel().rows.length)}`
            : table.getFilteredRowModel().rows.length
          }{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        
        {showPagination && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'<'}
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(totalPages - 1)}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'>>'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 