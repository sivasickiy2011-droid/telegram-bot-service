-- Синхронизация текущих данных по пользователям
UPDATE t_p5255237_telegram_bot_service.bots b
SET total_users = COALESCE((
    SELECT COUNT(DISTINCT telegram_user_id)
    FROM t_p5255237_telegram_bot_service.bot_users bu
    WHERE bu.bot_id = b.id
), 0);
