require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Enable the stealth plugin
puppeteer.use(StealthPlugin());

// Put the exact list of URLs you want to visit during a single run here
const TARGET_URLS = [
    'https://www.sezgindursun.com',
    'https://www.sezgindursun.com/hafta-hafta-gebelik-1-40/',
    'https://www.sezgindursun.com/iletisim/', // Add as many as you want
    "https://www.sezgindursun.com/atasehir-infertilitede-tup-bebek-ivf-tedavisi/",
    "https://www.sezgindursun.com/istanbul-infertilitede-tup-bebek-ivf-tedavisi/"
];

// Helper function to create human-like random delays
const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function simulateHumanVisit() {
    // 1. Check the Environment
    const isDev = process.env.DEV === 'true';
    console.log(`Environment: ${isDev ? 'DEVELOPMENT (Mac)' : 'PRODUCTION (EC2)'}`);
    console.log('Booting up stealth browser...');

    // 2. Configure Browser Arguments based on Environment
    const browserArgs = [];
    
    // Always use proxy if available
    if (process.env.PROXY_SERVER) {
        browserArgs.push(`--proxy-server=${process.env.PROXY_SERVER}`);
    }

    // If on EC2 (not dev), we MUST add these flags so Linux doesn't crash
    if (!isDev) {
        browserArgs.push('--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage');
    }

    // 3. Launch the Browser
    const browser = await puppeteer.launch({
        headless: !isDev, // true on EC2 (background), false on Mac (visible)
        args: browserArgs
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Authenticate the proxy
    if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
        await page.authenticate({ 
            username: process.env.PROXY_USERNAME, 
            password: process.env.PROXY_PASSWORD 
        });
    }

    try {
        // Quick IP Check before starting the traffic run
        console.log('Checking current IP address through the proxy...');
        await page.goto('https://api.ipify.org', { waitUntil: 'domcontentloaded' });
        const currentIP = await page.evaluate(() => document.body.innerText);
        console.log(`\n---> BROWSING FROM IP: ${currentIP} <---\n`);
        await randomDelay(2000, 3000);

        // 4. Loop through every URL in the list
        for (const [index, url] of TARGET_URLS.entries()) {
            console.log(`\n[Page ${index + 1}/${TARGET_URLS.length}] Navigating to ${url}...`);
            
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Simulate human behavior on this specific page
            console.log('Reading top of page...');
            await randomDelay(3000, 6000);

            console.log('Scrolling down...');
            await page.evaluate(() => window.scrollBy(0, 500));
            await randomDelay(2000, 5000);

            console.log('Scrolling down a bit more...');
            await page.evaluate(() => window.scrollBy(0, 500));
            await randomDelay(4000, 8000);

            console.log(`Finished engagement on ${url}.`);

            // If there are more pages left, wait a few seconds before going to the next one
            if (index < TARGET_URLS.length - 1) {
                console.log('Waiting before visiting the next page...');
                await randomDelay(3000, 7000);
            }
        }

    } catch (error) {
        console.error('An error occurred during the visit:', error);
    } finally {
        console.log('\nSession complete. All pages visited. Closing browser.');
        await browser.close();
    }
}

// Execute the function
simulateHumanVisit();