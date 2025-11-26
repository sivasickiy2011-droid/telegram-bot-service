-- Создание таблицы для хранения FSM состояний ботов
CREATE TABLE IF NOT EXISTS t_p5255237_telegram_bot_service.bot_fsm_states (
    bot_id INTEGER NOT NULL,
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    state TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bot_id, chat_id, user_id)
);

-- Индекс для быстрого поиска по bot_id
CREATE INDEX IF NOT EXISTS idx_bot_fsm_states_bot_id ON t_p5255237_telegram_bot_service.bot_fsm_states(bot_id);

-- Автоматическая очистка старых состояний (старше 24 часов)
CREATE INDEX IF NOT EXISTS idx_bot_fsm_states_updated_at ON t_p5255237_telegram_bot_service.bot_fsm_states(updated_at);

COMMENT ON TABLE t_p5255237_telegram_bot_service.bot_fsm_states IS 'FSM состояния пользователей ботов для webhook режима';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bot_fsm_states.state IS 'Текущее состояние FSM (например: BotStates:warehouse_entering_phone)';
COMMENT ON COLUMN t_p5255237_telegram_bot_service.bot_fsm_states.data IS 'Данные состояния в формате JSON';