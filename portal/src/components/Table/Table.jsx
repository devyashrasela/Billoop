import React from 'react';
import './Table.css';
import { Button } from '../Button/Button';

/**
 * Reusable DataTable with horizontal scroll wrapper, loading skeletons,
 * empty state, and responsive pagination.
 */
export function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  page = 1,
  totalPages = 1,
  totalRecords,
  onPageChange,
  keyExtractor = (item, index) => item.id || index,
  rowClassName,
  className = '',
}) {
  return (
    <div className={`table-container ${className}`}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={col.align === 'right' ? 'table__num' : ''}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`}>
                  {columns.map((col, cIdx) => (
                    <td key={`skel-${rIdx}-${cIdx}`}>
                      <div className="skel" style={{ width: cIdx === 0 ? '70%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => {
                const customRowClass = rowClassName ? rowClassName(item, rowIdx) : '';
                return (
                  <tr key={keyExtractor(item, rowIdx)} className={customRowClass}>
                    {columns.map((col, colIdx) => {
                      const value = col.render ? col.render(item, rowIdx) : item[col.key];
                      return (
                        <td
                          key={col.key || colIdx}
                          className={col.align === 'right' ? 'table__num' : ''}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {(totalPages > 1 || totalRecords !== undefined) && (
        <div className="pager">
          <span>
            {totalRecords !== undefined
              ? `Showing page ${page} of ${totalPages} (${totalRecords} items)`
              : `Page ${page} of ${totalPages}`}
          </span>
          <div className="pager__actions">
            <Button
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange && onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange && onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
