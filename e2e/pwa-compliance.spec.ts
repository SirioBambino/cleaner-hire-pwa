import { expect, test } from '@playwright/test';

test('PWA compliance: manifest and offline check', async ({ page, context, browserName }) => {
	test.skip(browserName === 'webkit', 'Offline emulation is unstable in WebKit CI');

	test.slow();

	await page.goto('/');

	const manifest = page.locator('link[rel="manifest"]');
	await expect(manifest, 'HTML should contain a <link rel="manifest"> tag').toBeAttached();

	const manifestUrl = await manifest.getAttribute('href');
	if (manifestUrl) {
		const fullUrl = new URL(manifestUrl, page.url()).href;
		const response = await page.request.get(fullUrl);
		expect(response.status(), `Manifest at ${fullUrl} should return 200 OK`).toBe(200);
	}

	const isSwActive = await page.evaluate(async () => {
		if (!('serviceWorker' in navigator)) {
			return false;
		}
		const registration = await Promise.race([
			navigator.serviceWorker.ready,
			new Promise<null>((_, reject) => setTimeout(() => reject(), 5000)),
		]).catch(() => null);
		return !!registration?.active;
	});
	expect(isSwActive, 'Service Worker failed to activate within 5s').toBe(true);

	await context.setOffline(true);
	await page.reload({ waitUntil: 'networkidle' });

	await expect(page.locator('body')).not.toBeEmpty();

	await context.setOffline(false);
});
