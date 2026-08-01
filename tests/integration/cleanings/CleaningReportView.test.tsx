import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DICT } from '@/dictionary';
import { CleaningReportView } from '@/features/cleanings/components/CleaningReportView';
import { buildCleaning } from '~/factories';

describe('CleaningReportView', () => {
	const baseProps = {
		evidenceMedia: [],
		expiryInfo: null,
		onMediaClick: vi.fn(),
	};

	it('renders fallback text when report fields are blank or null', () => {
		const cleaning = buildCleaning({
			report: {
				broken_items_report: '',
				low_supplies_report: null,
				created_at: new Date().toISOString(),
			},
		});

		render(<CleaningReportView cleaning={cleaning} {...baseProps} />);

		expect(screen.getByText(DICT.CLEANINGS.DETAIL.REPORT.NO_BROKEN_ITEMS)).toBeInTheDocument();
		expect(screen.getByText(DICT.CLEANINGS.DETAIL.REPORT.NO_LOW_SUPPLIES)).toBeInTheDocument();
	});

	it('renders the reported text when provided', () => {
		const cleaning = buildCleaning({
			report: {
				broken_items_report: 'Broken vase in living room',
				low_supplies_report: 'Running low on toilet paper',
				created_at: new Date().toISOString(),
			},
		});

		render(<CleaningReportView cleaning={cleaning} {...baseProps} />);

		expect(screen.getByText('Broken vase in living room')).toBeInTheDocument();
		expect(screen.getByText('Running low on toilet paper')).toBeInTheDocument();
		expect(
			screen.queryByText(DICT.CLEANINGS.DETAIL.REPORT.NO_BROKEN_ITEMS),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(DICT.CLEANINGS.DETAIL.REPORT.NO_LOW_SUPPLIES),
		).not.toBeInTheDocument();
	});

	it('does not render the report sections when no report exists', () => {
		const cleaning = buildCleaning({ report: null });

		render(<CleaningReportView cleaning={cleaning} {...baseProps} />);

		expect(screen.queryByText(DICT.CLEANINGS.DETAIL.REPORT.BROKEN_ITEMS)).not.toBeInTheDocument();
		expect(screen.queryByText(DICT.CLEANINGS.DETAIL.REPORT.LOW_SUPPLIES)).not.toBeInTheDocument();
	});
});
