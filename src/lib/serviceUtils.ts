import { DICT } from '@/dictionary';

export interface ActionResult<T> {
	data: T | null | undefined;
	error: string | null;
}

export interface MappableError {
	name?: string;
	code?: string;
	message?: string;
	details?: string;
	hint?: string;
}

export const mapDatabaseError = (error: MappableError): string => {
	const errorMap: Record<string, string> = {
		PGRST116: DICT.ERRORS.DATABASE.RECORD_NOT_FOUND,
		'42501': DICT.ERRORS.DATABASE.PERMISSION_DENIED,
		'23505': DICT.ERRORS.DATABASE.RECORD_EXISTS,
	};

	if (error.message?.includes('Failed to fetch')) {
		return DICT.ERRORS.COMMON.NETWORK;
	}
	if ('code' in error && error.code) {
		return errorMap[error.code] || error.message || DICT.ERRORS.COMMON.GENERIC;
	}
	return error.message || DICT.ERRORS.COMMON.GENERIC;
};
