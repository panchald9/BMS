const pool = require('./db');

const initDb = async () => {
  await pool.query(` 
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS agent_rates JSONB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS banks (
      id SERIAL PRIMARY KEY,
      bank_name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50),
      owner INTEGER NOT NULL,
      same_rate NUMERIC(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_group_owner
        FOREIGN KEY (owner)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  await pool.query(`
    ALTER TABLE groups
    ADD COLUMN IF NOT EXISTS same_rate NUMERIC(10,2);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_bank_rate (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      bank_id INTEGER NOT NULL,
      rate NUMERIC(10,2) NOT NULL,
      CONSTRAINT fk_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_bank
        FOREIGN KEY (bank_id)
        REFERENCES banks(id)
        ON DELETE CASCADE,
      CONSTRAINT unique_group_bank UNIQUE (group_id, bank_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_admin_numbers (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      number VARCHAR(20) NOT NULL,
      CONSTRAINT fk_group_admin
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
    );
  `);

  await pool.query(`
    ALTER TABLE group_admin_numbers
    ADD COLUMN IF NOT EXISTS name TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_employee_numbers (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      number VARCHAR(20) NOT NULL,
      CONSTRAINT fk_group_employee
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
    );
  `);

  await pool.query(`
    ALTER TABLE group_employee_numbers
    ADD COLUMN IF NOT EXISTS name TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_past_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      member_type VARCHAR(20) NOT NULL,
      number VARCHAR(20) NOT NULL,
      name TEXT,
      source VARCHAR(20) NOT NULL DEFAULT 'manual',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_group_past_member_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,
      CONSTRAINT chk_group_past_member_type
        CHECK (LOWER(member_type) IN ('admin', 'employee')),
      CONSTRAINT chk_group_past_member_source
        CHECK (LOWER(source) IN ('manual', 'removed'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_group_past_members_group_id
    ON group_past_members(group_id);
  `);

  await pool.query(`
    CREATE OR REPLACE VIEW group_member_numbers_view AS
    SELECT
      gan.group_id,
      'admin'::text AS member_type,
      gan.name,
      gan.number,
      FALSE AS is_past_member,
      'active'::text AS source
    FROM group_admin_numbers gan
    UNION ALL
    SELECT
      gen.group_id,
      'employee'::text AS member_type,
      gen.name,
      gen.number,
      FALSE AS is_past_member,
      'active'::text AS source
    FROM group_employee_numbers gen
    UNION ALL
    SELECT
      gpm.group_id,
      LOWER(gpm.member_type) AS member_type,
      gpm.name,
      gpm.number,
      TRUE AS is_past_member,
      LOWER(gpm.source) AS source
    FROM group_past_members gpm;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bill (
      id SERIAL PRIMARY KEY,
      bill_date DATE NOT NULL,
      group_id INTEGER NOT NULL,
      bank_id INTEGER,
      client_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      rate NUMERIC(12,2),
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_bill_group
        FOREIGN KEY (group_id) REFERENCES groups(id),
      CONSTRAINT fk_bill_bank
        FOREIGN KEY (bank_id) REFERENCES banks(id),
      CONSTRAINT fk_bill_client
        FOREIGN KEY (client_id) REFERENCES users(id),
      CONSTRAINT fk_bill_agent
        FOREIGN KEY (agent_id) REFERENCES users(id)
    );
  `);

  // Allow same-rate groups to store bills without bank_id.
  await pool.query(`
    ALTER TABLE bill
    ALTER COLUMN bank_id DROP NOT NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_bill (
      id SERIAL PRIMARY KEY,
      bill_id INTEGER NOT NULL UNIQUE,
      bill_date DATE NOT NULL,
      group_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      source VARCHAR(20) NOT NULL,
      bank_id INTEGER,
      amount NUMERIC(12,2) NOT NULL,
      rate NUMERIC(12,2) NOT NULL,
      total NUMERIC(14,2) NOT NULL,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_agent_bill_source CHECK (LOWER(source) IN ('claim', 'depo')),
      CONSTRAINT fk_agent_bill_bill
        FOREIGN KEY (bill_id) REFERENCES bill(id) ON DELETE CASCADE,
      CONSTRAINT fk_agent_bill_group
        FOREIGN KEY (group_id) REFERENCES groups(id),
      CONSTRAINT fk_agent_bill_bank
        FOREIGN KEY (bank_id) REFERENCES banks(id),
      CONSTRAINT fk_agent_bill_client
        FOREIGN KEY (client_id) REFERENCES users(id),
      CONSTRAINT fk_agent_bill_agent
        FOREIGN KEY (agent_id) REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS other_bill (
      id SERIAL PRIMARY KEY,
      kind VARCHAR(20) NOT NULL,
      bill_date DATE NOT NULL,
      group_id INTEGER,
      client_id INTEGER,
      agent_id INTEGER,
      comment TEXT,
      amount NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_other_bill_kind CHECK (LOWER(kind) IN ('client', 'agent')),
      CONSTRAINT fk_other_bill_group
        FOREIGN KEY (group_id) REFERENCES groups(id),
      CONSTRAINT fk_other_bill_client
        FOREIGN KEY (client_id) REFERENCES users(id),
      CONSTRAINT fk_other_bill_agent
        FOREIGN KEY (agent_id) REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dollar_rate (
      id SERIAL PRIMARY KEY,
      rate_date DATE NOT NULL,
      rate NUMERIC(12,4) NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transaction_details (
      id SERIAL PRIMARY KEY,
      transaction_date DATE NOT NULL,
      payment_method_id INT NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      dollar_rate_id INT NOT NULL,
      CONSTRAINT fk_transaction_payment_method
        FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(id)
        ON DELETE RESTRICT,
      CONSTRAINT fk_transaction_dollar_rate
        FOREIGN KEY (dollar_rate_id)
        REFERENCES dollar_rate(id)
        ON DELETE RESTRICT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS processing_group_calculation (
      id SERIAL PRIMARY KEY,
      processing_percent NUMERIC(5,2) NOT NULL,
      processing_group_id INT NOT NULL,
      client_id INT NOT NULL,
      processing_total NUMERIC(14,2),
      CONSTRAINT fk_processing_group
        FOREIGN KEY (processing_group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS processing_calculation (
      id SERIAL PRIMARY KEY,
      processing_percent NUMERIC(5,2) NOT NULL,
      processing_group_id INT NOT NULL,
      client_id INT NOT NULL,
      processing_total NUMERIC(14,2),
      CONSTRAINT fk_processing_calc_group
        FOREIGN KEY (processing_group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
    );
  `);
};

module.exports = initDb;
