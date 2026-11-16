PRAGMA foreign_keys = ON;

CREATE TABLE enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  full_name TEXT NOT NULL CHECK(length(full_name) BETWEEN 2 AND 80),
  phone TEXT NOT NULL,
  email TEXT,
  customer_type TEXT NOT NULL,
  location TEXT NOT NULL,
  interests_json TEXT NOT NULL,
  monthly_bill_ugx INTEGER,
  outage_pattern TEXT,
  outage_hours REAL,
  has_generator INTEGER,
  generator_kva REAL,
  fuel_spend_ugx INTEGER,
  message TEXT,
  source TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  landing_page TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','assessed','quoted','won','lost')),
  deleted_at TEXT
);

CREATE INDEX idx_enquiries_status_created ON enquiries(status, created_at);
CREATE INDEX idx_enquiries_phone ON enquiries(phone);

CREATE TABLE enquiry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id),
  at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL,
  detail TEXT
);

CREATE INDEX idx_enquiry_events_enquiry ON enquiry_events(enquiry_id, at);

CREATE TABLE consent_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id),
  consent_text_version TEXT NOT NULL,
  consented_at TEXT NOT NULL DEFAULT (datetime('now')),
  privacy_notice_version TEXT NOT NULL,
  withdrawn_at TEXT
);

CREATE TABLE assessment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  requested_location TEXT NOT NULL,
  district_key TEXT,
  travel_distance_km REAL,
  fee_ugx INTEGER NOT NULL CHECK(fee_ugx >= 0),
  exceptional_travel_charge_ugx INTEGER NOT NULL DEFAULT 0 CHECK(exceptional_travel_charge_ugx >= 0),
  payment_preference TEXT NOT NULL CHECK(payment_preference IN ('advance','on_arrival')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','pending','paid','refunded','waived')),
  appointment_status TEXT NOT NULL DEFAULT 'requested' CHECK(appointment_status IN ('requested','confirmed','rescheduled','completed','cancelled')),
  requested_date TEXT,
  confirmed_date TEXT,
  cancellation_terms_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_assessment_status ON assessment_requests(appointment_status, requested_at);

CREATE TABLE assessment_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessment_requests(id),
  amount_ugx INTEGER NOT NULL CHECK(amount_ugx >= 0),
  method TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','paid','refunded','waived')),
  provider_reference TEXT,
  receipt_number TEXT UNIQUE,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  recorded_by TEXT,
  note TEXT
);

CREATE TABLE assessment_fee_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessment_requests(id),
  installation_reference TEXT,
  credit_ugx INTEGER NOT NULL CHECK(credit_ugx >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applied','expired','voided')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  applied_at TEXT,
  note TEXT
);

CREATE TABLE preliminary_estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  system_mode TEXT NOT NULL CHECK(system_mode IN ('backup','hybrid')),
  peak_load_w INTEGER NOT NULL,
  backup_hours REAL NOT NULL,
  daily_energy_kwh REAL,
  result_json TEXT NOT NULL,
  pricing_config_version TEXT,
  source TEXT
);

CREATE TABLE rate_limits (
  key_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(key_hash, action)
);

CREATE TABLE site_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK(event_type IN ('form_start','form_submit','whatsapp_click','call_click','animation_play')),
  page_path TEXT NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_site_events_type_time ON site_events(event_type, occurred_at);
