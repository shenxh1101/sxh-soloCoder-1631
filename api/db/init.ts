import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'drycleaning.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSQL = `
CREATE TABLE IF NOT EXISTS clothing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    clothing_type VARCHAR(20) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    receive_date DATE NOT NULL,
    expected_pickup_date DATE NOT NULL,
    actual_pickup_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    remark TEXT,
    status_history TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clothing_barcode ON clothing(barcode);
CREATE INDEX IF NOT EXISTS idx_clothing_phone ON clothing(customer_phone);
CREATE INDEX IF NOT EXISTS idx_clothing_status ON clothing(status);
CREATE INDEX IF NOT EXISTS idx_clothing_receive_date ON clothing(receive_date);
CREATE INDEX IF NOT EXISTS idx_clothing_expected_date ON clothing(expected_pickup_date);

CREATE TABLE IF NOT EXISTS clothing_type_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_code VARCHAR(20) NOT NULL UNIQUE,
    type_name VARCHAR(20) NOT NULL,
    default_price DECIMAL(10, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO clothing_type_config (type_code, type_name, default_price) VALUES
    ('suit', '西装', 35.00),
    ('coat', '大衣', 50.00),
    ('downjacket', '羽绒服', 60.00),
    ('dress', '裙装', 30.00),
    ('shirt', '衬衫', 15.00);
`;

db.exec(initSQL);

export default db;
