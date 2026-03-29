import {
	Calendar,
	Check,
	Edit,
	Eye,
	MoreVertical,
	Power,
	Trash2,
	User,
} from "lucide-react";
import type { Blog } from "@/features/blogs/api";
import { Dropdown, DropdownItem } from "@/components/ui";
import { formatDateTimeShort } from "@/utils/formatters";
import { getExcerpt, stripHtml } from "@/utils/string";
import { BLOG_STATUS_STYLES } from "./types";

export interface BlogCardProps {
	blog: Blog;
	canManage: boolean;
	isSelected: boolean;
	onOpenDetail: () => void;
	onToggleSelect: (event: React.MouseEvent) => void;
	onViewDetails: () => void;
	onEdit: () => void;
	onToggleStatus: () => void;
	onDelete: () => void;
}

export function BlogCard({
	blog,
	canManage,
	isSelected,
	onOpenDetail,
	onToggleSelect,
	onViewDetails,
	onEdit,
	onToggleStatus,
	onDelete,
}: BlogCardProps) {
	return (
		<div
			onClick={onOpenDetail}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onOpenDetail();
				}
			}}
			role="button"
			tabIndex={0}
			className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white"
		>
			<div className="relative">
				<button
					type="button"
					onClick={onToggleSelect}
					className={`absolute left-3 top-3 z-10 inline-flex size-6 items-center justify-center rounded border transition-opacity ${
						isSelected
							? "border-slate-600 bg-slate-600 text-white opacity-100"
							: "border-white/80 bg-white/80 text-slate-700 opacity-0 group-hover:opacity-100"
					}`}
					aria-label={`Select blog ${blog.title}`}
				>
					{isSelected ? <Check className="size-4" /> : null}
				</button>

				{blog.cover_image_url ? (
					<img
						src={blog.cover_image_url}
						alt={blog.title}
						className="h-64 w-full object-cover"
					/>
				) : (
					<div className="h-64 w-full bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-700" />
				)}

				<div
					className="absolute right-3 top-3"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<Dropdown
						trigger={
							<span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-500/70 text-white hover:bg-slate-600">
								<MoreVertical className="size-5" />
							</span>
						}
						align="right"
					>
						<DropdownItem
							icon={<Eye className="size-4" />}
							onClick={onViewDetails}
						>
							View Details
						</DropdownItem>

						{canManage ? (
							<>
								<DropdownItem
									icon={<Edit className="size-4" />}
									onClick={onEdit}
								>
									Edit Blog
								</DropdownItem>

								<DropdownItem
									icon={<Power className="size-4" />}
									onClick={onToggleStatus}
								>
									{blog.is_active ? "Deactivate" : "Activate"}
								</DropdownItem>

								<DropdownItem
									icon={<Trash2 className="size-4" />}
									onClick={onDelete}
									variant="danger"
								>
									Delete
								</DropdownItem>
							</>
						) : null}
					</Dropdown>
				</div>
			</div>

			<div className="space-y-3 p-4">
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-lg font-medium text-slate-700">{blog.title}</h3>
					<span
						className={`rounded-full px-3 py-1 text-sm font-medium ${
							blog.is_active
								? BLOG_STATUS_STYLES.active
								: BLOG_STATUS_STYLES.inactive
						}`}
					>
						{blog.is_active ? "Active" : "Inactive"}
					</span>
				</div>

				<p className="text-sm leading-8 text-slate-600">
					{getExcerpt(stripHtml(blog.content))}
				</p>

				<p className="min-h-7 text-xs font-medium text-slate-500">
					{blog.hashtags.length > 0
						? blog.hashtags.map((tag) => `#${tag}`).join(" ")
						: "#blog #learning"}
				</p>

				<div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
					<span className="inline-flex items-center gap-1.5">
						<User className="size-4" />
						{blog.author?.name ?? "Unknown"}
					</span>

					<div className="ml-auto flex items-center gap-4">
						<span className="inline-flex items-center gap-1.5">
							<Calendar className="size-4" />
							{formatDateTimeShort(blog.created_at)}
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Eye className="size-4" />
							{blog.view_count.toLocaleString()}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
