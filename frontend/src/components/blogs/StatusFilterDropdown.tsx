import { Check, ChevronDown, Filter } from "lucide-react";
import { Button, Dropdown, DropdownItem } from "@/components/ui";
import { STATUS_OPTIONS, type StatusFilter } from "./types";

export interface StatusFilterDropdownProps {
	value: StatusFilter;
	onChange: (value: StatusFilter) => void;
}

export function StatusFilterDropdown({
	value,
	onChange,
}: StatusFilterDropdownProps) {
	const currentLabel =
		STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? "All";

	return (
		<Dropdown
			trigger={
				<Button
					type="button"
					variant="outline"
					className="rounded-xl border-slate-200 px-3 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
					leftIcon={<Filter className="size-5" />}
					rightIcon={<ChevronDown className="size-4" />}
				>
					<span className="hidden sm:inline">{currentLabel}</span>
				</Button>
			}
		>
			{STATUS_OPTIONS.map((option) => (
				<DropdownItem
					key={option.value}
					onClick={() => onChange(option.value)}
					icon={
						value === option.value ? (
							<Check className="size-4 text-slate-600" />
						) : (
							<span className="size-4" />
						)
					}
				>
					{option.label}
				</DropdownItem>
			))}
		</Dropdown>
	);
}
