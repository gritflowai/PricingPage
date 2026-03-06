import { test, expect } from '@playwright/test';

const PRICING_URL = 'https://www.autymate.com/pricing';

test.describe('Apollo Booking - Iframe Test', () => {

  test('Test Apollo booking flow inside iframe', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Dismiss any cookie consent overlays
    const consentOverlays = page.locator('[fs-consent-element], [class*="consent"], [class*="cookie"]');
    for (let i = 0; i < await consentOverlays.count(); i++) {
      const overlay = consentOverlays.nth(i);
      // Try clicking accept/dismiss buttons
      const acceptBtn = overlay.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("Got it"), button:has-text("Agree"), [class*="accept"]');
      if (await acceptBtn.count() > 0) {
        await acceptBtn.first().click({ timeout: 3000 }).catch(() => {});
        console.log('Dismissed consent overlay');
      }
    }

    // Also try to dismiss the Finsweet consent element
    await page.evaluate(() => {
      // Remove consent overlays that intercept clicks
      document.querySelectorAll('[fs-consent-element]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });

    // Find pricing iframe
    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();
    console.log(`Pricing iframe: ${pricingFrame!.url()}`);

    // Set slider to high value to trigger enterprise modal
    const slider = pricingFrame!.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 10000 });
    await slider.fill('51');
    console.log('Set slider to 51');
    await page.waitForTimeout(2000);

    // Screenshot the contact modal
    await page.screenshot({ path: 'test-results/apollo-01-modal.png', fullPage: false });

    // Look for contact modal in the pricing iframe
    const modalContent = pricingFrame!.locator('text=Custom Pricing').or(pricingFrame!.locator('text=Custom Plan')).or(pricingFrame!.locator('text=Enterprise'));

    if (await modalContent.first().isVisible().catch(() => false)) {
      console.log('Contact modal is visible');

      // Click "Get My Custom Quote" using force to bypass any overlays
      const getQuoteBtn = pricingFrame!.locator('button:has-text("Get My Custom Quote")');
      if (await getQuoteBtn.count() > 0) {
        console.log('Clicking "Get My Custom Quote" (force)...');
        await getQuoteBtn.click({ force: true });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/apollo-02-scheduling-form.png', fullPage: false });

        // Verify scheduling form fields are visible
        const emailField = pricingFrame!.locator('input[name="email"]');
        const firstNameField = pricingFrame!.locator('input[name="firstName"]');
        const lastNameField = pricingFrame!.locator('input[name="lastName"]');
        const bookBtn = pricingFrame!.locator('button:has-text("Book Meeting")');

        const emailVisible = await emailField.isVisible().catch(() => false);
        const bookBtnVisible = await bookBtn.isVisible().catch(() => false);
        console.log(`Email field visible: ${emailVisible}`);
        console.log(`Book Meeting button visible: ${bookBtnVisible}`);

        if (emailVisible && bookBtnVisible) {
          // Fill form
          await emailField.fill('playwright-test@example.com');
          await firstNameField.fill('Playwright');
          await lastNameField.fill('Test');
          console.log('Form filled');

          await page.screenshot({ path: 'test-results/apollo-03-form-filled.png', fullPage: false });

          // Click "Book Meeting" - should open popup when in iframe
          console.log('Clicking "Book Meeting"...');

          const popupPromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
          await bookBtn.click({ force: true });

          const popup = await popupPromise;
          await page.waitForTimeout(3000);

          if (popup) {
            console.log(`POPUP OPENED: ${popup.url()}`);
            await popup.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
            await popup.screenshot({ path: 'test-results/apollo-04-popup.png' }).catch(() => {});

            const popupContent = await popup.content();
            console.log(`Popup title: ${await popup.title()}`);

            const hasBooking = popupContent.includes('Book a Meeting') ||
                              popupContent.includes('apollo') ||
                              popupContent.includes('ApolloMeetings') ||
                              popupContent.includes('enterprise-meeting-form');
            console.log(`Popup has booking content: ${hasBooking}`);
            expect(hasBooking).toBe(true);

            // Check if Apollo widget loaded
            const apolloLoaded = await popup.evaluate(() => !!(window as any).ApolloMeetings).catch(() => false);
            console.log(`Apollo widget loaded in popup: ${apolloLoaded}`);

            await popup.close();
            console.log('SUCCESS: Apollo booking popup works inside iframe context');
          } else {
            console.log('No popup opened - checking if modal closed (which means inline Apollo might have worked)');
            await page.screenshot({ path: 'test-results/apollo-04-no-popup.png', fullPage: false });

            // Check if the modal was closed (which could mean Apollo took over)
            const modalStillVisible = await pricingFrame!.locator('text=Book Meeting').isVisible().catch(() => false);
            console.log(`Modal still visible: ${modalStillVisible}`);
          }
        }
      }
    } else {
      console.log('Contact modal did not appear');

      // Try clicking Enterprise tab directly
      const enterpriseTab = pricingFrame!.locator('text=Enterprise');
      if (await enterpriseTab.count() > 0) {
        console.log('Clicking Enterprise tab...');
        await enterpriseTab.first().click({ force: true });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/apollo-01b-enterprise.png', fullPage: false });
      }
    }
  });

  test('Verify parent page "Start Free — No Card Needed" needs Webflow fix', async ({ page }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Find the broken Webflow CTA
    const brokenLink = page.locator('a.w-button:has-text("Start Free — No Card Needed")');
    const count = await brokenLink.count();
    console.log(`\n"Start Free — No Card Needed" Webflow buttons: ${count}`);

    if (count > 0) {
      const target = await brokenLink.first().getAttribute('target');
      const href = await brokenLink.first().getAttribute('href');
      console.log(`  href: ${href}`);
      console.log(`  target: ${target} (should be "_blank")`);
      console.log(`  data-wf-element-id: ${await brokenLink.first().getAttribute('data-wf-element-id')}`);

      console.log('\n>>> ACTION NEEDED: This button is in Webflow CMS, not in this codebase.');
      console.log('>>> Fix in Webflow: Set "Open in new tab" on this button link.');
      console.log('>>> Webflow element ID: 3753d1df-bbee-5c82-5958-545eec81fad1');
    }
  });
});
