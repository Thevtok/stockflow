-- ============================================================================
-- StockFlow - Realistic Seed Data
-- Domain: Quartz Surfaces, Natural Stone & Warehouse Fabrication Consumables
-- 15+ Products, Initial Ledger Movements, and Historical Orders
-- ============================================================================

-- 1. Insert 15 Products
INSERT INTO products (sku, name, price, stock, is_active, created_at) VALUES
('QZ-CALA-001', 'Calacatta Gold Premium Quartz Slab (3200x1600x20mm)', 3850000, 25, true, now() - INTERVAL '30 days'),
('QZ-STAT-002', 'Statuario Nuvo Polished Quartz Slab (3000x1400x20mm)', 4200000, 18, true, now() - INTERVAL '28 days'),
('QZ-CARR-003', 'Carrara Mist Fine Veined Quartz (3200x1600x15mm)', 2950000, 40, true, now() - INTERVAL '25 days'),
('QZ-MRQ-004', 'Marquina Black Mirror Gloss Quartz (3200x1600x20mm)', 3400000, 15, true, now() - INTERVAL '20 days'),
('QZ-PURE-005', 'Pure White Crystal Engineered Quartz (3000x1400x15mm)', 2200000, 50, true, now() - INTERVAL '18 days'),
('QZ-CONC-006', 'Sleek Concrete Matte Quartz Slab (3200x1600x20mm)', 2650000, 8, true, now() - INTERVAL '15 days'),
('QZ-EMPR-007', 'Emperador Warm Earth Veined Quartz (3000x1400x20mm)', 3100000, 12, true, now() - INTERVAL '14 days'),
('QZ-TAJ-008', 'Taj Mahal Luxury Quartzite Textured (3200x1600x20mm)', 5500000, 5, true, now() - INTERVAL '12 days'),
('QZ-TERR-009', 'Venetian Terrazzo Aggregate Slab (2800x1200x18mm)', 1850000, 22, true, now() - INTERVAL '10 days'),
('QZ-GREY-010', 'Storm Grey Silky Honed Quartz (3200x1600x20mm)', 2450000, 30, true, now() - INTERVAL '8 days'),
('QZ-AZUL-011', 'Azul Macaubas Exotic Blue Quartzite (3200x1600x20mm)', 6200000, 3, true, now() - INTERVAL '7 days'),
('ACC-ADHE-012', 'Tenax Titanium Knife Grade Quartz Adhesive (1 Liter)', 350000, 85, true, now() - INTERVAL '30 days'),
('ACC-SEAL-013', 'Nano Anti-Stain Quartz & Stone Sealer (500ml)', 480000, 60, true, now() - INTERVAL '25 days'),
('ACC-DIAM-014', 'Electroplated Diamond Edge Polishing Pad 4-inch (Grit 400)', 175000, 120, true, now() - INTERVAL '20 days'),
('QZ-DISC-015', 'Arctic Frost Legacy Quartz 15mm (Discontinued Line)', 1500000, 0, false, now() - INTERVAL '60 days')
ON CONFLICT (sku) DO NOTHING;

-- 2. Insert Initial Ledger Stock Movements
INSERT INTO stock_movements (product_id, type, qty, note, created_at)
SELECT id, 'in', stock, 'Initial inventory audit & warehouse intake', created_at + INTERVAL '1 hour'
FROM products
WHERE stock > 0;

-- 3. Insert Historical Sample Sales Orders
-- Order 1: Completed Luxury Hotel Project Order
INSERT INTO sales_orders (id, customer, status, total, idempotency_key, created_at)
VALUES (1, 'Marina Bay Sands Interior Contractor', 'CREATED', 15900000, 'seed-order-uuid-001', now() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO sales_order_items (order_id, sku, qty, unit_price) VALUES
(1, 'QZ-CALA-001', 2, 3850000),
(1, 'QZ-STAT-002', 1, 4200000),
(1, 'ACC-ADHE-012', 4, 350000),
(1, 'ACC-SEAL-013', 2, 480000),
(1, 'ACC-DIAM-014', 6, 175000)
ON CONFLICT DO NOTHING;

-- Order 2: Sample Order That Was Cancelled (Stock was restored)
INSERT INTO sales_orders (id, customer, status, total, idempotency_key, created_at, cancelled_at)
VALUES (2, 'Sentosa Luxury Villa Project', 'CANCELLED', 11000000, 'seed-order-uuid-002', now() - INTERVAL '1 day', now() - INTERVAL '20 hours')
ON CONFLICT DO NOTHING;

INSERT INTO sales_order_items (order_id, sku, qty, unit_price) VALUES
(2, 'QZ-TAJ-008', 2, 5500000)
ON CONFLICT DO NOTHING;

-- Reset sequence to ensure future inserts don't collide
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('stock_movements_id_seq', (SELECT MAX(id) FROM stock_movements));
SELECT setval('sales_orders_id_seq', (SELECT MAX(id) FROM sales_orders));
SELECT setval('sales_order_items_id_seq', (SELECT MAX(id) FROM sales_order_items));
