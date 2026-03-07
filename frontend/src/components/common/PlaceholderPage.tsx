type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="w-full max-w-5xl space-y-2 px-2">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-subtext text-muted-foreground">
        {description ?? 'This page is not implemented yet.'}
      </p>
    </div>
  )
}
