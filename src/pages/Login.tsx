import { LoginForm } from '@/components/LoginForm';

export function LoginPage() {
	return (
		<div className="grid w-screen overflow-hidden h-svh lg:grid-cols-2 bg-background">
			<div className="flex flex-col items-center justify-center h-full p-8 md:p-16">
				<img
					src="logo.png"
					alt="Logo"
					className="w-110 relative right-2.5 object-contain mb-10 shrink-0"
				/>

				<div className="w-full max-w-[90vw] sm:max-w-xl lg:max-w-xs scale-100 sm:scale-110 lg:scale-100 origin-top shrink-0">
					<LoginForm />
				</div>
			</div>
			<div className="relative hidden h-full bg-muted lg:block">
				<img
					src="cleaners.jpg"
					alt="Cleaners ready to work"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
}
