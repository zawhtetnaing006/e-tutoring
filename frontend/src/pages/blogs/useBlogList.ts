import { useMemo, useState } from "react";
import { useBlogs } from "@/features/blogs/useBlogs";
import { useDebouncedValue } from "@/hooks";
import type { StatusFilter } from "@/components/blogs";

export const BLOGS_PAGE_SIZE = 9;

export function useBlogList() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

	const debouncedSearch = useDebouncedValue(search.trim(), 350);

	const query = useBlogs({
		page,
		perPage: BLOGS_PAGE_SIZE,
		search: debouncedSearch,
		isActive: statusFilter === "all" ? undefined : statusFilter === "active",
	});

	const blogs = useMemo(() => query.data?.data ?? [], [query.data?.data]);
	const totalPages = query.data?.total_page ?? 1;
	const totalItems = query.data?.total_items ?? 0;

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleStatusFilterChange = (value: StatusFilter) => {
		setStatusFilter(value);
		setPage(1);
	};

	return {
		blogs,
		isLoading: query.isLoading,
		page,
		setPage,
		search,
		statusFilter,
		totalPages,
		totalItems,
		handleSearchChange,
		handleStatusFilterChange,
	};
}
