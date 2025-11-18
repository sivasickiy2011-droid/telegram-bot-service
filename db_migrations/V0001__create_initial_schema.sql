CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    photo_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    telegram_token VARCHAR(500) NOT NULL,
    template VARCHAR(100) DEFAULT 'POLYTOPE',
    status VARCHAR(50) DEFAULT 'inactive',
    total_users INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bot_users (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bots(id),
    telegram_user_id BIGINT NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bot_id, telegram_user_id)
);

CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bots(id),
    code_number INTEGER NOT NULL,
    code_type VARCHAR(50) DEFAULT 'free',
    is_used BOOLEAN DEFAULT FALSE,
    used_by_user_id INTEGER REFERENCES bot_users(id),
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bot_id, code_number)
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bots(id),
    user_id INTEGER NOT NULL REFERENCES bot_users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    confirmed_by INTEGER REFERENCES users(id),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vip_keys (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bots(id),
    key_code VARCHAR(255) UNIQUE NOT NULL,
    payment_id INTEGER REFERENCES payments(id),
    issued_to_user_id INTEGER REFERENCES bot_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    issued_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bot_users_bot_id ON bot_users(bot_id);
CREATE INDEX idx_qr_codes_bot_id ON qr_codes(bot_id);
CREATE INDEX idx_payments_bot_id ON payments(bot_id);
CREATE INDEX idx_vip_keys_bot_id ON vip_keys(bot_id);