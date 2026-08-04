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

  // question_keys cuja resposta ficou marcada como pendência (prefixo ⏳, ver app.js)
  function pendingKeys(answers) {
    return answers.filter((a) => (a.answer_text || "").startsWith("⏳")).map((a) => a.question_key);
  }

  // Status do documento (convenção da GUIA_FLUXO_PROJETOS.md: Fase 2 só começa com COMPLETO).
  // Só é COMPLETO se o cliente enviou o formulário E nenhuma resposta ficou pendente.
  function docStatus(project, answers) {
    return project.status === "completed" && pendingKeys(answers).length === 0 ? "COMPLETO" : "RASCUNHO";
  }

  function buildMarkdown(project, answers, attachments) {
    const budgetAnswer = answers.find((a) => a.question_key === "budget_range");
    const designAnswer = answers.find((a) => a.question_key === "design_tokens");
    const mainAnswers = answers.filter((a) => a.question_key !== "budget_range" && a.question_key !== "design_tokens");
    const pending = pendingKeys(answers);

    const lines = [
      `# ${project.project_name}`,
      "",
      `Status: ${docStatus(project, answers)}`,
      "",
    ];
    if (pending.length) {
      lines.push(
        `> ⚠️ Pendências que impedem COMPLETO: ${pending.map(formatLabel).join(", ")}. Fase 2 não deve começar até isso ser resolvido.`,
        ""
      );
    }
    lines.push(
      `- **Cliente:** ${project.client_name}`,
      `- **Status do envio:** ${STATUS_LABEL[project.status] || project.status}`,
      `- **Criado em:** ${new Date(project.created_at).toLocaleDateString("pt-BR")}`,
      "",
      "## Respostas",
      ""
    );
    mainAnswers.forEach((a) => {
      lines.push(`### ${formatLabel(a.question_key)}`, "", a.answer_text || "—", "");
    });

    if (designAnswer && designAnswer.answer_text) {
      const tokens = JSON.parse(designAnswer.answer_text);
      lines.push(
        "## Direção Visual (escolhida pelo cliente)",
        "",
        `- **Arquétipo:** ${tokens.arquetipo}`,
        `- **Tipografia:** título ${tokens.tipografia.titulo} / corpo ${tokens.tipografia.corpo}`,
        `- **Paleta:** primária ${tokens.paleta.primaria}, secundária ${tokens.paleta.secundaria}, neutros ${tokens.paleta.neutros}, texto ${tokens.paleta.texto}`,
        `- **Estilos:** cantos ${tokens.estilos.cantos}, fundo ${tokens.estilos.fundo}, sombra ${tokens.estilos.sombra}`,
        `- **Densidade:** ${tokens.densidade}`,
        `- **Imagem:** moldura ${tokens.imagem.moldura}, tratamento ${tokens.imagem.tratamento}`,
        `- **CTA:** estilo ${tokens.cta.estilo}, ícone ${tokens.cta.icone ? "sim" : "não"}`,
        "",
        "Objeto completo (design tokens):",
        "",
        "```json",
        JSON.stringify(tokens, null, 2),
        "```",
        ""
      );
    }

    if (budgetAnswer && budgetAnswer.answer_text) {
      lines.push("## Uso interno — não publicar", "");
      lines.push(`**Orçamento comercial:** ${budgetAnswer.answer_text}`, "");
    }

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

    const budgetAnswer = answers.find((a) => a.question_key === "budget_range");
    const designAnswer = answers.find((a) => a.question_key === "design_tokens");
    const mainAnswers = answers.filter((a) => a.question_key !== "budget_range" && a.question_key !== "design_tokens");

    const answersHtml = mainAnswers
      .map((a) => {
        const isPending = (a.answer_text || "").startsWith("⏳");
        return `
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-gray-400 mb-1">${escapeHtml(formatLabel(a.question_key))}</p>
          <p class="text-sm font-bold whitespace-pre-wrap ${isPending ? "text-amber-400" : ""}">${escapeHtml(a.answer_text) || "—"}</p>
        </div>`;
      })
      .join("");

    const budgetHtml =
      budgetAnswer && budgetAnswer.answer_text
        ? `
        <div class="glass rounded-xl p-4" style="border-color: rgba(255,193,7,0.3);">
          <p class="text-xs font-bold mb-1" style="color: #ffc107;">Uso interno — orçamento comercial (nunca aparece na página)</p>
          <p class="text-sm font-bold whitespace-pre-wrap">${escapeHtml(budgetAnswer.answer_text)}</p>
        </div>`
        : "";

    const designHtml =
      designAnswer && designAnswer.answer_text
        ? (() => {
            const t = JSON.parse(designAnswer.answer_text);
            const swatch = (hex) => `<span style="width:18px;height:18px;border-radius:50%;background:${hex};display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>`;
            return `
        <div class="glass rounded-xl p-4 space-y-3">
          <p class="text-xs text-gray-400">Direção visual</p>
          <p class="text-sm font-bold">${escapeHtml(t.arquetipo)}</p>
          <div class="flex items-center gap-2">
            ${swatch(t.paleta.primaria)}${swatch(t.paleta.secundaria)}${swatch(t.paleta.neutros)}${swatch(t.paleta.texto)}
            <span class="text-xs text-gray-400">${escapeHtml(t.paleta.primaria)} / ${escapeHtml(t.paleta.secundaria)}</span>
          </div>
          <p class="text-xs text-gray-400">Tipografia: <span class="text-gray-200">${escapeHtml(t.tipografia.titulo)}</span> (título) + <span class="text-gray-200">${escapeHtml(t.tipografia.corpo)}</span> (corpo)</p>
          <p class="text-xs text-gray-400">Estilos: cantos ${escapeHtml(t.estilos.cantos)} · fundo ${escapeHtml(t.estilos.fundo)} · sombra ${escapeHtml(t.estilos.sombra)} · densidade ${escapeHtml(t.densidade)}</p>
          <p class="text-xs text-gray-400">Imagem: moldura ${escapeHtml(t.imagem.moldura)} · tratamento ${escapeHtml(t.imagem.tratamento)} — CTA: ${escapeHtml(t.cta.estilo)}${t.cta.icone ? " (com ícone)" : ""}</p>
          <details>
            <summary class="text-xs text-gray-400 cursor-pointer">Ver objeto completo (design tokens)</summary>
            <pre class="text-xs overflow-x-auto whitespace-pre-wrap mt-2">${escapeHtml(JSON.stringify(t, null, 2))}</pre>
          </details>
        </div>`;
          })()
        : "";

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

    const docStatusValue = docStatus(project, answers);
    const pending = pendingKeys(answers);
    const docStatusBadge =
      docStatusValue === "COMPLETO"
        ? `<span class="badge px-3 py-1 text-xs" style="background: rgba(0,255,136,0.12); color: #00ff88;">COMPLETO</span>`
        : `<span class="badge px-3 py-1 text-xs" style="background: rgba(255,193,7,0.12); color: #ffc107;">RASCUNHO</span>`;
    const pendingWarningHtml = pending.length
      ? `<p class="text-xs mt-3" style="color: #ffc107;">⚠️ Pendências que impedem COMPLETO: ${escapeHtml(pending.map(formatLabel).join(", "))}</p>`
      : "";

    detailView.innerHTML = `
      <header class="glass rounded-xl p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-black">${escapeHtml(project.project_name)}</h2>
            <p class="text-sm text-gray-400">${escapeHtml(project.client_name)} · ${new Date(project.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button type="button" id="btnExportMd" class="btn-ghost px-3 py-1.5 text-xs">Exportar .md</button>
            ${docStatusBadge}
            ${statusBadge(project.status)}
          </div>
        </div>
        ${pendingWarningHtml}
      </header>

      <div class="space-y-3">${answersHtml}</div>

      ${designHtml}

      ${budgetHtml}

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
