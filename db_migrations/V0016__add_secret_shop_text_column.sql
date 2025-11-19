-- Добавляем колонку для кастомного текста о Тайной витрине
ALTER TABLE t_p5255237_telegram_bot_service.bots 
ADD COLUMN IF NOT EXISTS secret_shop_text TEXT;

COMMENT ON COLUMN t_p5255237_telegram_bot_service.bots.secret_shop_text IS 'Кастомный текст для кнопки "Узнать про Тайную витрину"';