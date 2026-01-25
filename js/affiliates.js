/**
 * VapeScout Affiliate Link System
 * 
 * This handles affiliate link generation for various networks.
 * Add your affiliate IDs when you get approved.
 */

const affiliateConfig = {
    // Awin (formerly Affiliate Window) - Most UK vape retailers
    awin: {
        publisherId: 'YOUR_AWIN_PUBLISHER_ID', // Get from Awin dashboard
        baseUrl: 'https://www.awin1.com/cread.php',
        // Retailer-specific advertiser IDs (get these when approved)
        advertisers: {
            'vape-uk': '00000',
            'grey-haze': '00000',
            'electric-tobacconist': '00000',
            'vape-superstore': '00000'
        }
    },
    
    // Direct affiliate programs (some retailers have their own)
    direct: {
        // Example: Some brands have direct affiliate programs
    }
};

/**
 * Generate an Awin affiliate link
 * 
 * @param {string} retailerSlug - The retailer's slug (e.g., 'vape-uk')
 * @param {string} destinationUrl - The product page URL
 * @returns {string} The affiliate tracking link
 */
function generateAwinLink(retailerSlug, destinationUrl) {
    const config = affiliateConfig.awin;
    const advertiserId = config.advertisers[retailerSlug];
    
    if (!advertiserId || advertiserId === '00000') {
        // Not set up yet, return original URL
        return destinationUrl;
    }
    
    // Awin link format
    const params = new URLSearchParams({
        awinmid: advertiserId,
        awinaffid: config.publisherId,
        ued: destinationUrl
    });
    
    return `${config.baseUrl}?${params.toString()}`;
}

/**
 * Generate affiliate link for any retailer
 * 
 * @param {string} retailerSlug - The retailer's slug
 * @param {string} destinationUrl - The product page URL
 * @param {string} network - The affiliate network ('awin', 'direct', etc.)
 * @returns {string} The affiliate tracking link
 */
function generateAffiliateLink(retailerSlug, destinationUrl, network = 'awin') {
    switch (network) {
        case 'awin':
            return generateAwinLink(retailerSlug, destinationUrl);
        default:
            return destinationUrl;
    }
}

/**
 * Track click for analytics
 */
function trackClick(retailerSlug, productSlug, price) {
    // Send to your analytics (Google Analytics, etc.)
    if (typeof gtag === 'function') {
        gtag('event', 'affiliate_click', {
            retailer: retailerSlug,
            product: productSlug,
            price: price
        });
    }
    
    // You could also log to Supabase
    // logClickToSupabase(retailerSlug, productSlug, price);
}

// Export for use in pages
if (typeof window !== 'undefined') {
    window.VapeScoutAffiliates = {
        generateAffiliateLink,
        trackClick
    };
}

if (typeof module !== 'undefined') {
    module.exports = {
        affiliateConfig,
        generateAffiliateLink,
        generateAwinLink
    };
}

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. APPLY TO AWIN:
 *    - Go to https://www.awin.com/gb
 *    - Click "Publishers" > "Join Network"
 *    - Fill in your details (website: vapescout.co.uk)
 *    - Wait for approval (usually 1-3 days)
 * 
 * 2. FIND VAPE RETAILERS ON AWIN:
 *    Once approved, search for these retailers:
 *    - Electric Tobacconist
 *    - Grey Haze
 *    - Vape Superstore
 *    - (more available - search "vape" or "e-cigarette")
 * 
 * 3. APPLY TO EACH RETAILER:
 *    - From Awin dashboard, apply to each retailer's program
 *    - Some auto-approve, others review manually
 *    - Once approved, note the "Advertiser ID" for each
 * 
 * 4. UPDATE THIS FILE:
 *    - Replace YOUR_AWIN_PUBLISHER_ID with your actual ID
 *    - Add each retailer's advertiser ID to the advertisers object
 * 
 * 5. COMMISSION RATES (typical):
 *    - Most vape retailers: 5-10% commission
 *    - Cookie duration: 30 days typically
 *    - Payment: Monthly, £20 minimum
 * 
 * ALTERNATIVE NETWORKS:
 *    - Webgains (has some vape retailers)
 *    - CJ Affiliate
 *    - Direct brand programs (Vampire Vape, etc.)
 */
