'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangeEvent, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
	FileInput,
	FileUploader,
	FileUploaderContent,
	FileUploaderItem,
} from '@/components/ui/file-upload';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { DICT } from '@/dictionary';
import { useBucketConfig } from '@/hooks/useBucketConfig';
import { useObjectUrls } from '@/hooks/useObjectUrls';

const evidenceSchema = z
	.object({
		broken_items_report: z.string().optional(),
		low_supplies_report: z.string().optional(),
		no_broken_items: z.boolean(),
		no_low_supplies: z.boolean(),
		has_evidence: z.boolean().refine((val) => val === true, {
			message: DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.VALIDATION.EVIDENCE_REQUIRED,
		}),
	})
	.superRefine((data, ctx) => {
		const hasBrokenItemsText = (data.broken_items_report ?? '').trim().length > 0;
		if (!hasBrokenItemsText && !data.no_broken_items) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['no_broken_items'],
				message: DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.VALIDATION.BROKEN_ITEMS,
			});
		}
		const hasLowSuppliesText = (data.low_supplies_report ?? '').trim().length > 0;
		if (!hasLowSuppliesText && !data.no_low_supplies) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['no_low_supplies'],
				message: DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.VALIDATION.LOW_SUPPLIES,
			});
		}
	});

export type EvidenceFormValues = z.infer<typeof evidenceSchema>;

interface CleaningEvidenceFormProps {
	cleaningId: string;
	cleanerId: string;
	onSubmit: (values: EvidenceFormValues, files: File[]) => Promise<void>;
	onCancel?: () => void;
}

const FileSvgDraw = ({ accept }: { accept?: Record<string, string[]> }) => {
	const allowedExtensions = accept
		? Object.values(accept)
				.flat()
				.map((ext) => ext.replace('.', '').toUpperCase())
				.join(', ')
		: DICT.COMMON.IMAGES.ALLOWED_FILES;

	return (
		<>
			<svg
				className="size-8 mb-3 text-primary"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 20 16">
				<path
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
				/>
			</svg>
			<p className="mb-1 text-sm text-primary">
				<span className="font-semibold">{DICT.COMMON.IMAGES.UPLOAD_PROMPT}</span>{' '}
				{DICT.COMMON.IMAGES.UPLOAD_DRAG_DROP}
			</p>
			<p className="text-xs text-primary">{allowedExtensions}</p>
		</>
	);
};

export function CleaningEvidenceForm({ onSubmit, onCancel }: CleaningEvidenceFormProps) {
	const [files, setFiles] = useState<File[] | null>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const bucketConfig = useBucketConfig('cleaning-media', {
		'image/*': ['.jpg', '.jpeg', '.png'],
		'video/*': ['.mp4', '.mov'],
	});

	const previewUrls = useObjectUrls(files);

	const form = useForm<EvidenceFormValues>({
		resolver: zodResolver(evidenceSchema),
		defaultValues: {
			broken_items_report: '',
			low_supplies_report: '',
			no_broken_items: false,
			no_low_supplies: false,
			has_evidence: false,
		},
	});

	const brokenItemsText = useWatch({ control: form.control, name: 'broken_items_report' });
	const lowSuppliesText = useWatch({ control: form.control, name: 'low_supplies_report' });
	const noBrokenItems = useWatch({ control: form.control, name: 'no_broken_items' });
	const noLowSupplies = useWatch({ control: form.control, name: 'no_low_supplies' });

	const hasBrokenItemsText = (brokenItemsText ?? '').trim().length > 0;
	const hasLowSuppliesText = (lowSuppliesText ?? '').trim().length > 0;

	const handleFormSubmit = async (values: EvidenceFormValues) => {
		setIsSubmitting(true);
		try {
			await onSubmit(values, files || []);
		} finally {
			setIsSubmitting(false);
		}
	};

	const onFilesChange = (newFiles: File[] | null) => {
		setFiles(newFiles);
		form.setValue('has_evidence', !!(newFiles && newFiles.length > 0), {
			shouldValidate: form.formState.isSubmitted,
		});
	};

	const handleBrokenItemsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		form.setValue('broken_items_report', event.target.value, {
			shouldValidate: form.formState.isSubmitted,
		});
		if (event.target.value.trim().length > 0) {
			form.setValue('no_broken_items', false, { shouldValidate: form.formState.isSubmitted });
		}
	};

	const handleLowSuppliesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		form.setValue('low_supplies_report', event.target.value, {
			shouldValidate: form.formState.isSubmitted,
		});
		if (event.target.value.trim().length > 0) {
			form.setValue('no_low_supplies', false, { shouldValidate: form.formState.isSubmitted });
		}
	};

	const handleNoBrokenItemsToggle = (isChecked: boolean) => {
		form.setValue('no_broken_items', isChecked, { shouldValidate: form.formState.isSubmitted });
		if (isChecked) {
			form.setValue('broken_items_report', '', { shouldValidate: form.formState.isSubmitted });
		}
	};

	const handleNoLowSuppliesToggle = (isChecked: boolean) => {
		form.setValue('no_low_supplies', isChecked, { shouldValidate: form.formState.isSubmitted });
		if (isChecked) {
			form.setValue('low_supplies_report', '', { shouldValidate: form.formState.isSubmitted });
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.stopPropagation();
				form.handleSubmit(handleFormSubmit)(e);
			}}
			className="space-y-4">
			<FieldGroup>
				<Field>
					<FieldLabel>{DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.LABELS.BROKEN_ITEMS}</FieldLabel>
					<Textarea
						value={brokenItemsText}
						onChange={handleBrokenItemsChange}
						disabled={noBrokenItems}
						className="min-h-15 resize-none"
						placeholder={DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.PLACEHOLDERS.BROKEN_ITEMS}
					/>
					<div className="flex items-center gap-2">
						<Checkbox
							id="no_broken_items"
							checked={noBrokenItems}
							onCheckedChange={(checked) => handleNoBrokenItemsToggle(checked === true)}
							disabled={hasBrokenItemsText}
							className="group-has-disabled/field:opacity-100"
							aria-invalid={!!form.formState.errors.no_broken_items}
						/>
						<Label htmlFor="no_broken_items" className="text-sm font-normal cursor-pointer">
							{DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.LABELS.NO_BROKEN_ITEMS}
						</Label>
					</div>
					{form.formState.errors.no_broken_items && (
						<FieldError>{form.formState.errors.no_broken_items.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel>{DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.LABELS.LOW_SUPPLIES}</FieldLabel>
					<Textarea
						value={lowSuppliesText}
						onChange={handleLowSuppliesChange}
						disabled={noLowSupplies}
						className="min-h-15 resize-none"
						placeholder={DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.PLACEHOLDERS.LOW_SUPPLIES}
					/>
					<div className="flex items-center gap-2">
						<Checkbox
							id="no_low_supplies"
							checked={noLowSupplies}
							onCheckedChange={(checked) => handleNoLowSuppliesToggle(checked === true)}
							disabled={hasLowSuppliesText}
							className="group-has-disabled/field:opacity-100"
							aria-invalid={!!form.formState.errors.no_low_supplies}
						/>
						<Label htmlFor="no_low_supplies" className="text-sm font-normal cursor-pointer">
							{DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.LABELS.NO_LOW_SUPPLIES}
						</Label>
					</div>
					{form.formState.errors.no_low_supplies && (
						<FieldError>{form.formState.errors.no_low_supplies.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel>{DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.LABELS.CLEANING_EVIDENCE}</FieldLabel>
					<FileUploader
						value={files}
						onValueChange={onFilesChange}
						dropzoneOptions={{
							maxFiles: 20,
							maxSize: bucketConfig.maxSize,
							accept: bucketConfig.accept,
						}}
						className="file-dropzone">
						<FileInput className="flex-col-center w-full pt-3 pb-4">
							<FileSvgDraw accept={bucketConfig.accept} />
						</FileInput>
						<FileUploaderContent className="flex flex-row flex-wrap items-center gap-2 mt-2">
							{files?.map((file, i) => {
								const isVideo =
									file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
								return (
									<FileUploaderItem key={`${file.name}-${file.lastModified}-${i}`} index={i}>
										{isVideo ? (
											<VideoThumbnail src={previewUrls[i] ?? ''} className="size-20" />
										) : (
											<img
												src={previewUrls[i]}
												alt={DICT.COMMON.IMAGES.PREVIEW}
												className="object-cover size-20"
											/>
										)}
									</FileUploaderItem>
								);
							})}
						</FileUploaderContent>
					</FileUploader>
					{form.formState.errors.has_evidence && (
						<FieldError>{form.formState.errors.has_evidence.message}</FieldError>
					)}
				</Field>
			</FieldGroup>

			<div className="pt-2 border-t border-border flex gap-3">
				{onCancel && (
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={onCancel}
						disabled={isSubmitting || form.formState.isSubmitting}>
						{DICT.COMMON.ACTIONS.BACK}
					</Button>
				)}
				<Button
					type="submit"
					className="flex-1"
					disabled={isSubmitting || form.formState.isSubmitting}>
					{isSubmitting
						? DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.BUTTONS.UPLOADING
						: DICT.CLEANINGS.DETAIL.EVIDENCE.FORM.BUTTONS.COMPLETE}
				</Button>
			</div>
		</form>
	);
}
