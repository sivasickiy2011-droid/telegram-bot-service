-- Добавляем настройки QR-кодов для ботов
ALTER TABLE t_p5255237_telegram_bot_service.bots 
ADD COLUMN IF NOT EXISTS qr_free_count INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS qr_paid_count INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS qr_rotation_value INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qr_rotation_unit VARCHAR(20) DEFAULT 'never',
ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_url TEXT DEFAULT '';

-- Комментарии для полей
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.qr_free_count IS 'Количество уникальных бесплатных QR-кодов';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.qr_paid_count IS 'Количество уникальных платных QR-кодов';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.qr_rotation_value IS 'Значение для ротации QR-кодов (число)';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.qr_rotation_unit IS 'Единица измерения ротации: never, hours, days, weeks, years';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.payment_enabled IS 'Включены ли платные QR-коды';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.payment_url IS 'Ссылка для оплаты VIP-ключей';
