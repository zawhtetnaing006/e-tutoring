import { CirclePlus } from 'lucide-react'

export interface SubjectListHeaderProps {
  title: string
  subtitle: string
  addLabel: string
  onAdd: () => void
}

export function SubjectListHeader({
  title,
  subtitle,
  addLabel,
  onAdd,
}: SubjectListHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-1 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-foreground sm:text-xl 2xl:text-2xl">
          {title}
        </h1>
        <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm lg:text-base 2xl:text-lg">
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:h-10 sm:px-4 sm:text-sm xl:h-9 2xl:px-5 2xl:text-base"
      >
        <CirclePlus className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5" />
        <span className="whitespace-nowrap">{addLabel}</span>
      </button>
    </div>
  )
}
