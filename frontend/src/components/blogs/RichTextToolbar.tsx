export interface RichTextToolbarProps {
	onCommand: (command: string, value?: string) => void;
}

interface ToolbarButtonProps {
	onClick: () => void;
	label: string;
	children: React.ReactNode;
}

function ToolbarButton({ onClick, label, children }: ToolbarButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded p-1 hover:bg-slate-100"
			aria-label={label}
		>
			{children}
		</button>
	);
}

export function RichTextToolbar({ onCommand }: RichTextToolbarProps) {
	const handleLinkInsert = () => {
		const url = window.prompt("Enter URL (https://...)");
		if (url) {
			onCommand("createLink", url);
		}
	};

	return (
		<div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-slate-500">
			<ToolbarButton onClick={() => onCommand("undo")} label="Undo">
				↶
			</ToolbarButton>
			<ToolbarButton onClick={() => onCommand("redo")} label="Redo">
				↷
			</ToolbarButton>

			<span className="mx-2 text-base">Rich text</span>

			<ToolbarButton onClick={() => onCommand("bold")} label="Bold">
				<span className="px-1 text-base font-semibold">B</span>
			</ToolbarButton>
			<ToolbarButton onClick={() => onCommand("italic")} label="Italic">
				<span className="px-1 text-base italic">I</span>
			</ToolbarButton>
			<ToolbarButton onClick={() => onCommand("underline")} label="Underline">
				<span className="px-1 text-base underline">U</span>
			</ToolbarButton>

			<ToolbarButton
				onClick={() => onCommand("insertUnorderedList")}
				label="Bulleted list"
			>
				<span className="px-1 text-base">• List</span>
			</ToolbarButton>
			<ToolbarButton
				onClick={() => onCommand("insertOrderedList")}
				label="Numbered list"
			>
				<span className="px-1 text-base">1. List</span>
			</ToolbarButton>

			<ToolbarButton
				onClick={() => onCommand("formatBlock", "blockquote")}
				label="Quote"
			>
				<span className="px-1 text-base">Quote</span>
			</ToolbarButton>

			<ToolbarButton onClick={handleLinkInsert} label="Insert link">
				<span className="px-1 text-base">Link</span>
			</ToolbarButton>

			<ToolbarButton
				onClick={() => onCommand("removeFormat")}
				label="Clear formatting"
			>
				<span className="px-1 text-base">Clear</span>
			</ToolbarButton>
		</div>
	);
}
