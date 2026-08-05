import { Component, type ErrorInfo, type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DICT } from '@/dictionary';
import { CONFIG } from '@/lib/config';

const CHUNK_RECOVERY_KEY = 'sw:recovering_chunk';

interface ErrorDisplayProps {
	title?: string;
	message?: string;
	buttonText?: string;
	onAction?: () => void;
	errorCode?: string | null;
}

export function ErrorDisplay({
	title = DICT.ERRORS.HTTP.DEFAULT_TITLE,
	message = DICT.ERRORS.HTTP.DEFAULT_MESSAGE,
	buttonText = DICT.ERRORS.HTTP.RETURN,
	onAction = () => window.location.reload(),
	errorCode = null,
}: ErrorDisplayProps) {
	const [imgError, setImgError] = useState(false);

	return (
		<main className="h-screen p-6 flex-col-center bg-muted">
			<div className="flex h-full w-full max-h-[90dvh] flex-col-center">
				{errorCode && !imgError && (
					<img
						src={new URL(`../assets/errors/${errorCode} error.svg`, import.meta.url).href}
						alt={`${errorCode} error illustration`}
						className="h-auto max-h-[60vh] w-full drop-shadow-md"
						onError={() => setImgError(true)}
					/>
				)}
				<div className="space-y-3 text-center">
					<h1 className="text-3xl font-extrabold tracking-tight uppercase text-foreground md:text-4xl">
						{title}
					</h1>
					<p className="max-w-md mx-auto text-lg text-muted-foreground md:text-xl">{message}</p>
				</div>
				<Button variant="default" size="xl" className="mt-12" onClick={onAction}>
					{buttonText}
				</Button>
			</div>
		</main>
	);
}

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

function isChunkLoadError(error: Error): boolean {
	const message = error.message.toLowerCase();
	return (
		message.includes('text/html') ||
		message.includes('loading chunk') ||
		error.name === 'ChunkLoadError' ||
		message.includes('dynamically imported') ||
		message.includes('failed to fetch dynamically imported module')
	);
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		if (import.meta.env.DEV) {
			console.error('ErrorBoundary caught an error:', error, info);
		}

		if (isChunkLoadError(error)) {
			const lastAttempt = Number(sessionStorage.getItem(CHUNK_RECOVERY_KEY) ?? 0);
			const elapsed = Number.isFinite(lastAttempt) ? Date.now() - lastAttempt : Infinity;
			if (elapsed > CONFIG.CHUNK_RECOVERY_COOLDOWN_MS) {
				sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(Date.now()));
				window.location.reload();
			}
		}
	}

	render() {
		if (this.state.hasError) {
			return <ErrorDisplay />;
		}

		return this.props.children;
	}
}
