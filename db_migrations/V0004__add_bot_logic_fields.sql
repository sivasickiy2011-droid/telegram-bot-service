-- Добавляем поля для описания логики и настроек бота
ALTER TABLE bots 
ADD COLUMN IF NOT EXISTS bot_description TEXT,
ADD COLUMN IF NOT EXISTS bot_logic TEXT,
ADD COLUMN IF NOT EXISTS bot_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS bot_template VARCHAR(50) DEFAULT 'custom';

-- Комментарии для полей
COMMENT ON COLUMN bots.bot_description IS 'Краткое описание что делает бот';
COMMENT ON COLUMN bots.bot_logic IS 'Детальное описание логики работы бота';
COMMENT ON COLUMN bots.bot_features IS 'Список функций и возможностей бота';
COMMENT ON COLUMN bots.bot_template IS 'Шаблон бота: shop, keys, subscription, custom';