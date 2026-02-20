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
};

module.exports = initDb;

