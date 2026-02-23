import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	if (import.meta.env.DEV) {
		console.warn(
			'Supabase credentials missing. Ensure you have a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
		);
	} else {
		console.error('Error: Supabase environment variables are not defined.');
	}
}

export const supabase = createClient(
	supabaseUrl || 'https://placeholder-url.supabase.co',
	supabaseAnonKey || 'placeholder-key',
);
