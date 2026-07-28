document.addEventListener("DOMContentLoaded", () => {
  const listView = document.getElementById("listView");
  const detailView = document.getElementById("detailView");
  const backToList = document.getElementById("backToList");

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

  async function renderList() {
    backToList.classList.add("hidden");
    detailView.classList.add("hidden");
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
        <a href="/admin/briefing/${p.id}" class="glass rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[rgba(0,255,136,0.4)] transition-colors" style="display:flex">
          <div>
            <p class="font-bold">${escapeHtml(p.project_name)}</p>
            <p class="text-sm text-gray-400">${escapeHtml(p.client_name)} · ${new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
          ${statusBadge(p.status)}
        </a>`
      )
      .join("");
  }

  async function renderDetail(id) {
    backToList.classList.remove("hidden");
    listView.classList.add("hidden");
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
        ${statusBadge(project.status)}
      </header>

      <div class="space-y-3">${answersHtml}</div>

      <div>
        <h3 class="text-sm font-bold text-gray-400 mb-2">Identidade visual anexada</h3>
        ${attachmentsHtml}
      </div>
    `;
  }

  function route() {
    const match = window.location.pathname.match(/^\/admin\/briefing\/(\d+)/);
    if (match) renderDetail(match[1]);
    else renderList();
  }

  route();
});
