-- Создаем таблицу для хранения состояний пользователей в webhook-боте
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.user_states (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL,
    telegram_user_id BIGINT NOT NULL,
    state VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bot_id, telegram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_states_bot_user ON t_p5255237_telegram_bot_service.user_states(bot_id, telegram_user_id);