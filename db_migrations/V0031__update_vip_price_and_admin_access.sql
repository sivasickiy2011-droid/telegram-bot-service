-- Обновляем цену VIP-ключа на реальную 350 рублей
UPDATE t_p5255237_telegram_bot_service.bots
SET vip_price = 350
WHERE id = 2;

-- Добавляем поле для списка администраторов с безлимитным доступом
ALTER TABLE t_p5255237_telegram_bot_service.bots
ADD COLUMN IF NOT EXISTS admin_telegram_ids BIGINT[] DEFAULT ARRAY[]::BIGINT[];

-- Устанавливаем администраторов для бота Татьяны (владелец бота и админ портала)
UPDATE t_p5255237_telegram_bot_service.bots
SET admin_telegram_ids = ARRAY[718091347, 500136108]
WHERE id = 2;