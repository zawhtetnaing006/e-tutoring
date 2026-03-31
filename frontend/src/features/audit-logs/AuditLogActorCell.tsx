const ACTOR_WITH_ROLE = /^(.+?)\s*\(([^)]+)\)\s*$/

type AuditLogActorCellProps = {
  actor: string
}

export function AuditLogActorCell({ actor }: AuditLogActorCellProps) {
  const m = actor.match(ACTOR_WITH_ROLE)
  if (!m) {
    return (
      <span
        className="block truncate font-medium text-foreground"
        title={actor}
      >
        {actor}
      </span>
    )
  }
  return (
    <span className="block truncate" title={actor}>
      <span className="font-semibold text-foreground">{m[1].trim()}</span>
      <span className="text-muted-foreground"> ({m[2]})</span>
    </span>
  )
}
