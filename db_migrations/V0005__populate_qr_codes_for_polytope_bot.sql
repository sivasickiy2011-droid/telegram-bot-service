-- Создаем 500 бесплатных QR-ключей для бота ID=11
INSERT INTO t_p5255237_telegram_bot_service.qr_codes (bot_id, code_number, code_type, is_used)
SELECT 11, generate_series, 'free', false
FROM generate_series(1, 500);

-- Создаем 500 VIP QR-ключей для бота ID=11
INSERT INTO t_p5255237_telegram_bot_service.qr_codes (bot_id, code_number, code_type, is_used)
SELECT 11, generate_series, 'vip', false
FROM generate_series(501, 1000);
