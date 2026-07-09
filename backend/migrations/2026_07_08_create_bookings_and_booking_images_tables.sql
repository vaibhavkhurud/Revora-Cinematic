USE revora_cinematic;

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    showroom_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    videographer_id BIGINT UNSIGNED DEFAULT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    vehicle_brand VARCHAR(80) NOT NULL,
    vehicle_model VARCHAR(80) NOT NULL,
    vehicle_type VARCHAR(60) NOT NULL,
    vehicle_color VARCHAR(60) NOT NULL,
    registration_number VARCHAR(30) NOT NULL,
    booking_date DATETIME NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    status ENUM('pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_bookings_showroom_created (showroom_id, created_at),
    KEY idx_bookings_showroom_status (showroom_id, status),
    KEY idx_bookings_showroom_date (showroom_id, booking_date),
    KEY idx_bookings_registration_number (registration_number)
);

CREATE TABLE IF NOT EXISTS booking_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    uploaded_by BIGINT UNSIGNED NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_booking_images_booking (booking_id)
);
