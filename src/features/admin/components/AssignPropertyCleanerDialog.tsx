'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DICT } from '@/dictionary';

interface AssignPropertyCleanerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	propertyAddress: string;
	currentCleanerId: string | null;
	availableCleaners: { id: string; full_name: string | null }[];
	onSave: (cleanerId: string | null) => Promise<void>;
}

export function AssignPropertyCleanerDialog({
	open,
	onOpenChange,
	propertyAddress,
	currentCleanerId,
	availableCleaners,
	onSave,
}: AssignPropertyCleanerDialogProps) {
	const dict = DICT.ADMIN.PROPERTY_ASSIGN_CLEANER;

	const currentCleaner = availableCleaners.find((c) => c.id === currentCleanerId);
	const displayValue = currentCleaner?.full_name || '';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{dict.TITLE}</DialogTitle>
					<DialogDescription>
						{dict.DESCRIPTION.replace('{address}', propertyAddress)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<Select
						value={currentCleanerId ?? 'none'}
						onValueChange={(value) => {
							const newCleanerId = value === 'none' ? null : value;
							onSave(newCleanerId);
						}}>
						<SelectTrigger className="w-full" aria-label={dict.LABEL_SELECT}>
							<SelectValue
								placeholder={dict.LABEL_SELECT}
								className={displayValue ? 'text-foreground' : ''}>
								{displayValue || dict.LABEL_SELECT}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">{dict.NO_CLEANER}</SelectItem>
							{availableCleaners.map((cleaner) => (
								<SelectItem key={cleaner.id} value={cleaner.id}>
									{cleaner.full_name || 'Unknown'}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{DICT.COMMON.ACTIONS.CANCEL}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
