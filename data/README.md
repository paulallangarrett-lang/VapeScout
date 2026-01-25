# VapeScout Data Directory

This directory contains the product database structure for the VapeScout price comparison functionality.

## Files

### products.json
The main product database containing:
- **brands** - E-liquid manufacturers (Elfliq, Vampire Vape, etc.)
- **retailers** - UK vape shops we compare prices from
- **products** - Individual e-liquid products
- **prices** - Current prices from each retailer
- **categories** - Product types (Nic Salts, Shortfills, 50/50)
- **flavourCategories** - Flavour classifications

## Future Backend Requirements

To implement live price comparison, you'll need:

### 1. Price Scraping Service
- Node.js or Python script to scrape retailer prices
- Run on schedule (every 4-6 hours)
- Store results in database (Supabase/PostgreSQL)

### 2. API Endpoints
```
GET /api/products - List products with filters
GET /api/products/:slug - Single product with all prices
GET /api/brands - List all brands
GET /api/search?q=watermelon - Search products
GET /api/deals - Current multi-buy deals
```

### 3. Database Schema (Supabase)
```sql
-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT,
  description TEXT,
  website TEXT,
  featured BOOLEAN DEFAULT false
);

-- Products  
CREATE TABLE products (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  nicotine_strength INTEGER,
  size INTEGER,
  vg_pg_ratio TEXT,
  flavour_category TEXT,
  rrp DECIMAL(10,2),
  popular BOOLEAN DEFAULT false
);

-- Retailers
CREATE TABLE retailers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  free_delivery_threshold DECIMAL(10,2),
  delivery_cost DECIMAL(10,2),
  affiliate_network TEXT,
  active BOOLEAN DEFAULT true
);

-- Prices (updated by scraper)
CREATE TABLE prices (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  retailer_id UUID REFERENCES retailers(id),
  price DECIMAL(10,2) NOT NULL,
  multi_buy_qty INTEGER,
  multi_buy_price DECIMAL(10,2),
  in_stock BOOLEAN DEFAULT true,
  last_checked TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, retailer_id)
);
```

### 4. Affiliate Integration
- Awin: Most UK vape retailers
- Apply at: https://www.awin.com/gb
- Retailers on Awin: Vape UK, Grey Haze, Electric Tobacconist, etc.

### 5. Price Scraping Targets
Priority retailers to scrape:
1. Electric Tobacconist (large catalog, good prices)
2. Vape Superstore (wide range)
3. Grey Haze (competitive prices)
4. Vape UK (good multi-buy deals)
5. Direct from brands (Vampire Vape, Dinner Lady)

## Static Site Approach
The current site is static HTML. For basic functionality without backend:
1. Use products.json as read-only data source
2. Generate static product pages at build time
3. Update JSON manually or with simple scraper
4. Rebuild/redeploy when prices change

This approach works for MVP/launch but limits real-time price updates.
