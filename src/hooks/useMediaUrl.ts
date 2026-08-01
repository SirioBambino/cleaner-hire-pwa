'use client';

import { useEffect, useState } from 'react';
import type { StorageBucket } from '@/lib/mediaService';
import { mediaService } from '@/lib/mediaService';

const FALLBACK = '/placeholder-image.webp';

export function useMediaUrl(
	path: string | null | undefined,
	bucket: StorageBucket,
	expiresIn = 3600,
): string {
	const [url, setUrl] = useState<string>(FALLBACK);

	useEffect(() => {
		if (!path || path === 'Placeholder' || path.trim() === '') {
			setUrl(FALLBACK);
			return;
		}

		if (path.startsWith('http') || path.startsWith('blob:')) {
			setUrl(path);
			return;
		}

		let cancelled = false;

		const refresh = async () => {
			const signedUrl = await mediaService.getSignedUrl(path, bucket, expiresIn);
			if (!cancelled) {
				setUrl(signedUrl ?? FALLBACK);
			}
		};

		refresh();

		const id = setInterval(refresh, expiresIn * 750);

		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [path, bucket, expiresIn]);

	return url;
}
