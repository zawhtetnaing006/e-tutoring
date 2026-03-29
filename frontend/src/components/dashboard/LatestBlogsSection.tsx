import type { LatestBlogPost } from '@/api/analytics'
import { Card } from '@/components/ui/Card'
import { LatestBlogCard } from '@/components/dashboard/LatestBlogCard'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { DashboardViewAllLink } from '@/components/dashboard/DashboardViewAllLink'

type LatestBlogsSectionProps = {
  blogs: LatestBlogPost[]
  /** Staff dashboard shows 1 preview; tutor/student use 2. */
  previewCount?: number
}

export function LatestBlogsSection({
  blogs,
  previewCount = 2,
}: LatestBlogsSectionProps) {
  return (
    <Card className="p-4 sm:p-6">
      <DashboardSectionHeader
        title="Latest Blogs"
        action={<DashboardViewAllLink to="/blogs" />}
      />
      {blogs.length > 0 ? (
        <div className="flex flex-col gap-4">
          {blogs.slice(0, previewCount).map(blog => (
            <LatestBlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No blogs available</p>
      )}
    </Card>
  )
}
