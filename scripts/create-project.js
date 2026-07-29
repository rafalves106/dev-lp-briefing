const { createProject } = require("../server/db");

const [clientName, projectName] = process.argv.slice(2);
if (!clientName || !projectName) {
  console.error('Uso: node scripts/create-project.js "Nome do Cliente" "Nome do Projeto"');
  process.exit(1);
}

const project = createProject(clientName, projectName);
console.log(`Projeto criado. Link do briefing:\n${process.env.APP_URL || "http://localhost:3000"}/briefing/${project.token}`);
