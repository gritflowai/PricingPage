import { test, expect, devices } from '@playwright/test';

test.describe('UX Fixes Verification', () => {

  test('1. Onboarding Form ID field is hidden from user', async ({ page }) => {
    await page.goto('https://www.autymate.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });

    // Remove consent overlays
    await page.evaluate(() => {
      document.querySelectorAll('[fs-consent-element]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    // Trigger enterprise modal
    const slider = pricingFrame!.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 10000 });
    await slider.fill('51');
    await page.waitForTimeout(2000);

    // Click "Get My Custom Quote"
    const getQuoteBtn = pricingFrame!.locator('button:has-text("Get My Custom Quote")');
    await expect(getQuoteBtn).toBeVisible({ timeout: 5000 });
    await getQuoteBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Verify form fields that SHOULD be visible
    await expect(pricingFrame!.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
    await expect(pricingFrame!.locator('input[name="firstName"]')).toBeVisible();
    await expect(pricingFrame!.locator('input[name="lastName"]')).toBeVisible();
    await expect(pricingFrame!.locator('select[name="sessionLength"]')).toBeVisible();
    await expect(pricingFrame!.locator('button:has-text("Book Meeting")')).toBeVisible();

    // Verify "Onboarding Form ID" label is NOT visible
    const formIdLabel = pricingFrame!.locator('text=Onboarding Form ID');
    expect(await formIdLabel.count()).toBe(0);
    console.log('PASS: Onboarding Form ID label is not visible');

    // Verify the formId input exists but is hidden (type="hidden")
    const hiddenFormId = pricingFrame!.locator('input[name="formId"][type="hidden"]');
    expect(await hiddenFormId.count()).toBe(1);
    console.log('PASS: formId is passed as hidden input');

    await page.screenshot({ path: 'test-results/ux-no-formid-field.png', fullPage: false });
  });

  test('2. Booking page hides heading when Apollo calendar appears', async ({ page }) => {
    await page.goto('https://pricing.auty.io/?bookMeeting=true&email=test@test.com&firstName=Test&lastName=User', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Initially "Select a Date & Time" should be visible (while loading)
    // Then it should hide once Apollo calendar shows
    await page.waitForTimeout(4000); // Wait for Apollo to load and submit

    await page.screenshot({ path: 'test-results/ux-booking-after-apollo.png', fullPage: true });

    // After Apollo loads, the heading should be hidden
    const heading = page.locator('h3:has-text("Select a Date & Time")');
    const headingVisible = await heading.isVisible().catch(() => false);
    console.log(`"Select a Date & Time" heading visible after Apollo: ${headingVisible}`);
    expect(headingVisible).toBe(false);

    // Apollo should have loaded
    const apolloLoaded = await page.evaluate(() => !!(window as any).ApolloMeetings);
    expect(apolloLoaded).toBe(true);
    console.log('PASS: Heading hidden after Apollo calendar loaded');
  });

  test('3. Full flow: no Form ID, clean booking page', async ({ page, context }) => {
    await page.goto('https://www.autymate.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });

    await page.evaluate(() => {
      document.querySelectorAll('[fs-consent-element]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    // Trigger modal, fill form, book
    await pricingFrame!.locator('input[type="range"]').fill('51');
    await page.waitForTimeout(2000);
    await pricingFrame!.locator('button:has-text("Get My Custom Quote")').click({ force: true });
    await page.waitForTimeout(1000);

    await pricingFrame!.locator('input[name="email"]').fill('ux-test@acme.com');
    await pricingFrame!.locator('input[name="firstName"]').fill('UX');
    await pricingFrame!.locator('input[name="lastName"]').fill('Test');

    const [bookingTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      pricingFrame!.locator('button:has-text("Book Meeting")').click({ force: true }),
    ]);

    await bookingTab.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const url = bookingTab.url();
    console.log(`Booking URL: ${url}`);
    expect(url).toContain('pricing.auty.io');
    expect(url).toContain('bookMeeting=true');

    // Verify user info
    await expect(bookingTab.locator('text=UX Test')).toBeVisible({ timeout: 5000 });
    await expect(bookingTab.locator('text=ux-test@acme.com')).toBeVisible();

    // Wait for Apollo and verify heading is gone
    await bookingTab.waitForTimeout(4000);
    const headingGone = !(await bookingTab.locator('h3:has-text("Select a Date & Time")').isVisible().catch(() => false));
    console.log(`Heading hidden after Apollo: ${headingGone}`);
    expect(headingGone).toBe(true);

    await bookingTab.screenshot({ path: 'test-results/ux-full-flow.png', fullPage: true });
    console.log('PASS: Full flow clean — no Form ID, heading hidden after Apollo');
    await bookingTab.close();
  });

  test('4. Mobile: scheduling form has no Form ID field', async ({ browser }) => {
    const iPhone = devices['iPhone 13'];
    const ctx = await browser.newContext({ ...iPhone });
    const page = await ctx.newPage();

    await page.goto('https://www.autymate.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });

    await page.evaluate(() => {
      document.querySelectorAll('[fs-consent-element]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    await pricingFrame!.locator('input[type="range"]').fill('51');
    await page.waitForTimeout(2000);
    await pricingFrame!.locator('button:has-text("Get My Custom Quote")').click({ force: true });
    await page.waitForTimeout(1000);

    // No "Onboarding Form ID" label visible
    expect(await pricingFrame!.locator('text=Onboarding Form ID').count()).toBe(0);
    await page.screenshot({ path: 'test-results/ux-mobile-no-formid.png', fullPage: false });
    console.log('PASS: Mobile — no Onboarding Form ID field');
    await ctx.close();
  });
});
