// eBay Listing Parser Test - Run this in browser console on eBay search results page
// Navigate to: https://www.ebay.com/sch/i.html?_dkr=1&iconV2Request=true&_blrs=recall_filtering&_ssn=urbud&store_name=urbud&_sop=10&_oac=1&_ipg=240

console.log("🔍 Starting eBay HTML Structure Analysis...");

// Test different selectors for listing containers
const selectors = {
    listings: [
        'div.s-item__wrapper.clearfix',
        'li[class*="s-card"]',
        '.s-item',
        '[data-testid*="item"]',
        '.srp-results .s-item'
    ],
    titles: [
        '.s-item__title',
        '.s-card__title', 
        '[data-testid="item-title"]',
        '.it-ttl',
        'h3'
    ],
    prices: [
        '.s-card__price',
        '.s-item__price',
        '[data-testid="item-price"]',
        '.notranslate'
    ],
    links: [
        '.s-item__link',
        'a[href*="/itm/"]',
        'a[href*="ebay.com"]'
    ],
    images: [
        '.s-item__image img',
        '.s-card__image img',
        '[data-testid="item-image"] img',
        'img'
    ]
};

function testSelectors() {
    const results = {};
    
    // Test listing containers
    console.log("\n📦 Testing listing container selectors:");
    selectors.listings.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`${selector}: ${elements.length} items found`);
        results[selector] = elements.length;
    });
    
    // Find the best listing selector
    const bestListingSelector = Object.keys(results).reduce((a, b) => results[a] > results[b] ? a : b);
    console.log(`\n✅ Best listing selector: ${bestListingSelector} (${results[bestListingSelector]} items)`);
    
    // Test on first few listings
    const listings = document.querySelectorAll(bestListingSelector);
    console.log(`\n🔬 Analyzing first 3 listings with selector: ${bestListingSelector}`);
    
    for (let i = 0; i < Math.min(3, listings.length); i++) {
        const listing = listings[i];
        console.log(`\n--- Listing ${i + 1} ---`);
        
        // Test title selectors
        console.log("Title tests:");
        selectors.titles.forEach(selector => {
            const elem = listing.querySelector(selector);
            if (elem) {
                console.log(`  ✅ ${selector}: "${elem.textContent.trim().substring(0, 50)}..."`);
            } else {
                console.log(`  ❌ ${selector}: not found`);
            }
        });
        
        // Test price selectors
        console.log("Price tests:");
        selectors.prices.forEach(selector => {
            const elem = listing.querySelector(selector);
            if (elem) {
                console.log(`  ✅ ${selector}: "${elem.textContent.trim()}"`);
            } else {
                console.log(`  ❌ ${selector}: not found`);
            }
        });
        
        // Test link selectors
        console.log("Link tests:");
        selectors.links.forEach(selector => {
            const elem = listing.querySelector(selector);
            if (elem && elem.href) {
                const match = elem.href.match(/\/(\d+)(?:\?|$)/);
                const id = match ? match[1] : 'no ID found';
                console.log(`  ✅ ${selector}: ID=${id}, URL=${elem.href.substring(0, 60)}...`);
            } else {
                console.log(`  ❌ ${selector}: not found`);
            }
        });
        
        // Test image selectors
        console.log("Image tests:");
        selectors.images.forEach(selector => {
            const elem = listing.querySelector(selector);
            if (elem && elem.src) {
                console.log(`  ✅ ${selector}: ${elem.src.substring(0, 60)}...`);
            } else {
                console.log(`  ❌ ${selector}: not found`);
            }
        });
    }
    
    return { bestListingSelector, totalListings: listings.length };
}

// Run the test
const testResults = testSelectors();

// Generate suggested selectors
console.log("\n🎯 SUGGESTED PARSING STRATEGY:");
console.log("================================");
console.log(`Main container: ${testResults.bestListingSelector}`);
console.log(`Total listings found: ${testResults.totalListings}`);

// Test a complete parsing function
console.log("\n🧪 Testing complete parsing function...");

function testCompleteParsing() {
    const listings = document.querySelectorAll(testResults.bestListingSelector);
    const parsedData = [];
    
    for (let i = 0; i < Math.min(5, listings.length); i++) {
        const listing = listings[i];
        
        // Try to extract all data
        const data = {
            index: i + 1,
            title: null,
            price: null,
            link: null,
            id: null,
            image: null
        };
        
        // Title extraction with fallbacks
        for (const selector of selectors.titles) {
            const elem = listing.querySelector(selector);
            if (elem && elem.textContent.trim()) {
                data.title = elem.textContent.trim().replace(/^New Listing\s*/, '');
                break;
            }
        }
        
        // Price extraction with fallbacks
        for (const selector of selectors.prices) {
            const elem = listing.querySelector(selector);
            if (elem && elem.textContent.trim()) {
                data.price = elem.textContent.trim().replace(/[$,]/g, '');
                break;
            }
        }
        
        // Link and ID extraction
        for (const selector of selectors.links) {
            const elem = listing.querySelector(selector);
            if (elem && elem.href) {
                data.link = elem.href;
                const match = elem.href.match(/\/(\d+)(?:\?|$)/);
                if (match) {
                    data.id = match[1];
                    break;
                }
            }
        }
        
        // Image extraction
        for (const selector of selectors.images) {
            const elem = listing.querySelector(selector);
            if (elem && elem.src && !elem.src.includes('data:image')) {
                data.image = elem.src;
                break;
            }
        }
        
        parsedData.push(data);
        console.log(`Listing ${i + 1}:`, data);
    }
    
    return parsedData;
}

const parsedResults = testCompleteParsing();

console.log("\n📊 SUMMARY:");
console.log("============");
console.log(`Listings processed: ${parsedResults.length}`);
console.log(`Successful title extractions: ${parsedResults.filter(r => r.title).length}`);
console.log(`Successful price extractions: ${parsedResults.filter(r => r.price).length}`);
console.log(`Successful ID extractions: ${parsedResults.filter(r => r.id).length}`);
console.log(`Successful image extractions: ${parsedResults.filter(r => r.image).length}`);

console.log("\n✅ Test complete! Check the output above to see which selectors are working.");
