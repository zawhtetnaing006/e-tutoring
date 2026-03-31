import { MessageCircle } from "lucide-react";
import type { BlogComment } from "@/features/blogs/api";
import { Button } from "@/components/ui";
import { formatDateTimeShort } from "@/utils/formatters";

export interface BlogCommentSectionProps {
	comments: BlogComment[];
	isLoading: boolean;
	currentPage: number;
	totalPages: number;
	onPagePrev: () => void;
	onPageNext: () => void;
	commentDraft: string;
	onCommentDraftChange: (value: string) => void;
	onPostComment: () => void;
	isPosting: boolean;
}

function CommentItem({ comment }: { comment: BlogComment }) {
	return (
		<div className="group rounded-lg bg-slate-50 px-3 py-2.5 transition-colors hover:bg-slate-100/80 sm:px-4 sm:py-3">
			<p className="text-[13px] leading-relaxed text-slate-700 sm:text-sm">
				{comment.comment_text}
			</p>
			<div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 sm:text-xs">
				<span className="font-medium text-slate-500">
					{comment.commenter?.name ?? "Unknown"}
				</span>
				<span>·</span>
				<span>{formatDateTimeShort(comment.created_at)}</span>
			</div>
		</div>
	);
}

function CommentPagination({
	currentPage,
	totalPages,
	onPrev,
	onNext,
}: {
	currentPage: number;
	totalPages: number;
	onPrev: () => void;
	onNext: () => void;
}) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-3 pt-1">
			<Button
				type="button"
				variant="ghost"
				onClick={onPrev}
				disabled={currentPage <= 1}
				className="h-auto rounded px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
			>
				Previous
			</Button>
			<span className="text-xs text-slate-400">
				{currentPage} / {totalPages}
			</span>
			<Button
				type="button"
				variant="ghost"
				onClick={onNext}
				disabled={currentPage >= totalPages}
				className="h-auto rounded px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
			>
				Next
			</Button>
		</div>
	);
}

export function BlogCommentSection({
	comments,
	isLoading,
	currentPage,
	totalPages,
	onPagePrev,
	onPageNext,
	commentDraft,
	onCommentDraftChange,
	onPostComment,
	isPosting,
}: BlogCommentSectionProps) {
	return (
		<section className="mt-2 border-t border-slate-200 pt-4 sm:mt-4 sm:pt-5">
			<div className="mb-3 flex items-center gap-2 sm:mb-4">
				<MessageCircle className="size-4 text-slate-400" />
				<h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-[13px]">
					Comments
				</h3>
				{comments.length > 0 && (
					<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
						{comments.length}
					</span>
				)}
			</div>

			<div className="space-y-2 sm:space-y-2.5">
				{isLoading ? (
					<p className="py-4 text-center text-xs text-slate-400">
						Loading comments...
					</p>
				) : comments.length > 0 ? (
					comments.map((comment) => (
						<CommentItem key={comment.id} comment={comment} />
					))
				) : (
					<p className="py-4 text-center text-xs text-slate-400">
						No comments yet. Be the first to comment!
					</p>
				)}
			</div>

			<CommentPagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPrev={onPagePrev}
				onNext={onPageNext}
			/>

			<div className="mt-4 space-y-2.5 sm:mt-5">
				<textarea
					value={commentDraft}
					onChange={(event) => onCommentDraftChange(event.target.value)}
					rows={2}
					placeholder="Share your thoughts..."
					className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 sm:text-sm"
				/>
				<Button
					type="button"
					onClick={onPostComment}
					disabled={isPosting || !commentDraft.trim()}
					className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
				>
					{isPosting ? "Posting..." : "Post Comment"}
				</Button>
			</div>
		</section>
	);
}
