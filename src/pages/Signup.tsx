'use client';

import { ArrowRight, BrushCleaning, Building2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { SignupForm } from '@/components/SignupForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function SignupPage() {
	const [accountType, setAccountType] = useState<'host' | 'cleaner' | null>(null);

	return (
		<div className="flex items-center justify-center w-full h-screen p-4 overflow-hidden bg-background md:p-6">
			<div className="absolute inset-0 z-0">
				<div className="w-full h-2/3 portrait:h-1/2 bg-background" />
				<div className="w-full h-1/3 portrait:h-1/2 bg-primary" />

				<div className="absolute left-0 w-full overflow-hidden rotate-180 -translate-y-full top-2/3 portrait:top-1/2 leading-0">
					<svg
						className="relative block w-[calc(100%+1.3px)] h-20 md:h-37.5 -translate-y-1"
						data-name="Layer 1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 1200 120"
						preserveAspectRatio="none">
						<title>Decorative wave divider</title>
						<path
							d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
							opacity=".25"
							className="fill-primary"></path>
						<path
							d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
							opacity=".5"
							className="fill-primary"></path>
						<path
							d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
							className="fill-primary"></path>
					</svg>
				</div>
			</div>
			<div className="w-full max-w-3xl z-1">
				{!accountType ? (
					<div className="flex flex-col justify-center space-y-4 duration-500 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
						<div className="space-y-1 text-center">
							<h1 className="text-2xl font-extrabold tracking-tight md:text-4xl text-foreground">
								Join FreshersCo
							</h1>
							<p className="text-sm text-muted-foreground md:text-lg">
								Select how you'll be using our platform.
							</p>
						</div>

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
							<button
								type="button"
								onClick={() => setAccountType('host')}
								className={cn(
									'group flex flex-col items-start p-4 md:p-8 bg-card border-2 border-border rounded-2xl md:rounded-3xl transition-all duration-300 w-full',
									'hover:border-primary hover:shadow-lg xl:hover:-translate-y-1 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring',
								)}>
								<div className="p-3 text-primary transition-colors md:p-4 rounded-xl md:rounded-2xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground -translate-x-1.25 -translate-y-1.25">
									<Building2 className="w-6 h-6 md:w-8 md:h-8" />
								</div>
								<h3 className="mt-2 text-lg font-bold md:mt-6 md:text-xl text-card-foreground">
									Host
								</h3>
								<p className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">
									I want my properties professionally cleaned.
								</p>
								<div className="flex items-center gap-2 mt-3 text-xs font-semibold opacity-100 md:mt-6 text-primary md:text-sm xl:opacity-0 xl:group-hover:opacity-100">
									Get Started <ArrowRight size={14} className="md:w-4 md:h-4" />
								</div>
							</button>

							<button
								type="button"
								onClick={() => setAccountType('cleaner')}
								className={cn(
									'group flex flex-col items-start p-4 md:p-8 bg-card border-2 border-border rounded-2xl md:rounded-3xl transition-all duration-300 w-full',
									'hover:border-primary hover:shadow-lg xl:hover:-translate-y-1 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring',
								)}>
								<div className="p-3 text-primary transition-colors md:p-4 rounded-xl md:rounded-2xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground -translate-x-1.25 -translate-y-1.25">
									<BrushCleaning className="w-6 h-6 md:w-8 md:h-8" />
								</div>
								<h3 className="mt-2 text-lg font-bold md:mt-6 md:text-xl text-card-foreground">
									Cleaner
								</h3>
								<p className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">
									I want to find cleaning jobs for my schedule.
								</p>
								<div className="flex items-center gap-2 mt-3 text-xs font-semibold opacity-100 md:mt-6 text-primary md:text-sm xl:opacity-0 xl:group-hover:opacity-100">
									Get Started <ArrowRight size={14} className="md:w-4 md:h-4" />
								</div>
							</button>
						</div>
					</div>
				) : (
					<div className="duration-300 animate-in fade-in zoom-in-95">
						<Card className="relative border-none shadow-2xl rounded-3xl overflow-hidden max-h-[95vh] flex flex-col bg-card">
							<CardContent className="flex flex-col p-0 -translate-y-6">
								<div className="p-2 text-center bg-primary md:p-4 text-primary-foreground">
									<h2 className="text-lg font-bold capitalize md:text-2xl">
										Register as {accountType}
									</h2>
								</div>

								<div className="relative p-5 overflow-y-auto bg-card md:p-8 lg:overflow-visible">
									<SignupForm />
								</div>
							</CardContent>

							<div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none md:p-7">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setAccountType(null)}
									className="h-8 transition-colors pointer-events-auto text-muted-foreground hover:text-foreground hover:bg-accent">
									<ChevronLeft className="w-4 h-4 mr-1" /> Back to selection
								</Button>
							</div>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
