-- Добавление полей для настройки периода акции и сообщения при покупке VIP
ALTER TABLE t_p5255237_telegram_bot_service.bots 
ADD COLUMN IF NOT EXISTS vip_promo_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vip_promo_start_date DATE,
ADD COLUMN IF NOT EXISTS vip_promo_end_date DATE,
ADD COLUMN IF NOT EXISTS vip_purchase_message TEXT DEFAULT 'VIP-ключ открывает доступ к эксклюзивным материалам и привилегиям.';