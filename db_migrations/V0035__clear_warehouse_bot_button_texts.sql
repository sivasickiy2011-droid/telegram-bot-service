-- Очистка button_texts для бота склада SKADTEST01
UPDATE t_p5255237_telegram_bot_service.bots 
SET button_texts = NULL 
WHERE id = 27 AND template = 'warehouse';
