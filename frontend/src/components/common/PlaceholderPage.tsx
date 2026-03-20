type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="w-full max-w-5xl space-y-2 px-2 sm:space-y-3 sm:px-4">
      <h1 className="text-lg font-semibold text-foreground sm:text-xl lg:text-2xl">
        {title}
      </h1>
      <p className="text-xs text-muted-foreground sm:text-subtext">
        {description ?? 'This page is not implemented yet.'}
      </p>
    </div>
  )
}
