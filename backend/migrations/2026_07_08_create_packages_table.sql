USE revora_cinematic;

CREATE TABLE IF NOT EXISTS packages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT UNSIGNED NOT NULL,
    features JSON DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_packages_name (name),
    KEY idx_packages_is_active (is_active),
    FULLTEXT KEY ft_packages_name_description (name, description),
    CONSTRAINT chk_packages_price_positive CHECK (price > 0),
    CONSTRAINT chk_packages_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_packages_features_json CHECK (features IS NULL OR JSON_VALID(features))
);
