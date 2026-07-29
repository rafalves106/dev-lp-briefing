const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "data", "briefing.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    question_key TEXT NOT NULL,
    answer_text TEXT,
    answered_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    question_key TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function createProject(clientName, projectName) {
  const token = crypto.randomBytes(12).toString("hex");
  const info = db
    .prepare("INSERT INTO projects (token, client_name, project_name) VALUES (?, ?, ?)")
    .run(token, clientName, projectName);
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(info.lastInsertRowid);
}

module.exports = { db, createProject };
