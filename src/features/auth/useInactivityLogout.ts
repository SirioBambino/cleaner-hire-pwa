import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/authService';
import { CONFIG } from '@/lib/config';

/**
 * Hook that automatically logs out the user after a period of inactivity.
 * Respects the 'trust_device' localStorage flag - trusted devices bypass logout.
 *
 * @param timeoutMs - Time in milliseconds before auto-logout (default: 30 minutes)
 *
 * @example
 * ```typescript
 * useInactivityLogout(); // 30 min timeout
 * useInactivityLogout(15 * 60 * 1000); // 15 min timeout
 * ```
 */
export function useInactivityLogout(timeoutMs = CONFIG.INACTIVITY_TIMEOUT_MS) {
	const navigate = useNavigate();
	const timeoutRef = useRef<number | null>(null);

	const logout = useCallback(async () => {
		navigate('/login?reason=inactivity', { replace: true });
		await authService.signOut();
	}, [navigate]);

	const resetTimer = useCallback(() => {
		if (timeoutRef.current) {
			window.clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = window.setTimeout(logout, timeoutMs);
	}, [timeoutMs, logout]);

	useEffect(() => {
		let isTrusted = false;
		try {
			isTrusted = localStorage.getItem('trust_device') === 'true';
		} catch {
			// localStorage can throw when storage access is blocked (private mode or disabled cookies)
			isTrusted = false;
		}
		if (isTrusted) {
			return;
		}

		const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];

		events.forEach((event) => {
			window.addEventListener(event, resetTimer);
		});

		resetTimer();

		return () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}
			events.forEach((event) => {
				window.removeEventListener(event, resetTimer);
			});
		};
	}, [resetTimer]);
}
