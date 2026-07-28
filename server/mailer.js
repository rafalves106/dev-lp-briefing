const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === "465",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendBriefingEmail(project) {
  const adminUrl = `${process.env.APP_URL || "http://localhost:3000"}/admin/briefing/${project.id}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject: `Briefing recebido: ${project.project_name} (${project.client_name})`,
    text: `Novo briefing recebido de ${project.client_name} — ${project.project_name}.\n\nVer detalhes: ${adminUrl}`,
    html: `<p>Novo briefing recebido de <strong>${project.client_name}</strong> — ${project.project_name}.</p><p><a href="${adminUrl}">Ver detalhes no painel admin</a></p>`,
  });
}

module.exports = { sendBriefingEmail };
