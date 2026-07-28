document.addEventListener("DOMContentLoaded", () => {
  // ────────────────────────────────────────────────────────────
  // CONFIG — edite as perguntas do briefing aqui
  // ────────────────────────────────────────────────────────────
  const QUESTIONS = [
    {
      key: "nome_clinica_medico",
      text: "Qual o nome da clínica e do médico ou profissional responsável (com CRM)?",
      type: "short",
      minLength: 3,
    },
    {
      key: "procedimentos",
      text: "Quais procedimentos ou especialidades você quer destacar na página?",
      type: "long",
      minLength: 10,
    },
    {
      key: "diferenciais",
      text: "O que diferencia sua clínica dos concorrentes?",
      type: "long",
      minLength: 10,
    },
    {
      key: "tom_voz",
      text: "Como você descreveria o tom de comunicação ideal: mais técnico e sério, ou mais acolhedor e humano?",
      type: "short",
      minLength: 5,
    },
    {
      key: "publico_alvo",
      text: "Quem é o paciente ideal que você quer atrair com essa página?",
      type: "long",
      minLength: 10,
    },
    {
      key: "contato_valores_cta",
      text: "Qual o número de WhatsApp, o endereço completo da clínica, a faixa de valores dos procedimentos e para onde os botões da página devem levar: direto pro WhatsApp, para um sistema de agendamento online (Doctoralia, iClinic, etc.) ou outro fluxo?",
      type: "long",
      minLength: 15,
    },
  ];

  const STOPWORDS = new Set([
    "de","a","o","que","e","do","da","em","um","para","com","não","uma","os","no","se",
    "na","por","mais","as","dos","como","mas","ao","ele","das","tem","à","seu","sua",
    "ou","ser","quando","muito","há","nos","já","está","eu","também","só","pelo","pela",
    "até","isso","ela","entre","era","depois","sem","mesmo","aos","ter","seus","quem",
    "nas","me","esse","eles","você","essa","num","nem","suas","meu","às","minha","numa",
    "pelos","elas","qual","nós","lhe","deles","essas","esses","pelas","este","dele","tu",
    "te","vocês","vos","lhes","meus","minhas","teu","tua","teus","tuas","nosso","nossa",
    "nossos","nossas","dela","delas","esta","estes","estas","aquele","aquela","aqueles",
    "aquelas","isto","aquilo","estou","está","estamos","estão","esteve","estivemos",
    "gostaria","queria","quero","preciso","seria","fazer","fica","ficar","bem","sobre",
  ]);

  // ────────────────────────────────────────────────────────────
  // STATE
  // ────────────────────────────────────────────────────────────
  const token = (window.location.pathname.split("/").filter(Boolean).pop()) || "sem-token";

  const state = {
    token,
    currentIndex: 0,
    answers: {},
    files: [],
    editingFromReview: false,
    muted: false,
    currentAudio: null,
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ────────────────────────────────────────────────────────────
  // DOM
  // ────────────────────────────────────────────────────────────
  const screens = {
    intro: document.getElementById("screen-intro"),
    questions: document.getElementById("screen-questions"),
    review: document.getElementById("screen-review"),
    done: document.getElementById("screen-done"),
  };

  const progressBar = document.getElementById("progressBar");
  const chatLog = document.getElementById("chatLog");
  const questionText = document.getElementById("questionText");
  const answerInput = document.getElementById("answerInput");
  const charHint = document.getElementById("charHint");
  const btnNext = document.getElementById("btnNext");
  const btnStart = document.getElementById("btnStart");
  const btnMute = document.getElementById("btnMute");
  const iconSound = document.getElementById("iconSound");
  const iconMute = document.getElementById("iconMute");
  const keywordLayer = document.getElementById("keywordLayer");

  const reviewSummary = document.getElementById("reviewSummary");
  const additionalInfo = document.getElementById("additionalInfo");
  const inspirationLinks = document.getElementById("inspirationLinks");
  const competitors = document.getElementById("competitors");
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const btnBrowseFiles = document.getElementById("btnBrowseFiles");
  const fileList = document.getElementById("fileList");
  const btnBackToQuestions = document.getElementById("btnBackToQuestions");
  const btnSubmit = document.getElementById("btnSubmit");

  // ────────────────────────────────────────────────────────────
  // CURSOR CUSTOMIZADO
  // ────────────────────────────────────────────────────────────
  const cursor = document.getElementById("cursor");
  const cursorGlow = document.getElementById("cursorGlow");
  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  if (!isTouch) {
    document.addEventListener("mousemove", (e) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
      gsap.to(cursorGlow, { x: e.clientX, y: e.clientY, duration: 0.6, ease: "power2.out" });
    });
    document.querySelectorAll("button, a").forEach((el) => {
      el.addEventListener("mouseenter", () => gsap.to(cursor, { scale: 3, duration: 0.3 }));
      el.addEventListener("mouseleave", () => gsap.to(cursor, { scale: 1, duration: 0.3 }));
    });
  }

  // ────────────────────────────────────────────────────────────
  // TROCA DE TELAS
  // ────────────────────────────────────────────────────────────
  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      if (key === name) {
        el.classList.remove("hidden");
        if (prefersReducedMotion) {
          gsap.set(el, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            el,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" }
          );
        }
      } else {
        el.classList.add("hidden");
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // BARRA DE PROGRESSO
  // ────────────────────────────────────────────────────────────
  function buildProgressBar() {
    progressBar.innerHTML = "";
    QUESTIONS.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "progress-dot";
      dot.dataset.index = String(i);
      progressBar.appendChild(dot);
    });
    progressBar.classList.remove("hidden");
  }

  function updateProgressBar() {
    progressBar.querySelectorAll(".progress-dot").forEach((dot) => {
      const i = Number(dot.dataset.index);
      dot.classList.toggle("is-done", i < state.currentIndex);
      dot.classList.toggle("is-active", i === state.currentIndex);
    });
  }

  // ────────────────────────────────────────────────────────────
  // ÁUDIO (Piper TTS pré-gerado em ./assets/audio/pergunta-N.ogg)
  // ────────────────────────────────────────────────────────────
  function playQuestionAudio(index) {
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    if (state.muted) return;

    const audio = new Audio(`/assets/audio/pergunta-${index + 1}.ogg`);
    state.currentAudio = audio;
    audio.play().catch(() => {
      // autoplay bloqueado ou arquivo ainda não gerado — segue sem áudio
    });
  }

  btnMute.addEventListener("click", () => {
    state.muted = !state.muted;
    iconSound.classList.toggle("hidden", state.muted);
    iconMute.classList.toggle("hidden", !state.muted);
    if (state.muted && state.currentAudio) {
      state.currentAudio.pause();
    }
  });

  // ────────────────────────────────────────────────────────────
  // PALAVRAS-CHAVE ANIMADAS NO FUNDO
  // ────────────────────────────────────────────────────────────
  let keywordDebounce = null;

  function extractKeywords(text) {
    const words = text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    return [...new Set(words)].slice(-4);
  }

  const KEYWORD_EASES = ["power2.out", "back.out(1.6)", "power1.out"];

  function spawnKeywordChip(word) {
    if (prefersReducedMotion) return;
    const chip = document.createElement("span");
    chip.className = "keyword-chip";
    chip.textContent = word;

    // lado esquerdo ou direito da tela, longe do formulário no centro
    const side = Math.random() < 0.5 ? "left" : "right";
    chip.style[side] = `${2 + Math.random() * 14}%`;
    chip.style.top = `${8 + Math.random() * 78}%`;
    chip.style.fontSize = `${0.9 + Math.random() * 1.7}rem`;
    keywordLayer.appendChild(chip);

    const drift = (side === "left" ? -1 : 1) * (10 + Math.random() * 25);
    const rise = -(15 + Math.random() * 35);
    const rotate = (Math.random() - 0.5) * 24;
    const ease = KEYWORD_EASES[Math.floor(Math.random() * KEYWORD_EASES.length)];

    gsap.set(chip, { opacity: 0, scale: 0.7, x: 0, y: 0, rotate: 0 });
    gsap.to(chip, {
      opacity: 1,
      scale: 1,
      x: drift,
      y: rise,
      rotate,
      duration: 0.6 + Math.random() * 0.5,
      ease,
      onComplete: () => {
        gsap.to(chip, {
          opacity: 0,
          y: rise - 20,
          duration: 0.9,
          delay: 1.1 + Math.random() * 0.8,
          ease: "power1.in",
          onComplete: () => chip.remove(),
        });
      },
    });
  }

  answerInput.addEventListener("input", () => {
    const q = QUESTIONS[state.currentIndex];
    btnNext.disabled = answerInput.value.trim().length < q.minLength;

    clearTimeout(keywordDebounce);
    keywordDebounce = setTimeout(() => {
      const keywords = extractKeywords(answerInput.value);
      if (keywords.length) spawnKeywordChip(keywords[keywords.length - 1]);
    }, 500);
  });

  // ────────────────────────────────────────────────────────────
  // CHAT LOG (histórico de balões respondidos)
  // ────────────────────────────────────────────────────────────
  function appendToChatLog(question, answer) {
    const wrapper = document.createElement("div");
    wrapper.className = "space-y-2";
    wrapper.innerHTML = `
      <div class="glass rounded-xl px-4 py-3 text-sm text-gray-300 max-w-[90%]">${escapeHtml(question)}</div>
      <div class="glass-neon rounded-xl px-4 py-3 text-sm ml-auto max-w-[90%] text-right">${escapeHtml(answer)}</div>
    `;
    chatLog.appendChild(wrapper);
    chatLog.scrollTop = chatLog.scrollHeight;

    if (!prefersReducedMotion) {
      gsap.fromTo(wrapper, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ────────────────────────────────────────────────────────────
  // SALVAMENTO PROGRESSIVO (backend)
  // ────────────────────────────────────────────────────────────
  async function saveAnswerProgressively(questionKey, answerText) {
    try {
      await fetch(`/briefing/${encodeURIComponent(state.token)}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_key: questionKey, answer_text: answerText }),
      });
    } catch (err) {
      console.warn("Não foi possível salvar a resposta agora, ela segue guardada localmente.", err);
    }
  }

  // ────────────────────────────────────────────────────────────
  // FLUXO DE PERGUNTAS
  // ────────────────────────────────────────────────────────────
  function renderQuestion(index) {
    const q = QUESTIONS[index];
    questionText.textContent = q.text;
    answerInput.value = state.answers[q.key] || "";
    answerInput.placeholder = q.type === "long"
      ? "Fique à vontade para escrever com detalhes..."
      : "Digite sua resposta aqui...";
    charHint.textContent = q.type === "long" ? "Pode escrever bastante, sem pressa." : "Resposta curta e direta já ajuda.";
    btnNext.textContent = index === QUESTIONS.length - 1 ? "Revisar tudo →" : "Próxima →";
    btnNext.disabled = answerInput.value.trim().length < q.minLength;

    updateProgressBar();
    playQuestionAudio(index);
    answerInput.focus();
  }

  btnStart.addEventListener("click", () => {
    buildProgressBar();
    showScreen("questions");
    renderQuestion(state.currentIndex);
  });

  btnNext.addEventListener("click", () => {
    const q = QUESTIONS[state.currentIndex];
    const answer = answerInput.value.trim();
    if (answer.length < q.minLength) return;

    state.answers[q.key] = answer;
    appendToChatLog(q.text, answer);
    saveAnswerProgressively(q.key, answer);

    if (state.editingFromReview) {
      state.editingFromReview = false;
      goToReview();
      return;
    }

    if (state.currentIndex < QUESTIONS.length - 1) {
      state.currentIndex += 1;
      renderQuestion(state.currentIndex);
    } else {
      goToReview();
    }
  });

  // ────────────────────────────────────────────────────────────
  // REVISÃO
  // ────────────────────────────────────────────────────────────
  function goToReview() {
    if (state.currentAudio) state.currentAudio.pause();
    renderReviewSummary();
    showScreen("review");
  }

  function renderReviewSummary() {
    reviewSummary.innerHTML = "";
    QUESTIONS.forEach((q, i) => {
      const item = document.createElement("div");
      item.className = "glass rounded-xl p-4 flex items-start justify-between gap-4";
      item.innerHTML = `
        <div>
          <p class="text-xs text-gray-400 mb-1">${escapeHtml(q.text)}</p>
          <p class="text-sm font-bold">${escapeHtml(state.answers[q.key] || "—")}</p>
        </div>
        <button type="button" data-edit-index="${i}" class="btn-ghost px-3 py-1.5 text-xs shrink-0">Editar</button>
      `;
      reviewSummary.appendChild(item);
    });

    reviewSummary.querySelectorAll("[data-edit-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.editIndex);
        state.currentIndex = i;
        state.editingFromReview = true;
        showScreen("questions");
        renderQuestion(i);
      });
    });
  }

  btnBackToQuestions.addEventListener("click", () => {
    state.currentIndex = QUESTIONS.length - 1;
    state.editingFromReview = false;
    showScreen("questions");
    renderQuestion(state.currentIndex);
  });

  // ────────────────────────────────────────────────────────────
  // UPLOAD DE ARQUIVOS
  // ────────────────────────────────────────────────────────────
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  const ACCEPTED_TYPES = [".svg", ".png", ".webp", ".jpg", ".jpeg", ".pdf"];

  btnBrowseFiles.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

  ["dragenter", "dragover"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("is-dragover");
    });
  });
  dropZone.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));

  function handleFiles(fileListInput) {
    Array.from(fileListInput).forEach((file) => {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!ACCEPTED_TYPES.includes(ext)) {
        renderFileError(`${file.name}: formato não aceito.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        renderFileError(`${file.name}: arquivo maior que 15MB.`);
        return;
      }
      state.files.push(file);
    });
    renderFileList();
  }

  function renderFileError(message) {
    const li = document.createElement("li");
    li.className = "text-xs text-red-400";
    li.textContent = message;
    fileList.appendChild(li);
    setTimeout(() => li.remove(), 4000);
  }

  function renderFileList() {
    fileList.querySelectorAll("[data-file-item]").forEach((el) => el.remove());
    state.files.forEach((file, i) => {
      const li = document.createElement("li");
      li.dataset.fileItem = "true";
      li.className = "glass rounded-lg px-3 py-2 flex items-center justify-between text-sm";
      li.innerHTML = `
        <span class="truncate">${escapeHtml(file.name)}</span>
        <button type="button" data-remove-file="${i}" class="text-gray-400 hover:text-red-400 ml-3" aria-label="Remover ${escapeHtml(file.name)}">✕</button>
      `;
      fileList.appendChild(li);
    });

    fileList.querySelectorAll("[data-remove-file]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.files.splice(Number(btn.dataset.removeFile), 1);
        renderFileList();
      });
    });
  }

  // ────────────────────────────────────────────────────────────
  // ENVIO FINAL
  // ────────────────────────────────────────────────────────────
  btnSubmit.addEventListener("click", async () => {
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Enviando...";

    const formData = new FormData();
    formData.append("token", state.token);
    formData.append("answers", JSON.stringify(state.answers));
    formData.append("additional_info", additionalInfo.value.trim());
    formData.append("inspiration_links", inspirationLinks.value.trim());
    formData.append("competitors", competitors.value.trim());
    state.files.forEach((file) => formData.append("identidade_visual", file));

    try {
      const res = await fetch(`/briefing/${encodeURIComponent(state.token)}/submit`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("submit failed");
      showScreen("done");
    } catch (err) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Enviar briefing";
      renderFileError("Não foi possível enviar agora. Tente novamente em instantes.");
    }
  });

  // ────────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────────
  showScreen("intro");
});
