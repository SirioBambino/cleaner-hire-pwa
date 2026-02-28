import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { router } from './routes';

describe('Navigation Router', () => {
	it('renders the Home page by default', () => {
		render(<RouterProvider router={router} />);
		expect(screen.getByRole('heading', { name: /Cleaner Hire PWA/i })).toBeDefined();
	});

	it('renders the navigation links', () => {
		render(<RouterProvider router={router} />);
		expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
		expect(screen.getByRole('link', { name: /Dashboard/i })).toBeDefined();
	});
});
