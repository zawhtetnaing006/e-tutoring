import { cn } from "@/lib/utils";

export interface FormLabelProps {
	children: React.ReactNode;
	htmlFor?: string;
	required?: boolean;
	className?: string;
}

export function FormLabel({
	children,
	htmlFor,
	required,
	className,
}: FormLabelProps) {
	return (
		<label
			htmlFor={htmlFor}
			className={cn(
				"mb-1 block text-sm font-medium text-foreground",
				className,
			)}
		>
			{children}
			{required ? <span className="text-red-500"> *</span> : null}
		</label>
	);
}
