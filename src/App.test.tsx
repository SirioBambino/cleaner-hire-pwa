import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { router } from './lib/router'; // Adjust this path to where your router is defined

describe('App Component', () => {
	it('renders the main heading', () => {
		render(<App />);
		expect(screen.getByText(/Cleaner Hire PWA/i)).toBeDefined();
	});
});

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
