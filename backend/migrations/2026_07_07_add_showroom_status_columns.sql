USE revora_cinematic;

ALTER TABLE showrooms
    ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER contact_number,
    ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER status,
    ADD INDEX idx_showrooms_status (status);
