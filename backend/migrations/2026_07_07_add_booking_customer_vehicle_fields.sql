USE revora_cinematic;

ALTER TABLE bookings
    ADD COLUMN customer_name VARCHAR(120) NOT NULL AFTER videographer_id,
    ADD COLUMN customer_mobile VARCHAR(20) NOT NULL AFTER customer_name,
    ADD COLUMN vehicle_brand VARCHAR(80) NOT NULL AFTER customer_mobile,
    ADD COLUMN vehicle_model VARCHAR(80) NOT NULL AFTER vehicle_brand,
    ADD COLUMN vehicle_type VARCHAR(60) NOT NULL AFTER vehicle_model,
    ADD COLUMN vehicle_color VARCHAR(60) NOT NULL AFTER vehicle_type,
    ADD COLUMN registration_number VARCHAR(30) NOT NULL AFTER vehicle_color,
    ADD COLUMN time_slot VARCHAR(30) NOT NULL AFTER booking_date,
    ADD INDEX idx_bookings_registration_number (registration_number);
