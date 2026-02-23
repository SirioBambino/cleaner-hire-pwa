import { createBrowserRouter, Link, Outlet, ScrollRestoration } from 'react-router-dom';
import { App } from '../App';

const RootLayout = () => (
	<div className="min-h-screen bg-background font-sans antialiased text-foreground">
		<header className="border-b bg-card p-4">
			<nav className="container mx-auto flex gap-6">
				<Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
					Home
				</Link>
				<Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
					Dashboard
				</Link>
			</nav>
		</header>

		<main className="container mx-auto p-6">
			<Outlet />
		</main>
		<ScrollRestoration />
	</div>
);

export const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		children: [
			{
				index: true,
				element: <App />,
			},
			{
				path: 'dashboard',
				element: <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>,
			},
		],
	},
]);
