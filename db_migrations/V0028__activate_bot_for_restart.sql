-- Активируем бот для перезапуска с новыми текстами
UPDATE t_p5255237_telegram_bot_service.bots 
SET status = 'active'
WHERE id = 2;