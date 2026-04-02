import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'

export interface BlogPageHeaderProps {
  onNewBlog: () => void
  canManageBlogs?: boolean
}

export function BlogPageHeader({
  onNewBlog,
  canManageBlogs = false,
}: BlogPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
        <h1 className="text-lg font-bold text-foreground sm:text-xl 2xl:text-2xl">
          Blogs
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm lg:text-base">
          Share knowledge and insights with the community
        </p>
      </div>

      {canManageBlogs ? (
        <Button
          type="button"
          onClick={onNewBlog}
          className="w-full rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:w-auto"
          leftIcon={<Plus className="size-4" />}
        >
          New Blog
        </Button>
      ) : null}
    </div>
  )
}
