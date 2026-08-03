'use client';

import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

interface DebouncedInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
	value: string;
	onValueChange: (value: string) => void;
	debounceMs?: number;
}

function DebouncedInput({ value, onValueChange, debounceMs = 300, ...rest }: DebouncedInputProps) {
	const [localValue, setLocalValue] = useState(value);
	const onValueChangeRef = useRef(onValueChange);

	useEffect(() => {
		onValueChangeRef.current = onValueChange;
	}, [onValueChange]);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		if (debounceMs <= 0) {
			return;
		}
		const timer = setTimeout(() => {
			onValueChangeRef.current(localValue);
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [localValue, debounceMs]);

	if (debounceMs <= 0) {
		return (
			<Input
				{...rest}
				value={value}
				onChange={(e) => {
					onValueChange(e.target.value);
				}}
			/>
		);
	}

	return (
		<Input
			{...rest}
			value={localValue}
			onChange={(e) => {
				setLocalValue(e.target.value);
			}}
		/>
	);
}

export { DebouncedInput };
