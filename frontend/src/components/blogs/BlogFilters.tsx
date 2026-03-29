import { BlogPageHeader } from "./BlogPageHeader";
import { BlogToolbar } from "./BlogToolbar";
import type { StatusFilter } from "./types";

export interface BlogFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	statusFilter: StatusFilter;
	onStatusFilterChange: (value: StatusFilter) => void;
	onExportCsv: () => void;
	onDeleteSelected: () => void;
	onNewBlog: () => void;
	hasSelection?: boolean;
}

export function BlogFilters({
	search,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	onExportCsv,
	onDeleteSelected,
	onNewBlog,
	hasSelection = false,
}: BlogFiltersProps) {
	return (
		<>
			<BlogPageHeader onNewBlog={onNewBlog} />
			<BlogToolbar
				search={search}
				onSearchChange={onSearchChange}
				statusFilter={statusFilter}
				onStatusFilterChange={onStatusFilterChange}
				onExportCsv={onExportCsv}
				onDeleteSelected={onDeleteSelected}
				hasSelection={hasSelection}
			/>
		</>
	);
}
