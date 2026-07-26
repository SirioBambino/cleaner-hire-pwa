'use client';

import { useState } from 'react';
import { toast } from '@/components/Toast';
import { DICT } from '@/dictionary';
import { userService } from '@/features/admin/services/userService';

interface UsePropertyPriceDialogOptions {
	propertyId: string;
	onSuccess?: () => void;
}

interface UsePropertyPriceDialogResult {
	saving: boolean;
	handleSave: (price: string, cleanerPay: string) => Promise<void>;
}

export function usePropertyPriceDialog({
	propertyId,
	onSuccess,
}: UsePropertyPriceDialogOptions): UsePropertyPriceDialogResult {
	const [saving, setSaving] = useState(false);

	const handleSave = async (price: string, cleanerPay: string) => {
		const priceValue = parseFloat(price);
		if (Number.isNaN(priceValue) || priceValue <= 0) {
			toast.error(DICT.ADMIN.PROPERTY_PRICE_DIALOG.PRICE_REQUIRED);
			return;
		}

		const cleanerPayValue = cleanerPay.trim() === '' ? undefined : parseFloat(cleanerPay);
		if (cleanerPayValue !== undefined && (Number.isNaN(cleanerPayValue) || cleanerPayValue < 0)) {
			toast.error(DICT.ADMIN.PROPERTY_PRICE_DIALOG.CLEANER_PAY_INVALID);
			return;
		}

		setSaving(true);
		const result = await userService.updatePropertyPrice(propertyId, priceValue, cleanerPayValue);
		setSaving(false);

		if (result.error) {
			toast.error(result.error);
		} else {
			toast.success(DICT.ADMIN.PROPERTY_PRICE_DIALOG.TOAST_SUCCESS);
			onSuccess?.();
		}
	};

	return {
		saving,
		handleSave,
	};
}
