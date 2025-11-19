-- Добавление полей для интеграции с T-Bank и отслеживания платежей
ALTER TABLE t_p5255237_telegram_bot_service.payments
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_check_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS check_attempts INTEGER DEFAULT 0;