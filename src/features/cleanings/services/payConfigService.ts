'use client';

import { z } from 'zod';
import { DICT } from '@/dictionary';
import type { CleanerPayConfig } from '@/features/cleanings/types';
import { type ActionResult, mapDatabaseError } from '@/lib/serviceUtils';
import { supabase } from '@/lib/supabaseClient';

const CleanerPayConfigSchema = z.object({
	hourly_rate: z.number(),
	target_times: z.object({
		studio: z.number(),
		'1_bed': z.number(),
		'2_bed': z.number(),
		'3_bed': z.number(),
		'4_bed': z.number(),
	}),
	bathroom_time: z.number().default(0.5),
});

export const payConfigService = {
	async getCleanerPayConfig(): Promise<ActionResult<CleanerPayConfig>> {
		const { data, error } = await supabase.rpc('get_cleaner_pay_config');
		if (error) {
			return { data: null, error: mapDatabaseError(error) };
		}
		if (!data || data.length === 0) {
			return { data: null, error: DICT.ADMIN.CLEANINGS.ERROR_INVALID_PAY_CONFIG };
		}
		const parsed = CleanerPayConfigSchema.safeParse(data[0]);
		if (!parsed.success) {
			if (import.meta.env.DEV) {
				console.error('[PayConfig] RPC response validation failed:', parsed.error.issues);
			}
			return { data: null, error: DICT.ADMIN.CLEANINGS.ERROR_INVALID_PAY_CONFIG };
		}
		return { data: parsed.data, error: null };
	},

	async updateCleanerPayConfig(config: CleanerPayConfig): Promise<ActionResult<void>> {
		const { error } = await supabase.rpc('update_cleaner_pay_config', {
			p_hourly_rate: config.hourly_rate,
			p_target_times: config.target_times,
			p_bathroom_time: config.bathroom_time,
		});
		if (error) {
			return { data: null, error: mapDatabaseError(error) };
		}
		return { data: undefined, error: null };
	},
};
