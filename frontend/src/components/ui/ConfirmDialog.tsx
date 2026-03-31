import { AlertTriangle, Info, Trash2, X } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: ConfirmDialogVariant;
	isLoading?: boolean;
}

const VARIANT_CONFIG = {
	danger: {
		icon: Trash2,
		iconBg: "bg-red-100",
		iconColor: "text-red-600",
		buttonClass: "bg-red-600 hover:bg-red-700 text-white",
	},
	warning: {
		icon: AlertTriangle,
		iconBg: "bg-amber-100",
		iconColor: "text-amber-600",
		buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
	},
	info: {
		icon: Info,
		iconBg: "bg-blue-100",
		iconColor: "text-blue-600",
		buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
	},
} as const;

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "danger",
	isLoading = false,
}: ConfirmDialogProps) {
	const config = VARIANT_CONFIG[variant];
	const Icon = config.icon;

	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="sm"
			showCloseButton={false}
			closeOnOverlayClick={!isLoading}
			closeOnEscape={!isLoading}
			overlayClassName="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4"
			className="rounded-xl p-0 shadow-2xl"
			contentClassName=""
		>
			<div className="p-6">
				<div className="flex items-start gap-4">
					<div
						className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
					>
						<Icon className={`h-6 w-6 ${config.iconColor}`} />
					</div>
					<div className="flex-1">
						<div className="flex items-start justify-between">
							<h3 className="text-lg font-semibold text-slate-900">{title}</h3>
							<button
								type="button"
								onClick={onClose}
								disabled={isLoading}
								className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
								aria-label="Close"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<p className="mt-2 text-sm text-slate-600">{description}</p>
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isLoading}
						className="rounded-lg border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
					>
						{cancelLabel}
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						disabled={isLoading}
						className={`rounded-lg px-4 py-2 text-sm font-medium ${config.buttonClass}`}
					>
						{isLoading ? "Please wait..." : confirmLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
