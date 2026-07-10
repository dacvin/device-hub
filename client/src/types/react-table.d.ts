import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // Allow columns to carry a Tailwind class applied to their <th>/<td>.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
