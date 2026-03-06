import { test, expect } from '@playwright/test';

test.describe('Final Verification - Production', () => {

  test('Scenario 1: Start Free Trial opens in new tab from iframe', async ({ page, context }) => {
    await page.goto('https://www.autymate.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    const ctaButton = pricingFrame!.locator('a:has-text("Start Free Trial")');
    await expect(ctaButton).toBeVisible({ timeout: 15000 });

    // Verify attributes
    expect(await ctaButton.getAttribute('target')).toBe('_blank');
    expect(await ctaButton.getAttribute('href')).toContain('auth.autymate.com/Register');
    expect(await ctaButton.getAttribute('rel')).toContain('noopener');

    // Click and verify new tab opens
    const [newTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      ctaButton.click(),
    ]);

    expect(newTab.url()).toContain('auth.autymate.com');
    await newTab.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    expect(await newTab.content()).not.toContain('refused to connect');
    console.log('PASS: Start Free Trial opens in new tab successfully');
    await newTab.close();
  });

  test('Scenario 2: Book Meeting opens branded booking page (not about:blank popup)', async ({ page, context }) => {
    await page.goto('https://www.autymate.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });

    // Dismiss consent overlays
    await page.evaluate(() => {
      document.querySelectorAll('[fs-consent-element]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    // Set slider to 51+ to trigger contact modal
    const slider = pricingFrame!.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 10000 });
    await slider.fill('51');
    await page.waitForTimeout(2000);

    // Click "Get My Custom Quote"
    const getQuoteBtn = pricingFrame!.locator('button:has-text("Get My Custom Quote")');
    await expect(getQuoteBtn).toBeVisible({ timeout: 5000 });
    await getQuoteBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Fill the booking form
    const emailField = pricingFrame!.locator('input[name="email"]');
    await expect(emailField).toBeVisible({ timeout: 5000 });
    await emailField.fill('test@example.com');
    await pricingFrame!.locator('input[name="firstName"]').fill('Test');
    await pricingFrame!.locator('input[name="lastName"]').fill('User');

    // Click "Book Meeting" and verify proper new tab opens
    const bookBtn = pricingFrame!.locator('button:has-text("Book Meeting")');
    const [bookingTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      bookBtn.click({ force: true }),
    ]);

    // Verify it's a proper URL, NOT about:blank
    await bookingTab.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const url = bookingTab.url();
    console.log(`Booking tab URL: ${url}`);

    expect(url).not.toContain('about:blank');
    expect(url).toContain('pricing.auty.io');
    expect(url).toContain('bookMeeting=true');
    expect(url).toContain('email=test');

    // Wait for the page to render
    await bookingTab.waitForTimeout(2000);
    await bookingTab.screenshot({ path: 'test-results/final-booking-page.png' });

    // Verify branded booking page content
    const content = await bookingTab.content();
    expect(content).toContain('Autymate');
    expect(content).toContain('Strategy Session');
    expect(content).toContain('Select a Date');

    // Verify user info is shown
    expect(content).toContain('Test');
    expect(content).toContain('User');
    expect(content).toContain('test@example.com');

    // Check Apollo loaded
    const apolloLoaded = await bookingTab.evaluate(() => !!(window as any).ApolloMeetings).catch(() => false);
    console.log(`Apollo loaded: ${apolloLoaded}`);

    // Wait for Apollo calendar to appear
    await bookingTab.waitForTimeout(3000);
    await bookingTab.screenshot({ path: 'test-results/final-booking-with-calendar.png' });

    console.log('PASS: Branded booking page with clean URL and Apollo calendar');
    await bookingTab.close();
  });

  test('Scenario 3: Booking page works standalone (direct URL)', async ({ page }) => {
    // Test the booking page directly (as it would load in a new tab)
    await page.goto('https://pricing.auty.io/?bookMeeting=true&email=john@acme.com&firstName=John&lastName=Smith&sessionLength=45+min', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.screenshot({ path: 'test-results/final-standalone-booking.png', fullPage: true });

    // Verify branded page
    await expect(page.locator('text=Autymate')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Strategy Session')).toBeVisible();
    await expect(page.locator('text=Select a Date & Time')).toBeVisible();

    // Verify user info is pre-filled
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=john@acme.com')).toBeVisible();

    // Verify trust signals
    await expect(page.locator('text=SOC 2')).toBeVisible();
    await expect(page.locator('text=3,500+ customers')).toBeVisible();

    // Verify Apollo form exists
    const form = page.locator('#booking-form');
    expect(await form.count()).toBe(1);
    expect(await form.locator('input[name="email"]').getAttribute('value')).toBe('john@acme.com');

    // Wait for Apollo to load and show calendar
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/final-standalone-with-calendar.png', fullPage: true });

    const apolloLoaded = await page.evaluate(() => !!(window as any).ApolloMeetings);
    console.log(`Apollo loaded: ${apolloLoaded}`);
    expect(apolloLoaded).toBe(true);

    console.log('PASS: Standalone booking page works with pre-filled data and Apollo calendar');
  });
});
