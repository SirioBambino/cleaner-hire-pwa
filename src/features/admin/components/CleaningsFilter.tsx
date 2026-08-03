'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DebouncedInput } from '@/components/ui/debounced-input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DICT } from '@/dictionary';
import { CLEANING_STATUS } from '@/features/cleanings/types';

interface CleaningsFilterProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusChange: (value: string) => void;
	cleanerFilter: string;
	onCleanerChange: (value: string) => void;
	upcomingFilter: boolean;
	onUpcomingChange: (value: boolean) => void;
	onClear: () => void;
	availableCleaners: { id: string; full_name: string | null }[];
	showCleanerFilter?: boolean;
	searchDebounceMs?: number;
}

export function CleaningsFilter({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusChange,
	cleanerFilter,
	onCleanerChange,
	upcomingFilter,
	onUpcomingChange,
	onClear,
	availableCleaners,
	showCleanerFilter = true,
	searchDebounceMs = 300,
}: CleaningsFilterProps) {
	const filtersDict = DICT.ADMIN.CLEANINGS.FILTERS;
	const statusDict = DICT.ADMIN.CLEANINGS.STATUS_OPTIONS;

	const statusOptions = [
		{ label: statusDict.ALL, value: 'all' },
		{ label: statusDict.REQUESTED, value: CLEANING_STATUS.REQUESTED },
		{ label: statusDict.CONFIRMED, value: CLEANING_STATUS.CONFIRMED },
		{ label: statusDict.IN_PROGRESS, value: CLEANING_STATUS.IN_PROGRESS },
		{ label: statusDict.COMPLETED, value: CLEANING_STATUS.COMPLETED },
		{ label: statusDict.CANCELLED, value: CLEANING_STATUS.CANCELLED },
	];

	return (
		<Card className="mb-4 py-1">
			<div className="p-3 flex flex-wrap gap-4">
				<div className="flex-1 relative min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<DebouncedInput
						className="h-8 pl-9"
						placeholder={filtersDict.SEARCH_PLACEHOLDER}
						value={searchQuery}
						onValueChange={onSearchChange}
						debounceMs={searchDebounceMs}
					/>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(value) => {
						onStatusChange(value);
					}}>
					<SelectTrigger className="w-[150px]" aria-label={filtersDict.STATUS}>
						<SelectValue placeholder={filtersDict.STATUS} />
					</SelectTrigger>
					<SelectContent>
						{statusOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{showCleanerFilter && (
					<Select
						value={cleanerFilter}
						onValueChange={(value) => {
							onCleanerChange(value);
						}}>
						<SelectTrigger className="w-[150px]" aria-label={filtersDict.CLEANER}>
							<SelectValue placeholder={filtersDict.CLEANER} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{filtersDict.ALL_CLEANERS}</SelectItem>
							<SelectItem value="unassigned">{filtersDict.UNASSIGNED}</SelectItem>
							{availableCleaners.map((cleaner) => (
								<SelectItem key={cleaner.id} value={cleaner.id}>
									{cleaner.full_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				<div className="flex items-center gap-2">
					<Checkbox
						id="admin-cleanings-upcoming"
						checked={upcomingFilter}
						onCheckedChange={(checked) => {
							onUpcomingChange(checked === true);
						}}
					/>
					<Label htmlFor="admin-cleanings-upcoming" className="text-sm cursor-pointer">
						{filtersDict.ONLY_UPCOMING}
					</Label>
				</div>
				<Button className="h-8" variant="outline" onClick={onClear}>
					{filtersDict.CLEAR}
				</Button>
			</div>
		</Card>
	);
}
