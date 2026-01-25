/**
 * VapeScout Price Scraper
 * 
 * This script fetches prices from UK vape retailers and updates the Supabase database.
 * Run with: node scraper.js
 * 
 * Prerequisites:
 * npm install @supabase/supabase-js cheerio node-fetch
 */

const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

// Supabase Configuration
const SUPABASE_URL = 'https://quixkyblpiwazhpvjeir.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Get from Supabase Dashboard > Settings > API > service_role

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Retailer configurations
const retailers = {
    'vape-uk': {
        name: 'Vape UK',
        baseUrl: 'https://vapeuk.co.uk',
        // Example selectors - you'll need to inspect each site
        selectors: {
            price: '.product-price',
            inStock: '.in-stock',
            multiBuy: '.multi-buy-offer'
        }
    },
    'grey-haze': {
        name: 'Grey Haze',
        baseUrl: 'https://greyhaze.co.uk',
        selectors: {
            price: '.price',
            inStock: '.availability',
            multiBuy: '.offer-text'
        }
    },
    'electric-tobacconist': {
        name: 'Electric Tobacconist',
        baseUrl: 'https://electrictobacconist.co.uk',
        selectors: {
            price: '.product-price-amount',
            inStock: '.stock-status',
            multiBuy: '.multi-buy'
        }
    }
};

/**
 * Fetch HTML from a URL
 */
async function fetchPage(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

/**
 * Parse price from text
 */
function parsePrice(text) {
    if (!text) return null;
    const match = text.match(/£?([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
}

/**
 * Parse multi-buy offer
 * Examples: "10 for £20", "5 for £15", "Buy 3 for £25"
 */
function parseMultiBuy(text) {
    if (!text) return { qty: null, price: null };
    const match = text.match(/(\d+)\s*for\s*£?([\d.]+)/i);
    if (match) {
        return {
            qty: parseInt(match[1]),
            price: parseFloat(match[2])
        };
    }
    return { qty: null, price: null };
}

/**
 * Scrape a single product page
 */
async function scrapeProduct(url, retailerConfig) {
    const html = await fetchPage(url);
    if (!html) return null;

    const $ = cheerio.load(html);
    const selectors = retailerConfig.selectors;

    const priceText = $(selectors.price).first().text();
    const price = parsePrice(priceText);

    const inStockText = $(selectors.inStock).text().toLowerCase();
    const inStock = !inStockText.includes('out of stock') && !inStockText.includes('unavailable');

    const multiBuyText = $(selectors.multiBuy).text();
    const multiBuy = parseMultiBuy(multiBuyText);

    return {
        price,
        inStock,
        multiBuyQty: multiBuy.qty,
        multiBuyPrice: multiBuy.price
    };
}

/**
 * Update price in database
 */
async function updatePrice(productId, retailerId, priceData, url) {
    const { data, error } = await supabase
        .from('prices')
        .upsert({
            product_id: productId,
            retailer_id: retailerId,
            price: priceData.price,
            in_stock: priceData.inStock,
            multi_buy_qty: priceData.multiBuyQty,
            multi_buy_price: priceData.multiBuyPrice,
            url: url,
            last_checked: new Date().toISOString()
        }, {
            onConflict: 'product_id,retailer_id'
        });

    if (error) {
        console.error('Error updating price:', error);
        return false;
    }
    return true;
}

/**
 * Get all products with their existing price URLs
 */
async function getProductsToScrape() {
    const { data, error } = await supabase
        .from('prices')
        .select(`
            id,
            url,
            product_id,
            retailer_id,
            products (name, slug),
            retailers (slug, name)
        `)
        .not('url', 'is', null);

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data || [];
}

/**
 * Main scraping function
 */
async function runScraper() {
    console.log('Starting VapeScout price scraper...');
    console.log('================================');

    const products = await getProductsToScrape();
    console.log(`Found ${products.length} products to scrape`);

    let updated = 0;
    let failed = 0;

    for (const item of products) {
        const retailerSlug = item.retailers?.slug;
        const retailerConfig = retailers[retailerSlug];

        if (!retailerConfig) {
            console.log(`Skipping ${item.products?.name} - no config for ${retailerSlug}`);
            continue;
        }

        console.log(`Scraping: ${item.products?.name} from ${item.retailers?.name}`);

        const priceData = await scrapeProduct(item.url, retailerConfig);

        if (priceData && priceData.price) {
            const success = await updatePrice(
                item.product_id,
                item.retailer_id,
                priceData,
                item.url
            );

            if (success) {
                console.log(`  ✓ £${priceData.price} (${priceData.inStock ? 'In Stock' : 'Out of Stock'})`);
                updated++;
            } else {
                failed++;
            }
        } else {
            console.log(`  ✗ Could not fetch price`);
            failed++;
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('================================');
    console.log(`Scraping complete: ${updated} updated, ${failed} failed`);
}

// Run the scraper
runScraper().catch(console.error);

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Get your service_role key from Supabase:
 *    - Go to Project Settings > API
 *    - Copy the "service_role" key (NOT the anon key)
 *    - Replace YOUR_SERVICE_ROLE_KEY above
 * 
 * 2. Install dependencies:
 *    npm install @supabase/supabase-js cheerio
 * 
 * 3. Run the scraper:
 *    node scraper.js
 * 
 * 4. For automated scraping, set up a cron job or use:
 *    - GitHub Actions (free, runs on schedule)
 *    - Vercel Cron (if using Vercel Pro)
 *    - Render.com (free tier available)
 * 
 * IMPORTANT NOTES:
 * - Each retailer's website structure is different
 * - You'll need to inspect each site and update the selectors
 * - Some sites may block scrapers - use proxies if needed
 * - Respect robots.txt and rate limits
 * - Consider using their APIs if available (some have them)
 */
