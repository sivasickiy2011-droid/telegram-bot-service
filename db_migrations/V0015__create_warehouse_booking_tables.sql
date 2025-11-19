-- Таблица для бронирований времени разгрузки на складе
CREATE TABLE IF NOT EXISTS warehouse_bookings (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username VARCHAR(255),
    user_phone VARCHAR(50),
    user_company VARCHAR(255),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    vehicle_type VARCHAR(100),
    cargo_description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    bot_id INTEGER,
    UNIQUE(booking_date, booking_time, status)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_warehouse_bookings_date ON warehouse_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_bookings_user ON warehouse_bookings(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bookings_status ON warehouse_bookings(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_bookings_bot ON warehouse_bookings(bot_id);

-- Таблица для настроек расписания склада
CREATE TABLE IF NOT EXISTS warehouse_schedule (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER UNIQUE,
    work_start_time TIME DEFAULT '08:00:00',
    work_end_time TIME DEFAULT '18:00:00',
    slot_duration_minutes INTEGER DEFAULT 60,
    max_slots_per_day INTEGER DEFAULT 10,
    work_days VARCHAR(50) DEFAULT '1,2,3,4,5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE warehouse_bookings IS 'Бронирования времени для разгрузки на складе';
COMMENT ON TABLE warehouse_schedule IS 'Настройки рабочего расписания склада';