-- Перезапускаем бот для очистки кэша
UPDATE t_p5255237_telegram_bot_service.bots 
SET status = 'inactive'
WHERE id = 2;

UPDATE t_p5255237_telegram_bot_service.bots 
SET status = 'active'
WHERE id = 2;