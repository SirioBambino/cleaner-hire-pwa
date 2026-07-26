'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DICT } from '@/dictionary';
import { usePropertyPriceDialog } from '@/features/admin/hooks/usePropertyPriceDialog';

interface PropertyPriceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	propertyId: string;
	propertyAddress: string;
	currentPrice: number | null;
	currentCleanerPay: number | null;
	onSuccess?: () => void;
}

export function PropertyPriceDialog({
	open,
	onOpenChange,
	propertyId,
	propertyAddress,
	currentPrice,
	currentCleanerPay,
	onSuccess,
}: PropertyPriceDialogProps) {
	const [price, setPrice] = useState(currentPrice?.toString() || '');
	const [cleanerPay, setCleanerPay] = useState(currentCleanerPay?.toString() || '');
	const { saving, handleSave: savePrice } = usePropertyPriceDialog({
		propertyId,
		onSuccess: () => {
			onSuccess?.();
			onOpenChange(false);
		},
	});

	const handleSave = async () => {
		await savePrice(price, cleanerPay);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{DICT.ADMIN.PROPERTY_PRICE_DIALOG.TITLE}</DialogTitle>
					<DialogDescription>
						{DICT.ADMIN.PROPERTY_PRICE_DIALOG.DESCRIPTION.replace('{address}', propertyAddress)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="property-price">
							{DICT.ADMIN.PROPERTY_PRICE_DIALOG.LABEL_PRICE} ({DICT.COMMON.CURRENCY})
						</Label>
						<Input
							id="property-price"
							type="number"
							step="0.01"
							min="0"
							placeholder={DICT.ADMIN.PROPERTY_PRICE_DIALOG.PLACEHOLDER_PRICE}
							value={price}
							onChange={(e) => setPrice(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="property-cleaner-pay">
							{DICT.CLEANINGS.FORM.LABELS.CLEANER_PAY} ({DICT.COMMON.CURRENCY})
						</Label>
						<Input
							id="property-cleaner-pay"
							type="number"
							step="0.01"
							min="0"
							placeholder={DICT.ADMIN.PROPERTY_PRICE_DIALOG.PLACEHOLDER_CLEANER_PAY}
							value={cleanerPay}
							onChange={(e) => setCleanerPay(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							{DICT.ADMIN.PROPERTY_PRICE_DIALOG.DESCRIPTION_CLEANER_PAY}
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{DICT.COMMON.ACTIONS.CANCEL}
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							DICT.COMMON.ACTIONS.SAVE_CHANGES
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
