import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CleaningEvidenceForm } from '@/features/cleanings/components/CleaningEvidenceForm';

describe('Cleaner Evidence Submission', () => {
	it('renders form with text areas and submit button', () => {
		const onSubmit = vi.fn();

		render(<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />);

		expect(screen.getByText(/Any broken or damaged items/i)).toBeInTheDocument();
		expect(screen.getByText(/Any supplies running low/i)).toBeInTheDocument();
		expect(screen.getByText(/Cleaning Evidence/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Complete Cleaning/i })).toBeInTheDocument();
	});

	it('shows back button when onCancel is provided', () => {
		const onSubmit = vi.fn();
		const onCancel = vi.fn();

		render(
			<CleaningEvidenceForm
				cleaningId="c1"
				cleanerId="u1"
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
	});

	it('calls onCancel when back button clicked', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const onCancel = vi.fn();

		render(
			<CleaningEvidenceForm
				cleaningId="c1"
				cleanerId="u1"
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		await user.click(screen.getByRole('button', { name: /Back/i }));

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('accepts text input in broken items and low supplies fields', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />);

		const brokenInput = screen.getByPlaceholderText(/Describe any issues found/i);
		const suppliesInput = screen.getByPlaceholderText(/List items like/i);

		await user.type(brokenInput, 'Broken vase in living room');
		await user.type(suppliesInput, 'Running low on toilet paper');

		expect(brokenInput).toHaveValue('Broken vase in living room');
		expect(suppliesInput).toHaveValue('Running low on toilet paper');
	});

	it('calls onSubmit with form values and files when submitted with evidence', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		const { container } = render(
			<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />,
		);

		const brokenInput = screen.getByPlaceholderText(/Describe any issues found/i);
		await user.type(brokenInput, 'Broken vase');

		const suppliesInput = screen.getByPlaceholderText(/List items like/i);
		await user.type(suppliesInput, 'Low on supplies');

		const fileInput = container.querySelector('input[type="file"]');
		if (!fileInput) {
			throw new Error('File input not found');
		}

		const testFile = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
		fireEvent.change(fileInput, { target: { files: [testFile] } });

		await user.click(screen.getByRole('button', { name: /Complete Cleaning/i }));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledOnce();
		});

		const [values, files] = onSubmit.mock.calls[0] as [
			{
				broken_items_report: string;
				low_supplies_report: string;
				no_broken_items: boolean;
				no_low_supplies: boolean;
			},
			File[],
		];
		expect(values.broken_items_report).toBe('Broken vase');
		expect(values.low_supplies_report).toBe('Low on supplies');
		expect(values.no_broken_items).toBe(false);
		expect(values.no_low_supplies).toBe(false);
		expect(files).toHaveLength(1);
		expect(files[0].name).toBe('evidence.jpg');
	});

	it('blocks submission when report fields are blank and no-issue checkboxes are unchecked', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		const { container } = render(
			<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />,
		);

		const fileInput = container.querySelector('input[type="file"]');
		if (!fileInput) {
			throw new Error('File input not found');
		}

		const testFile = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
		fireEvent.change(fileInput, { target: { files: [testFile] } });

		await user.click(screen.getByRole('button', { name: /Complete Cleaning/i }));

		expect(
			await screen.findByText(/Describe any broken or damaged items or confirm there are none/i),
		).toBeInTheDocument();
		expect(
			await screen.findByText(/Describe any low supplies or confirm there are none/i),
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits with no-issue checkboxes when report fields are left blank', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		const { container } = render(
			<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />,
		);

		await user.click(
			screen.getByRole('checkbox', { name: /No broken or damaged items to report/i }),
		);
		await user.click(screen.getByRole('checkbox', { name: /No low supplies to report/i }));

		const fileInput = container.querySelector('input[type="file"]');
		if (!fileInput) {
			throw new Error('File input not found');
		}

		const testFile = new File(['test'], 'evidence.jpg', { type: 'image/jpeg' });
		fireEvent.change(fileInput, { target: { files: [testFile] } });

		await user.click(screen.getByRole('button', { name: /Complete Cleaning/i }));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledOnce();
		});

		const [values] = onSubmit.mock.calls[0] as [
			{
				broken_items_report: string;
				low_supplies_report: string;
				no_broken_items: boolean;
				no_low_supplies: boolean;
			},
			File[],
		];
		expect(values.no_broken_items).toBe(true);
		expect(values.no_low_supplies).toBe(true);
		expect(values.broken_items_report).toBe('');
		expect(values.low_supplies_report).toBe('');
	});

	it('disables the no-issue checkbox once text is typed', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />);

		const brokenInput = screen.getByPlaceholderText(/Describe any issues found/i);
		await user.type(brokenInput, 'Broken vase');

		expect(
			screen.getByRole('checkbox', { name: /No broken or damaged items to report/i }),
		).toBeDisabled();
	});

	it('re-enables the no-issue checkbox when typed text is cleared', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />);

		const brokenInput = screen.getByPlaceholderText(/Describe any issues found/i);
		const checkbox = screen.getByRole('checkbox', {
			name: /No broken or damaged items to report/i,
		});

		await user.type(brokenInput, 'Broken vase');
		expect(checkbox).toBeDisabled();

		await user.clear(brokenInput);
		expect(checkbox).toBeEnabled();
	});

	it('disables the textarea once its no-issue checkbox is checked', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<CleaningEvidenceForm cleaningId="c1" cleanerId="u1" onSubmit={onSubmit} />);

		await user.click(
			screen.getByRole('checkbox', { name: /No broken or damaged items to report/i }),
		);

		expect(screen.getByPlaceholderText(/Describe any issues found/i)).toBeDisabled();
	});
});
