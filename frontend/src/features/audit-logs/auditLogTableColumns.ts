import type { AuditLogSortKey } from './sorting'

export type AuditLogTableColumnDef = {
  key: AuditLogSortKey
  label: string
  thClassName: string
  labelWrapperClassName: string
}

/**
 * Column metadata for the audit log table header (order matches body cells).
 * Keep widths aligned with row `<td>` classes in `AuditLogPage`.
 */
export const AUDIT_LOG_TABLE_COLUMNS: AuditLogTableColumnDef[] = [
  {
    key: 'date_time',
    label: 'Date & Time',
    thClassName:
      'whitespace-nowrap bg-muted p-2 font-semibold text-foreground sm:p-3 2xl:w-[12%] 2xl:p-4',
    labelWrapperClassName:
      'inline-flex w-full items-center justify-start gap-1.5 2xl:gap-2',
  },
  {
    key: 'actor',
    label: 'Actor (Role)',
    thClassName:
      'whitespace-nowrap bg-muted p-2 font-semibold text-foreground sm:p-3 2xl:w-[14%] 2xl:p-4',
    labelWrapperClassName:
      'inline-flex w-full items-center justify-start gap-1.5 2xl:gap-2',
  },
  {
    key: 'action',
    label: 'Action',
    thClassName:
      'whitespace-nowrap bg-muted p-2 font-semibold text-foreground sm:p-3 2xl:w-[12%] 2xl:p-4',
    labelWrapperClassName:
      'inline-flex w-full items-center justify-start gap-1.5 2xl:gap-2',
  },
  {
    key: 'target',
    label: 'Target',
    thClassName:
      'whitespace-nowrap bg-muted p-2 font-semibold text-foreground sm:p-3 2xl:w-[12%] 2xl:p-4',
    labelWrapperClassName:
      'inline-flex w-full items-center justify-start gap-1.5 2xl:gap-2',
  },
  {
    key: 'description',
    label: 'Description',
    thClassName:
      'min-w-[220px] bg-muted p-2 pl-3 font-semibold text-foreground sm:min-w-[260px] sm:p-3 sm:pl-4 2xl:min-w-0 2xl:w-[44%] 2xl:p-4 2xl:pl-5',
    labelWrapperClassName:
      'inline-flex w-full min-w-0 items-center justify-start gap-1.5 pr-1 2xl:gap-2',
  },
]
