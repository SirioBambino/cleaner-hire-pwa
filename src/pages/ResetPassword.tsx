import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordPage() {
	return (
		<div className="grid w-screen overflow-hidden h-svh lg:grid-cols-2 bg-background">
			<div className="relative flex flex-col items-center justify-center h-full p-8 md:p-16">
				<div className="absolute top-8 left-8">
					<Link to="/login">
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-foreground">
							<ChevronLeft className="w-4 h-4 mr-2" /> Back to login
						</Button>
					</Link>
				</div>

				<img
					src="logo.png"
					alt="Logo"
					className="w-80 lg:w-110 mb-10 relative right-2.5 object-contain shrink-0"
				/>

				<div className="w-full max-w-[90vw] sm:max-w-xl lg:max-w-xs scale-100 sm:scale-110 lg:scale-100 origin-top shrink-0 space-y-6">
					<div className="space-y-2 text-center lg:text-left">
						<h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
						<p className="text-sm text-muted-foreground">
							Enter your email address and we'll send you a link to reset your password.
						</p>
					</div>

					<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
						<div className="space-y-2">
							<Label htmlFor="email">Email address</Label>
							<Input
								id="email"
								type="email"
								placeholder="account@example.com"
								required
								className="h-11 rounded-xl border-zinc-200 focus:ring-primary"
							/>
						</div>
						<Button type="submit" className="w-full font-semibold h-11 rounded-xl">
							Send reset link
						</Button>
					</form>
				</div>
			</div>

			<div className="relative hidden bg-muted lg:block">
				<img
					src="computer.avif"
					alt="Reset your access"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
}
