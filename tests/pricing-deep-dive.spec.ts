import { test, expect } from '@playwright/test';

const PRICING_URL = 'https://www.autymate.com/pricing';

test.describe('Deep Dive: Find the broken CTA and test Apollo booking', () => {

  test('Find "Start Free — No Card Needed" element context', async ({ page }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Find the broken link and get its surrounding context
    const brokenLink = page.locator('a:has-text("Start Free — No Card Needed")');
    const count = await brokenLink.count();
    console.log(`Found ${count} "Start Free — No Card Needed" link(s)`);

    if (count > 0) {
      // Get the parent element context
      const context = await brokenLink.first().evaluate((el) => {
        // Get parent chain
        const parents: string[] = [];
        let current: HTMLElement | null = el as HTMLElement;
        for (let i = 0; i < 10 && current; i++) {
          const tag = current.tagName;
          const id = current.id ? `#${current.id}` : '';
          const cls = current.className ? `.${String(current.className).split(' ').join('.')}` : '';
          parents.push(`${tag}${id}${cls}`);
          current = current.parentElement;
        }

        // Get the outer HTML of the link and its nearby siblings
        const parent = (el as HTMLElement).parentElement;
        const parentHTML = parent?.outerHTML?.substring(0, 2000) || 'N/A';

        // Get the section/div context
        const section = (el as HTMLElement).closest('section, [class*="pricing"], [class*="cta"], [id*="pricing"]');

        return {
          linkHTML: (el as HTMLElement).outerHTML,
          parentChain: parents,
          parentHTML: parentHTML,
          sectionId: section?.id || null,
          sectionClass: section?.className || null,
          linkRect: (el as HTMLElement).getBoundingClientRect(),
        };
      });

      console.log('\n=== BROKEN LINK CONTEXT ===');
      console.log('Link HTML:', context.linkHTML);
      console.log('Parent chain:', context.parentChain);
      console.log('Section id:', context.sectionId);
      console.log('Section class:', context.sectionClass);
      console.log('Position:', JSON.stringify(context.linkRect));
      console.log('\nParent HTML (truncated):', context.parentHTML);
    }

    // Also capture ALL link elements on the page to auth.autymate.com with their section context
    const allLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="auth.autymate.com"]');
      return Array.from(links).map((el, i) => {
        const section = el.closest('section, header, footer, nav, [class*="section"]');
        return {
          index: i,
          text: el.textContent?.trim(),
          href: el.getAttribute('href'),
          target: el.getAttribute('target'),
          sectionTag: section?.tagName,
          sectionId: section?.id,
          sectionClass: section?.className?.substring(0, 100),
          inIframe: false,
        };
      });
    });

    console.log('\n=== ALL REGISTRATION LINKS ON PARENT PAGE ===');
    for (const link of allLinks) {
      console.log(`  ${link.index}: "${link.text}" | target=${link.target} | section=${link.sectionTag}#${link.sectionId} .${link.sectionClass}`);
    }
  });

  test('Test Apollo booking in iframe context', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Find the pricing iframe
    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();
    console.log(`Pricing iframe: ${pricingFrame!.url()}`);

    // Set slider to high value to trigger contact modal
    const slider = pricingFrame!.locator('input[type="range"]');
    await expect(slider).toBeVisible({ timeout: 10000 });

    const max = await slider.getAttribute('max');
    console.log(`Setting slider to max (${max})...`);
    await slider.fill(max || '100');
    await page.waitForTimeout(2000);

    // Take screenshot showing the contact modal
    await page.screenshot({ path: 'test-results/10-contact-modal.png', fullPage: false });

    // Check if contact modal appeared in the pricing iframe
    const modalVisible = await pricingFrame!.locator('text=Custom Pricing').or(pricingFrame!.locator('text=Custom Plan')).or(pricingFrame!.locator('text=Enterprise Plan')).first().isVisible().catch(() => false);
    console.log(`Contact modal visible: ${modalVisible}`);

    if (modalVisible) {
      // Find and click "Get My Custom Quote"
      const getQuoteBtn = pricingFrame!.locator('button:has-text("Get My Custom Quote")');
      if (await getQuoteBtn.count() > 0 && await getQuoteBtn.isVisible()) {
        console.log('Clicking "Get My Custom Quote"...');
        await getQuoteBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/11-scheduling-form.png', fullPage: false });

        // Fill in the form
        const emailField = pricingFrame!.locator('input[name="email"]');
        const firstNameField = pricingFrame!.locator('input[name="firstName"]');
        const lastNameField = pricingFrame!.locator('input[name="lastName"]');

        if (await emailField.isVisible()) {
          await emailField.fill('playwright-test@example.com');
          await firstNameField.fill('Playwright');
          await lastNameField.fill('Test');
          console.log('Form filled');

          await page.screenshot({ path: 'test-results/12-form-filled.png', fullPage: false });

          // Click "Book Meeting" and check for popup
          const bookBtn = pricingFrame!.locator('button:has-text("Book Meeting")');
          if (await bookBtn.count() > 0) {
            console.log('Clicking "Book Meeting"...');

            const [popup] = await Promise.all([
              context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
              bookBtn.click(),
            ]);

            await page.waitForTimeout(2000);

            if (popup) {
              const popupUrl = popup.url();
              console.log(`Popup opened: ${popupUrl}`);
              await popup.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
              await popup.screenshot({ path: 'test-results/13-popup.png' }).catch(() => {});

              const popupContent = await popup.content();
              const hasBooking = popupContent.includes('Book a Meeting') || popupContent.includes('apollo') || popupContent.includes('ApolloMeetings');
              console.log(`Popup has booking content: ${hasBooking}`);

              // Check for Apollo widget initialization
              const apolloStatus = await popup.evaluate(() => ({
                hasApolloMeetings: !!(window as any).ApolloMeetings,
                bodyHTML: document.body.innerHTML.substring(0, 500),
              })).catch(() => ({ hasApolloMeetings: false, bodyHTML: 'error' }));
              console.log(`Popup Apollo status:`, JSON.stringify(apolloStatus));

              await popup.close();
            } else {
              console.log('No popup opened');
              await page.screenshot({ path: 'test-results/13-no-popup.png', fullPage: false });

              // Check if Apollo widget opened inline
              const apolloWidget = await page.evaluate(() => {
                const apolloElements = document.querySelectorAll('[id*="apollo"], [class*="apollo"], [data-apollo]');
                return {
                  count: apolloElements.length,
                  elements: Array.from(apolloElements).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className?.toString().substring(0, 100),
                    visible: (el as HTMLElement).offsetWidth > 0,
                  }))
                };
              });
              console.log('Apollo elements on page:', JSON.stringify(apolloWidget, null, 2));
            }
          }
        }
      } else {
        console.log('"Get My Custom Quote" button not found or not visible');

        // Check for "Talk to Sales" or direct enterprise link
        const talkToSales = pricingFrame!.locator('text=Talk to Sales');
        if (await talkToSales.count() > 0) {
          console.log('"Talk to Sales" found - checking attributes');
          const text = await talkToSales.first().textContent();
          console.log(`Text: "${text}"`);
        }
      }
    } else {
      // Maybe the modal appears outside the iframe or we need to look elsewhere
      console.log('Modal not found in pricing iframe, checking main page...');

      // Look for Enterprise section
      const enterpriseSection = pricingFrame!.locator('text=Enterprise');
      if (await enterpriseSection.count() > 0) {
        console.log('Enterprise section found, clicking...');
        await enterpriseSection.first().click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/10b-after-enterprise-click.png', fullPage: false });
      }
    }
  });

  test('Verify our iframe CTA works end-to-end', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const pricingFrame = page.frames().find(f => f.url().includes('pricing.auty.io'));
    expect(pricingFrame).toBeTruthy();

    // Find our "Start Free Trial — No Credit Card" button
    const ctaButton = pricingFrame!.locator('a:has-text("Start Free Trial")');
    await expect(ctaButton).toBeVisible({ timeout: 10000 });

    const target = await ctaButton.getAttribute('target');
    const href = await ctaButton.getAttribute('href');
    const rel = await ctaButton.getAttribute('rel');

    console.log(`Our CTA: target=${target} href=${href} rel=${rel}`);
    expect(target).toBe('_blank');
    expect(href).toContain('auth.autymate.com/Register');
    expect(rel).toContain('noopener');

    // Click it and verify it opens in a new tab
    const [newTab] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      ctaButton.click(),
    ]);

    console.log(`New tab opened: ${newTab.url()}`);
    expect(newTab.url()).toContain('auth.autymate.com');

    await newTab.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    const content = await newTab.content();
    const hasRefusedError = content.includes('refused to connect');
    console.log(`Has "refused to connect" error: ${hasRefusedError}`);
    expect(hasRefusedError).toBe(false);

    await newTab.screenshot({ path: 'test-results/20-new-tab-register.png' }).catch(() => {});
    console.log('SUCCESS: CTA opens registration in new tab without iframe errors');
    await newTab.close();
  });
});
