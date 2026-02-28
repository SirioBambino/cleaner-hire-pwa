import { Outlet, ScrollRestoration } from 'react-router-dom';

export const AuthLayout = () => (
	<div className="flex items-center min-h-screen bg-background font-sans antialiased text-foreground">
		<main className="w-full h-full">
			<Outlet />
		</main>
		<ScrollRestoration />
	</div>
);
