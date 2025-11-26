-- Создание таблиц для шаблона "Интернет-магазин"

-- Таблица категорий товаров
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.shop_categories (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_categories_bot_id ON t_p5255237_telegram_bot_service.shop_categories(bot_id);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.shop_products (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL,
    category_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_products_bot_id ON t_p5255237_telegram_bot_service.shop_products(bot_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_category_id ON t_p5255237_telegram_bot_service.shop_products(category_id);

-- Таблица корзин пользователей
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.shop_carts (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_carts_user_id ON t_p5255237_telegram_bot_service.shop_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_carts_bot_id ON t_p5255237_telegram_bot_service.shop_carts(bot_id);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.shop_orders (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    payment_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    delivery_address TEXT,
    delivery_phone VARCHAR(50),
    delivery_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_bot_id ON t_p5255237_telegram_bot_service.shop_orders(bot_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON t_p5255237_telegram_bot_service.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_order_number ON t_p5255237_telegram_bot_service.shop_orders(order_number);

-- Таблица товаров в заказе
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.shop_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id ON t_p5255237_telegram_bot_service.shop_order_items(order_id);

COMMENT ON TABLE t_p5255237_telegram_bot_service.shop_categories IS 'Категории товаров для шаблона Интернет-магазин';
COMMENT ON TABLE t_p5255237_telegram_bot_service.shop_products IS 'Товары в каталоге магазина';
COMMENT ON TABLE t_p5255237_telegram_bot_service.shop_carts IS 'Корзины покупок пользователей';
COMMENT ON TABLE t_p5255237_telegram_bot_service.shop_orders IS 'Заказы пользователей';
COMMENT ON TABLE t_p5255237_telegram_bot_service.shop_order_items IS 'Товары в составе заказа';