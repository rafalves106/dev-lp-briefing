require("dotenv").config();
const path = require("path");
const express = require("express");
const { db, createProject } = require("./server/db");
const { upload, UPLOADS_ROOT } = require("./server/upload");
const { sendBriefingEmail } = require("./server/mailer");

const app = express();
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));

function loadProject(req, res, next) {
  const project = db.prepare("SELECT * FROM projects WHERE token = ?").get(req.params.token);
  if (!project) return res.status(404).send("Link inválido ou expirado.");
  req.project = project;
  next();
}

function upsertAnswer(projectId, questionKey, answerText) {
  const existing = db
    .prepare("SELECT id FROM answers WHERE project_id = ? AND question_key = ?")
    .get(projectId, questionKey);
  if (existing) {
    db.prepare("UPDATE answers SET answer_text = ?, answered_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      answerText,
      existing.id
    );
  } else {
    db.prepare("INSERT INTO answers (project_id, question_key, answer_text) VALUES (?, ?, ?)").run(
      projectId,
      questionKey,
      answerText
    );
  }
}

// ────────────────────────────────────────────────────────────
// PÁGINAS
// ────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));
app.get("/admin/briefing/:id", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));

app.get(["/briefing", "/briefing/"], (req, res) => res.sendFile(path.join(__dirname, "briefing-cta.html")));

app.get("/briefing/:token", (req, res) => {
  const project = db.prepare("SELECT * FROM projects WHERE token = ?").get(req.params.token);
  if (!project) return res.sendFile(path.join(__dirname, "briefing-cta.html"));
  if (project.status === "pending") {
    db.prepare("UPDATE projects SET status = 'in_progress' WHERE id = ?").run(project.id);
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

// ────────────────────────────────────────────────────────────
// API DO BRIEFING
// ────────────────────────────────────────────────────────────
app.post("/briefing/:token/answer", loadProject, (req, res) => {
  const { question_key, answer_text } = req.body;
  if (!question_key) return res.status(400).json({ error: "question_key é obrigatório." });
  upsertAnswer(req.project.id, question_key, answer_text || "");
  res.json({ ok: true });
});

app.post("/briefing/:token/submit", loadProject, upload.array("identidade_visual", 20), async (req, res) => {
  const project = req.project;

  let answers = {};
  try {
    answers = JSON.parse(req.body.answers || "{}");
  } catch {
    return res.status(400).json({ error: "answers inválido." });
  }
  for (const [key, value] of Object.entries(answers)) upsertAnswer(project.id, key, value);

  upsertAnswer(project.id, "informacoes_adicionais", req.body.additional_info || "");
  upsertAnswer(project.id, "links_inspiracao", req.body.inspiration_links || "");
  upsertAnswer(project.id, "concorrentes", req.body.competitors || "");

  const insertAttachment = db.prepare(
    "INSERT INTO attachments (project_id, question_key, file_path) VALUES (?, 'identidade_visual', ?)"
  );
  for (const file of req.files || []) {
    insertAttachment.run(project.id, path.join(String(project.id), file.filename));
  }

  db.prepare("UPDATE projects SET status = 'completed' WHERE id = ?").run(project.id);

  try {
    await sendBriefingEmail(project);
  } catch (err) {
    console.error("Falha ao enviar e-mail de notificação:", err);
  }

  res.json({ ok: true });
});

// ────────────────────────────────────────────────────────────
// PAINEL ADMIN (protegido via Cloudflare Access na frente do túnel)
// ────────────────────────────────────────────────────────────
app.get("/admin/api/briefings", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
  res.json(projects);
});

app.post("/admin/api/briefings", (req, res) => {
  const clientName = (req.body.client_name || "").trim();
  const projectName = (req.body.project_name || "").trim();
  if (!clientName || !projectName) {
    return res.status(400).json({ error: "client_name e project_name são obrigatórios." });
  }
  res.status(201).json(createProject(clientName, projectName));
});

app.get("/admin/api/briefings/:id", (req, res) => {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!project) return res.status(404).json({ error: "Briefing não encontrado." });
  const answers = db
    .prepare("SELECT question_key, answer_text, answered_at FROM answers WHERE project_id = ? ORDER BY id")
    .all(project.id);
  const attachments = db
    .prepare("SELECT id, question_key, file_path, uploaded_at FROM attachments WHERE project_id = ? ORDER BY id")
    .all(project.id);
  res.json({ project, answers, attachments });
});

app.get("/admin/briefing/:id/download/:attachmentId", (req, res) => {
  const attachment = db
    .prepare("SELECT * FROM attachments WHERE id = ? AND project_id = ?")
    .get(req.params.attachmentId, req.params.id);
  if (!attachment) return res.status(404).send("Arquivo não encontrado.");
  res.download(path.join(UPLOADS_ROOT, attachment.file_path));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`briefing-app rodando em http://localhost:${PORT}`));
