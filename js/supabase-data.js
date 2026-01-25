// VapeScout Supabase Configuration
(function() {
    'use strict';
    
    var SUPABASE_URL = 'https://quixkyblpiwazhpvjeir.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aXhreWJscGl3YXpocHZqZWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTMzMjYsImV4cCI6MjA4NDkyOTMyNn0._mNGAp4DAl8KPoPrv7XlrNLOS07vqRJ1RNYhyZ0gbc8';

    // Wait for Supabase library to load
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return;
    }

    // Initialize Supabase client
    var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');

    // Category emojis
    var categoryEmoji = {
        'fruit': '🍓',
        'menthol': '❄️',
        'dessert': '🍰',
        'tobacco': '🍂',
        'candy': '🍬',
        'drink': '🥤'
    };

    // Format price for display
    function formatPrice(price) {
        return '£' + parseFloat(price).toFixed(2);
    }

    // Get products with their best price
    async function getProductsWithPrices(filters) {
        filters = filters || {};
        try {
            var query = db.from('products').select('*, brands(id, name, slug)');
            
            if (filters.popularOnly) {
                query = query.eq('popular', true);
            }
            
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            
            query = query.order('popular', { ascending: false }).order('name');
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            var result = await query;
            var products = result.data || [];
            
            if (result.error) {
                console.error('Error fetching products:', result.error);
                return [];
            }
            
            if (products.length === 0) return [];
            
            // Get all prices for these products
            var productIds = products.map(function(p) { return p.id; });
            
            var pricesResult = await db
                .from('prices')
                .select('*, retailers(id, name, slug)')
                .in('product_id', productIds)
                .eq('in_stock', true);
            
            var allPrices = pricesResult.data || [];
            
            // Attach best price to each product
            return products.map(function(product) {
                var productPrices = allPrices.filter(function(p) { 
                    return p.product_id === product.id; 
                });
                var sortedPrices = productPrices.sort(function(a, b) { 
                    return a.price - b.price; 
                });
                return {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    type: product.type,
                    nicotine_strength: product.nicotine_strength,
                    size: product.size,
                    flavour_category: product.flavour_category,
                    rrp: product.rrp,
                    popular: product.popular,
                    brands: product.brands,
                    bestPrice: sortedPrices[0] || null,
                    priceCount: productPrices.length
                };
            });
        } catch (err) {
            console.error('Error in getProductsWithPrices:', err);
            return [];
        }
    }

    // Create product card HTML
    function createProductCard(product) {
        var bestPrice = product.bestPrice;
        var savings = (product.rrp && bestPrice) ? Math.round((1 - bestPrice.price / product.rrp) * 100) : 0;
        var brandName = product.brands ? product.brands.name : '';
        var emoji = categoryEmoji[product.flavour_category] || '💨';
        
        var html = '<article class="product-card" data-product-slug="' + product.slug + '">';
        
        if (product.popular) {
            html += '<div class="product-badge bestseller">Popular</div>';
        }
        
        html += '<div class="product-image"><div class="product-placeholder">' + emoji + '</div></div>';
        html += '<div class="product-content">';
        html += '<h3>' + product.name + '</h3>';
        html += '<p class="product-brand">' + brandName + '</p>';
        html += '<div class="product-specs">';
        html += '<span class="spec">' + product.size + 'ml</span>';
        html += '<span class="spec">' + product.nicotine_strength + 'mg</span>';
        html += '</div>';
        html += '<div class="product-pricing">';
        
        if (bestPrice) {
            html += '<div class="price-range">';
            html += '<span class="price-from">From</span>';
            html += '<span class="price-value">' + formatPrice(bestPrice.price) + '</span>';
            html += '</div>';
            if (product.rrp && savings > 0) {
                html += '<div class="price-comparison">';
                html += '<span class="rrp">RRP ' + formatPrice(product.rrp) + '</span>';
                html += '<span class="savings">Save ' + savings + '%</span>';
                html += '</div>';
            }
        } else {
            html += '<div class="price-range"><span class="price-value">Price TBC</span></div>';
        }
        
        html += '</div>';
        html += '<a href="/product/' + product.slug + '/" class="btn btn-primary btn-block">Compare ' + (product.priceCount || 0) + ' Prices</a>';
        html += '</div></article>';
        
        return html;
    }

    // Initialize homepage
    async function initHomepage() {
        console.log('initHomepage called');
        
        var popularContainer = document.getElementById('popular-products');
        if (!popularContainer) {
            console.log('No popular-products container found');
            return;
        }
        
        popularContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;">Loading products...</p>';
        
        try {
            var products = await getProductsWithPrices({ popularOnly: true, limit: 8 });
            console.log('Products loaded:', products.length);
            
            if (products.length > 0) {
                var html = products.map(createProductCard).join('');
                popularContainer.innerHTML = html;
            } else {
                popularContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;">No products found.</p>';
            }
        } catch (err) {
            console.error('Error in initHomepage:', err);
            popularContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;">Error loading products.</p>';
        }
    }

    // Export functions for use in pages
    window.VapeScout = {
        formatPrice: formatPrice,
        getProductsWithPrices: getProductsWithPrices,
        createProductCard: createProductCard,
        initHomepage: initHomepage
    };

    console.log('VapeScout data layer loaded successfully');
})();
