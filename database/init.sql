CREATE DATABASE IF NOT EXISTS tienda_virtual
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tienda_virtual;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2) NULL,
  icon VARCHAR(40) NOT NULL DEFAULT 'laptop',
  accent VARCHAR(30) NOT NULL DEFAULT 'lavender',
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0,
  reviews INT UNSIGNED NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_products_catalog (is_active, is_featured, category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  shipping_address VARCHAR(500) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_orders_email_created (email, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NULL,
  product_name VARCHAR(160) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO products
  (id, name, category, description, price, old_price, icon, accent, stock, rating, reviews, is_featured)
VALUES
  (1, 'Auriculares Aura Pro', 'Audio', 'Sonido envolvente, sin distracciones', 1899.00, 2299.00, 'headphones', 'lavender', 18, 4.9, 128, 1),
  (2, 'Laptop Forma 14', 'Computación', 'Ligera, potente y lista para crear', 18999.00, NULL, 'laptop', 'peach', 8, 4.8, 76, 1),
  (3, 'Smartphone Nébula 5G', 'Celulares', 'Cada detalle merece una gran pantalla', 12499.00, 13999.00, 'smartphone', 'blue', 12, 4.9, 93, 1),
  (4, 'Smartwatch Tempo', 'Wearables', 'Tu ritmo, de un vistazo', 2799.00, NULL, 'watch', 'mint', 24, 4.7, 54, 0),
  (5, 'Teclado Mecánico Senda', 'Accesorios', 'Escritura cómoda, tecla por tecla', 1599.00, 1899.00, 'laptop', 'pink', 16, 4.8, 41, 1),
  (6, 'Bocina Nube Mini', 'Audio', 'Pequeña por fuera. Grande por dentro', 1199.00, NULL, 'headphones', 'blue', 21, 4.6, 37, 0),
  (7, 'Laptop Nómada Air', 'Computación', 'Potencia portátil para todos tus días', 15499.00, 16999.00, 'laptop', 'mint', 6, 4.8, 62, 0),
  (8, 'Smartwatch Alba', 'Wearables', 'Bienestar y estilo en tu muñeca', 2199.00, NULL, 'watch', 'peach', 19, 4.7, 29, 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  price = VALUES(price),
  old_price = VALUES(old_price),
  icon = VALUES(icon),
  accent = VALUES(accent),
  stock = VALUES(stock),
  rating = VALUES(rating),
  reviews = VALUES(reviews),
  is_featured = VALUES(is_featured),
  is_active = 1;
