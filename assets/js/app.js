document.addEventListener("DOMContentLoaded", () => {
  // ────────────────────────────────────────────────────────────
  // CONFIG — edite as perguntas do briefing aqui
  // ────────────────────────────────────────────────────────────
  const QUESTIONS = [
    {
      key: "segmento",
      text: "Qual o foco principal da página?",
      type: "choice",
      options: [
        { value: "clinica", label: "Clínica" },
        { value: "profissional", label: "Profissional" },
        { value: "produto", label: "Produto/procedimento específico" },
      ],
    },
    {
      key: "identificacao",
      type: "short",
      minLength: 3,
      textBySegment: {
        clinica: "Qual o nome da clínica e do profissional responsável (com CRM)?",
        profissional: "Qual o nome do profissional, especialidade e CRM?",
        produto: "Qual o nome do procedimento/produto, e qual profissional ou clínica está por trás dele (nome + CRM)?",
      },
    },
    {
      key: "tipo_atendimento",
      text: "O atendimento é presencial, por telemedicina, ou os dois?",
      type: "choice",
      options: [
        { value: "presencial", label: "Presencial" },
        { value: "telemedicina", label: "Telemedicina" },
        { value: "ambos", label: "Ambos" },
      ],
    },
    {
      key: "cidade_regiao",
      text: "Qual a cidade ou região de atendimento?",
      type: "short",
      minLength: 2,
    },
    {
      key: "o_que_sera_vendido",
      type: "long",
      minLength: 10,
      textBySegment: {
        clinica: "Quais procedimentos ou especialidades a clínica quer destacar?",
        profissional: "Quais procedimentos esse profissional realiza e quer destacar?",
        produto: "Descreva o procedimento/produto: como funciona, pra quem é indicado, principais benefícios.",
      },
    },
    {
      key: "diferenciais",
      type: "long",
      minLength: 10,
      textBySegment: {
        clinica: "O que diferencia a clínica dos concorrentes?",
        profissional: "O que diferencia o profissional dos concorrentes?",
        produto: "O que diferencia o produto dos concorrentes?",
      },
    },
    {
      key: "tom_voz",
      text: "Como você descreveria o tom de comunicação ideal: mais técnico e sério, ou mais acolhedor e humano?",
      type: "short",
      minLength: 5,
    },
    {
      key: "possui_manual_marca",
      text: "Você já tem manual de marca, identidade visual ou direção criativa própria?",
      type: "choice",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    {
      key: "usar_ferramenta_direcao",
      text: "Deseja utilizar nossa ferramenta de direção criativa mesmo assim?",
      type: "choice",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    {
      key: "publico_alvo",
      text: "Quem é o paciente ideal que você quer atrair com essa página?",
      type: "long",
      minLength: 10,
    },
    {
      key: "aceita_convenio",
      text: "Sua clínica aceita convênio?",
      type: "choice",
      options: [
        { value: "nao", label: "Não" },
        {
          value: "sim",
          label: "Sim",
          followUp: {
            type: "text",
            text: "Quais convênios?",
            placeholder: "Ex: Unimed, Bradesco Saúde, SulAmérica...",
            minLength: 2,
            audio: "pergunta-11-followup.ogg",
          },
        },
      ],
    },
    {
      key: "telemedicina_100",
      text: "O atendimento é 100% telemedicina, sem endereço físico?",
      type: "choice",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    {
      key: "tem_video_institucional",
      text: "Você já tem um vídeo institucional pronto pra usar na página?",
      type: "choice",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    {
      key: "contato_endereco",
      text: "Qual o número de WhatsApp e o endereço completo?",
      type: "long",
      minLength: 10,
    },
    {
      key: "destino_ctas",
      text: "Para onde os botões da página devem levar: direto pro WhatsApp, para um sistema de agendamento online (Doctoralia, iClinic, etc.), ou outro fluxo?",
      type: "short",
      minLength: 5,
    },
    {
      key: "hosting_type",
      text: "Você já tem domínio e hospedagem próprios, ou prefere começar com um subdomínio gratuito nosso (ex: clinicax.falveshub.com)?",
      type: "choice",
      options: [
        { value: "our_subdomain", label: "Subdomínio gratuito (falveshub.com)" },
        {
          value: "own_domain",
          label: "Domínio próprio",
          followUp: {
            type: "choice",
            text: "Sua hospedagem é (ou vai ser) VPS/Cloud com acesso root/SSH, ou hospedagem compartilhada (painel cPanel)?",
            audio: "pergunta-16-followup.ogg",
            options: [
              { value: "own_domain_root", label: "VPS/Cloud com acesso root/SSH" },
              { value: "own_domain_shared", label: "Compartilhada (painel cPanel)" },
              { value: "own_domain_unknown", label: "Não sei", pending: true },
            ],
          },
        },
        { value: "own_domain_unknown_help", label: "Preciso de ajuda pra decidir", pending: true },
      ],
    },
  ];

  // ────────────────────────────────────────────────────────────
  // DIREÇÃO VISUAL — dados curados (tela própria, fora das perguntas de texto)
  // ────────────────────────────────────────────────────────────
  const FONT_PAIRS = {
    classico: { label: "Clássico editorial", titulo: { familia: "Playfair Display", peso: 700 }, corpo: { familia: "Inter", peso: 400 } },
    acolhedor: { label: "Acolhedor humano", titulo: { familia: "Poppins", peso: 600 }, corpo: { familia: "Nunito Sans", peso: 400 } },
    premium: { label: "Premium elegante", titulo: { familia: "Cormorant Garamond", peso: 600 }, corpo: { familia: "Lato", peso: 400 } },
    moderno: { label: "Moderno direto", titulo: { familia: "Montserrat", peso: 800 }, corpo: { familia: "DM Sans", peso: 400 } },
    versatil: { label: "Versátil", titulo: { familia: "Fraunces", peso: 600 }, corpo: { familia: "Work Sans", peso: 400 } },
  };

  const PALETTES = {
    azul_confianca: { label: "Azul Confiança", primaria: "#0d6efd", secundaria: "#0a58ca", neutros: "#f1f3f5", texto: "#1a1a1a" },
    verde_acolhedor: { label: "Verde Acolhedor", primaria: "#4caf7d", secundaria: "#2e7d52", neutros: "#f5f2ea", texto: "#23301f" },
    preto_dourado: { label: "Preto & Dourado", primaria: "#d4af37", secundaria: "#8a6d1a", neutros: "#1a1a1a", texto: "#f0f0f0" },
    roxo_vibrante: { label: "Roxo Vibrante", primaria: "#8b5cf6", secundaria: "#6d28d9", neutros: "#f8f7ff", texto: "#1e1b2e" },
    coral_caloroso: { label: "Coral Caloroso", primaria: "#ff6b6b", secundaria: "#e64c4c", neutros: "#fff5f2", texto: "#2d1810" },
  };

  const CANTO_OPTIONS = [
    { value: "reto", label: "Reto" },
    { value: "suave", label: "Levemente arredondado" },
    { value: "arredondado", label: "Bem arredondado" },
  ];
  const FUNDO_OPTIONS = [
    { value: "solido", label: "Sólido" },
    { value: "textura", label: "Textura sutil" },
    { value: "gradiente", label: "Gradiente leve" },
  ];
  const SOMBRA_OPTIONS = [
    { value: "nenhuma", label: "Nenhuma (flat)" },
    { value: "sutil", label: "Sutil" },
    { value: "pronunciada", label: "Pronunciada" },
  ];
  const DENSIDADE_OPTIONS = [
    { value: "compacto", label: "Compacto" },
    { value: "espacoso", label: "Espaçoso" },
  ];
  const IMAGEM_MOLDURA_OPTIONS = [
    { value: "reta", label: "Moldura reta" },
    { value: "suave", label: "Cantos suavizados" },
  ];
  const IMAGEM_TRATAMENTO_OPTIONS = [
    { value: "natural", label: "Natural" },
    { value: "overlay_marca", label: "Overlay na cor da marca" },
  ];
  const CTA_ESTILO_OPTIONS = [
    { value: "solido", label: "Sólido preenchido" },
    { value: "contornado", label: "Contornado" },
    { value: "pill", label: "Pill" },
  ];
  const CTA_ICONE_OPTIONS = [
    { value: true, label: "Com ícone" },
    { value: false, label: "Só texto" },
  ];

  const ARCHETYPES = {
    clinico: {
      label: "Clínico & Confiável",
      descricao: "Sério, técnico, cores frias, tipografia reta",
      tipografia: "classico", paleta: "azul_confianca", cantos: "reto", fundo: "solido",
      sombra: "sutil", densidade: "compacto", imagemMoldura: "reta", imagemTratamento: "natural",
      ctaEstilo: "solido", ctaIcone: false,
    },
    acolhedor: {
      label: "Acolhedor & Humano",
      descricao: "Caloroso, orgânico, cores suaves, cantos arredondados",
      tipografia: "acolhedor", paleta: "verde_acolhedor", cantos: "arredondado", fundo: "textura",
      sombra: "sutil", densidade: "espacoso", imagemMoldura: "suave", imagemTratamento: "natural",
      ctaEstilo: "pill", ctaIcone: true,
    },
    premium: {
      label: "Premium & Sofisticado",
      descricao: "Elegante, minimalista, paleta escura/neutra, espaçoso",
      tipografia: "premium", paleta: "preto_dourado", cantos: "suave", fundo: "gradiente",
      sombra: "pronunciada", densidade: "espacoso", imagemMoldura: "reta", imagemTratamento: "overlay_marca",
      ctaEstilo: "contornado", ctaIcone: false,
    },
    jovem: {
      label: "Jovem & Direto",
      descricao: "Vibrante, moderno, contraste alto, CTA chamativo",
      tipografia: "moderno", paleta: "roxo_vibrante", cantos: "arredondado", fundo: "gradiente",
      sombra: "pronunciada", densidade: "compacto", imagemMoldura: "suave", imagemTratamento: "overlay_marca",
      ctaEstilo: "solido", ctaIcone: true,
    },
  };

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
    visualDirection: document.getElementById("screen-visual-direction"),
    review: document.getElementById("screen-review"),
    done: document.getElementById("screen-done"),
  };

  const progressBar = document.getElementById("progressBar");
  const chatLog = document.getElementById("chatLog");
  const questionText = document.getElementById("questionText");
  const textAnswerBlock = document.getElementById("textAnswerBlock");
  const answerInput = document.getElementById("answerInput");
  const charHint = document.getElementById("charHint");
  const btnNext = document.getElementById("btnNext");
  const choiceOptions = document.getElementById("choiceOptions");
  const btnStart = document.getElementById("btnStart");
  const btnMute = document.getElementById("btnMute");
  const iconSound = document.getElementById("iconSound");
  const iconMute = document.getElementById("iconMute");
  const keywordLayer = document.getElementById("keywordLayer");

  const archetypeGrid = document.getElementById("archetypeGrid");
  const miniSections = document.getElementById("miniSections");
  const btnVisualDirectionContinue = document.getElementById("btnVisualDirectionContinue");

  const reviewSummary = document.getElementById("reviewSummary");
  const additionalInfo = document.getElementById("additionalInfo");
  const inspirationLinks = document.getElementById("inspirationLinks");
  const competitors = document.getElementById("competitors");
  const budgetRange = document.getElementById("budgetRange");
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
  // ÁUDIO (Piper TTS pré-gerado em ./assets/audio/pergunta-N[-segmento].ogg)
  // ────────────────────────────────────────────────────────────
  function playAudioFile(filename) {
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    if (state.muted) return;

    const audio = new Audio(`/assets/audio/${filename}`);
    state.currentAudio = audio;
    audio.play().catch(() => {
      // autoplay bloqueado ou arquivo ainda não gerado — segue sem áudio
    });
  }

  function playQuestionAudio(index) {
    const q = QUESTIONS[index];
    const suffix = q.textBySegment ? `-${state.segmento}` : "";
    playAudioFile(`pergunta-${index + 1}${suffix}.ogg`);
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
  // DIREÇÃO VISUAL — tela interativa com preview ao vivo
  // Fontes carregadas via Google Fonts CDN só nessa tela de escolha (ambiente de
  // demonstração); o valor exportado é sempre "família + peso", suficiente pra
  // Fase 2 baixar o .woff2 e self-hostar — nunca um link de CDN como entrega final.
  // ────────────────────────────────────────────────────────────
  const loadedFonts = new Set();
  function loadGoogleFont(familia, peso) {
    const id = `${familia}-${peso}`;
    if (loadedFonts.has(id)) return;
    loadedFonts.add(id);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia)}:wght@${peso}&display=swap`;
    document.head.appendChild(link);
  }

  function updateVisualPreview() {
    const t = state.designTokens;
    if (!t) return;
    const font = FONT_PAIRS[t.tipografia];
    const palette = PALETTES[t.paleta];

    loadGoogleFont(font.titulo.familia, font.titulo.peso);
    loadGoogleFont(font.corpo.familia, font.corpo.peso);

    const radius = { reto: "4px", suave: "12px", arredondado: "24px" }[t.cantos];
    const shadow = { nenhuma: "none", sutil: "0 4px 12px rgba(0,0,0,0.2)", pronunciada: "0 16px 40px rgba(0,0,0,0.45)" }[t.sombra];
    const padding = t.densidade === "espacoso" ? "2.25rem" : "1.1rem";
    const heroBg =
      t.fundo === "gradiente" ? `linear-gradient(135deg, ${palette.primaria}, ${palette.secundaria})` : palette.neutros;

    const hero = document.getElementById("previewHero");
    hero.style.background = heroBg;
    hero.style.borderRadius = radius;
    hero.style.boxShadow = shadow;
    hero.style.padding = padding;
    hero.style.color = t.fundo === "gradiente" ? "#ffffff" : palette.texto;

    const headline = document.getElementById("previewHeadline");
    headline.style.fontFamily = `'${font.titulo.familia}', sans-serif`;
    headline.style.fontWeight = font.titulo.peso;

    const subheadline = document.getElementById("previewSubheadline");
    subheadline.style.fontFamily = `'${font.corpo.familia}', sans-serif`;
    subheadline.style.fontWeight = font.corpo.peso;
    subheadline.style.opacity = "0.85";

    const cta = document.getElementById("previewCta");
    cta.style.fontFamily = `'${font.corpo.familia}', sans-serif`;
    cta.style.borderRadius = t.ctaEstilo === "pill" ? "999px" : radius;
    cta.style.transition = "none";
    if (t.ctaEstilo === "contornado") {
      cta.style.background = "transparent";
      cta.style.border = `2px solid ${palette.primaria}`;
      cta.style.color = t.fundo === "gradiente" ? "#ffffff" : palette.primaria;
    } else {
      cta.style.background = palette.primaria;
      cta.style.border = "none";
      cta.style.color = "#ffffff";
    }
    cta.textContent = t.ctaIcone ? "📱 Agendar avaliação" : "Agendar avaliação";

    [document.getElementById("previewCard"), document.getElementById("previewTestimonial")].forEach((el) => {
      el.style.background = palette.neutros;
      el.style.color = palette.texto;
      el.style.borderRadius = radius;
      el.style.boxShadow = shadow;
      el.style.padding = padding;
      el.style.fontFamily = `'${font.corpo.familia}', sans-serif`;
    });
    document.querySelector("#previewCard p.font-bold").style.fontFamily = `'${font.titulo.familia}', sans-serif`;

    const previewImage = document.getElementById("previewImage");
    previewImage.style.background =
      t.imagemTratamento === "overlay_marca" ? `linear-gradient(135deg, ${palette.primaria}55, ${palette.secundaria}55)` : "rgba(255,255,255,0.12)";
    previewImage.style.borderRadius = t.imagemMoldura === "suave" ? "16px" : "4px";
  }

  function renderSwatchGroup(containerId, options, tokenKey) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "direction-swatch";
      btn.textContent = opt.label;
      btn.dataset.active = String(state.designTokens[tokenKey] === opt.value);
      btn.addEventListener("click", () => {
        state.designTokens[tokenKey] = opt.value;
        renderAllSwatchGroups();
        updateVisualPreview();
      });
      container.appendChild(btn);
    });
  }

  function renderFontOptions() {
    const container = document.getElementById("fontOptions");
    container.innerHTML = "";
    Object.entries(FONT_PAIRS).forEach(([id, pair]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "direction-swatch";
      btn.dataset.active = String(state.designTokens.tipografia === id);
      btn.innerHTML = `<span class="block font-bold">${escapeHtml(pair.titulo.familia)}</span><span class="block text-xs opacity-70">${escapeHtml(pair.corpo.familia)}</span>`;
      btn.addEventListener("click", () => {
        state.designTokens.tipografia = id;
        renderAllSwatchGroups();
        updateVisualPreview();
      });
      container.appendChild(btn);
    });
  }

  function renderPaletteOptions() {
    const container = document.getElementById("paletteOptions");
    container.innerHTML = "";
    Object.entries(PALETTES).forEach(([id, pal]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "direction-swatch";
      btn.dataset.active = String(state.designTokens.paleta === id);
      btn.innerHTML = `
        <span class="flex gap-1 mb-2">
          <span style="width:16px;height:16px;border-radius:50%;background:${pal.primaria};display:inline-block;"></span>
          <span style="width:16px;height:16px;border-radius:50%;background:${pal.secundaria};display:inline-block;"></span>
        </span>
        <span class="block text-xs">${escapeHtml(pal.label)}</span>
      `;
      btn.addEventListener("click", () => {
        state.designTokens.paleta = id;
        renderAllSwatchGroups();
        updateVisualPreview();
      });
      container.appendChild(btn);
    });
  }

  function renderAllSwatchGroups() {
    renderFontOptions();
    renderPaletteOptions();
    renderSwatchGroup("cantoOptions", CANTO_OPTIONS, "cantos");
    renderSwatchGroup("fundoOptions", FUNDO_OPTIONS, "fundo");
    renderSwatchGroup("sombraOptions", SOMBRA_OPTIONS, "sombra");
    renderSwatchGroup("densidadeOptions", DENSIDADE_OPTIONS, "densidade");
    renderSwatchGroup("imagemMolduraOptions", IMAGEM_MOLDURA_OPTIONS, "imagemMoldura");
    renderSwatchGroup("imagemTratamentoOptions", IMAGEM_TRATAMENTO_OPTIONS, "imagemTratamento");
    renderSwatchGroup("ctaEstiloOptions", CTA_ESTILO_OPTIONS, "ctaEstilo");
    renderSwatchGroup("ctaIconeOptions", CTA_ICONE_OPTIONS, "ctaIcone");
  }

  function selectArchetype(id) {
    const arch = ARCHETYPES[id];
    state.designTokens = {
      arquetipoId: id,
      tipografia: arch.tipografia,
      paleta: arch.paleta,
      cantos: arch.cantos,
      fundo: arch.fundo,
      sombra: arch.sombra,
      densidade: arch.densidade,
      imagemMoldura: arch.imagemMoldura,
      imagemTratamento: arch.imagemTratamento,
      ctaEstilo: arch.ctaEstilo,
      ctaIcone: arch.ctaIcone,
    };
    renderArchetypeGrid();
    miniSections.classList.remove("hidden");
    renderAllSwatchGroups();
    updateVisualPreview();
    btnVisualDirectionContinue.disabled = false;
  }

  function renderArchetypeGrid() {
    archetypeGrid.innerHTML = "";
    Object.entries(ARCHETYPES).forEach(([id, arch]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "direction-swatch";
      btn.dataset.active = String(!!state.designTokens && state.designTokens.arquetipoId === id);
      btn.innerHTML = `<span class="block font-bold mb-1">${escapeHtml(arch.label)}</span><span class="block text-xs opacity-70">${escapeHtml(arch.descricao)}</span>`;
      btn.addEventListener("click", () => selectArchetype(id));
      archetypeGrid.appendChild(btn);
    });
  }

  function showVisualDirectionTool(returnToReview) {
    state.visualToolReturnsToReview = !!returnToReview;
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    renderArchetypeGrid();
    if (state.designTokens) {
      miniSections.classList.remove("hidden");
      renderAllSwatchGroups();
      updateVisualPreview();
      btnVisualDirectionContinue.disabled = false;
    } else {
      miniSections.classList.add("hidden");
      btnVisualDirectionContinue.disabled = true;
    }
    showScreen("visualDirection");
  }

  btnVisualDirectionContinue.addEventListener("click", () => {
    if (!state.designTokens) return;
    const t = state.designTokens;
    const font = FONT_PAIRS[t.tipografia];
    const palette = PALETTES[t.paleta];
    const archetype = ARCHETYPES[t.arquetipoId];

    const exportObject = {
      arquetipo: archetype.label,
      tipografia: {
        titulo: `${font.titulo.familia} ${font.titulo.peso}`,
        corpo: `${font.corpo.familia} ${font.corpo.peso}`,
      },
      paleta: {
        primaria: palette.primaria,
        secundaria: palette.secundaria,
        neutros: palette.neutros,
        texto: palette.texto,
      },
      estilos: {
        cantos: t.cantos,
        fundo: t.fundo,
        sombra: t.sombra,
      },
      densidade: t.densidade,
      imagem: {
        moldura: t.imagemMoldura,
        tratamento: t.imagemTratamento,
      },
      cta: {
        estilo: t.ctaEstilo,
        icone: t.ctaIcone,
      },
    };

    const answerText = JSON.stringify(exportObject);
    state.answers.design_tokens = answerText;
    saveAnswerProgressively("design_tokens", answerText);
    appendToChatLog("Direção visual escolhida", archetype.label);

    if (state.visualToolReturnsToReview) {
      goToReview();
      return;
    }
    showScreen("questions");
    advanceToNextQuestion();
  });

  // ────────────────────────────────────────────────────────────
  // FLUXO DE PERGUNTAS
  // ────────────────────────────────────────────────────────────
  function resolveQuestionText(q) {
    return q.textBySegment ? q.textBySegment[state.segmento] : q.text;
  }

  function advanceToNextQuestion() {
    if (state.currentIndex < QUESTIONS.length - 1) {
      state.currentIndex += 1;
      renderQuestion(state.currentIndex);
    } else {
      goToReview();
    }
  }

  function commitAnswer(key, answerText, questionTextResolved) {
    state.answers[key] = answerText;
    appendToChatLog(questionTextResolved, answerText);
    saveAnswerProgressively(key, answerText);

    const returningToReview = state.editingFromReview;
    state.editingFromReview = false;

    // gate da direção visual: "não tenho manual próprio" pula direto pra ferramenta
    if (key === "possui_manual_marca" && answerText === "Não") {
      state.currentIndex = QUESTIONS.findIndex((q) => q.key === "usar_ferramenta_direcao");
      showVisualDirectionTool(returningToReview);
      return;
    }

    // "tenho manual próprio, mas quero usar a ferramenta mesmo assim"
    if (key === "usar_ferramenta_direcao") {
      if (answerText === "Sim") {
        showVisualDirectionTool(returningToReview);
        return;
      }
      if (returningToReview) {
        goToReview();
        return;
      }
      advanceToNextQuestion();
      return;
    }

    if (returningToReview) {
      goToReview();
      return;
    }

    advanceToNextQuestion();
  }

  // combina o(s) rótulo(s) escolhidos num texto só, marcando pendência quando aplicável
  function combineAnswerParts(parts, pending) {
    const text = parts.join(" — ");
    return pending ? `⏳ Pendente — ${text}` : text;
  }

  // campo de texto solto (não usa o textAnswerBlock/btnNext principal, pra não colidir
  // com o listener genérico de perguntas de texto)
  function renderFollowUpText(followUp, onConfirm) {
    choiceOptions.innerHTML = `
      <textarea id="followUpInput" class="field w-full p-4 text-base resize-none" rows="2" placeholder="${escapeHtml(followUp.placeholder || "")}"></textarea>
      <button type="button" id="followUpConfirm" class="btn-neon px-6 py-3 text-sm mt-3" disabled>Confirmar</button>
    `;
    const input = document.getElementById("followUpInput");
    const confirmBtn = document.getElementById("followUpConfirm");
    const minLength = followUp.minLength || 1;
    input.addEventListener("input", () => {
      confirmBtn.disabled = input.value.trim().length < minLength;
    });
    confirmBtn.addEventListener("click", () => {
      if (input.value.trim().length < minLength) return;
      onConfirm(input.value.trim());
    });
    input.focus();
  }

  function renderFollowUpChoice(followUp, onSelect) {
    choiceOptions.innerHTML = "";
    questionText.textContent = followUp.text;
    followUp.options.forEach((subOpt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-ghost w-full p-4 text-base text-left";
      btn.textContent = subOpt.label;
      btn.addEventListener("click", () => onSelect(subOpt));
      choiceOptions.appendChild(btn);
    });
  }

  function handleChoiceSelect(q, opt, questionTextResolved) {
    if (q.key === "segmento") state.segmento = opt.value;

    if (!opt.followUp) {
      commitAnswer(q.key, combineAnswerParts([opt.label], opt.pending), questionTextResolved);
      return;
    }

    if (opt.followUp.audio) playAudioFile(opt.followUp.audio);

    if (opt.followUp.type === "choice") {
      renderFollowUpChoice(opt.followUp, (subOpt) => {
        commitAnswer(q.key, combineAnswerParts([opt.label, subOpt.label], subOpt.pending), questionTextResolved);
      });
    } else if (opt.followUp.type === "text") {
      questionText.textContent = opt.followUp.text;
      renderFollowUpText(opt.followUp, (detail) => {
        commitAnswer(q.key, combineAnswerParts([opt.label, detail], false), questionTextResolved);
      });
    }
  }

  function renderChoiceOptions(q, questionTextResolved) {
    choiceOptions.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-ghost w-full p-4 text-base text-left";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => handleChoiceSelect(q, opt, questionTextResolved));
      choiceOptions.appendChild(btn);
    });
  }

  function renderQuestion(index) {
    const q = QUESTIONS[index];
    const text = resolveQuestionText(q);
    questionText.textContent = text;

    if (q.type === "choice") {
      textAnswerBlock.classList.add("hidden");
      choiceOptions.classList.remove("hidden");
      renderChoiceOptions(q, text);
    } else {
      choiceOptions.classList.add("hidden");
      textAnswerBlock.classList.remove("hidden");
      answerInput.value = state.answers[q.key] || "";
      answerInput.placeholder = q.type === "long"
        ? "Fique à vontade para escrever com detalhes..."
        : "Digite sua resposta aqui...";
      charHint.textContent = q.type === "long" ? "Pode escrever bastante, sem pressa." : "Resposta curta e direta já ajuda.";
      btnNext.textContent = index === QUESTIONS.length - 1 ? "Revisar tudo →" : "Próxima →";
      btnNext.disabled = answerInput.value.trim().length < q.minLength;
      answerInput.focus();
    }

    updateProgressBar();
    playQuestionAudio(index);
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
    commitAnswer(q.key, answer, resolveQuestionText(q));
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
      const answer = state.answers[q.key] || "—";
      const isPending = answer.startsWith("⏳");
      const item = document.createElement("div");
      item.className = "glass rounded-xl p-4 flex items-start justify-between gap-4";
      item.innerHTML = `
        <div>
          <p class="text-xs text-gray-400 mb-1">${escapeHtml(resolveQuestionText(q))}</p>
          <p class="text-sm font-bold ${isPending ? "text-amber-400" : ""}">${escapeHtml(answer)}</p>
        </div>
        <button type="button" data-edit-index="${i}" class="btn-ghost px-3 py-1.5 text-xs shrink-0">Editar</button>
      `;
      reviewSummary.appendChild(item);
    });

    if (state.answers.design_tokens) {
      const tokens = JSON.parse(state.answers.design_tokens);
      const item = document.createElement("div");
      item.className = "glass rounded-xl p-4 flex items-start justify-between gap-4";
      item.innerHTML = `
        <div>
          <p class="text-xs text-gray-400 mb-1">Direção visual</p>
          <p class="text-sm font-bold">${escapeHtml(tokens.arquetipo)}</p>
        </div>
        <button type="button" id="editVisualDirection" class="btn-ghost px-3 py-1.5 text-xs shrink-0">Editar</button>
      `;
      reviewSummary.appendChild(item);
      document.getElementById("editVisualDirection").addEventListener("click", () => {
        showVisualDirectionTool(true);
      });
    }

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
    formData.append("budget_range", budgetRange.value.trim());
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
