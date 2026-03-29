import { Plus } from "lucide-react";
import { Button } from "@/components/ui";

export interface BlogPageHeaderProps {
	onNewBlog: () => void;
}

export function BlogPageHeader({ onNewBlog }: BlogPageHeaderProps) {
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<h1 className="text-3xl font-medium text-slate-800">Blogs</h1>
				<p className="mt-1 text-sm text-slate-600">
					Share knowledge and insights with the community
				</p>
			</div>

			<Button
				type="button"
				onClick={onNewBlog}
				className="rounded-lg bg-slate-600 px-5 py-3 text-lg font-medium text-white hover:bg-slate-700"
				leftIcon={<Plus className="size-5" />}
			>
				New Blog
			</Button>
		</div>
	);
}
