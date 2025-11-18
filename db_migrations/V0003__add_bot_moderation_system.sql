-- Добавляем систему модерации ботов
ALTER TABLE bots 
ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN moderation_reason TEXT,
ADD COLUMN moderated_by INTEGER REFERENCES users(id),
ADD COLUMN moderated_at TIMESTAMP;

-- Создаем индекс для быстрого поиска ботов на модерации
CREATE INDEX idx_bots_moderation_status ON bots(moderation_status);

-- Обновляем существующие боты - делаем их одобренными
UPDATE bots SET moderation_status = 'approved' WHERE moderation_status = 'pending';