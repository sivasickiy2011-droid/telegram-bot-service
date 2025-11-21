-- Заменяем "Чёрной пятнице" на "Закрытой распродаже" в текстах бота
UPDATE t_p5255237_telegram_bot_service.bots 
SET message_texts = jsonb_set(
  message_texts, 
  '{free_key_success}', 
  '"✅ Ваш бесплатный ключ №{code_number}\n\nПокажите этот QR-код на кассе:\n• Участвуете в розыгрыше подарка\n• Получаете право на участие в Закрытой распродаже"'
)
WHERE id = 2;