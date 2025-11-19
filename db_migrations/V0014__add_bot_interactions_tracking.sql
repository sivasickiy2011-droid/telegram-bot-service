-- Добавляем поля для отслеживания взаимодействий
ALTER TABLE t_p5255237_telegram_bot_service.bots 
ADD COLUMN IF NOT EXISTS interactions_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interactions_yesterday INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_interaction_date DATE DEFAULT CURRENT_DATE;

-- Обновляем счетчик взаимодействий на основе количества выданных QR-кодов
UPDATE t_p5255237_telegram_bot_service.bots b
SET interactions_today = COALESCE((
    SELECT COUNT(*)
    FROM t_p5255237_telegram_bot_service.qr_codes qr
    WHERE qr.bot_id = b.id 
    AND DATE(qr.created_at) = CURRENT_DATE
), 0);

UPDATE t_p5255237_telegram_bot_service.bots b
SET interactions_yesterday = COALESCE((
    SELECT COUNT(*)
    FROM t_p5255237_telegram_bot_service.qr_codes qr
    WHERE qr.bot_id = b.id 
    AND DATE(qr.created_at) = CURRENT_DATE - INTERVAL '1 day'
), 0);
