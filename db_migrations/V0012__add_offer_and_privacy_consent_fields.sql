-- Добавление полей для оффера и согласия на обработку персональных данных
ALTER TABLE t_p5255237_telegram_bot_service.bots 
ADD COLUMN IF NOT EXISTS offer_image_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS privacy_consent_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_consent_text TEXT DEFAULT 'Я согласен на обработку персональных данных';