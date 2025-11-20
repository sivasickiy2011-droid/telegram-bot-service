-- Перезапуск бота ID 11 для пользователя Татьяны (@Perina76)
-- Сначала останавливаем бота
UPDATE t_p5255237_telegram_bot_service.bots 
SET status = 'inactive', updated_at = NOW() 
WHERE id = 11;

-- Затем снова запускаем
UPDATE t_p5255237_telegram_bot_service.bots 
SET status = 'active', updated_at = NOW() 
WHERE id = 11;