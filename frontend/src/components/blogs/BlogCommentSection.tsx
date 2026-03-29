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
		<div className="rounded-lg border border-slate-200 px-3 py-2">
			<p className="text-xl text-slate-700">{comment.comment_text}</p>
			<p className="mt-1 text-sm text-slate-500">
				{comment.commenter?.name ?? "Unknown"} •{" "}
				{formatDateTimeShort(comment.created_at)}
			</p>
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
	return (
		<div className="flex items-center justify-between gap-2 text-sm text-slate-500">
			<Button
				type="button"
				variant="outline"
				onClick={onPrev}
				disabled={currentPage <= 1}
				className="rounded border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
			>
				Previous
			</Button>
			<span>
				Page {currentPage} / {totalPages}
			</span>
			<Button
				type="button"
				variant="outline"
				onClick={onNext}
				disabled={currentPage >= totalPages}
				className="rounded border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
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
		<section className="space-y-3 border-t border-slate-200 pt-4">
			<h3 className="text-2xl font-semibold text-slate-700">Comments</h3>

			{isLoading ? (
				<p className="text-slate-500">Loading comments...</p>
			) : comments.length > 0 ? (
				comments.map((comment) => (
					<CommentItem key={comment.id} comment={comment} />
				))
			) : (
				<p className="text-slate-500">No comments yet.</p>
			)}

			<CommentPagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPrev={onPagePrev}
				onNext={onPageNext}
			/>

			<textarea
				value={commentDraft}
				onChange={(event) => onCommentDraftChange(event.target.value)}
				rows={3}
				placeholder="Write a comment..."
				className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xl text-slate-700 outline-none focus:border-slate-400"
			/>

			<Button
				type="button"
				onClick={onPostComment}
				disabled={isPosting}
				className="rounded-lg bg-slate-600 px-4 py-2 text-lg text-white hover:bg-slate-700 disabled:opacity-50"
			>
				{isPosting ? "Posting..." : "Post Comment"}
			</Button>
		</section>
	);
}
