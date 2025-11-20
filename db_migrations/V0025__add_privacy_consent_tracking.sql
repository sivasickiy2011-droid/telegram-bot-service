-- Добавляем таблицу для отслеживания согласий на обработку персональных данных
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.privacy_consents (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES t_p5255237_telegram_bot_service.bots(id),
    user_id INTEGER NOT NULL REFERENCES t_p5255237_telegram_bot_service.bot_users(id),
    telegram_user_id BIGINT NOT NULL,
    consent_text TEXT NOT NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_unique_code VARCHAR(50),
    UNIQUE(bot_id, user_id)
);

-- Добавляем поле для хранения текста согласия в настройках бота
ALTER TABLE t_p5255237_telegram_bot_service.bots 
ADD COLUMN IF NOT EXISTS privacy_policy_text TEXT DEFAULT 'Политика конфиденциальности и обработки персональных данных

1. Общие положения
Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей бота.

2. Персональные данные
Мы собираем: имя, фамилию, номер телефона, Telegram ID.

3. Цели обработки
- Идентификация пользователя
- Предоставление доступа к услугам
- Уведомления о статусе заказа

4. Хранение данных
Данные хранятся на защищенных серверах и не передаются третьим лицам.

5. Ваши права
Вы можете запросить удаление своих данных, связавшись с администратором.

Используя бота, вы соглашаетесь с данной политикой конфиденциальности.';

-- Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_privacy_consents_bot_user ON t_p5255237_telegram_bot_service.privacy_consents(bot_id, user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_telegram_user ON t_p5255237_telegram_bot_service.privacy_consents(telegram_user_id);