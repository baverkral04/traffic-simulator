require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Enable the stealth plugin to strip the webdriver flag and spoof hardware
puppeteer.use(StealthPlugin());

// const TARGET_URL = 'https://www.sezgindursun.com'; // Change this to your test site
const TARGET_URL = 'https://bot.sannysoft.com';

// Helper function to create human-like random delays
const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function simulateHumanVisit() {
    console.log('Booting up stealth browser...');

    // Prepare arguments, including the proxy if you have it in your .env
    const browserArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    if (process.env.PROXY_SERVER) {
        browserArgs.push(`--proxy-server=${process.env.PROXY_SERVER}`);
    }

    const browser = await puppeteer.launch({
        // Set this to false on your Mac so you can visually watch it work. 
        // We will flip this to true when deploying to the headless EC2 server.
        headless: false, 
        args: browserArgs
    });

    const page = await browser.newPage();

    // Set a normal desktop viewport
    await page.setViewport({ width: 1366, height: 768 });

    // Authenticate the proxy if credentials exist
    if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
        await page.authenticate({ 
            username: process.env.PROXY_USERNAME, 
            password: process.env.PROXY_PASSWORD 
        });
    }

    try {


        // --- ADD THIS BLOCK ---
        console.log('Checking current IP address through the proxy...');
        await page.goto('https://api.ipify.org', { waitUntil: 'domcontentloaded' });
        
        // Extract the IP address from the page body
        const currentIP = await page.evaluate(() => document.body.innerText);
        console.log(`\n---> SUCCESS: Your browser is currently browsing from IP: ${currentIP} <---\n`);
        
        // Wait a couple of seconds so you can read the console
        await randomDelay(2000, 3000);
        // -----------------------
        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

        // Wait 3 to 6 seconds before doing anything (reading the headline)
        console.log('Reading top of page...');
        await randomDelay(3000, 6000);

        // Scroll down a bit
        console.log('Scrolling down...');
        await page.evaluate(() => window.scrollBy(0, 500));
        await randomDelay(2000, 5000);

        // Scroll down a bit more
        await page.evaluate(() => window.scrollBy(0, 500));
        await randomDelay(4000, 8000);

        // Find all links on the page and click a random one to generate deeper session duration
        console.log('Looking for an internal link to click...');
        
        // Find all links that have a real web address
        const validUrls = await page.$$eval('a', (anchors) => {
            return anchors
                .map(a => a.href)
                .filter(href => href.startsWith('http') && !href.includes('#'));
        });
        
        if (validUrls.length > 0) {
            // Pick a random URL
            const randomIndex = Math.floor(Math.random() * validUrls.length);
            const nextUrl = validUrls[randomIndex];
            
            console.log('Navigating to: ' + nextUrl);
            await page.goto(nextUrl, { waitUntil: 'domcontentloaded' });
            
            console.log('Successfully navigated to a second page. Reading...');
            await randomDelay(5000, 10000); 
        } else {
            console.log('No links found to click.');
        }

    } catch (error) {
        console.error('An error occurred during the visit:', error);
    } finally {
        console.log('Session complete. Closing browser.');
        await browser.close();
    }
}

// Execute the function
simulateHumanVisit();