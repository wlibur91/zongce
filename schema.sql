CREATE TABLE IF NOT EXISTS records (
  id VARCHAR(64) PRIMARY KEY,
  module VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sub_type VARCHAR(64) NOT NULL,
  grade VARCHAR(32),
  role ENUM('personal','team') NOT NULL DEFAULT 'personal',
  date DATE NOT NULL,
  term VARCHAR(32),
  hours DECIMAL(6,1),
  custom_points DECIMAL(6,1),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
