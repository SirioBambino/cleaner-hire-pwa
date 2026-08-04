'use client';

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { cleaningsService } from '@/features/cleanings/services/cleaningsService';
import type { CleanerPayConfig } from '@/features/cleanings/types';
import { supabase } from '@/lib/supabaseClient';

interface CleanerPayContextValue {
	config: CleanerPayConfig | null;
	refresh: () => Promise<void>;
}

const CleanerPayContext = createContext<CleanerPayContextValue | null>(null);

export function CleanerPayProvider({ children }: { children: ReactNode }) {
	const [config, setConfig] = useState<CleanerPayConfig | null>(null);
	const { user } = useAuth();
	const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

	const refresh = useCallback(async () => {
		if (!user) {
			setConfig(null);
			return;
		}
		const result = await cleaningsService.getCleanerPayConfig();
		if (result.data) {
			setConfig(result.data);
		}
	}, [user]);

	useEffect(() => {
		if (!user) {
			setConfig(null);
			return;
		}

		let cancelled = false;
		const fetchConfig = async () => {
			const result = await cleaningsService.getCleanerPayConfig();
			if (!cancelled && result.data) {
				setConfig(result.data);
			}
		};
		fetchConfig();
		return () => {
			cancelled = true;
		};
	}, [user]);

	useEffect(() => {
		if (!user) {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
			return;
		}

		if (channelRef.current) {
			return;
		}

		const newChannel = supabase
			.channel('cleaner-pay-config-realtime')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'cleaner_pay_config',
				},
				() => {
					refresh();
				},
			)
			.subscribe((status: string, err?: unknown) => {
				if (err && import.meta.env.PROD) {
					console.error('[CleanerPay] Channel error', { status, error: err });
				}
			});

		channelRef.current = newChannel;

		return () => {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [user, refresh]);

	return (
		<CleanerPayContext.Provider value={{ config, refresh }}>{children}</CleanerPayContext.Provider>
	);
}

export function useCleanerPayConfig(): {
	config: CleanerPayConfig | null;
	refresh: () => Promise<void>;
} {
	const ctx = useContext(CleanerPayContext);
	if (!ctx) {
		throw new Error('useCleanerPayConfig must be used within a CleanerPayProvider');
	}
	return { config: ctx.config, refresh: ctx.refresh };
}
