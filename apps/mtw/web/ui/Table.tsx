import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { EmptyState } from './Layout';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ComponentChildren;
  /** Provide to make the column sortable. */
  sort?: (a: T, b: T) => number;
  /** 'num' right-aligns the header and cells with tabular figures. */
  align?: 'actions' | 'num';
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  empty?: string;
}

export function Table<T>({ columns, rows, rowKey, onRowClick, rowLabel, defaultSort, empty = 'Nothing here yet.' }: TableProps<T>) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (col.sort as (a: T, b: T) => number)(a, b) * factor);
  }, [rows, sort, columns]);

  if (!rows.length) return <EmptyState>{empty}</EmptyState>;

  return (
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" class={c.align === 'num' ? 'col-num' : undefined} aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : c.sort ? 'none' : undefined}>
                  {c.sort ? (
                    <button type="button" title={`Sorts the table by ${typeof c.header === 'string' ? c.header : 'this column'}. Click again to reverse the order.`} onClick={() => setSort({ key: c.key, dir: active && sort?.dir === 'asc' ? 'desc' : 'asc' })}>
                      {c.header}
                      {active && <span aria-hidden="true">{sort?.dir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  ) : (
                    <span>{c.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              data-click={onRowClick ? 'true' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick ? rowLabel?.(row) : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((c) => (
                <td key={c.key} class={c.align === 'actions' ? 'actions' : c.align === 'num' ? 'col-num' : undefined}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
