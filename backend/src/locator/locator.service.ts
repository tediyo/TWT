import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { chromium, Page, Frame } from 'playwright';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from './search-history.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LocatorService {
    constructor(
        @InjectRepository(SearchHistory)
        private searchHistoryRepository: Repository<SearchHistory>,
    ) { }

    /**
     * Launch a stealth browser context that looks like a real Chrome browser.
     * Optionally inject cookies for authenticated pages.
     */
    private async launchBrowser(cookies?: { name: string; value: string; domain: string; path?: string; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' }[]) {
        const browser = await chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
            ],
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US',
            colorScheme: 'light',
            ignoreHTTPSErrors: true,
        });

        // Inject cookies for authenticated pages
        if (cookies && cookies.length > 0) {
            const playwrightCookies = cookies.map(c => ({
                name: c.name,
                value: c.value,
                domain: c.domain,
                path: c.path || '/',
                secure: c.secure || false,
                sameSite: c.sameSite || 'Lax' as const,
            }));
            await context.addCookies(playwrightCookies);
            console.log(`[Locator] Injected ${playwrightCookies.length} cookies`);
        }

        const page = await context.newPage();

        // Hide webdriver flag
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        return { browser, context, page };
    }

    /**
     * Navigate to a URL with fallback strategies.
     */
    private async navigateWithFallback(page: Page, url: string) {
        console.log(`[Locator] Navigating to: ${url}`);

        // Strategy 1: networkidle (best, but hangs on sites with persistent connections)
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
            console.log('[Locator] Loaded with networkidle');
            return;
        } catch {
            console.log('[Locator] networkidle timed out, trying load...');
        }

        // Strategy 2: load
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 20000 });
            console.log('[Locator] Loaded with load event');
            return;
        } catch {
            console.log('[Locator] load timed out, trying domcontentloaded...');
        }

        // Strategy 3: domcontentloaded (always works, but content may not be rendered)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('[Locator] Loaded with domcontentloaded');
    }

    /**
     * Dismiss cookie consent banners if present.
     */
    private async dismissCookieBanners(page: Page) {
        try {
            const cookieSelectors = [
                'button:has-text("Accept")',
                'button:has-text("Accept All")',
                'button:has-text("Accept all")',
                'button:has-text("Got it")',
                'button:has-text("I agree")',
                'button:has-text("OK")',
                'button:has-text("Allow")',
                'button:has-text("Allow all")',
                '[id*="cookie"] button',
                '[class*="cookie"] button',
                '[id*="consent"] button',
                '[class*="consent"] button',
            ];
            for (const sel of cookieSelectors) {
                const btn = page.locator(sel).first();
                if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
                    await btn.click({ timeout: 2000 }).catch(() => { });
                    await page.waitForTimeout(1000);
                    console.log(`[Locator] Dismissed cookie banner with: ${sel}`);
                    break;
                }
            }
        } catch { }
    }

    /**
     * The in-browser scanning function that finds elements matching a keyword.
     * This is passed to page.evaluate() / frame.evaluate().
     */
    private getScanFunction() {
        return (kw: string) => {
            // --- Helper functions ---
            function getDirectText(el: Element): string {
                let text = '';
                for (const node of el.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        text += node.textContent?.trim() || '';
                    }
                }
                return text.trim();
            }

            function escapeCssIdent(s: string): string {
                return s.replace(/([^\w-])/g, '\\$1');
            }

            function getRelativeXPath(el: Element): string {
                if (el.id) return `//*[@id="${el.id}"]`;
                let current: Element | null = el;
                const path: string[] = [];
                while (current && current !== document.documentElement) {
                    if (current.id && current !== el) {
                        return `//*[@id="${current.id}"]/${path.join('/')}`;
                    }
                    const tag = current.tagName.toLowerCase();
                    let index = 1;
                    let sibling = current.previousElementSibling;
                    while (sibling) {
                        if (sibling.tagName === current.tagName) index++;
                        sibling = sibling.previousElementSibling;
                    }
                    const siblings = current.parentElement
                        ? Array.from(current.parentElement.children).filter(c => c.tagName === current!.tagName)
                        : [];
                    path.unshift(siblings.length > 1 ? `${tag}[${index}]` : tag);
                    current = current.parentElement;
                }
                return '/html/' + path.join('/');
            }

            function getFullXPath(el: Element): string {
                let current: Element | null = el;
                const path: string[] = [];
                while (current && current !== document.documentElement) {
                    const tag = current.tagName.toLowerCase();
                    let index = 1;
                    let sibling = current.previousElementSibling;
                    while (sibling) {
                        if (sibling.tagName === current.tagName) index++;
                        sibling = sibling.previousElementSibling;
                    }
                    const siblings = current.parentElement
                        ? Array.from(current.parentElement.children).filter(c => c.tagName === current!.tagName)
                        : [];
                    path.unshift(siblings.length > 1 ? `${tag}[${index}]` : tag);
                    current = current.parentElement;
                }
                return '/html/' + path.join('/');
            }

            function getCssSelector(el: Element): string {
                if (el.id) return `#${escapeCssIdent(el.id)}`;
                let current: Element | null = el;
                const parts: string[] = [];
                while (current && current !== document.body && current !== document.documentElement) {
                    if (current.id) {
                        parts.unshift(`#${escapeCssIdent(current.id)}`);
                        break;
                    }
                    const tag = current.tagName.toLowerCase();
                    const parent = current.parentElement;
                    let selector = tag;
                    if (parent) {
                        const siblings = Array.from(parent.children);
                        const sameTagSiblings = siblings.filter((s: Element) => s.tagName === current!.tagName);
                        if (sameTagSiblings.length > 1) {
                            if (current.className && typeof current.className === 'string') {
                                const classes = current.className.trim().split(/\s+/).filter(Boolean);
                                if (classes.length > 0) {
                                    selector += '.' + classes.map(c => escapeCssIdent(c)).join('.');
                                }
                            }
                            const selectorClasses = typeof current.className === 'string' ? current.className : '';
                            const stillAmbiguous = sameTagSiblings.filter((s: Element) => {
                                const sClasses = typeof s.className === 'string' ? s.className : '';
                                return sClasses === selectorClasses;
                            });
                            if (stillAmbiguous.length > 1) {
                                const childIndex = siblings.indexOf(current) + 1;
                                selector += `:nth-child(${childIndex})`;
                            }
                        }
                    }
                    parts.unshift(selector);
                    current = parent;
                }
                return parts.join(' > ');
            }

            function getJsPath(el: Element): string {
                const sel = getCssSelector(el);
                return `document.querySelector("${sel.replace(/"/g, '\\"')}")`;
            }

            function getStyles(el: Element): string {
                const computed = window.getComputedStyle(el);
                const importantProps = [
                    'display', 'position', 'width', 'height', 'margin', 'padding',
                    'background', 'background-color', 'color', 'font-size', 'font-weight',
                    'font-family', 'border', 'border-radius', 'box-shadow', 'opacity',
                    'cursor', 'text-align', 'line-height', 'overflow', 'z-index',
                    'transition', 'transform', 'flex', 'grid',
                ];
                const lines: string[] = [];
                for (const prop of importantProps) {
                    const val = computed.getPropertyValue(prop);
                    if (val && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== '0px' && val !== 'static') {
                        lines.push(`${prop}: ${val};`);
                    }
                }
                return lines.join('\n');
            }

            // --- Scan ALL elements (not just specific tags) ---
            const allElements = document.querySelectorAll('*');

            // Step 1: Collect all matching elements first
            const matchedElements: Element[] = [];

            allElements.forEach((el) => {
                // Skip script, style, meta, etc.
                const tag = el.tagName.toLowerCase();
                if (['script', 'style', 'meta', 'link', 'head', 'html', 'body', 'noscript', 'br', 'hr'].includes(tag)) return;

                // Skip invisible elements
                try {
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden') return;
                    // Skip elements with 0 size (truly hidden)
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 && rect.height === 0) return;
                } catch { return; }

                const id = el.id || '';
                const name = (el as any).name || '';
                const placeholder = (el as any).placeholder || '';
                const ariaLabel = el.getAttribute('aria-label') || '';
                const className = typeof el.className === 'string' ? el.className : '';
                const directText = getDirectText(el);
                const title = el.getAttribute('title') || '';
                const value = (el as any).value || '';
                const alt = el.getAttribute('alt') || '';
                const href = el.getAttribute('href') || '';
                const dataTestId = el.getAttribute('data-testid') || el.getAttribute('data-test-id') || '';
                const type = el.getAttribute('type') || '';
                const role = el.getAttribute('role') || '';
                const forAttr = el.getAttribute('for') || '';
                const src = el.getAttribute('src') || '';
                const action = (el as any).action || '';
                // Get innerText but only for leaf-ish elements (avoid grabbing entire page text)
                let innerText = '';
                if (el.children.length < 10) {
                    innerText = ((el as any).innerText || '').substring(0, 200);
                }

                const matchTargets = [
                    id, name, placeholder, ariaLabel, className, directText,
                    title, value, alt, href, dataTestId, innerText,
                    type, role, forAttr, src, action,
                ];
                const match = matchTargets.some(val => val.toLowerCase().includes(kw));

                if (match) {
                    matchedElements.push(el);
                }
            });

            // Step 2: Remove ancestor elements — keep only the most specific (deepest) matches.
            // If element A contains element B, and both matched, remove A (the ancestor).
            const matchedSet = new Set<Element>(matchedElements);
            const filteredElements = matchedElements.filter(el => {
                // Check if any OTHER matched element is a descendant of this element
                for (const other of matchedSet) {
                    if (other !== el && el.contains(other)) {
                        // 'el' is an ancestor of 'other', so skip 'el'
                        return false;
                    }
                }
                return true;
            });

            // Step 3: Build results from filtered (most specific) elements
            const results: {
                tag: string;
                directText: string;
                xpath: string;
                fullXpath: string;
                cssSelector: string;
                jsPath: string;
                outerHTML: string;
                element: string;
                styles: string;
            }[] = [];

            for (const el of filteredElements) {
                const tag = el.tagName.toLowerCase();
                const directText = getDirectText(el);
                const outerHTML = el.outerHTML;
                results.push({
                    tag,
                    directText: directText.substring(0, 60),
                    xpath: getRelativeXPath(el),
                    fullXpath: getFullXPath(el),
                    cssSelector: getCssSelector(el),
                    jsPath: getJsPath(el),
                    outerHTML: outerHTML.substring(0, 1000),
                    element: outerHTML.substring(0, 500),
                    styles: getStyles(el),
                });
            }

            return results;
        };
    }

    /**
     * Scan all frames (main + iframes) for matching elements.
     */
    private async scanAllFrames(page: Page, keyword: string) {
        const scanFn = this.getScanFunction();
        let allResults: any[] = [];

        // Scan main frame
        const mainResults = await page.evaluate(scanFn, keyword);
        console.log(`[Locator] Main frame: ${mainResults.length} matches`);
        allResults = [...mainResults];

        // Scan all iframes
        const frames = page.frames();
        for (const frame of frames) {
            if (frame === page.mainFrame()) continue;
            try {
                const frameResults = await frame.evaluate(scanFn, keyword);
                if (frameResults.length > 0) {
                    console.log(`[Locator] iframe (${frame.url()}): ${frameResults.length} matches`);
                    allResults = [...allResults, ...frameResults];
                }
            } catch {
                // iframe might have different origin - skip
            }
        }

        return allResults;
    }

    async generateLocators(url: string, keyword: string, locatorType: string, userId: number, cookies?: string) {
        let browser;
        try {
            // Parse cookies if provided (format: "name=value; name2=value2")
            let parsedCookies: { name: string; value: string; domain: string; path: string; secure: boolean; sameSite: 'Strict' | 'Lax' | 'None' }[] = [];
            if (cookies && cookies.trim()) {
                const domain = new URL(url).hostname;
                parsedCookies = cookies.split(';').map(c => c.trim()).filter(Boolean).map(c => {
                    const eqIndex = c.indexOf('=');
                    const name = c.substring(0, eqIndex).trim();
                    const value = c.substring(eqIndex + 1).trim();
                    // __Secure- and __Host- prefixed cookies require secure flag
                    const needsSecure = name.startsWith('__Secure-') || name.startsWith('__Host-');
                    return {
                        name,
                        value,
                        domain: domain,
                        path: '/',
                        secure: needsSecure,
                        sameSite: needsSecure ? 'None' as const : 'Lax' as const,
                    };
                });
                console.log(`[Locator] Parsed ${parsedCookies.length} cookies for domain: ${domain}`);
                console.log(`[Locator] Cookie names: ${parsedCookies.map(c => c.name).join(', ')}`);
            }

            const launched = await this.launchBrowser(parsedCookies.length > 0 ? parsedCookies : undefined);
            browser = launched.browser;
            const page = launched.page;

            await this.navigateWithFallback(page, url);

            // Wait for JS frameworks to finish rendering
            await page.waitForTimeout(3000);

            // Check if we got redirected (e.g., to a login page)
            const finalUrl = page.url();
            const wasRedirected = finalUrl !== url && !finalUrl.startsWith(url);
            if (wasRedirected) {
                console.log(`[Locator] Redirected from ${url} to ${finalUrl}`);
            }

            // Try to scroll down to trigger lazy-loaded content
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await page.waitForTimeout(1000);
            await page.evaluate(() => {
                window.scrollTo(0, 0);
            });

            await this.dismissCookieBanners(page);

            const normalizedKeyword = keyword.toLowerCase();

            // Scan main page + all iframes
            const elements = await this.scanAllFrames(page, normalizedKeyword);

            // Log page diagnostics when no results found
            if (elements.length === 0) {
                const pageTitle = await page.title();
                const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'NO BODY TEXT');
                const elementCount = await page.evaluate(() => document.querySelectorAll('*').length);
                console.log(`[Locator] ===== EMPTY RESULT DIAGNOSTICS =====`);
                console.log(`[Locator] Final URL: ${finalUrl}`);
                console.log(`[Locator] Page title: ${pageTitle}`);
                console.log(`[Locator] Total elements on page: ${elementCount}`);
                console.log(`[Locator] Body text preview: ${bodyText.substring(0, 300)}`);
                console.log(`[Locator] Keyword searched: "${keyword}"`);
                console.log(`[Locator] =====================================`);

                // Return helpful warning if redirected
                if (wasRedirected && (finalUrl.includes('login') || finalUrl.includes('signin') || finalUrl.includes('auth'))) {
                    return {
                        warning: 'This page requires authentication. The browser was redirected to a login page.',
                        redirectedTo: finalUrl,
                        hint: 'Paste your browser cookies in the "Cookies" field to scan authenticated pages. To get cookies: open the target site in Chrome → F12 → Console → type document.cookie → copy the result.',
                        results: [],
                    };
                }
            }

            console.log(`[Locator] Total matches: ${elements.length}`);

            // Map to the selected locator type
            const locators = elements.map(el => {
                let locator = '';
                switch (locatorType.toLowerCase()) {
                    case 'xpath':
                        locator = el.xpath;
                        break;
                    case 'full_xpath':
                        locator = el.fullXpath;
                        break;
                    case 'selector':
                        locator = el.cssSelector;
                        break;
                    case 'js_path':
                        locator = el.jsPath;
                        break;
                    case 'outerhtml':
                        locator = el.outerHTML;
                        break;
                    case 'element':
                        locator = el.element;
                        break;
                    case 'styles':
                        locator = el.styles;
                        break;
                    default:
                        locator = el.xpath;
                }
                return { tag: el.tag, locator };
            }).filter(l => l.locator && l.locator.trim() !== '');

            // Save to history
            const history = this.searchHistoryRepository.create({
                url,
                keyword,
                locatorType,
                results: locators,
                user: { id: userId } as any,
            });
            await this.searchHistoryRepository.save(history);

            return locators;
        } catch (error) {
            console.error('[Locator] Error:', error);
            throw new InternalServerErrorException('Failed to generate locators: ' + (error as Error).message);
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Debug endpoint: returns what Playwright actually sees on the page.
     */
    async debugPage(url: string) {
        let browser;
        try {
            const launched = await this.launchBrowser();
            browser = launched.browser;
            const page = launched.page;

            await this.navigateWithFallback(page, url);
            await page.waitForTimeout(3000);

            const pageTitle = await page.title();
            const finalUrl = page.url();
            const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || 'NO BODY');
            const elementCount = await page.evaluate(() => document.querySelectorAll('*').length);
            const iframeCount = page.frames().length - 1;
            const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);

            // Take screenshot
            const screenshotDir = path.join(process.cwd(), 'debug-screenshots');
            if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
            const screenshotPath = path.join(screenshotDir, `debug-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });

            return {
                requestedUrl: url,
                finalUrl,
                pageTitle,
                totalElements: elementCount,
                iframeCount,
                htmlSizeBytes: htmlLength,
                screenshotSaved: screenshotPath,
                bodyTextPreview: bodyText,
            };
        } catch (error) {
            return {
                requestedUrl: url,
                error: (error as Error).message,
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    async getHistory(userId: number) {
        return this.searchHistoryRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }
}
