import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Eye, User, X } from "lucide-react";
import { createBlogComment } from "@/features/blogs/api";
import { useBlog, useBlogComments } from "@/features/blogs/useBlogs";
import { LoadingSpinner, Modal } from "@/components/ui";
import { formatDateTimeShort } from "@/utils/formatters";
import { sanitizeRichText } from "@/utils/string";
import { BlogCommentSection } from "./BlogCommentSection";

const COMMENTS_PER_PAGE = 8;

export interface BlogDetailModalProps {
	blogId: number | null;
	onClose: () => void;
}

export function BlogDetailModal({ blogId, onClose }: BlogDetailModalProps) {
	const queryClient = useQueryClient();
	const [commentDraft, setCommentDraft] = useState("");
	const [commentPage, setCommentPage] = useState(1);

	const isOpen = blogId != null;

	const blogQuery = useBlog(blogId);
	const commentsQuery = useBlogComments(blogId, {
		page: commentPage,
		perPage: COMMENTS_PER_PAGE,
		enabled: isOpen,
	});

	const blog = blogQuery.data;
	const comments = commentsQuery.data?.data ?? [];
	const commentsTotalPages = commentsQuery.data?.total_page ?? 1;

	const createCommentMutation = useMutation({
		mutationFn: ({
			targetBlogId,
			commentText,
		}: {
			targetBlogId: number;
			commentText: string;
		}) => createBlogComment(targetBlogId, { comment_text: commentText }),
		onSuccess: (_, variables) => {
			toast.success("Comment posted.");
			setCommentDraft("");
			void queryClient.invalidateQueries({
				queryKey: ["blogs", "detail", variables.targetBlogId],
			});
			void queryClient.invalidateQueries({
				queryKey: ["blogs", "comments", variables.targetBlogId],
			});
			void queryClient.invalidateQueries({ queryKey: ["blogs"] });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to post comment",
			);
		},
	});

	const handleClose = () => {
		setCommentDraft("");
		setCommentPage(1);
		onClose();
	};

	const handlePostComment = () => {
		const value = commentDraft.trim();
		if (!value) {
			toast.error("Please write a comment first.");
			return;
		}
		if (!blogId) return;

		createCommentMutation.mutate({
			targetBlogId: blogId,
			commentText: value,
		});
	};

	const handleCommentPagePrev = () => {
		setCommentPage((current) => Math.max(1, current - 1));
	};

	const handleCommentPageNext = () => {
		setCommentPage((current) => Math.min(commentsTotalPages, current + 1));
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			size="6xl"
			showCloseButton={false}
			closeOnOverlayClick={false}
			overlayClassName="fixed inset-0 z-modal flex items-center justify-center bg-black/30 p-4"
			className="flex max-h-[95vh] flex-col overflow-hidden rounded-xl p-0 shadow-2xl"
			contentClassName="flex min-h-0 flex-1 flex-col"
		>
			{/* Header - Fixed */}
			<div className="shrink-0 border-b border-slate-200 px-6 py-4">
				<div className="flex items-start justify-between">
					<h2 className="text-2xl font-semibold text-slate-800">
						{blogQuery.isLoading
							? "Loading..."
							: (blog?.title ?? "Blog Details")}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="rounded-full p-1 text-slate-600 hover:bg-slate-100"
						aria-label="Close details"
					>
						<X className="size-6" />
					</button>
				</div>
			</div>

			{/* Body - Scrollable */}
			<div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
				{blogQuery.isLoading ? (
					<div className="py-10 text-center text-slate-500">
						<span className="inline-flex items-center gap-2">
							<LoadingSpinner size="md" className="text-slate-500" />
							Loading blog details...
						</span>
					</div>
				) : blog ? (
					<div className="space-y-4">
						{blog.cover_image_url ? (
							<img
								src={blog.cover_image_url}
								alt={blog.title}
								className="h-[420px] w-full rounded-lg object-cover"
							/>
						) : (
							<div className="h-[420px] w-full rounded-lg bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-700" />
						)}

						<div className="flex items-center justify-end gap-6 text-sm text-slate-500">
							<span className="inline-flex items-center gap-1.5">
								<User className="size-4" />
								{blog.author?.name ?? "Unknown"}
							</span>
							<span className="inline-flex items-center gap-1.5">
								<Calendar className="size-4" />
								{formatDateTimeShort(blog.created_at)}
							</span>
							<span className="inline-flex items-center gap-1.5">
								<Eye className="size-4" />
								{blog.view_count.toLocaleString()}
							</span>
						</div>

						<article
							className="space-y-2 text-2xl leading-9 text-slate-700"
							dangerouslySetInnerHTML={{
								__html: sanitizeRichText(blog.content),
							}}
						/>

						<p className="text-2xl font-medium text-slate-600">
							{blog.hashtags.length > 0
								? blog.hashtags.map((tag) => `#${tag}`).join(" ")
								: "#study #techniques"}
						</p>

						<BlogCommentSection
							comments={comments}
							isLoading={commentsQuery.isLoading}
							currentPage={commentPage}
							totalPages={commentsTotalPages}
							onPagePrev={handleCommentPagePrev}
							onPageNext={handleCommentPageNext}
							commentDraft={commentDraft}
							onCommentDraftChange={setCommentDraft}
							onPostComment={handlePostComment}
							isPosting={createCommentMutation.isPending}
						/>
					</div>
				) : (
					<div className="py-10 text-center text-slate-500">
						Unable to load blog detail.
					</div>
				)}
			</div>
		</Modal>
	);
}
