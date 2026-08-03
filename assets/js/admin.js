document.addEventListener("DOMContentLoaded", () => {
  const listView = document.getElementById("listView");
  const detailView = document.getElementById("detailView");
  const backToList = document.getElementById("backToList");
  const newProjectForm = document.getElementById("newProjectForm");
  const newClientName = document.getElementById("newClientName");
  const newProjectName = document.getElementById("newProjectName");
  const newProjectResult = document.getElementById("newProjectResult");

  const STATUS_LABEL = { pending: "Pendente", in_progress: "Em andamento", completed: "Concluído" };

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function formatLabel(key) {
    return key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  }

  function statusBadge(status) {
    return `<span class="badge badge-${status} px-3 py-1 text-xs">${STATUS_LABEL[status] || status}</span>`;
  }

  function briefingLink(token) {
    return `${window.location.origin}/briefing/${token}`;
  }

  function slugify(str) {
    return str
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function buildMarkdown(project, answers, attachments) {
    const lines = [
      `# ${project.project_name}`,
      "",
      `- **Cliente:** ${project.client_name}`,
      `- **Status:** ${STATUS_LABEL[project.status] || project.status}`,
      `- **Criado em:** ${new Date(project.created_at).toLocaleDateString("pt-BR")}`,
      "",
      "## Respostas",
      "",
    ];
    answers.forEach((a) => {
      lines.push(`### ${formatLabel(a.question_key)}`, "", a.answer_text || "—", "");
    });
    lines.push("## Identidade visual anexada", "");
    if (attachments.length) {
      attachments.forEach((f) => {
        const name = f.file_path.split("/").pop();
        lines.push(`- [${name}](${window.location.origin}/admin/briefing/${project.id}/download/${f.id})`);
      });
    } else {
      lines.push("Nenhum arquivo enviado.");
    }
    return lines.join("\n");
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function renderList() {
    backToList.classList.add("hidden");
    detailView.classList.add("hidden");
    newProjectForm.classList.remove("hidden");
    listView.classList.remove("hidden");
    listView.innerHTML = `<p class="text-sm text-gray-400">Carregando...</p>`;

    const res = await fetch("/admin/api/briefings");
    const projects = await res.json();

    if (!projects.length) {
      listView.innerHTML = `<p class="glass rounded-xl p-6 text-sm text-gray-400">Nenhum briefing criado ainda.</p>`;
      return;
    }

    listView.innerHTML = projects
      .map(
        (p) => `
        <div class="glass rounded-xl p-4 flex items-center justify-between gap-4">
          <a href="/admin/briefing/${p.id}" class="flex-1 hover:opacity-80 transition-opacity">
            <p class="font-bold">${escapeHtml(p.project_name)}</p>
            <p class="text-sm text-gray-400">${escapeHtml(p.client_name)} · ${new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
          </a>
          <div class="flex items-center gap-3 shrink-0">
            <button type="button" data-copy-token="${p.token}" class="btn-ghost px-3 py-1.5 text-xs">Copiar link</button>
            ${statusBadge(p.status)}
          </div>
        </div>`
      )
      .join("");
  }

  listView.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy-token]");
    if (!btn) return;
    navigator.clipboard.writeText(briefingLink(btn.dataset.copyToken));
    const original = btn.textContent;
    btn.textContent = "Copiado!";
    setTimeout(() => (btn.textContent = original), 1500);
  });

  newProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = newProjectForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    newProjectResult.classList.add("hidden");

    try {
      const res = await fetch("/admin/api/briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: newClientName.value.trim(),
          project_name: newProjectName.value.trim(),
        }),
      });
      if (!res.ok) throw new Error("falha ao criar projeto");
      const project = await res.json();
      const link = briefingLink(project.token);

      newProjectResult.innerHTML = `
        Link do briefing: <a href="${link}" target="_blank" rel="noopener" class="neon-text underline">${link}</a>
        <button type="button" data-copy-token="${project.token}" class="btn-ghost px-2 py-1 text-xs ml-2">Copiar</button>
      `;
      newProjectResult.classList.remove("hidden");
      newProjectForm.reset();
      renderList();
    } catch {
      newProjectResult.textContent = "Não foi possível criar o projeto agora. Tente de novo.";
      newProjectResult.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  });

  newProjectResult.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy-token]");
    if (!btn) return;
    navigator.clipboard.writeText(briefingLink(btn.dataset.copyToken));
    btn.textContent = "Copiado!";
  });

  async function renderDetail(id) {
    backToList.classList.remove("hidden");
    listView.classList.add("hidden");
    newProjectForm.classList.add("hidden");
    newProjectResult.classList.add("hidden");
    detailView.classList.remove("hidden");
    detailView.innerHTML = `<p class="text-sm text-gray-400">Carregando...</p>`;

    const res = await fetch(`/admin/api/briefings/${id}`);
    if (!res.ok) {
      detailView.innerHTML = `<p class="glass rounded-xl p-6 text-sm text-gray-400">Briefing não encontrado.</p>`;
      return;
    }
    const { project, answers, attachments } = await res.json();

    const answersHtml = answers
      .map(
        (a) => `
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-gray-400 mb-1">${escapeHtml(formatLabel(a.question_key))}</p>
          <p class="text-sm font-bold whitespace-pre-wrap">${escapeHtml(a.answer_text) || "—"}</p>
        </div>`
      )
      .join("");

    const attachmentsHtml = attachments.length
      ? attachments
          .map(
            (f) => `
        <a href="/admin/briefing/${project.id}/download/${f.id}" class="btn-ghost px-3 py-2 text-xs inline-block mr-2 mb-2">
          ${escapeHtml(f.file_path.split("/").pop())}
        </a>`
          )
          .join("")
      : `<p class="text-sm text-gray-400">Nenhum arquivo enviado.</p>`;

    detailView.innerHTML = `
      <header class="glass rounded-xl p-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black">${escapeHtml(project.project_name)}</h2>
          <p class="text-sm text-gray-400">${escapeHtml(project.client_name)} · ${new Date(project.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button type="button" id="btnExportMd" class="btn-ghost px-3 py-1.5 text-xs">Exportar .md</button>
          ${statusBadge(project.status)}
        </div>
      </header>

      <div class="space-y-3">${answersHtml}</div>

      <div>
        <h3 class="text-sm font-bold text-gray-400 mb-2">Identidade visual anexada</h3>
        ${attachmentsHtml}
      </div>
    `;

    document.getElementById("btnExportMd").addEventListener("click", () => {
      const md = buildMarkdown(project, answers, attachments);
      downloadTextFile(`briefing-${slugify(project.project_name)}.md`, md);
    });
  }

  function route() {
    const match = window.location.pathname.match(/^\/admin\/briefing\/(\d+)/);
    if (match) renderDetail(match[1]);
    else renderList();
  }

  route();
});
