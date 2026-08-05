import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CONFIG } from '@/lib/config';

const CHUNK_RECOVERY_KEY = 'sw:recovering_chunk';

interface ThrowableProps {
	onThrow: () => never;
}

function Throwable({ onThrow }: ThrowableProps): never {
	throw onThrow();
}

function throwChunkError(): never {
	throw new Error('Failed to fetch dynamically imported module');
}

function throwGenericError(): never {
	throw new Error('unexpected boom');
}

describe('ErrorBoundary', () => {
	const reloadMock = vi.fn();

	beforeEach(() => {
		reloadMock.mockClear();
		const realLocation = window.location;
		Object.defineProperty(window, 'location', {
			configurable: true,
			writable: true,
			value: {
				...realLocation,
				href: realLocation.href,
				pathname: realLocation.pathname,
				search: realLocation.search,
				hash: realLocation.hash,
				reload: reloadMock,
			},
		});
		sessionStorage.clear();
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it('reloads once on a chunk load error and records the recovery attempt', () => {
		render(
			<ErrorBoundary>
				<Throwable onThrow={throwChunkError} />
			</ErrorBoundary>,
		);

		expect(window.location.reload).toHaveBeenCalledTimes(1);
		expect(Number(sessionStorage.getItem(CHUNK_RECOVERY_KEY))).toBeGreaterThan(0);
	});

	it('does not reload again while a recovery attempt is still recent', () => {
		sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(Date.now()));

		render(
			<ErrorBoundary>
				<Throwable onThrow={throwChunkError} />
			</ErrorBoundary>,
		);

		expect(window.location.reload).not.toHaveBeenCalled();
	});

	it('reloads again after the cooldown has elapsed', () => {
		sessionStorage.setItem(
			CHUNK_RECOVERY_KEY,
			String(Date.now() - CONFIG.CHUNK_RECOVERY_COOLDOWN_MS - 1),
		);

		render(
			<ErrorBoundary>
				<Throwable onThrow={throwChunkError} />
			</ErrorBoundary>,
		);

		expect(window.location.reload).toHaveBeenCalledTimes(1);
	});

	it('does not reload for non-chunk errors', () => {
		render(
			<ErrorBoundary>
				<Throwable onThrow={throwGenericError} />
			</ErrorBoundary>,
		);

		expect(window.location.reload).not.toHaveBeenCalled();
		expect(sessionStorage.getItem(CHUNK_RECOVERY_KEY)).toBeNull();
	});

	it('renders children normally when no error is thrown', () => {
		render(
			<ErrorBoundary>
				<div>content</div>
			</ErrorBoundary>,
		);

		expect(screen.getByText('content')).toBeInTheDocument();
		expect(window.location.reload).not.toHaveBeenCalled();
	});
});
