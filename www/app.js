// LOGICBOT — app.js corrigido
"use strict";

const content = document.getElementById("content");
const STORAGE_KEY = "logicbot_progress_v1";
const CHAT_API_URL = "http://localhost:3000/api/chat";

const lessons = [
  { id: 1, title: "O que é lógica de programação?", description: "Aprenda a organizar o raciocínio para resolver problemas usando passos claros.", content: `<p><strong>Lógica de programação</strong> é a organização de instruções para resolver um problema.</p><br><p>Imagine preparar um sanduíche: você separa os ingredientes, monta o sanduíche e serve. A ordem das etapas importa!</p><br><p>Um algoritmo é uma sequência organizada de passos para atingir um objetivo.</p>` },
  { id: 2, title: "Algoritmos no dia a dia", description: "Entenda como transformar uma tarefa em uma sequência de instruções.", content: `<p>Um algoritmo descreve como realizar uma tarefa.</p><br><p><strong>Exemplo: preparar um café</strong></p><p>1. Separar os ingredientes.</p><p>2. Aquecer a água.</p><p>3. Preparar o café.</p><p>4. Servir na xícara.</p><br><p>Na programação, organizamos instruções de maneira semelhante, mas usando comandos que o computador consegue executar.</p>` },
  { id: 3, title: "Variáveis e dados", description: "Descubra como guardar informações para utilizar em um programa.", content: `<p>Uma variável é um espaço identificado por um nome, usado para guardar um valor.</p><br><p><strong>Exemplo em Python:</strong></p><pre><code>nome = "Ana"\nidade = 18\n\nprint(nome)\nprint(idade)</code></pre><br><p>A variável <code>nome</code> guarda um texto. A variável <code>idade</code> guarda um número inteiro.</p>` },
  { id: 4, title: "Decisões e condições", description: "Aprenda a fazer um programa escolher o que fazer conforme uma condição.", content: `<p>As condições permitem que o programa tome decisões.</p><br><p><strong>Exemplo em Python:</strong></p><pre><code>idade = 18\n\nif idade >= 18:\n    print("Maior de idade")\nelse:\n    print("Menor de idade")</code></pre><br><p>O comando <code>if</code> verifica uma condição. O <code>else</code> define o que acontece se ela não for verdadeira.</p>` }
];

const questions = [
  { question: "O que é um algoritmo?", options: ["Uma peça física do computador", "Uma sequência de passos para resolver um problema", "Um tipo de monitor", "Um aplicativo de mensagens"], answer: 1, explanation: "Correto! Um algoritmo organiza os passos necessários para resolver um problema." },
  { question: "Para que serve uma variável?", options: ["Para desligar o computador", "Para desenhar imagens automaticamente", "Para guardar e representar informações", "Para substituir todos os comandos"], answer: 2, explanation: "Isso mesmo! Variáveis armazenam valores que podem ser utilizados pelo programa." },
  { question: "Qual comando Python verifica uma condição?", options: ["if", "print", "input", "import"], answer: 0, explanation: "Correto! O comando if permite executar instruções dependendo de uma condição." },
  { question: "O que acontece no bloco else?", options: ["O programa sempre termina", "Uma variável é apagada", "O computador reinicia", "São executadas instruções quando a condição do if não é satisfeita"], answer: 3, explanation: "Muito bem! O else define um caminho alternativo quando a condição não é satisfeita." }
];

let currentPage = "inicio";
let currentQuestion = 0;
let quizScore = 0;
let questionAnswered = false;
let quizFinished = false;
let quizAnswers = [];
let chatRequestInProgress = false;

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { completedLessons: [] };
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.completedLessons)) return { completedLessons: [] };
    return { completedLessons: parsed.completedLessons.filter(id => lessons.some(lesson => lesson.id === id)) };
  } catch (error) {
    console.warn("Não foi possível carregar o progresso.", error);
    return { completedLessons: [] };
  }
}

let progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Não foi possível salvar o progresso.", error);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function updateNavigation() {
  document.querySelectorAll(".nav-item").forEach(button => {
    const active = button.dataset.page === currentPage;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function updateProgress() {
  const total = lessons.length;
  const completed = progress.completedLessons.length;
  const percentage = Math.round(completed / total * 100);
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-label");
  const description = document.getElementById("progress-description");
  if (fill) fill.style.width = `${percentage}%`;
  if (label) label.textContent = `${percentage}% concluído`;
  if (description) description.textContent = completed === total
    ? "Parabéns! Você concluiu todas as aulas disponíveis."
    : `Você concluiu ${completed} de ${total} aulas. Continue aprendendo!`;
}

function renderHome() {
  content.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">🚀 SUA JORNADA COMEÇA AQUI</span>
        <h1>Transforme lógica em <span>código.</span></h1>
        <p>Aprenda programação passo a passo, pratique seus conhecimentos e evolua no seu ritmo.</p>
        <button class="primary-button" data-page="aulas">Começar a aprender <span>→</span></button>
      </div>
      <div class="robot" aria-label="Robô do LogicBot">
        <div class="robot-glow"></div><div class="robot-face"><div class="robot-antenna"></div><div class="robot-eyes"><span></span><span></span></div><div class="robot-mouth"></div></div><div class="robot-base"></div>
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">SEU PROGRESSO</span><h2>Continue evoluindo</h2></div><span class="progress-label" id="progress-label">0% concluído</span></div>
      <div class="progress-card"><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div><p id="progress-description"></p></div>
    </section>
    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">EXPLORE</span><h2>O que deseja aprender?</h2></div></div>
      <div class="feature-grid">
        <button class="feature-card" data-page="aulas"><span class="feature-icon purple">📚</span><strong>Aulas</strong><span>Aprenda os fundamentos</span><span class="card-arrow">→</span></button>
        <button class="feature-card" data-page="exercicios"><span class="feature-icon blue">🧩</span><strong>Exercícios</strong><span>Teste seus conhecimentos</span><span class="card-arrow">→</span></button>
        <button class="feature-card" data-page="assistente"><span class="feature-icon cyan">🤖</span><strong>LogicBot IA</strong><span>Tire suas dúvidas</span><span class="card-arrow">→</span></button>
      </div>
    </section>
    <section class="tip-card"><span class="tip-icon">💡</span><div><strong>Dica do LogicBot</strong><p>Programar é aprender a resolver problemas, um passo de cada vez.</p></div></section>`;
  updateProgress();
}

function renderLessons() {
  const lessonCards = lessons.map((lesson, index) => {
    const completed = progress.completedLessons.includes(lesson.id);
    return `<article class="lesson-card"><div class="lesson-top"><div class="lesson-number">${String(index + 1).padStart(2, "0")}</div><div><h3>${escapeHTML(lesson.title)}</h3><p>${escapeHTML(lesson.description)}</p></div></div><div class="lesson-actions"><button class="small-button" data-action="open-lesson" data-id="${lesson.id}">Estudar aula</button><button class="small-button ${completed ? "completed" : ""}" data-action="complete-lesson" data-id="${lesson.id}">${completed ? "✓ Concluída" : "Marcar concluída"}</button></div></article>`;
  }).join("");
  content.innerHTML = `<span class="eyebrow">TRILHA DE APRENDIZADO</span><h1 class="page-title">Suas aulas</h1><p class="page-description">Comece pelos fundamentos e avance no seu ritmo.</p><div class="lesson-list">${lessonCards}</div>`;
}

function openLesson(id) {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) return;
  const completed = progress.completedLessons.includes(id);
  content.innerHTML = `<button class="small-button" data-page="aulas">← Voltar às aulas</button><section class="section"><span class="eyebrow">AULA ${String(lesson.id).padStart(2, "0")}</span><h1 class="page-title">${escapeHTML(lesson.title)}</h1><p class="page-description">${escapeHTML(lesson.description)}</p><article class="lesson-card lesson-content">${lesson.content}</article><button class="primary-button" data-action="complete-lesson" data-id="${lesson.id}">${completed ? "✓ Aula concluída" : "Marcar aula como concluída"}</button></section>`;
}

function completeLesson(id) {
  if (!lessons.some(lesson => lesson.id === id)) return;
  if (!progress.completedLessons.includes(id)) {
    progress.completedLessons.push(id);
    saveProgress();
  }
  renderLessons();
  updateProgress();
}

function renderQuiz() {
  currentQuestion = 0; quizScore = 0; questionAnswered = false; quizFinished = false; quizAnswers = [];
  renderQuestion();
}

function renderQuestion() {
  const question = questions[currentQuestion];
  if (!question) return;
  questionAnswered = false;
  const options = question.options.map((option, index) => `<button class="quiz-option" data-action="answer" data-index="${index}">${escapeHTML(option)}</button>`).join("");
  content.innerHTML = `<span class="eyebrow">PRATIQUE SEUS CONHECIMENTOS</span><h1 class="page-title">Desafio de lógica</h1><p class="page-description">Questão ${currentQuestion + 1} de ${questions.length}</p><article class="quiz-card"><div class="progress-track"><div class="progress-fill" style="width: ${(currentQuestion + 1) / questions.length * 100}%"></div></div><h3 style="margin-top: 20px">${escapeHTML(question.question)}</h3><div class="quiz-options">${options}</div><p id="quiz-feedback" class="quiz-feedback" aria-live="polite"></p><button id="next-question" class="primary-button" data-action="next-question" hidden>Próxima questão →</button></article>`;
}

function answerQuestion(index) {
  if (questionAnswered || quizFinished) return;
  const question = questions[currentQuestion];
  if (!question || index < 0 || index >= question.options.length) return;
  questionAnswered = true;
  const correct = index === question.answer;
  if (correct) quizScore++;
  quizAnswers.push({ question: currentQuestion, selected: index, correct });

  document.querySelectorAll(".quiz-option").forEach((button, buttonIndex) => {
    button.disabled = true;
    if (buttonIndex === question.answer) button.classList.add("correct");
    else if (buttonIndex === index && !correct) button.classList.add("wrong");
  });

  const feedback = document.getElementById("quiz-feedback");
  if (feedback) {
    feedback.textContent = correct ? `✓ ${question.explanation}` : `Não foi dessa vez. ${question.explanation}`;
    feedback.style.color = correct ? "#70efa9" : "#ff9999";
  }
  const nextButton = document.getElementById("next-question");
  if (nextButton) {
    nextButton.hidden = false;
    nextButton.textContent = currentQuestion === questions.length - 1 ? "Ver resultado" : "Próxima questão →";
  }
}

function nextQuestion() {
  if (!questionAnswered) return;
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else renderQuizResult();
}

function renderQuizResult() {
  quizFinished = true;
  const percentage = Math.round(quizScore / questions.length * 100);
  content.innerHTML = `<section class="quiz-card" style="text-align:center;padding:30px 20px"><div style="font-size:48px;margin-bottom:15px">${percentage >= 75 ? "🏆" : "🧠"}</div><span class="eyebrow">DESAFIO FINALIZADO</span><h1 class="page-title">Você conseguiu!</h1><p class="page-description">Você acertou ${quizScore} de ${questions.length} questões.</p><div style="font-size:42px;font-weight:800;color:var(--cyan)">${percentage}%</div><p class="page-description" style="margin-top:15px">${percentage >= 75 ? "Excelente trabalho! Continue avançando." : "Continue estudando e tente novamente. Cada tentativa é aprendizado!"}</p><button class="primary-button" data-action="restart-quiz">Tentar novamente</button><button class="small-button" data-page="aulas" style="margin-left:6px">Revisar aulas</button></section>`;
}

function renderAssistant() {
  content.innerHTML = `<span class="eyebrow">SEU COMPANHEIRO DE APRENDIZADO</span><h1 class="page-title">Assistente LogicBot</h1><p class="page-description">Tire dúvidas e aprenda programação com explicações simples.</p><section class="chat-panel"><div class="chat-heading"><span class="brand-icon">🤖</span><div><h3>LogicBot IA</h3><p>Assistente de programação com OpenRouter</p></div></div><div id="chat-messages" class="chat-messages" aria-live="polite"><div class="message">Olá! Sou o LogicBot. Pergunte sobre lógica de programação, algoritmos, Python, Java, HTML ou CSS.</div></div><p id="chat-status" class="chat-notice" role="status"></p><form id="chat-form" class="chat-form"><textarea id="chat-input" name="question" rows="1" maxlength="2000" placeholder="Digite sua dúvida..." aria-label="Digite sua dúvida" required></textarea><button id="chat-send" type="submit" aria-label="Enviar pergunta">➤</button></form></section><p class="notice">O LogicBot usa um servidor para proteger a chave da inteligência artificial.</p>`;
}

function addMessage(text, type) {
  const messages = document.getElementById("chat-messages");
  if (!messages) return null;
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  if (type === "user") messageElement.classList.add("user");
  // Usa texto simples para não interpretar conteúdo da IA como HTML.
  messageElement.textContent = String(text);
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
  return messageElement;
}

function setChatStatus(message) {
  const status = document.getElementById("chat-status");
  if (status) status.textContent = message;
}

async function handleChatSubmit(event) {
  event.preventDefault();
  if (chatRequestInProgress) return;

  const input = document.getElementById("chat-input");
  const sendButton = document.getElementById("chat-send");
  if (!input) return;

  const question = input.value.trim();
  if (!question) return;

  chatRequestInProgress = true;
  addMessage(question, "user");
  input.value = "";
  input.disabled = true;
  if (sendButton) sendButton.disabled = true;
  setChatStatus("O LogicBot está preparando a resposta…");
  const loadingMessage = addMessage("Pensando... 🤖", "bot");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    let response;
    try {
      response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await response.text();
    let data;
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      console.error("O servidor retornou conteúdo que não é JSON:", rawBody);
      throw new Error("O servidor retornou uma resposta inválida.");
    }

    if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`);
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      console.error("Resposta recebida do servidor sem o campo reply:", data);
      throw new Error("O servidor não retornou uma resposta válida.");
    }

    if (loadingMessage) loadingMessage.remove();
    addMessage(data.reply.trim(), "bot");
    setChatStatus("");
  } catch (error) {
    console.error("Erro no LogicBot:", error);
    let message = "Não consegui conectar ao servidor do LogicBot. Confira se ele está ligado e se o endereço da API está correto.";
    if (error.name === "AbortError") message = "A resposta demorou mais de 60 segundos. Tente novamente.";
    else if (!(error instanceof TypeError) && error.message) message = error.message;
    if (loadingMessage) loadingMessage.remove();
    addMessage(message, "bot");
    setChatStatus("Não foi possível concluir a solicitação.");
  } finally {
    chatRequestInProgress = false;
    const currentInput = document.getElementById("chat-input");
    const currentSendButton = document.getElementById("chat-send");
    if (currentInput) { currentInput.disabled = false; currentInput.focus(); }
    if (currentSendButton) currentSendButton.disabled = false;
  }
}

function navigate(page) {
  const allowedPages = ["inicio", "aulas", "exercicios", "assistente"];
  if (!allowedPages.includes(page)) return;
  currentPage = page;
  updateNavigation();
  switch (page) {
    case "inicio": renderHome(); break;
    case "aulas": renderLessons(); break;
    case "exercicios": renderQuiz(); break;
    case "assistente": renderAssistant(); break;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

document.addEventListener("click", event => {
  const button = event.target.closest("button[data-page], a[data-page]");
  if (button) {
    event.preventDefault();
    navigate(button.dataset.page);
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  switch (action) {
    case "open-lesson": openLesson(id); break;
    case "complete-lesson": completeLesson(id); break;
    case "answer": answerQuestion(Number(actionButton.dataset.index)); break;
    case "next-question": nextQuestion(); break;
    case "restart-quiz": renderQuiz(); break;
  }
});

document.addEventListener("submit", event => {
  if (event.target.id === "chat-form") handleChatSubmit(event);
});

renderHome();
updateNavigation();