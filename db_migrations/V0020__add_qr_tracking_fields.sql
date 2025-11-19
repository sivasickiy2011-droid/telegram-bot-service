-- Добавляем поля для отслеживания выданных QR-кодов пользователям
ALTER TABLE t_p5255237_telegram_bot_service.bot_users 
ADD COLUMN IF NOT EXISTS received_free_qr BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS received_vip_qr BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS free_qr_received_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS vip_qr_received_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Создаём индекс для быстрой проверки администраторов
CREATE INDEX IF NOT EXISTS idx_bot_users_admin ON t_p5255237_telegram_bot_service.bot_users(bot_id, is_admin) WHERE is_admin = true;