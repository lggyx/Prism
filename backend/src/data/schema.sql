CREATE TABLE IF NOT EXISTS observers (
  id VARCHAR(64) PRIMARY KEY,
  observer_code VARCHAR(32) NOT NULL UNIQUE,
  observer_no VARCHAR(16) NOT NULL,
  email VARCHAR(255) NULL UNIQUE,
  phone VARCHAR(32) NULL UNIQUE,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  active_since DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observer_settings (
  observer_id VARCHAR(64) PRIMARY KEY,
  show_community_location BOOLEAN NOT NULL DEFAULT TRUE,
  location_precision ENUM('CITY', 'DISTRICT', 'OFF') NOT NULL DEFAULT 'CITY',
  challenge_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  interface_theme ENUM('DARK') NOT NULL DEFAULT 'DARK',
  default_slice_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_observer_settings_observer FOREIGN KEY (observer_id) REFERENCES observers(id)
);

CREATE TABLE IF NOT EXISTS lenses (
  id VARCHAR(96) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  english_name VARCHAR(96) NOT NULL,
  category ENUM('NATURE', 'CULTURE', 'URBAN', 'TEMPORAL', 'CUSTOM') NOT NULL,
  color CHAR(7) NOT NULL,
  icon VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL,
  full_description TEXT NULL,
  prompt TEXT NULL,
  is_preset BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lens_usage (
  observer_id VARCHAR(64) NOT NULL,
  lens_id VARCHAR(96) NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  first_used_at DATETIME NULL,
  last_used_at DATETIME NULL,
  PRIMARY KEY (observer_id, lens_id),
  CONSTRAINT fk_lens_usage_observer FOREIGN KEY (observer_id) REFERENCES observers(id),
  CONSTRAINT fk_lens_usage_lens FOREIGN KEY (lens_id) REFERENCES lenses(id)
);

CREATE TABLE IF NOT EXISTS captures (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  captured_at DATETIME NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  accuracy_meters INT NULL,
  city VARCHAR(64) NULL,
  province VARCHAR(64) NULL,
  private_text VARCHAR(128) NULL,
  public_text VARCHAR(128) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_captures_owner FOREIGN KEY (owner_id) REFERENCES observers(id)
);

CREATE TABLE IF NOT EXISTS readings (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  capture_id VARCHAR(64) NOT NULL,
  lens_id VARCHAR(96) NOT NULL,
  status ENUM('queued', 'processing', 'succeeded', 'failed', 'timeout', 'empty') NOT NULL,
  summary TEXT NULL,
  failure_reason VARCHAR(64) NULL,
  empty_reason VARCHAR(64) NULL,
  annotations_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_readings_owner FOREIGN KEY (owner_id) REFERENCES observers(id),
  CONSTRAINT fk_readings_capture FOREIGN KEY (capture_id) REFERENCES captures(id),
  CONSTRAINT fk_readings_lens FOREIGN KEY (lens_id) REFERENCES lenses(id)
);

CREATE TABLE IF NOT EXISTS slices (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  reading_id VARCHAR(64) NOT NULL,
  capture_id VARCHAR(64) NOT NULL,
  lens_id VARCHAR(96) NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  summary TEXT NOT NULL,
  annotations_json JSON NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  resonance_count INT NOT NULL DEFAULT 0,
  saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_slices_owner FOREIGN KEY (owner_id) REFERENCES observers(id),
  CONSTRAINT fk_slices_reading FOREIGN KEY (reading_id) REFERENCES readings(id),
  CONSTRAINT fk_slices_capture FOREIGN KEY (capture_id) REFERENCES captures(id),
  CONSTRAINT fk_slices_lens FOREIGN KEY (lens_id) REFERENCES lenses(id)
);

CREATE TABLE IF NOT EXISTS export_tasks (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  slice_id VARCHAR(64) NOT NULL,
  status ENUM('processing', 'succeeded', 'failed') NOT NULL DEFAULT 'processing',
  format VARCHAR(64) NOT NULL,
  include_location BOOLEAN NOT NULL DEFAULT FALSE,
  template VARCHAR(64) NOT NULL,
  export_url TEXT NULL,
  error_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  expires_at DATETIME NULL,
  CONSTRAINT fk_export_tasks_owner FOREIGN KEY (owner_id) REFERENCES observers(id),
  CONSTRAINT fk_export_tasks_slice FOREIGN KEY (slice_id) REFERENCES slices(id)
);

CREATE TABLE IF NOT EXISTS lens_creator_sessions (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  status ENUM('asking', 'draft_ready', 'confirmed') NOT NULL DEFAULT 'asking',
  entry VARCHAR(64) NULL,
  transcript TEXT NULL,
  draft_lens_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lens_creator_sessions_owner FOREIGN KEY (owner_id) REFERENCES observers(id)
);
