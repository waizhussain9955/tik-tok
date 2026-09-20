const puppeteer = require('puppeteer-core');
const fs = require('fs');

const getChromePath = () => {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

async function debug() {
    const chromePath = getChromePath();
    console.log('Chrome:', chromePath);

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating...');
    await page.goto('https://www.tiktok.com/@khaby.lame', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    // Wait a bit for JS to load
    await new Promise(r => setTimeout(r, 5000));

    // Get all video containers - different selectors
    const selectors = [
        '[data-e2e="user-post-item"]',
        '[data-e2e="user-post-item-list"] > div',
        '.tiktok-x6y88p-DivItemContainerV2',
        'div[class*="DivItemContainer"]',
        'div[class*="video-feed"] a',
        'a[href*="/video/"]'
    ];

    for (const sel of selectors) {
        const count = await page.$$eval(sel, els => els.length).catch(() => 0);
        console.log(`Selector "${sel}": ${count} elements`);
    }

    // Save screenshot
    await page.screenshot({ path: 'debug_screenshot.png', fullPage: false });
    console.log('Screenshot saved to debug_screenshot.png');

    // Save HTML
    const html = await page.content();
    fs.writeFileSync('debug_page.html', html);
    console.log('HTML saved to debug_page.html');

    // Try to find any links to videos
    const videoLinks = await page.$$eval('a', links =>
        links.filter(a => a.href && a.href.includes('/video/')).map(a => ({
            href: a.href,
            text: a.textContent?.substring(0, 50)
        }))
    );
    console.log('Video links found:', videoLinks.length);
    if (videoLinks.length > 0) {
        console.log('First 3:', videoLinks.slice(0, 3));
    }

    // Keep browser open for 30 seconds
    console.log('Browser will close in 30 seconds...');
    await new Promise(r => setTimeout(r, 30000));

    await browser.close();
}

debug().catch(console.error);
