import { Download, Trash2 } from "lucide-react";
import { Button, SearchInput } from "@/components/ui";
import { StatusFilterDropdown } from "./StatusFilterDropdown";
import type { StatusFilter } from "./types";

export interface BlogToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	statusFilter: StatusFilter;
	onStatusFilterChange: (value: StatusFilter) => void;
	onExportCsv: () => void;
	onDeleteSelected: () => void;
	hasSelection?: boolean;
}

export function BlogToolbar({
	search,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	onExportCsv,
	onDeleteSelected,
	hasSelection = false,
}: BlogToolbarProps) {
	return (
		<div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
			<SearchInput
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
				placeholder="Search blogs..."
				className="w-full md:max-w-xs"
				showClearButton={false}
			/>

			<Button
				type="button"
				variant="outline"
				onClick={onExportCsv}
				className="rounded-xl border-slate-200 px-4 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
				leftIcon={<Download className="size-5" />}
			>
				Excel
			</Button>

			<StatusFilterDropdown
				value={statusFilter}
				onChange={onStatusFilterChange}
			/>

			<Button
				type="button"
				variant="outline"
				onClick={onDeleteSelected}
				disabled={!hasSelection}
				className="rounded-xl border-slate-200 px-3 py-2.5 text-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
				aria-label="Delete selected blogs"
			>
				<Trash2 className="size-5" />
			</Button>
		</div>
	);
}
