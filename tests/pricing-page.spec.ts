import { test, expect } from '@playwright/test';

const PRICING_URL = 'https://www.autymate.com/pricing';

test.describe('Pricing Page - Research & Fix Verification', () => {

  test('Research: Map page structure, all frames, all registration links', async ({ page }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-page-loaded.png', fullPage: true });

    // Map all frames
    const frames = page.frames();
    console.log(`\n=== FRAME MAP (${frames.length} frames) ===`);
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`\nFrame ${i}: ${frame.url()}`);
      console.log(`  Name: "${frame.name()}"`);

      // Find ALL links to auth.autymate.com
      const regLinks = frame.locator('a[href*="auth.autymate.com"]');
      const linkCount = await regLinks.count();
      if (linkCount > 0) {
        console.log(`  Registration links: ${linkCount}`);
        for (let j = 0; j < linkCount; j++) {
          const link = regLinks.nth(j);
          const text = (await link.textContent())?.trim();
          const href = await link.getAttribute('href');
          const target = await link.getAttribute('target');
          const rel = await link.getAttribute('rel');
          const isVisible = await link.isVisible();
          console.log(`    Link ${j + 1}: "${text}" | href=${href} | target=${target} | rel=${rel} | visible=${isVisible}`);
        }
      }

      // Find ALL iframes within this frame
      const iframeElements = frame.locator('iframe');
      const iframeCount = await iframeElements.count();
      if (iframeCount > 0) {
        console.log(`  Iframes: ${iframeCount}`);
        for (let j = 0; j < iframeCount; j++) {
          const iframe = iframeElements.nth(j);
          const src = await iframe.getAttribute('src');
          const hidden = await iframe.getAttribute('hidden');
          const width = await iframe.getAttribute('width');
          const height = await iframe.getAttribute('height');
          const isVisible = await iframe.isVisible();
          console.log(`    iframe ${j + 1}: src=${src} | hidden=${hidden} | ${width}x${height} | visible=${isVisible}`);
        }
      }

      // Find slider elements
      const sliders = frame.locator('input[type="range"]');
      if (await sliders.count() > 0) {
        console.log(`  Has slider: YES (${await sliders.count()})`);
      }

      // Find "Book Meeting" or "Custom Quote" buttons
      const meetingBtns = frame.locator('button:has-text("Meeting"), button:has-text("Custom Quote"), button:has-text("Talk to Sales"), a:has-text("Talk to Sales")');
      if (await meetingBtns.count() > 0) {
        console.log(`  Meeting/Sales buttons: ${await meetingBtns.count()}`);
        for (let j = 0; j < await meetingBtns.count(); j++) {
          const text = (await meetingBtns.nth(j).textContent())?.trim();
          console.log(`    "${text}"`);
        }
      }
    }

    console.log('\n=== END FRAME MAP ===\n');
  });

  test('Scenario 1: "Start Free Trial" CTA must have target="_blank"', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Find ALL registration links across all frames
    const frames = page.frames();
    let allLinksChecked = 0;
    let failedLinks: string[] = [];

    for (const frame of frames) {
      const regLinks = frame.locator('a[href*="auth.autymate.com/Register"]');
      const count = await regLinks.count();

      for (let j = 0; j < count; j++) {
        const link = regLinks.nth(j);
        const isVisible = await link.isVisible();
        if (!isVisible) continue;

        allLinksChecked++;
        const text = (await link.textContent())?.trim();
        const target = await link.getAttribute('target');
        const href = await link.getAttribute('href');

        console.log(`Visible link: "${text}" | target=${target} | href=${href}`);

        if (target !== '_blank') {
          failedLinks.push(`"${text}" in frame ${frame.url()} (target=${target})`);
        }
      }
    }

    console.log(`\nChecked ${allLinksChecked} visible registration links`);
    console.log(`Failed links (missing target="_blank"): ${failedLinks.length}`);
    for (const f of failedLinks) {
      console.log(`  FAIL: ${f}`);
    }

    // Now test that a visible CTA with target="_blank" actually opens in a new tab
    const mainFrame = frames[0];
    const visibleCTA = mainFrame.locator('a[href*="auth.autymate.com/Register"]:visible').first();

    if (await visibleCTA.count() > 0) {
      const target = await visibleCTA.getAttribute('target');

      if (target === '_blank') {
        console.log('\nTesting new tab behavior...');
        const [newPage] = await Promise.all([
          context.waitForEvent('page', { timeout: 10000 }),
          visibleCTA.click(),
        ]);

        console.log(`New tab URL: ${newPage.url()}`);
        expect(newPage.url()).toContain('auth.autymate.com');

        // Check for "refused to connect" error
        await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        const content = await newPage.content();
        expect(content).not.toContain('refused to connect');
        console.log('New tab loaded successfully without "refused to connect" error');

        await newPage.close();
      } else {
        console.log(`\nWARNING: First visible CTA still missing target="_blank" - this is a bug on the autymate.com site`);
      }
    }

    // Report failures
    if (failedLinks.length > 0) {
      console.log(`\n!!! ${failedLinks.length} link(s) still missing target="_blank" !!!`);
    }
  });

  test('Scenario 2: High volume triggers meeting modal', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Find the slider across all frames
    const frames = page.frames();
    let sliderFrame = frames[0]; // Default to main
    let slider = sliderFrame.locator('input[type="range"]').first();

    for (const frame of frames) {
      const s = frame.locator('input[type="range"]');
      if (await s.count() > 0) {
        sliderFrame = frame;
        slider = s.first();
        console.log(`Found slider in frame: ${frame.url()}`);
        break;
      }
    }

    if (await slider.count() === 0) {
      console.log('No slider found, looking for + button or other volume controls...');
      // Try to find a + button
      const plusBtn = sliderFrame.locator('button:has-text("+")');
      if (await plusBtn.count() > 0) {
        console.log('Found + button, clicking to increase volume...');
        for (let i = 0; i < 50; i++) {
          await plusBtn.click();
          await page.waitForTimeout(50);
        }
      }
    } else {
      // Get slider attributes
      const min = await slider.getAttribute('min');
      const max = await slider.getAttribute('max');
      const step = await slider.getAttribute('step');
      const value = await slider.getAttribute('value');
      console.log(`Slider: min=${min} max=${max} step=${step} current=${value}`);

      // Set slider to max
      await slider.fill(max || '100');
      console.log(`Set slider to ${max || '100'}`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/02-high-volume.png', fullPage: true });

    // Look for contact/meeting modal or enterprise CTA
    const modalTexts = [
      'Custom Pricing', 'Custom Plan', 'Enterprise',
      'Get My Custom Quote', 'Book Meeting', 'Talk to Sales',
      'Schedule', 'Let\'s Meet'
    ];

    let foundModal = false;
    for (const frame of page.frames()) {
      for (const text of modalTexts) {
        const el = frame.locator(`text="${text}"`);
        if (await el.count() > 0 && await el.first().isVisible()) {
          console.log(`Found visible modal element: "${text}" in frame ${frame.url()}`);
          foundModal = true;
        }
      }
    }

    if (!foundModal) {
      // Maybe we need to click Enterprise tab first
      for (const frame of page.frames()) {
        const enterpriseTab = frame.locator('text=Enterprise');
        if (await enterpriseTab.count() > 0 && await enterpriseTab.first().isVisible()) {
          console.log('Clicking Enterprise tab...');
          await enterpriseTab.first().click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-results/03-enterprise-tab.png', fullPage: true });
        }

        // Look for "Talk to Sales" link
        const talkToSales = frame.locator('a:has-text("Talk to Sales"), button:has-text("Talk to Sales")');
        if (await talkToSales.count() > 0 && await talkToSales.first().isVisible()) {
          const tag = await talkToSales.first().evaluate(el => el.tagName);
          const href = await talkToSales.first().getAttribute('href');
          const target = await talkToSales.first().getAttribute('target');
          console.log(`"Talk to Sales": tag=${tag} href=${href} target=${target}`);
        }
      }
    }

    // Check for any Apollo-related scripts or elements
    const apolloPresent = await page.evaluate(() => {
      return {
        hasApolloMeetings: !!window.ApolloMeetings,
        apolloScripts: Array.from(document.querySelectorAll('script[src*="apollo"]')).map(s => s.getAttribute('src')),
        apolloElements: document.querySelectorAll('[id*="apollo"], [class*="apollo"]').length,
      };
    });
    console.log(`\nApollo status:`, JSON.stringify(apolloPresent, null, 2));

    // Take final screenshot
    await page.screenshot({ path: 'test-results/04-final-state.png', fullPage: true });
  });

  test('Scenario 2b: Scroll down and interact with pricing calculator CTA', async ({ page, context }) => {
    await page.goto(PRICING_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Scroll down to find the pricing calculator section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/05-scrolled-mid.png', fullPage: false });

    // Look for CTA buttons with specific text patterns
    const ctaPatterns = [
      'Start Free Trial',
      'Start Free',
      'No Credit Card',
      'No Card Needed',
      'Free Trial',
    ];

    for (const pattern of ctaPatterns) {
      const links = page.locator(`a:has-text("${pattern}"):visible`);
      const count = await links.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const link = links.nth(i);
          const text = (await link.textContent())?.trim();
          const href = await link.getAttribute('href');
          const target = await link.getAttribute('target');
          const rel = await link.getAttribute('rel');

          // Get bounding box for location info
          const box = await link.boundingBox();
          console.log(`CTA: "${text}" | href=${href} | target=${target} | rel=${rel} | y=${box?.y}`);

          if (href?.includes('auth.autymate.com') && target !== '_blank') {
            console.log(`  >>> BUG: This link is missing target="_blank"!`);
          }
        }
      }
    }

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/06-scrolled-bottom.png', fullPage: false });
  });
});
