-- ===========================================
-- VapeScout Additional Products & Prices
-- Run this in Supabase SQL Editor
-- ===========================================

-- Add more products
INSERT INTO products (brand_id, name, slug, type, nicotine_strength, size, vg_pg_ratio, flavour_category, rrp, popular)
SELECT b.id, p.name, p.slug, p.type, p.nic, p.size, p.ratio, p.category, p.rrp, p.popular
FROM (VALUES
  -- More Elfliq flavours
  ('elfliq', 'Mango', 'elfliq-mango-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('elfliq', 'Grape', 'elfliq-grape-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('elfliq', 'Pink Lemonade', 'elfliq-pink-lemonade-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('elfliq', 'Spearmint', 'elfliq-spearmint-20mg', 'nic-salt', 20, 10, '50/50', 'menthol', 4.99, false),
  ('elfliq', 'Blueberry', 'elfliq-blueberry-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, true),
  
  -- More Bar Juice
  ('bar-juice-5000', 'Watermelon Ice', 'bar-juice-watermelon-ice-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 3.99, false),
  ('bar-juice-5000', 'Cherry Ice', 'bar-juice-cherry-ice-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 3.99, false),
  ('bar-juice-5000', 'Grape', 'bar-juice-grape-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 3.99, false),
  ('bar-juice-5000', 'Kiwi Passionfruit', 'bar-juice-kiwi-passionfruit-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 3.99, true),
  
  -- More Vampire Vape
  ('vampire-vape', 'Blood Sukka', 'vampire-vape-blood-sukka-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('vampire-vape', 'Berry Menthol', 'vampire-vape-berry-menthol-20mg', 'nic-salt', 20, 10, '50/50', 'menthol', 4.99, false),
  ('vampire-vape', 'Tobacco', 'vampire-vape-tobacco-20mg', 'nic-salt', 20, 10, '50/50', 'tobacco', 4.99, false),
  
  -- More Dinner Lady
  ('dinner-lady', 'Apple Pie', 'dinner-lady-apple-pie-20mg', 'nic-salt', 20, 10, '50/50', 'dessert', 5.99, false),
  ('dinner-lady', 'Blackberry Crumble', 'dinner-lady-blackberry-crumble-20mg', 'nic-salt', 20, 10, '50/50', 'dessert', 5.99, false),
  ('dinner-lady', 'Watermelon Slices', 'dinner-lady-watermelon-slices-20mg', 'nic-salt', 20, 10, '50/50', 'candy', 5.99, false),
  
  -- More MaryLiq
  ('maryliq', 'Triple Mango', 'maryliq-triple-mango-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, true),
  ('maryliq', 'Blue Razz Cherry', 'maryliq-blue-razz-cherry-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('maryliq', 'Citrus Sunrise', 'maryliq-citrus-sunrise-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  
  -- More SKE Crystal
  ('ske-crystal', 'Watermelon Ice', 'ske-crystal-watermelon-ice-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('ske-crystal', 'Fizzy Cherry', 'ske-crystal-fizzy-cherry-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  ('ske-crystal', 'Lemon Lime', 'ske-crystal-lemon-lime-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 4.99, false),
  
  -- More IVG
  ('ivg', 'Watermelon Ice', 'ivg-watermelon-ice-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 5.99, false),
  ('ivg', 'Strawberry Watermelon', 'ivg-strawberry-watermelon-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 5.99, false),
  ('ivg', 'Spearmint', 'ivg-spearmint-20mg', 'nic-salt', 20, 10, '50/50', 'menthol', 5.99, false),
  
  -- More Riot Squad
  ('riot-squad', 'Cherry Fizzle', 'riot-squad-cherry-fizzle-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 5.99, false),
  ('riot-squad', 'Tropical Fury', 'riot-squad-tropical-fury-20mg', 'nic-salt', 20, 10, '50/50', 'fruit', 5.99, false),
  
  -- Shortfills
  ('vampire-vape', 'Heisenberg Shortfill', 'vampire-vape-heisenberg-50ml', 'shortfill', 0, 50, '70/30', 'menthol', 12.99, true),
  ('dinner-lady', 'Lemon Tart Shortfill', 'dinner-lady-lemon-tart-50ml', 'shortfill', 0, 50, '70/30', 'dessert', 14.99, false),
  ('nasty-juice', 'Cush Man Shortfill', 'nasty-juice-cush-man-50ml', 'shortfill', 0, 50, '70/30', 'fruit', 14.99, false)
) AS p(brand_slug, name, slug, type, nic, size, ratio, category, rrp, popular)
JOIN brands b ON b.slug = p.brand_slug
ON CONFLICT (slug) DO NOTHING;

-- Add more prices for existing products
INSERT INTO prices (product_id, retailer_id, price, multi_buy_qty, multi_buy_price, url, in_stock)
SELECT p.id, r.id, pr.price, pr.mbq, pr.mbp, pr.url, true
FROM (VALUES
  -- Fill in missing prices
  ('ske-crystal-blue-razz-lemonade-20mg', 'vape-uk', 2.99, 10, 22.00, 'https://vapeuk.co.uk/ske-crystal-blue-razz'),
  ('ske-crystal-blue-razz-lemonade-20mg', 'grey-haze', 3.29, 5, 14.00, 'https://greyhaze.co.uk/ske-crystal-blue-razz'),
  ('nasty-juice-cush-man-20mg', 'vape-uk', 3.99, 5, 17.50, 'https://vapeuk.co.uk/cush-man'),
  ('nasty-juice-cush-man-20mg', 'grey-haze', 4.29, 5, 19.00, 'https://greyhaze.co.uk/cush-man'),
  
  -- New Elfliq prices
  ('elfliq-blueberry-20mg', 'vape-uk', 2.99, 10, 20.00, 'https://vapeuk.co.uk/elfliq-blueberry'),
  ('elfliq-blueberry-20mg', 'grey-haze', 3.29, 5, 15.00, 'https://greyhaze.co.uk/elfliq-blueberry'),
  ('elfliq-blueberry-20mg', 'electric-tobacconist', 2.79, 10, 22.00, 'https://electrictobacconist.co.uk/elfliq-blueberry'),
  
  -- Bar Juice prices
  ('bar-juice-kiwi-passionfruit-20mg', 'vape-uk', 1.99, 10, 15.00, 'https://vapeuk.co.uk/bar-juice-kiwi'),
  ('bar-juice-kiwi-passionfruit-20mg', 'grey-haze', 2.29, 10, 17.50, 'https://greyhaze.co.uk/bar-juice-kiwi'),
  ('bar-juice-kiwi-passionfruit-20mg', 'electric-tobacconist', 1.79, 10, 14.99, 'https://electrictobacconist.co.uk/bar-juice-kiwi'),
  
  -- MaryLiq prices  
  ('maryliq-triple-mango-20mg', 'vape-uk', 2.99, 10, 22.00, 'https://vapeuk.co.uk/maryliq-mango'),
  ('maryliq-triple-mango-20mg', 'eco-vape', 2.49, 10, 19.99, 'https://ecovapeuk.com/maryliq-mango'),
  
  -- Shortfill prices
  ('vampire-vape-heisenberg-50ml', 'vape-uk', 9.99, 3, 25.00, 'https://vapeuk.co.uk/heisenberg-shortfill'),
  ('vampire-vape-heisenberg-50ml', 'grey-haze', 10.99, 3, 28.00, 'https://greyhaze.co.uk/heisenberg-shortfill'),
  ('vampire-vape-heisenberg-50ml', 'vape-superstore', 8.99, 3, 24.00, 'https://vapesuperstore.co.uk/heisenberg-shortfill')
) AS pr(product_slug, retailer_slug, price, mbq, mbp, url)
JOIN products p ON p.slug = pr.product_slug
JOIN retailers r ON r.slug = pr.retailer_slug
ON CONFLICT (product_id, retailer_id) DO UPDATE 
SET price = EXCLUDED.price, 
    multi_buy_qty = EXCLUDED.multi_buy_qty, 
    multi_buy_price = EXCLUDED.multi_buy_price,
    last_checked = NOW();
