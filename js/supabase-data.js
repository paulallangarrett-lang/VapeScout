// VapeScout Supabase Configuration
const SUPABASE_URL = 'https://quixkyblpiwazhpvjeir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aXhreWJscGl3YXpocHZqZWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTMzMjYsImV4cCI6MjA4NDkyOTMyNn0._mNGAp4DAl8KPoPrv7XlrNLOS07vqRJ1RNYhyZ0gbc8';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================
// DATA FETCHING FUNCTIONS
// =====================

// Get all brands
async function getBrands(featuredOnly = false) {
    let query = supabase.from('brands').select('*').order('name');
    if (featuredOnly) {
        query = query.eq('featured', true);
    }
    const { data, error } = await query;
    if (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
    return data;
}

// Get single brand by slug
async function getBrandBySlug(slug) {
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .single();
    if (error) {
        console.error('Error fetching brand:', error);
        return null;
    }
    return data;
}

// Get all retailers
async function getRetailers() {
    const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('active', true)
        .order('name');
    if (error) {
        console.error('Error fetching retailers:', error);
        return [];
    }
    return data;
}

// Get products with optional filters
async function getProducts(filters = {}) {
    let query = supabase
        .from('products')
        .select(`
            *,
            brands (id, name, slug)
        `);
    
    if (filters.brandSlug) {
        const brand = await getBrandBySlug(filters.brandSlug);
        if (brand) {
            query = query.eq('brand_id', brand.id);
        }
    }
    
    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    
    if (filters.popularOnly) {
        query = query.eq('popular', true);
    }
    
    if (filters.category) {
        query = query.eq('flavour_category', filters.category);
    }
    
    query = query.order('popular', { ascending: false }).order('name');
    
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data;
}

// Get single product by slug with all prices
async function getProductBySlug(slug) {
    const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
            *,
            brands (id, name, slug)
        `)
        .eq('slug', slug)
        .single();
    
    if (productError) {
        console.error('Error fetching product:', productError);
        return null;
    }
    
    // Get prices for this product
    const { data: prices, error: pricesError } = await supabase
        .from('prices')
        .select(`
            *,
            retailers (id, name, slug, website, free_delivery_threshold, delivery_cost)
        `)
        .eq('product_id', product.id)
        .eq('in_stock', true)
        .order('price');
    
    if (pricesError) {
        console.error('Error fetching prices:', pricesError);
        product.prices = [];
    } else {
        product.prices = prices;
    }
    
    return product;
}

// Get products with their best price
async function getProductsWithPrices(filters = {}) {
    const products = await getProducts(filters);
    
    // Get all prices for these products
    const productIds = products.map(p => p.id);
    
    const { data: allPrices, error } = await supabase
        .from('prices')
        .select(`
            *,
            retailers (id, name, slug)
        `)
        .in('product_id', productIds)
        .eq('in_stock', true);
    
    if (error) {
        console.error('Error fetching prices:', error);
        return products.map(p => ({ ...p, bestPrice: null, priceCount: 0 }));
    }
    
    // Attach best price to each product
    return products.map(product => {
        const productPrices = allPrices.filter(p => p.product_id === product.id);
        const sortedPrices = productPrices.sort((a, b) => a.price - b.price);
        return {
            ...product,
            bestPrice: sortedPrices[0] || null,
            priceCount: productPrices.length,
            allPrices: sortedPrices
        };
    });
}

// Get best deals (products with biggest savings)
async function getBestDeals(limit = 8) {
    const products = await getProductsWithPrices({ limit: 50 });
    
    // Calculate savings and sort
    const withSavings = products
        .filter(p => p.bestPrice && p.rrp)
        .map(p => ({
            ...p,
            savings: p.rrp - p.bestPrice.price,
            savingsPercent: Math.round((1 - p.bestPrice.price / p.rrp) * 100)
        }))
        .sort((a, b) => b.savingsPercent - a.savingsPercent);
    
    return withSavings.slice(0, limit);
}

// Get multi-buy deals
async function getMultiBuyDeals(limit = 10) {
    const { data, error } = await supabase
        .from('prices')
        .select(`
            *,
            products (id, name, slug, rrp, brands (name, slug)),
            retailers (id, name, slug, website)
        `)
        .not('multi_buy_qty', 'is', null)
        .eq('in_stock', true)
        .order('multi_buy_price');
    
    if (error) {
        console.error('Error fetching multi-buy deals:', error);
        return [];
    }
    
    // Calculate per-unit price and sort by value
    const deals = data.map(d => ({
        ...d,
        perUnitPrice: d.multi_buy_price / d.multi_buy_qty
    })).sort((a, b) => a.perUnitPrice - b.perUnitPrice);
    
    return deals.slice(0, limit);
}

// Search products
async function searchProducts(query) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            brands (id, name, slug)
        `)
        .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
        .limit(20);
    
    if (error) {
        console.error('Error searching products:', error);
        return [];
    }
    return data;
}

// =====================
// UI RENDERING FUNCTIONS
// =====================

// Format price for display
function formatPrice(price) {
    return '£' + parseFloat(price).toFixed(2);
}

// Create product card HTML
function createProductCard(product) {
    const bestPrice = product.bestPrice;
    const savings = product.rrp && bestPrice ? Math.round((1 - bestPrice.price / product.rrp) * 100) : 0;
    
    const categoryEmoji = {
        'fruit': '🍓',
        'menthol': '❄️',
        'dessert': '🍰',
        'tobacco': '🍂',
        'candy': '🍬',
        'drink': '🥤'
    };
    
    return `
        <article class="product-card" data-product-slug="${product.slug}">
            ${product.popular ? '<div class="product-badge bestseller">Popular</div>' : ''}
            <div class="product-image">
                <div class="product-placeholder">${categoryEmoji[product.flavour_category] || '💨'}</div>
            </div>
            <div class="product-content">
                <h3>${product.name}</h3>
                <p class="product-brand">${product.brands?.name || ''}</p>
                <div class="product-specs">
                    <span class="spec">${product.size}ml</span>
                    <span class="spec">${product.nicotine_strength}mg</span>
                </div>
                <div class="product-pricing">
                    ${bestPrice ? `
                        <div class="price-range">
                            <span class="price-from">From</span>
                            <span class="price-value">${formatPrice(bestPrice.price)}</span>
                        </div>
                        ${product.rrp ? `
                            <div class="price-comparison">
                                <span class="rrp">RRP ${formatPrice(product.rrp)}</span>
                                ${savings > 0 ? `<span class="savings">Save ${savings}%</span>` : ''}
                            </div>
                        ` : ''}
                    ` : '<div class="price-range"><span class="price-value">Price TBC</span></div>'}
                </div>
                <a href="/product/${product.slug}/" class="btn btn-primary btn-block">
                    Compare ${product.priceCount || 0} Prices
                </a>
            </div>
        </article>
    `;
}

// Create deal card HTML
function createDealCard(deal) {
    return `
        <div class="deal-card">
            <div class="deal-badge">${deal.retailers?.name}</div>
            <h4>${deal.products?.brands?.name} ${deal.products?.name}</h4>
            <div class="deal-offer">
                <span class="deal-qty">${deal.multi_buy_qty} for</span>
                <span class="deal-price">${formatPrice(deal.multi_buy_price)}</span>
            </div>
            <div class="deal-per-unit">${formatPrice(deal.perUnitPrice)} each</div>
            <a href="${deal.url || deal.retailers?.website}" target="_blank" rel="noopener" class="btn btn-small">
                View Deal
            </a>
        </div>
    `;
}

// =====================
// PAGE INITIALIZERS
// =====================

// Initialize homepage
async function initHomepage() {
    // Load popular products
    const popularContainer = document.getElementById('popular-products');
    if (popularContainer) {
        popularContainer.innerHTML = '<p>Loading...</p>';
        const products = await getProductsWithPrices({ popularOnly: true, limit: 8 });
        if (products.length > 0) {
            popularContainer.innerHTML = products.map(createProductCard).join('');
        } else {
            popularContainer.innerHTML = '<p>No products found.</p>';
        }
    }
    
    // Load best deals
    const dealsContainer = document.getElementById('best-deals');
    if (dealsContainer) {
        const deals = await getMultiBuyDeals(4);
        if (deals.length > 0) {
            dealsContainer.innerHTML = deals.map(createDealCard).join('');
        }
    }
}

// Initialize brand page
async function initBrandPage(brandSlug) {
    const productsContainer = document.getElementById('brand-products');
    if (productsContainer) {
        productsContainer.innerHTML = '<p>Loading products...</p>';
        const products = await getProductsWithPrices({ brandSlug });
        if (products.length > 0) {
            productsContainer.innerHTML = `
                <div class="products-grid">
                    ${products.map(createProductCard).join('')}
                </div>
            `;
        } else {
            productsContainer.innerHTML = '<p>No products found for this brand.</p>';
        }
    }
}

// Initialize category page (nic-salts, shortfills, etc)
async function initCategoryPage(type) {
    const productsContainer = document.getElementById('category-products');
    if (productsContainer) {
        productsContainer.innerHTML = '<p>Loading products...</p>';
        const products = await getProductsWithPrices({ type });
        if (products.length > 0) {
            productsContainer.innerHTML = `
                <div class="products-grid">
                    ${products.map(createProductCard).join('')}
                </div>
            `;
        } else {
            productsContainer.innerHTML = '<p>No products found.</p>';
        }
    }
}

// Initialize deals page
async function initDealsPage() {
    const dealsContainer = document.getElementById('all-deals');
    if (dealsContainer) {
        dealsContainer.innerHTML = '<p>Loading deals...</p>';
        const deals = await getMultiBuyDeals(20);
        if (deals.length > 0) {
            dealsContainer.innerHTML = `
                <div class="deals-grid">
                    ${deals.map(createDealCard).join('')}
                </div>
            `;
        } else {
            dealsContainer.innerHTML = '<p>No deals found.</p>';
        }
    }
}

// Export functions for use in pages
window.VapeScout = {
    getBrands,
    getBrandBySlug,
    getRetailers,
    getProducts,
    getProductBySlug,
    getProductsWithPrices,
    getBestDeals,
    getMultiBuyDeals,
    searchProducts,
    formatPrice,
    createProductCard,
    createDealCard,
    initHomepage,
    initBrandPage,
    initCategoryPage,
    initDealsPage
};

console.log('VapeScout data layer loaded');
