import { test, expect, devices } from '@playwright/test';

const PRICING_URL = 'https://www.autymate.com/pricing';

test.describe('Production Tests - Desktop', () => {

  test('1. Start Free Trial button opens registration in new tab', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    const ctaButton = pricingFrame!.locator('a:has-text("Start Free Trial")');
    await expect(ctaButton).toBeVisible({ timeout: 15000 });

    // Verify attributes
    const target = await ctaButton.getAttribute('target');
    const href = await ctaButton.getAttribute('href');
    const rel = await ctaButton.getAttribute('rel');
    console.log(`CTA: target=${target} href=${href} rel=${rel}`);
    expect(target).toBe('_blank');
    expect(href).toContain('auth.autymate.com/Register');
    expect(rel).toContain('noopener');

    // Click and verify new tab
    const [newTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      ctaButton.click(),
    ]);
    expect(newTab.url()).toContain('auth.autymate.com');
    await newTab.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    const content = await newTab.content();
    expect(content).not.toContain('refused to connect');
    console.log('PASS: Registration page loaded in new tab, no iframe errors');
    await newTab.close();
  });

  test('2. Book Meeting flow opens branded booking page with Apollo calendar', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Remove consent overlays
    await page.evaluate(() => {
      document.querySelectorAll('[fs-consent-element]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    // Set slider to 51+ to trigger enterprise modal
    const slider = pricingFrame!.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 10000 });
    await slider.fill('51');
    await page.waitForTimeout(2000);

    // Click "Get My Custom Quote"
    const getQuoteBtn = pricingFrame!.locator('button:has-text("Get My Custom Quote")');
    await expect(getQuoteBtn).toBeVisible({ timeout: 5000 });
    await getQuoteBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Fill booking form
    await pricingFrame!.locator('input[name="email"]').fill('enterprise@acme.com');
    await pricingFrame!.locator('input[name="firstName"]').fill('Jane');
    await pricingFrame!.locator('input[name="lastName"]').fill('Smith');

    // Click "Book Meeting"
    const bookBtn = pricingFrame!.locator('button:has-text("Book Meeting")');
    const [bookingTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      bookBtn.click({ force: true }),
    ]);

    await bookingTab.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const url = bookingTab.url();
    console.log(`Booking URL: ${url}`);

    // Verify clean branded URL
    expect(url).not.toContain('about:blank');
    expect(url).toContain('pricing.auty.io');
    expect(url).toContain('bookMeeting=true');

    // Verify branded page rendered
    await expect(bookingTab.getByRole('heading', { name: 'Autymate' })).toBeVisible({ timeout: 5000 });
    await expect(bookingTab.getByRole('heading', { name: 'Strategy Session' })).toBeVisible();
    // "Select a Date & Time" shows initially then hides when Apollo loads
    await expect(bookingTab.locator('text=Select a Date & Time').or(bookingTab.locator('text=Please choose a day'))).toBeVisible();
    await expect(bookingTab.locator('text=Jane Smith')).toBeVisible();
    await expect(bookingTab.locator('text=enterprise@acme.com')).toBeVisible();
    await expect(bookingTab.locator('text=SOC 2')).toBeVisible();
    await expect(bookingTab.locator('text=Secure')).toBeVisible();

    // Wait for Apollo calendar
    await bookingTab.waitForTimeout(3000);
    const apolloLoaded = await bookingTab.evaluate(() => !!(window as any).ApolloMeetings);
    console.log(`Apollo loaded: ${apolloLoaded}`);
    expect(apolloLoaded).toBe(true);

    await bookingTab.screenshot({ path: 'test-results/prod-desktop-booking.png' });
    console.log('PASS: Branded booking page with Apollo calendar');
    await bookingTab.close();
  });

  test('3. Booking page works as direct URL', async ({ page }) => {
    await page.goto('https://pricing.auty.io/?bookMeeting=true&email=ceo@startup.io&firstName=Alex&lastName=Chen&sessionLength=30+min', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Verify page structure
    await expect(page.getByRole('heading', { name: 'Autymate' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Strategy Session')).toBeVisible();
    await expect(page.locator('text=Alex Chen')).toBeVisible();
    await expect(page.locator('text=ceo@startup.io')).toBeVisible();
    await expect(page.locator('text=30 min')).toBeVisible();

    // Verify hidden form has correct values
    const emailVal = await page.locator('#booking-form input[name="email"]').getAttribute('value');
    expect(emailVal).toBe('ceo@startup.io');

    // Wait for Apollo
    await page.waitForTimeout(3000);
    expect(await page.evaluate(() => !!(window as any).ApolloMeetings)).toBe(true);

    await page.screenshot({ path: 'test-results/prod-direct-booking.png', fullPage: true });
    console.log('PASS: Direct booking URL works with pre-filled data');
  });
});

test.describe('Production Tests - Mobile', () => {

  test('4. Mobile: Start Free Trial opens in new tab', async ({ browser }) => {
    const iPhone = devices['iPhone 13'];
    const context = await browser.newContext({ ...iPhone });
    const page = await context.newPage();

    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    const ctaButton = pricingFrame!.locator('a:has-text("Start Free Trial")');
    await expect(ctaButton).toBeVisible({ timeout: 15000 });
    expect(await ctaButton.getAttribute('target')).toBe('_blank');

    const [newTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      ctaButton.click(),
    ]);
    expect(newTab.url()).toContain('auth.autymate.com');
    console.log('PASS: Mobile - Start Free Trial opens in new tab');
    await context.close();
  });

  test('5. Mobile: Booking page is responsive', async ({ browser }) => {
    const iPhone = devices['iPhone 13'];
    const context = await browser.newContext({ ...iPhone });
    const page = await context.newPage();

    await page.goto('https://pricing.auty.io/?bookMeeting=true&email=mobile@test.com&firstName=Mobile&lastName=User&sessionLength=15+min', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await expect(page.getByRole('heading', { name: 'Autymate' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Mobile User')).toBeVisible();
    await expect(page.locator('text=mobile@test.com')).toBeVisible();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/prod-mobile-booking.png', fullPage: true });

    expect(await page.evaluate(() => !!(window as any).ApolloMeetings)).toBe(true);
    console.log('PASS: Mobile booking page renders and Apollo loads');
    await context.close();
  });
});
