const crypto = require("crypto");
const db = require("../server/db");

const [clientName, projectName] = process.argv.slice(2);
if (!clientName || !projectName) {
  console.error('Uso: node scripts/create-project.js "Nome do Cliente" "Nome do Projeto"');
  process.exit(1);
}

const token = crypto.randomBytes(12).toString("hex");
db.prepare("INSERT INTO projects (token, client_name, project_name) VALUES (?, ?, ?)").run(
  token,
  clientName,
  projectName
);

console.log(`Projeto criado. Link do briefing:\n${process.env.APP_URL || "http://localhost:3000"}/briefing/${token}`);
