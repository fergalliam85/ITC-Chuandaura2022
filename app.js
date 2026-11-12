(() => {
  'use strict';

  const ACCOUNT_KEY = 'on-tin-hoc.accounts';
  const SESSION_KEY = 'on-tin-hoc.session';
  const GUEST_SESSION = '__guest__';
  const PROGRESS_PREFIX = 'on-tin-hoc.progress.';
  const PAGE_SIZE = 20;
  const PRACTICAL_HISTORY_LIMIT = 20;
  const topics = [
    { id: 'basics', name: 'Kiến thức máy tính', icon: '01', color: '#5570e8', pale: '#eef1ff' },
    { id: 'system', name: 'Hệ điều hành & thiết bị', icon: 'PC', color: '#d38c37', pale: '#fff5e8' },
    { id: 'network', name: 'Mạng & chia sẻ dữ liệu', icon: 'LAN', color: '#41967a', pale: '#eaf7f1' },
    { id: 'files', name: 'Windows & quản lý tệp', icon: '▤', color: '#8463d9', pale: '#f1edfc' },
    { id: 'vietnamese', name: 'Gõ tiếng Việt', icon: 'VN', color: '#db7181', pale: '#fff0f2' },
    { id: 'safety', name: 'An toàn dữ liệu', icon: '✓', color: '#41967a', pale: '#eaf7f1' },
    { id: 'word', name: 'Microsoft Word', icon: 'W', color: '#4278ca', pale: '#edf4ff' },
    { id: 'excel', name: 'Microsoft Excel', icon: 'X', color: '#31966e', pale: '#e9f7ef' },
    { id: 'powerpoint', name: 'Microsoft PowerPoint', icon: 'P', color: '#d76f4a', pale: '#fff0ea' },
    { id: 'web', name: 'Internet & trình duyệt', icon: '↗', color: '#5d75d5', pale: '#eef1ff' },
    { id: 'email', name: 'Thư điện tử', icon: '@', color: '#cb718a', pale: '#fff0f4' }
  ];
  const palette = ['#5570e8', '#d38c37', '#41967a', '#8463d9', '#db7181', '#41967a', '#4278ca', '#31966e', '#d76f4a', '#5d75d5', '#cb718a'];
  const authView = document.getElementById('auth-view');
  const appView = document.getElementById('app-view');
  const pageContent = document.getElementById('page-content');
  const searchInput = document.getElementById('global-search');
  const toast = document.getElementById('toast');
  let account = null;
  let progress = { learned: [], saved: [], recent: [] };
  let currentView = 'home';
  let selectedTopic = null;
  let questionFilter = 'all';
  let currentPage = 1;
  let exam = null;
  let studySession = null;
  let studyTopicFilter = '';
  let practicalExam = null;
  let practicalTemplateFilter = 'random';
  let officeExam = null;
  let officeTemplateFilters = { word: 'random', powerpoint: 'random' };
  let toastTimer;

  function notify(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('is-error', isError);
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function readJson(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Dữ liệu lưu "${key}" không đọc được. Hãy kiểm tra bộ nhớ trang web trước khi tiếp tục.`);
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function accountProgressKey(email) {
    return `${PROGRESS_PREFIX}${encodeURIComponent(email)}`;
  }

  function loadProgress(email) {
    const saved = readJson(accountProgressKey(email), { learned: [], saved: [], recent: [], practicalHistory: [] });
    if (!saved || !Array.isArray(saved.learned) || !Array.isArray(saved.saved) || !Array.isArray(saved.recent) ||
      (saved.practicalHistory !== undefined && !Array.isArray(saved.practicalHistory))) {
      throw new Error('Dữ liệu tiến độ học không đúng định dạng. Tiến độ hiện có chưa bị thay đổi.');
    }
    progress = {
      learned: [...new Set(saved.learned.filter(Number.isInteger))],
      saved: [...new Set(saved.saved.filter(Number.isInteger))],
      recent: [...new Set(saved.recent.filter(Number.isInteger))],
      practicalHistory: Array.isArray(saved.practicalHistory) ? saved.practicalHistory : []
    };
  }

  function persistProgress() {
    if (!account) throw new Error('Bạn cần đăng nhập để lưu tiến độ.');
    writeJson(accountProgressKey(account.email), progress);
  }

  function normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g) || [], byte => parseInt(byte, 16));
  }

  async function passwordHash(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Trình duyệt chưa hỗ trợ bảo mật tài khoản. Hãy mở trang bằng HTTPS hoặc localhost.');
    }
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const result = await crypto.subtle.deriveBits({
      name: 'PBKDF2', salt: hexToBytes(salt), iterations: 150000, hash: 'SHA-256'
    }, key, 256);
    return bytesToHex(result);
  }

  function getAccounts() {
    const accounts = readJson(ACCOUNT_KEY, []);
    if (!Array.isArray(accounts)) throw new Error('Danh sách tài khoản trong trình duyệt không hợp lệ.');
    return accounts;
  }

  function showAuthForm(mode) {
    document.getElementById('login-form').classList.toggle('is-hidden', mode !== 'login');
    document.getElementById('register-form').classList.toggle('is-hidden', mode !== 'register');
  }

  function setAuthenticatedUser(user) {
    loadProgress(user.email);
    localStorage.setItem(SESSION_KEY, user.email);
    account = user;
    authView.classList.add('is-hidden');
    appView.classList.remove('is-hidden');
    document.getElementById('user-name').textContent = account.name;
    document.querySelector('.profile-copy small').textContent = user.email === GUEST_SESSION
      ? 'Dùng không cần tài khoản'
      : 'Gói học cá nhân';
    const initial = account.name.trim().charAt(0) || '?';
    document.getElementById('user-avatar').textContent = initial;
    document.getElementById('top-avatar').textContent = initial;
    renderTopicNav();
    renderPage();
  }

  function topicForQuestion(question) {
    return topics.find(topic => topic.id === question.topic);
  }

  function countTopicQuestions(topicId) {
    return window.CDR_QUESTIONS.filter(question => question.topic === topicId).length;
  }

  function countLearned(topicId = null) {
    const ids = topicId
      ? window.CDR_QUESTIONS.filter(question => question.topic === topicId).map(question => question.id)
      : window.CDR_QUESTIONS.map(question => question.id);
    return ids.filter(id => progress.learned.includes(id)).length;
  }

  function renderTopicNav() {
    const nav = document.getElementById('topic-nav');
    document.getElementById('topic-total').textContent = topics.length;
    nav.innerHTML = topics.map((topic, index) => `
      <button class="nav-item ${currentView === 'topic' && selectedTopic === topic.id ? 'is-active' : ''}" data-topic="${topic.id}">
        <span class="topic-dot" style="--dot:${palette[index]}"></span>${escapeHtml(topic.name)}
        <span class="nav-count">${countLearned(topic.id)}/${countTopicQuestions(topic.id)}</span>
      </button>`).join('');
  }

  function setView(view, topicId = null) {
    currentView = view;
    selectedTopic = topicId;
    currentPage = 1;
    if (!['questions', 'tips'].includes(view)) searchInput.value = '';
    document.querySelectorAll('.primary-nav [data-view]').forEach(button => {
      const active = view === button.dataset.view && (view !== 'questions' || !topicId);
      button.classList.toggle('is-active', active);
    });
    renderTopicNav();
    renderPage();
    document.getElementById('sidebar').classList.remove('is-open');
  }

  function renderPage() {
    if (!account) return;
    if (currentView === 'home') {
      pageContent.innerHTML = renderDashboard();
      document.getElementById('breadcrumb-current').textContent = 'Tổng quan';
      return;
    }
    if (currentView === 'topics') {
      renderTopicsPage();
      return;
    }
    if (currentView === 'practice') {
      renderPracticePage();
      return;
    }
    if (currentView === 'tips') {
      renderTipsPage();
      return;
    }
    if (currentView === 'exam') {
      renderExamPage();
      return;
    }
    if (currentView === 'practical') {
      renderPracticalPage();
      return;
    }
    if (currentView === 'word-practical') {
      renderOfficePracticalPage('word');
      return;
    }
    if (currentView === 'powerpoint-practical') {
      renderOfficePracticalPage('powerpoint');
      return;
    }
    renderQuestionPage();
  }

  function renderDashboard() {
    const learned = countLearned();
    const percentage = Math.round(learned / window.CDR_QUESTIONS.length * 100);
    const nextQuestion = window.CDR_QUESTIONS.find(question => !progress.learned.includes(question.id));
    const recent = progress.recent
      .filter(id => progress.learned.includes(id))
      .slice(0, 5)
      .map(id => window.CDR_QUESTIONS.find(question => question.id === id))
      .filter(Boolean);
    const date = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    const cards = topics.map((topic, index) => {
      const total = countTopicQuestions(topic.id);
      const done = countLearned(topic.id);
      return `<article class="card topic-card" data-open-topic="${topic.id}" tabindex="0" role="button" aria-label="Mở chủ đề ${escapeHtml(topic.name)}">
        <div class="topic-card-top">
          <span class="topic-card-icon" style="--topic-color:${palette[index]};--topic-pale:${topic.pale}">${escapeHtml(topic.icon)}</span>
          <small>${done}/${total} đã học</small>
        </div>
        <h3>${escapeHtml(topic.name)}</h3>
        <p>${total} câu hỏi trong chủ đề</p>
      </article>`;
    }).join('');
    const recentRows = recent.length
      ? recent.map(question => `<div class="recent-row">
          <div class="recent-question"><strong>Câu ${question.id}. ${escapeHtml(question.question)}</strong><small>${escapeHtml(topicForQuestion(question).name)}</small></div>
          <span class="recent-check" aria-label="Đã học">✓</span>
        </div>`).join('')
      : '<p class="empty-recent">Các câu bạn đánh dấu đã học sẽ xuất hiện tại đây.</p>';

    return `<section class="welcome-line">
        <div><p class="eyebrow">TỔNG QUAN HỌC TẬP</p><h1>Chào ${escapeHtml(account.name)}! 👋</h1><p>Mỗi câu hỏi hôm nay là một bước gần hơn tới mục tiêu của bạn.</p></div>
        <span class="date-pill">${escapeHtml(date)}</span>
      </section>
      <section class="dashboard-grid">
        <article class="card progress-card">
          <div class="progress-copy">
            <span class="card-kicker">TIẾN ĐỘ CỦA BẠN</span>
            <h2>${learned ? 'Bạn đang làm rất tốt!' : 'Sẵn sàng bắt đầu ôn tập?'}</h2>
            <p>Đã hoàn thành ${learned} trên tổng số ${window.CDR_QUESTIONS.length} câu hỏi.</p>
            <div class="progress-meta"><span class="progress-track"><span style="width:${percentage}%"></span></span><small>${percentage}% hoàn thành</small></div>
          </div>
          <div class="progress-ring" style="--progress:${percentage}%"><strong>${percentage}%</strong></div>
        </article>
        <article class="card stat-card">
          <div class="stat-heading"><span>Câu đã đánh dấu học</span><span class="stat-icon">✓</span></div>
          <p class="stat-number">${learned}<span style="color:#aab2c0;font-size:17px"> / ${window.CDR_QUESTIONS.length}</span></p>
          <p class="stat-caption">${progress.saved.length} câu đã lưu để xem lại</p>
        </article>
      </section>
      <section class="section-heading"><div><h2>Tiếp tục học</h2><p>${nextQuestion ? `Câu ${nextQuestion.id} đang chờ bạn.` : 'Bạn đã đánh dấu đã học toàn bộ câu hỏi.'}</p></div>
        <button class="link-button" data-view="questions">Xem tất cả câu hỏi →</button></section>
      ${nextQuestion ? `<article class="card recent-card">
        <div class="recent-row">
          <div class="recent-question"><strong>Câu ${nextQuestion.id}. ${escapeHtml(nextQuestion.question)}</strong><small>${escapeHtml(topicForQuestion(nextQuestion).name)} · 4 lựa chọn</small></div>
          <button class="button button-primary" data-continue="${nextQuestion.id}">Ôn câu này →</button>
        </div>
      </article>` : ''}
      <section class="section-heading"><div><h2>Chủ đề học tập</h2><p>Chọn một chủ đề để xem câu hỏi.</p></div></section>
      <section class="topic-grid">${cards}</section>
      <section class="section-heading"><div><h2>Gần đây</h2><p>Các câu hỏi bạn đã học gần nhất.</p></div></section>
      <article class="card recent-card">${recentRows}</article>`;
  }

  function renderTopicsPage() {
    document.getElementById('breadcrumb-current').textContent = 'Ôn theo chủ đề';
    const cards = topics.map((topic, index) => {
      const total = countTopicQuestions(topic.id);
      const learned = countLearned(topic.id);
      const percentage = total ? Math.round(learned / total * 100) : 0;
      return `<article class="card topic-card">
        <div class="topic-card-top">
          <span class="topic-card-icon" style="--topic-color:${palette[index]};--topic-pale:${topic.pale}">${escapeHtml(topic.icon)}</span>
          <small>${learned}/${total} đã học</small>
        </div>
        <h3>${escapeHtml(topic.name)}</h3>
        <p>${total} câu hỏi · ${percentage}% hoàn thành</p>
        <span class="topic-progress-track"><span style="width:${percentage}%;--topic-color:${palette[index]}"></span></span>
        <button class="link-button topic-practice-link" data-open-topic-button="${topic.id}">Xem câu hỏi →</button>
        <button class="link-button topic-practice-link" data-study-topic="${topic.id}">Luyện chủ đề →</button>
      </article>`;
    }).join('');
    pageContent.innerHTML = `<section class="welcome-line">
        <div><p class="eyebrow">CHỌN NỘI DUNG ÔN TẬP</p><h1>Ôn theo chủ đề</h1>
        <p>Chọn một chủ đề để học câu hỏi và đáp án đúng cùng nhau.</p></div>
      </section><section class="topic-grid topic-grid-expanded">${cards}</section>`;
  }

  function renderPracticePage() {
    document.getElementById('breadcrumb-current').textContent = 'Luyện tập tương tác';
    const topicOptions = `<option value="" ${studyTopicFilter ? '' : 'selected'}>Tất cả chủ đề</option>
      ${topics.map(topic => `<option value="${topic.id}" ${studyTopicFilter === topic.id ? 'selected' : ''}>${escapeHtml(topic.name)}</option>`).join('')}`;
    if (!studySession) {
      pageContent.innerHTML = `<section class="welcome-line">
          <div><p class="eyebrow">TỰ NHỚ, TỰ KIỂM TRA</p><h1>Luyện tập tương tác</h1>
          <p>Đáp án được ẩn cho đến khi bạn chọn. Sau mỗi lựa chọn, đáp án đúng sẽ tự động hiện ra.</p></div>
        </section>
        <article class="card study-start-card">
          <div class="study-start-copy"><span class="exam-hero-icon">☷</span><div><h2>Bạn muốn luyện phần nào?</h2>
          <p>Chọn một chủ đề hoặc luyện ngẫu nhiên trong toàn bộ ngân hàng 285 câu hỏi.</p></div></div>
          <label class="study-topic-label" for="study-topic-filter">Chủ đề</label>
          <select id="study-topic-filter" class="filter-select">${topicOptions}</select>
          <button class="button button-primary" data-start-study>Bắt đầu luyện tập →</button>
        </article>`;
      document.getElementById('study-topic-filter').addEventListener('change', event => {
        studyTopicFilter = event.target.value;
      });
      return;
    }

    const total = studySession.questionIds.length;
    const currentQuestion = window.CDR_QUESTIONS.find(question => question.id === studySession.questionIds[studySession.index]);
    if (!currentQuestion) {
      pageContent.innerHTML = `<section class="welcome-line"><div><p class="eyebrow">HOÀN THÀNH</p><h1>Đã luyện hết câu hỏi</h1></div></section>
        <article class="card study-start-card"><p class="muted">Bạn đã hoàn thành ${total} câu trong lượt luyện này.</p><button class="button button-primary" data-finish-study>Bắt đầu lượt mới →</button></article>`;
      return;
    }

    const selected = studySession.selectedIndex;
    const hasAnswered = selected !== null;
    const isCorrect = selected === currentQuestion.correctIndex;
    const choices = currentQuestion.answers.map((answer, index) => {
      const classes = ['exam-option', 'study-option'];
      if (hasAnswered && index === currentQuestion.correctIndex) classes.push('is-correct');
      if (hasAnswered && index === selected && !isCorrect) classes.push('is-wrong');
      if (!hasAnswered && index === selected) classes.push('is-selected');
      return `<button class="${classes.join(' ')}" data-study-answer data-answer="${index}" ${hasAnswered ? 'disabled' : ''}>
        <span class="answer-letter">${'ABCD'[index]}.</span><span>${escapeHtml(answer)}</span>
        ${hasAnswered && index === currentQuestion.correctIndex ? '<strong class="correct-label">ĐÁP ÁN ĐÚNG</strong>' : ''}
        ${hasAnswered && index === selected && !isCorrect ? '<strong class="wrong-label">BẠN CHỌN</strong>' : ''}
      </button>`;
    }).join('');
    const feedback = !hasAnswered ? '' : `<div class="study-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}">
        <strong>${isCorrect ? 'Chính xác!' : 'Chưa đúng, đáp án đúng đã được tô vàng.'}</strong>
        <span>${'ABCD'[currentQuestion.correctIndex]}. ${escapeHtml(currentQuestion.answers[currentQuestion.correctIndex])}</span>
      </div>`;
    const markedLearned = progress.learned.includes(currentQuestion.id);
    pageContent.innerHTML = `<section class="welcome-line">
        <div><p class="eyebrow">LUYỆN TẬP ${studySession.topicId ? 'THEO CHỦ ĐỀ' : 'TỔNG HỢP'}</p><h1>${studySession.topicId ? escapeHtml(topics.find(topic => topic.id === studySession.topicId).name) : 'Câu hỏi ngẫu nhiên'}</h1>
        <p>Chọn một phương án; đáp án đúng chỉ xuất hiện sau khi bạn trả lời.</p></div>
        <span class="date-pill">Câu ${studySession.index + 1} / ${total}</span>
      </section>
      <article class="card study-question-card">
        <div class="exam-question-heading"><span class="question-number">${currentQuestion.id}</span><span class="question-topic">${escapeHtml(topicForQuestion(currentQuestion).name)}</span></div>
        <h2 class="question-title">${escapeHtml(currentQuestion.question)}</h2>
        <div class="exam-options">${choices}</div>
        ${feedback}
        <div class="study-controls">
          ${hasAnswered ? `<button class="mark-button ${markedLearned ? 'is-learned' : ''}" data-mark-study-learned="${currentQuestion.id}">${markedLearned ? '✓ Đã đánh dấu đã học' : 'Đánh dấu đã học'}</button>` : '<span class="study-hint">Chọn đáp án để kiểm tra</span>'}
          ${hasAnswered ? `<button class="button button-primary" data-next-study>${studySession.index + 1 === total ? 'Hoàn thành lượt học' : 'Câu tiếp theo →'}</button>` : ''}
        </div>
      </article>
      <button class="link-button study-exit" data-finish-study>Thoát lượt luyện tập</button>`;
  }

  function startStudySession(topicId = studyTopicFilter) {
    const pool = window.CDR_QUESTIONS.filter(question => !topicId || question.topic === topicId);
    for (let index = pool.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    studySession = { questionIds: pool.map(question => question.id), index: 0, selectedIndex: null, topicId };
    currentView = 'practice';
    renderTopicNav();
    renderPracticePage();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makePracticalData(templateId) {
    if (templateId === 'seafood-sales') {
      const products = [
        { code: 'T', name: 'Tôm', fresh: 80000, dry: 300000, tax: 0.02 },
        { code: 'M', name: 'Mực', fresh: 150000, dry: 400000, tax: 0.05 },
        { code: 'G', name: 'Ghẹ', fresh: 300000, dry: 0, tax: 0.015 },
        { code: 'C', name: 'Cá ngừ', fresh: 102000, dry: 300000, tax: 0.015 }
      ];
      const rows = Array.from({ length: 8 }, (_, index) => {
        const product = products[randomInt(0, products.length - 1)];
        const zone = index === 0 ? 'I' : index === 1 ? 'E' : Math.random() < 0.5 ? 'I' : 'E';
        const distance = zone === 'I' ? 0 : randomInt(10, 75);
        const condition = Math.random() < 0.65 ? 'T' : 'K';
        return [index + 1, `${product.code}${zone}${String(distance).padStart(2, '0')}${condition}`, '', randomInt(5, 95), '', '', '', ''];
      });
      return [
        { title: 'DOANH SỐ BÁN HÀNG', rows: [['STT', 'Mã số', 'Tên mặt hàng', 'Số lượng', 'Đơn giá', 'Cước VC', 'Thuế', 'Giá bán'], ...rows] },
        { title: 'BẢNG ĐƠN GIÁ', rows: [['Mã mặt hàng', 'T', 'M', 'G', 'C'], ['Tên mặt hàng', ...products.map(item => item.name)], ['Loại khô', ...products.map(item => item.dry)], ['Loại tươi', ...products.map(item => item.fresh)], ['Thuế suất', ...products.map(item => item.tax)]] },
        { title: 'BẢNG THỐNG KÊ', rows: [['Tên mặt hàng', ...products.map(item => item.name)], ['Tổng đơn hàng', ...products.map(() => '')], ['Tổng số lượng', ...products.map(() => '')]] }
      ];
    }

    if (templateId === 'cinema-tickets') {
      const movies = [
        { code: 'FF', name: 'Fast & Furious 9', child: 55000, adult: 80000 },
        { code: 'TR', name: 'Trăng Rơi', child: 52000, adult: 85000 },
        { code: 'PV', name: 'Phi Vụ Đen', child: 54000, adult: 82000 }
      ];
      const rows = Array.from({ length: 10 }, (_, index) => {
        const movie = movies[randomInt(0, movies.length - 1)];
        const screen = index === 0 ? 1 : randomInt(1, 4);
        const ticketType = Math.random() < 0.4 ? 'C' : 'A';
        return [index + 1, `${movie.code}${randomInt(1, 2)}${ticketType}${screen}`, '', '', index === 0 ? randomInt(6, 8) : randomInt(1, 8), '', ''];
      });
      return [
        { title: 'LỊCH CHIẾU VÀ DOANH THU VÉ PHIM', rows: [['STT', 'Mã vé phim', 'Tên phim', 'Giờ chiếu', 'SL vé', 'Giá vé', 'Thành tiền'], ...rows] },
        { title: 'BẢNG GIÁ VÉ', rows: [['Mã phim', 'Tên phim', 'Trẻ em', 'Người lớn'], ...movies.map(movie => [movie.code, movie.name, movie.child, movie.adult])] },
        { title: 'BẢNG THỐNG KÊ', rows: [['Tên phim', 'SL vé', 'SL đặt'], ...movies.map(movie => [movie.name, '', ''])] }
      ];
    }

    if (templateId === 'quarterly-sales') {
      const products = [
        { code: 'AT', name: 'Áo thun', unit: 'Cái', month1: 150, month2: 190 },
        { code: 'GV', name: 'Giầy', unit: 'Đôi', month1: 220, month2: 275 },
        { code: 'DS', name: 'Dép', unit: 'Đôi', month1: 150, month2: 167 },
        { code: 'QN', name: 'Quần Jean', unit: 'Cái', month1: 150, month2: 120 }
      ];
      const rows = Array.from({ length: 10 }, (_, index) => {
        const product = index === 0 ? products[0] : products[randomInt(0, products.length - 1)];
        const month = index === 0 ? 1 : randomInt(1, 2);
        return [index + 1, `${product.code}${String(index + 1).padStart(2, '0')}`, month, '', '', index === 0 ? randomInt(220, 280) : randomInt(10, 280), '', ''];
      });
      return [
        { title: 'DOANH SỐ BÁN HÀNG THEO QUÝ', rows: [['STT', 'Mã hóa đơn', 'Tháng', 'Tên hàng', 'Quy cách', 'Số lượng', 'Đơn giá', 'Thành tiền'], ...rows] },
        { title: 'BẢNG TRA TÊN HÀNG VÀ ĐƠN GIÁ', rows: [['Mã hàng', 'Tên hàng', 'Đơn giá tháng 1', 'Đơn giá tháng 2'], ...products.map(product => [product.code, product.name, product.month1, product.month2])] },
        { title: 'BẢNG THỐNG KÊ', rows: [['Tên hàng', 'Thành tiền', 'Số lượng đơn hàng'], ...products.map(product => [product.name, '', ''])] }
      ];
    }

    const products = [
      { code: 'AT', name: 'Áo thun', type1: 80000, type2: 45000 },
      { code: 'SM', name: 'Sơ mi', type1: 105000, type2: 75000 },
      { code: 'QK', name: 'Quần Kaki', type1: 160000, type2: 90000 },
      { code: 'QJ', name: 'Quần Jean', type1: 220000, type2: 125000 }
    ];
    const rows = Array.from({ length: 10 }, (_, index) => {
      const product = products[randomInt(0, products.length - 1)];
      const productType = randomInt(1, 2);
      const quantity = index === 0 ? randomInt(160, 220) : index === 1 ? randomInt(80, 120) : index === 2 ? randomInt(25, 45) : randomInt(20, 220);
      return [index + 1, `${product.code}${productType}-${String(index + 1).padStart(3, '0')}`, '', quantity, '', '', '', ''];
    });
    return [
      { title: 'BẢNG KÊ CHI TIẾT MẶT HÀNG MAY MẶC', rows: [['STT', 'Mã HĐ', 'Tên hàng', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Giảm giá', 'Tổng tiền'], ...rows] },
      { title: 'BẢNG TRA TÊN HÀNG VÀ ĐƠN GIÁ', rows: [['Mã hàng', ...products.map(product => product.code)], ['Tên hàng', ...products.map(product => product.name)], ['Đơn giá loại 1', ...products.map(product => product.type1)], ['Đơn giá loại 2', ...products.map(product => product.type2)]] },
      { title: 'BẢNG THỐNG KÊ DOANH THU', rows: [['Mã hàng', ...products.map(product => product.code)], ['Số đơn hàng', ...products.map(() => '')], ['Tổng tiền', ...products.map(() => '')]] }
    ];
  }

  function practicalCsv(data) {
    const csvRows = [['ITC - CÂU LẠC BỘ TIN HỌC · ĐỀ THỰC HÀNH EXCEL']];
    data.forEach(section => {
      csvRows.push([], [section.title], ...section.rows);
    });
    const escapeCell = value => {
      const text = String(value ?? '');
      return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return '\uFEFF' + csvRows.map(row => row.map(escapeCell).join(';')).join('\r\n');
  }

  function startPracticalExam(templateId = practicalTemplateFilter) {
    const template = templateId === 'random'
      ? window.CDR_PRACTICAL_TEMPLATES[randomInt(0, window.CDR_PRACTICAL_TEMPLATES.length - 1)]
      : window.CDR_PRACTICAL_TEMPLATES.find(item => item.id === templateId);
    if (!template) {
      notify('Không tìm thấy dạng đề thực hành đã chọn.', true);
      return;
    }
    const formNumber = randomInt(100, 999);
    practicalExam = {
      id: `${Date.now()}-${formNumber}`,
      formNumber,
      templateId: template.id,
      sections: makePracticalData(template.id),
      checks: template.rubric.map(() => false),
      completed: false
    };
    renderPracticalPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function practicalScore() {
    const template = window.CDR_PRACTICAL_TEMPLATES.find(item => item.id === practicalExam.templateId);
    const maxPoints = template.rubric.reduce((sum, item) => sum + item.points, 0);
    const earned = template.rubric.reduce((sum, item, index) => sum + (practicalExam.checks[index] ? item.points : 0), 0);
    return { earned, maxPoints };
  }

  function renderPracticalPage() {
    document.getElementById('breadcrumb-current').textContent = 'Thi thực hành Excel';
    const templates = window.CDR_PRACTICAL_TEMPLATES;
    if (!practicalExam) {
      const cards = templates.map(template => `<article class="card practical-type-card">
        <span class="topic-card-icon practical-type-icon">${escapeHtml(template.icon)}</span>
        <h2>${escapeHtml(template.shortName)}</h2>
        <p>${escapeHtml(template.description)}</p>
        <small>${template.rubric.length} tiêu chí · ${template.rubric.reduce((sum, row) => sum + row.points, 0)} điểm</small>
      </article>`).join('');
      const recent = progress.practicalHistory.filter(item => !item.appKind || item.appKind === 'excel').slice(0, 5);
      const historyMarkup = recent.length
        ? `<section class="practical-history card"><h2>Bài thực hành gần đây</h2>${recent.map(item => {
          const template = templates.find(row => row.id === item.templateId);
          return `<div class="recent-row"><div class="recent-question"><strong>${escapeHtml(template ? template.shortName : 'Bài thực hành Excel')} · Đề ${item.formNumber}</strong><small>${escapeHtml(item.date)}</small></div><span class="practical-history-score">${item.earned}/${item.maxPoints} điểm</span></div>`;
        }).join('')}</section>`
        : '';
      pageContent.innerHTML = `<section class="welcome-line">
          <div><p class="eyebrow">LUYỆN KỸ NĂNG EXCEL</p><h1>Đề thi thực hành Excel</h1>
          <p>Đề được xây dựng từ 4 dạng bài trong file bài tập chuẩn đầu ra. Mỗi lần tạo đề sẽ sinh mã, số liệu và phiên bản mới.</p></div>
        </section>
        <article class="card practical-generator-card">
          <div><span class="exam-hero-icon">▦</span><h2>Tạo một đề mới</h2>
          <p>Chọn dạng muốn luyện hoặc để hệ thống chọn ngẫu nhiên. Đề kèm dữ liệu CSV để mở bằng Microsoft Excel.</p></div>
          <label for="practical-template-filter">Dạng bài</label>
          <select id="practical-template-filter" class="filter-select">
            <option value="random" ${practicalTemplateFilter === 'random' ? 'selected' : ''}>Ngẫu nhiên trong 4 dạng</option>
            ${templates.map(template => `<option value="${template.id}" ${practicalTemplateFilter === template.id ? 'selected' : ''}>${escapeHtml(template.name)}</option>`).join('')}
          </select>
          <button class="button button-primary" data-start-practical>Tạo đề thực hành →</button>
        </article>
        <section class="section-heading"><div><h2>Bốn dạng bài trong tài liệu</h2><p>Mỗi dạng có thể tạo nhiều phiên bản số liệu.</p></div></section>
        <section class="practical-type-grid">${cards}</section>
        ${historyMarkup}`;
      document.getElementById('practical-template-filter').addEventListener('change', event => {
        practicalTemplateFilter = event.target.value;
      });
      return;
    }

    const template = templates.find(item => item.id === practicalExam.templateId);
    const score = practicalScore();
    const sectionsMarkup = practicalExam.sections.map(section => `<section class="practical-data-section">
      <h3>${escapeHtml(section.title)}</h3>
      <div class="practical-table-wrap"><table class="practical-table"><tbody>
        ${section.rows.map((row, rowIndex) => `<tr>${row.map((cell, cellIndex) => {
          const isHeader = rowIndex === 0;
          const tag = isHeader ? 'th' : 'td';
          return `<${tag} class="${cell === '' ? 'is-blank' : ''}">${cell === '' ? '<span aria-label="Ô cần hoàn thành">—</span>' : escapeHtml(cell)}</${tag}>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </section>`).join('');
    const rubricMarkup = template.rubric.map((criterion, index) => `<label class="rubric-row">
      <input type="checkbox" data-practical-check="${index}" ${practicalExam.checks[index] ? 'checked' : ''} ${practicalExam.completed ? 'disabled' : ''}>
      <span>${escapeHtml(criterion.title)}</span><strong>${criterion.points}đ</strong>
    </label>`).join('');
    pageContent.innerHTML = `<section class="welcome-line practical-welcome">
        <div><p class="eyebrow">ĐỀ THỰC HÀNH · FORM ${practicalExam.formNumber}</p><h1>${escapeHtml(template.shortName)}</h1>
        <p>${escapeHtml(template.description)}</p></div>
        <button class="button button-secondary" data-download-practical>Tải dữ liệu CSV ↓</button>
      </section>
      <div class="practical-notice"><strong>Thời gian gợi ý: 45 phút.</strong> Mở tệp CSV trong Excel và làm theo yêu cầu trong bài. Đánh dấu các mục hoàn thành để tự chấm; điểm này phục vụ ôn tập, chưa thay thế chấm bài trên tệp Excel.</div>
      <div class="practical-layout">
        <section class="card practical-task-card">
          <div class="practical-card-heading"><div><span class="card-kicker">YÊU CẦU THỰC HÀNH</span><h2>Danh sách công việc</h2></div>
            <span class="practical-score">${score.earned}<small> / ${score.maxPoints} điểm</small></span></div>
          <div class="rubric-list">${rubricMarkup}</div>
          ${practicalExam.completed
            ? '<div class="practical-finished"><strong>Đã lưu kết quả tự chấm.</strong><p>Bạn có thể tạo một đề khác với bộ dữ liệu mới.</p></div>'
            : '<button class="button button-primary practical-submit" data-finish-practical>Lưu kết quả tự chấm</button>'}
          <button class="link-button practical-new-link" data-new-practical>Tạo đề khác</button>
        </section>
        <section class="card practical-data-card">
          <div class="practical-card-heading"><div><span class="card-kicker">BỘ DỮ LIỆU</span><h2>Xem bảng dữ liệu</h2></div></div>
          <p class="muted">Các ô có dấu gạch ngang là thông tin bạn tự tính trong Excel.</p>
          ${sectionsMarkup}
        </section>
      </div>`;
  }

  function getOfficeTemplates(appKind) {
    if (!window.CDR_OFFICE_PRACTICALS || !Array.isArray(window.CDR_OFFICE_PRACTICALS[appKind])) {
      throw new Error(`Chưa tải được bộ đề thực hành ${appKind === 'word' ? 'Word' : 'PowerPoint'}.`);
    }
    return window.CDR_OFFICE_PRACTICALS[appKind];
  }

  function officeScore() {
    const template = getOfficeTemplates(officeExam.appKind).find(item => item.id === officeExam.templateId);
    const maxPoints = template.rubric.reduce((sum, item) => sum + item[1], 0);
    const earned = template.rubric.reduce((sum, item, index) => sum + (officeExam.checks[index] ? item[1] : 0), 0);
    return { earned, maxPoints };
  }

  function renderOfficePracticalPage(appKind) {
    const isWord = appKind === 'word';
    const appLabel = isWord ? 'Word' : 'PowerPoint';
    const viewId = isWord ? 'word-practical' : 'powerpoint-practical';
    const templates = getOfficeTemplates(appKind);
    document.getElementById('breadcrumb-current').textContent = `Thi thực hành ${appLabel}`;

    if (!officeExam || officeExam.appKind !== appKind) {
      const recent = progress.practicalHistory.filter(item => item.appKind === appKind).slice(0, 5);
      const historyMarkup = recent.length
        ? `<section class="practical-history card"><h2>Bài ${appLabel} gần đây</h2>${recent.map(item => {
          const previousTemplate = templates.find(template => template.id === item.templateId);
          return `<div class="recent-row"><div class="recent-question"><strong>${escapeHtml(previousTemplate ? previousTemplate.name : `Bài thực hành ${appLabel}`)} · Đề ${item.formNumber}</strong><small>${escapeHtml(item.date)}</small></div><span class="practical-history-score">${item.earned}/${item.maxPoints} điểm</span></div>`;
        }).join('')}</section>`
        : '';
      const cards = templates.map((template, index) => `<article class="card practical-type-card">
        <span class="topic-card-icon practical-type-icon">${String(index + 1).padStart(2, '0')}</span>
        <h2>${escapeHtml(template.name)}</h2>
        <p>${escapeHtml(template.description)}</p>
        <small>${template.duration} phút · ${template.rubric.reduce((sum, item) => sum + item[1], 0)} điểm</small>
      </article>`).join('');
      pageContent.innerHTML = `<section class="welcome-line">
          <div><p class="eyebrow">LUYỆN KỸ NĂNG ${appLabel.toUpperCase()}</p><h1>Đề thi thực hành ${appLabel}</h1>
          <p>${isWord
            ? 'Ba dạng bài được xây dựng theo đề: đơn đăng ký luận văn, đơn hoãn thi và phiếu đăng ký dự thi tiếng Anh.'
            : 'Bốn dạng bài được xây dựng theo đề: phím tắt, quy trình tuyển dụng, kỹ năng mềm và thống kê tuyển sinh.'}</p></div>
        </section>
        <article class="card practical-generator-card">
          <div><span class="exam-hero-icon">${isWord ? 'W' : 'P'}</span><h2>Tạo một đề mới</h2>
          <p>${isWord
            ? 'Tải tệp HTML tương thích Microsoft Word, mở bằng Word rồi lưu thành .docx để làm bài.'
            : 'Tải dàn ý .txt và nhập vào PowerPoint bằng Home → New Slide → Slides from Outline.'}</p></div>
          <label for="${viewId}-template-filter">Dạng bài</label>
          <select id="${viewId}-template-filter" class="filter-select">
            <option value="random" ${officeTemplateFilters[appKind] === 'random' ? 'selected' : ''}>Ngẫu nhiên trong ${templates.length} dạng</option>
            ${templates.map(template => `<option value="${template.id}" ${officeTemplateFilters[appKind] === template.id ? 'selected' : ''}>${escapeHtml(template.name)}</option>`).join('')}
          </select>
          <button class="button button-primary" data-start-office="${appKind}">Tạo đề ${appLabel} →</button>
        </article>
        <section class="section-heading"><div><h2>${templates.length} dạng bài thực hành</h2><p>Mỗi lần tạo đề sẽ thay đổi nội dung hoặc dữ liệu để luyện lại.</p></div></section>
        <section class="practical-type-grid">${cards}</section>
        ${historyMarkup}`;
      document.getElementById(`${viewId}-template-filter`).addEventListener('change', event => {
        officeTemplateFilters[appKind] = event.target.value;
      });
      return;
    }

    const template = templates.find(item => item.id === officeExam.templateId);
    const score = officeScore();
    const isCompleted = officeExam.completed;
    const rubric = template.rubric.map(([title, points], index) => `<label class="rubric-row">
      <input type="checkbox" data-office-check="${index}" ${officeExam.checks[index] ? 'checked' : ''} ${isCompleted ? 'disabled' : ''}>
      <span>${escapeHtml(title)}</span><strong>${points}đ</strong>
    </label>`).join('');
    const details = officeExam.content.facts.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const downloadLabel = isWord ? 'Tải bài mẫu mở bằng Word ↓' : 'Tải dàn ý PowerPoint ↓';
    pageContent.innerHTML = `<section class="welcome-line practical-welcome">
        <div><p class="eyebrow">ĐỀ THỰC HÀNH ${appLabel.toUpperCase()} · FORM ${officeExam.formNumber}</p><h1>${escapeHtml(template.name)}</h1>
        <p>${escapeHtml(template.description)}</p></div>
        <button class="button button-secondary" data-download-office="${appKind}">${downloadLabel}</button>
      </section>
      <div class="practical-notice"><strong>Thời gian gợi ý: ${template.duration} phút.</strong> ${isWord
        ? 'Tệp tải về là HTML tương thích Microsoft Word, có thể mở để chỉnh sửa rồi lưu thành .docx.'
        : 'Tệp tải về là dàn ý văn bản; dùng chức năng Slides from Outline trong PowerPoint để tạo slide, sau đó định dạng theo yêu cầu.'}
        Đánh dấu các mục đã hoàn thành để tự chấm; điểm này phục vụ ôn tập.</div>
      <div class="practical-layout">
        <section class="card practical-task-card">
          <div class="practical-card-heading"><div><span class="card-kicker">YÊU CẦU THỰC HÀNH</span><h2>Danh sách công việc</h2></div>
            <span class="practical-score">${score.earned}<small> / ${score.maxPoints} điểm</small></span></div>
          <div class="rubric-list">${rubric}</div>
          ${isCompleted
            ? '<div class="practical-finished"><strong>Đã lưu kết quả tự chấm.</strong><p>Bạn có thể tạo đề khác với nội dung mới.</p></div>'
            : '<button class="button button-primary practical-submit" data-finish-office>Lưu kết quả tự chấm</button>'}
          <button class="link-button practical-new-link" data-new-office="${appKind}">Tạo đề khác</button>
        </section>
        <section class="card practical-data-card office-preview-card">
          <div class="practical-card-heading"><div><span class="card-kicker">${isWord ? 'NỘI DUNG BÀI MẪU' : 'NỘI DUNG DÀN Ý'}</span><h2>${escapeHtml(officeExam.content.title || template.name)}</h2></div></div>
          <ul class="office-facts">${details}</ul>
          ${isWord
            ? `<div class="word-document-preview">${officeExam.content.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph).replace(/\\n/g, '<br>').replace(/\\t/g, '&emsp;')}</p>`).join('')}</div>
              <p class="muted office-note">Phần nội dung trên được đưa vào tệp HTML tương thích với Word để bạn tiếp tục định dạng theo đề.</p>`
            : officeExam.content.slides.map((slide, index) => `<article class="slide-preview">
                <span>SLIDE ${index + 1}</span><h3>${escapeHtml(slide.title)}</h3>
                <ul>${slide.bullets.map(bullet => `<li>${escapeHtml(bullet.trim())}</li>`).join('')}</ul>
              </article>`).join('')}
        </section>
      </div>`;
  }

  function makeWordExerciseHtml() {
    const paragraphs = officeExam.content.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph).replace(/\\n/g, '<br>').replace(/\\t/g, '&emsp;')}</p>`).join('');
    const rubric = getOfficeTemplates('word').find(template => template.id === officeExam.templateId).rubric;
    const instructions = rubric.map(([title, points]) => `<li>${escapeHtml(title)} <span>(${points} điểm)</span></li>`).join('');
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(officeExam.content.title)}</title>
      <style>@page{size:A4;margin:2cm 2cm 2cm 2.5cm}body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.3;color:#111}h1,h2{font-family:Arial,sans-serif}h1{font-size:20pt;color:#294fb5}h2{font-size:15pt;margin-top:24pt}li{margin:6pt 0}hr{border:0;border-top:1px dashed #888;margin:24pt 0}.starter p{margin:7pt 0}</style></head>
      <body><h1>ITC · CÂU LẠC BỘ TIN HỌC</h1><p>Trường Đại học Lâm nghiệp · Phân hiệu Đồng Nai</p>
      <h2>ĐỀ THỰC HÀNH WORD · FORM ${officeExam.formNumber}</h2><h3>${escapeHtml(officeExam.content.title)}</h3>
      <p>Thời gian gợi ý: ${officeExam.duration} phút. Tạo bản sao nội dung bên dưới, sau đó thực hiện các yêu cầu định dạng.</p><ol>${instructions}</ol>
      <hr><section class="starter">${paragraphs}</section></body></html>`;
  }

  function makePowerPointOutline() {
    return officeExam.content.slides.map(slide => [
      slide.title,
      ...slide.bullets.map(bullet => `\t${bullet}`)
    ].join('\r\n')).join('\r\n');
  }

  function downloadOfficeExercise(appKind) {
    if (!officeExam || officeExam.appKind !== appKind) return;
    const filename = appKind === 'word'
      ? `ITC_De-thuc-hanh-Word_Form-${officeExam.formNumber}.html`
      : `ITC_De-thuc-hanh-PowerPoint_Form-${officeExam.formNumber}.txt`;
    const content = appKind === 'word' ? makeWordExerciseHtml() : makePowerPointOutline();
    const mimeType = appKind === 'word' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8';
    try {
      const blob = new Blob(['\\uFEFF', content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify(`Đã tải bài thực hành ${appKind === 'word' ? 'Word' : 'PowerPoint'}.`);
    } catch (error) {
      notify(`Không thể tạo tệp thực hành: ${error.message}`, true);
    }
  }

  function startOfficeExercise(appKind, templateId) {
    const templates = getOfficeTemplates(appKind);
    const template = templateId === 'random'
      ? templates[randomInt(0, templates.length - 1)]
      : templates.find(item => item.id === templateId);
    if (!template) {
      notify('Không tìm thấy dạng bài thực hành đã chọn.', true);
      return;
    }
    try {
      officeExam = {
        appKind,
        templateId: template.id,
        formNumber: randomInt(100, 999),
        duration: template.duration,
        content: template.make(),
        checks: template.rubric.map(() => false),
        completed: false
      };
    } catch (error) {
      notify(`Không thể tạo đề thực hành: ${error.message}`, true);
      return;
    }
    currentView = appKind === 'word' ? 'word-practical' : 'powerpoint-practical';
    renderOfficePracticalPage(appKind);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveOfficeResult() {
    if (!officeExam || officeExam.completed) return;
    const score = officeScore();
    const attempt = {
      id: `${Date.now()}-${officeExam.formNumber}`,
      appKind: officeExam.appKind,
      templateId: officeExam.templateId,
      formNumber: officeExam.formNumber,
      earned: score.earned,
      maxPoints: score.maxPoints,
      date: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
    };
    const previousHistory = progress.practicalHistory;
    progress.practicalHistory = [attempt, ...previousHistory].slice(0, PRACTICAL_HISTORY_LIMIT);
    try {
      persistProgress();
      officeExam.completed = true;
      renderOfficePracticalPage(officeExam.appKind);
      notify(`Đã lưu kết quả tự chấm: ${score.earned}/${score.maxPoints} điểm.`);
    } catch (error) {
      progress.practicalHistory = previousHistory;
      notify(error.message || 'Không thể lưu kết quả bài thực hành.', true);
    }
  }

  function downloadPracticalCsv() {
    if (!practicalExam) return;
    const template = window.CDR_PRACTICAL_TEMPLATES.find(item => item.id === practicalExam.templateId);
    const filename = `ITC_De-thuc-hanh-${template.id}_Form-${practicalExam.formNumber}.csv`;
    try {
      const blob = new Blob([practicalCsv(practicalExam.sections)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Đã tải bộ dữ liệu bài thực hành.');
    } catch (error) {
      notify(`Không thể tạo tệp CSV: ${error.message}`, true);
    }
  }

  function savePracticalResult() {
    if (!practicalExam || practicalExam.completed) return;
    const score = practicalScore();
    const attempt = {
      id: practicalExam.id,
    appKind: 'excel',
    templateId: practicalExam.templateId,
      formNumber: practicalExam.formNumber,
      earned: score.earned,
      maxPoints: score.maxPoints,
      date: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
    };
    const previousHistory = progress.practicalHistory;
    progress.practicalHistory = [attempt, ...previousHistory].slice(0, PRACTICAL_HISTORY_LIMIT);
    try {
      persistProgress();
      practicalExam.completed = true;
      renderPracticalPage();
      notify(`Đã lưu kết quả tự chấm: ${score.earned}/${score.maxPoints} điểm.`);
    } catch (error) {
      progress.practicalHistory = previousHistory;
      notify(error.message || 'Không thể lưu kết quả bài thực hành.', true);
    }
  }

  function renderTipsPage() {
    document.getElementById('breadcrumb-current').textContent = 'Học mẹo';
    const filtered = window.CDR_QUESTIONS.filter(question => {
      if (selectedTopic && question.topic !== selectedTopic) return false;
      const term = searchInput.value.trim().toLocaleLowerCase('vi');
      if (!term) return true;
      return `${question.question} ${question.answers[question.correctIndex]} ${topicForQuestion(question).name}`
        .toLocaleLowerCase('vi').includes(term);
    });
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, pageCount);
    const pageQuestions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const cards = pageQuestions.map(question => `<article class="card tip-card">
      <div class="question-head">
        <span class="question-number">${question.id}</span>
        <div class="question-title-wrap"><span class="question-topic">${escapeHtml(topicForQuestion(question).name)}</span>
          <h2 class="question-title">${escapeHtml(question.question)}</h2></div>
      </div>
      <div class="answer-option is-correct tip-answer">
        <span class="answer-letter">${'ABCD'[question.correctIndex]}.</span>
        <span>${escapeHtml(question.answers[question.correctIndex])}</span>
        <strong class="correct-label">ĐÁP ÁN ĐÚNG</strong>
      </div>
    </article>`).join('');
    pageContent.innerHTML = `<section class="welcome-line">
        <div><p class="eyebrow">GHI NHỚ NHANH</p><h1>Học mẹo: chỉ xem đáp án đúng</h1>
        <p>Lướt nhanh 285 câu cùng đáp án đúng, không cần xem các phương án nhiễu.</p></div>
      </section>
      <div class="answer-source-note"><span>★</span> Đáp án đúng được tô vàng theo tài liệu gốc. Theo xác nhận bổ sung của bạn: câu 48 chọn B, câu 263 chọn D.</div>
      <div class="question-toolbar">
        <span class="question-total">Hiển thị ${filtered.length} câu</span>
        <select id="tips-topic-filter" class="filter-select" aria-label="Lọc mẹo theo chủ đề">
          <option value="" ${selectedTopic ? '' : 'selected'}>Tất cả chủ đề</option>
          ${topics.map(topic => `<option value="${topic.id}" ${selectedTopic === topic.id ? 'selected' : ''}>${escapeHtml(topic.name)}</option>`).join('')}
        </select>
      </div>
      <section class="question-list">${cards || '<div class="card empty-state"><strong>Không tìm thấy câu hỏi</strong>Thử từ khóa khác để tìm đáp án đúng.</div>'}</section>
      ${filtered.length > PAGE_SIZE ? `<nav class="pagination" aria-label="Phân trang đáp án đúng">
        <button class="page-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Trang trước">‹</button>
        <span>Trang ${currentPage} / ${pageCount}</span>
        <button class="page-button" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''} aria-label="Trang sau">›</button>
      </nav>` : ''}`;
    document.getElementById('tips-topic-filter').addEventListener('change', event => {
      selectedTopic = event.target.value || null;
      currentPage = 1;
      renderTipsPage();
    });
  }

  function filteredQuestions() {
    let result = window.CDR_QUESTIONS;
    if (selectedTopic) result = result.filter(question => question.topic === selectedTopic);
    if (questionFilter === 'learned') result = result.filter(question => progress.learned.includes(question.id));
    if (questionFilter === 'unlearned') result = result.filter(question => !progress.learned.includes(question.id));
    if (questionFilter === 'saved') result = result.filter(question => progress.saved.includes(question.id));
    const term = searchInput.value.trim().toLocaleLowerCase('vi');
    if (term) {
      result = result.filter(question => {
        const searchable = `${question.question} ${question.answers.join(' ')} ${topicForQuestion(question).name}`;
        return searchable.toLocaleLowerCase('vi').includes(term);
      });
    }
    return result;
  }

  function renderQuestionPage() {
    const topic = topics.find(item => item.id === selectedTopic);
    const title = topic ? topic.name : 'Tất cả câu hỏi';
    document.getElementById('breadcrumb-current').textContent = title;
    const filtered = filteredQuestions();
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, pageCount);
    const pageQuestions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const cards = pageQuestions.map(renderQuestionCard).join('');
    const emptyText = searchInput.value.trim()
      ? 'Thử từ khóa khác để tìm câu hỏi phù hợp.'
      : 'Không có câu hỏi nào trong bộ lọc này.';
    pageContent.innerHTML = `<section class="welcome-line">
        <div><p class="eyebrow">${topic ? 'CHỦ ĐỀ ÔN TẬP' : 'NGÂN HÀNG CÂU HỎI'}</p><h1>${escapeHtml(title)}</h1>
        <p>${topic ? `Đã học ${countLearned(topic.id)} / ${countTopicQuestions(topic.id)} câu trong chủ đề.` : `Đầy đủ ${window.CDR_QUESTIONS.length} câu hỏi được chia theo ${topics.length} chủ đề.`}</p></div>
      </section>
      <div class="question-toolbar">
        <label class="filter-select-label"><span class="question-total">Hiển thị ${filtered.length} câu hỏi</span></label>
        <select id="question-filter" class="filter-select" aria-label="Lọc câu hỏi">
          <option value="all" ${questionFilter === 'all' ? 'selected' : ''}>Tất cả câu hỏi</option>
          <option value="unlearned" ${questionFilter === 'unlearned' ? 'selected' : ''}>Chưa đánh dấu đã học</option>
          <option value="learned" ${questionFilter === 'learned' ? 'selected' : ''}>Đã học</option>
          <option value="saved" ${questionFilter === 'saved' ? 'selected' : ''}>Đã lưu xem lại</option>
        </select>
      </div>
      <section class="question-list">${cards || `<div class="card empty-state"><strong>Chưa tìm thấy câu hỏi</strong>${emptyText}</div>`}</section>
      ${filtered.length > PAGE_SIZE ? `<nav class="pagination" aria-label="Phân trang câu hỏi">
        <button class="page-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Trang trước">‹</button>
        <span>Trang ${currentPage} / ${pageCount}</span>
        <button class="page-button" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''} aria-label="Trang sau">›</button>
      </nav>` : ''}`;
    const filterSelect = document.getElementById('question-filter');
    filterSelect.addEventListener('change', () => {
      questionFilter = filterSelect.value;
      currentPage = 1;
      renderQuestionPage();
    });
  }

  function renderQuestionCard(question) {
    const learned = progress.learned.includes(question.id);
    const saved = progress.saved.includes(question.id);
    const topic = topicForQuestion(question);
    return `<article class="card question-card" id="question-${question.id}">
      <div class="question-head">
        <span class="question-number">${question.id}</span>
        <div class="question-title-wrap"><span class="question-topic">${escapeHtml(topic.name)}</span><h2 class="question-title">${escapeHtml(question.question)}</h2></div>
        <div class="question-actions">
          <button class="question-action ${saved ? 'is-selected' : ''}" data-action="save" data-id="${question.id}" aria-label="${saved ? 'Bỏ lưu' : 'Lưu câu hỏi'}" title="${saved ? 'Bỏ lưu' : 'Lưu để xem lại'}">${saved ? '★' : '☆'}</button>
          <button class="question-action ${learned ? 'is-learned' : ''}" data-action="learn" data-id="${question.id}" aria-label="${learned ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học'}" title="${learned ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học'}">${learned ? '✓' : '○'}</button>
        </div>
      </div>
      <div class="answer-list">${question.answers.map((answer, index) => `<div class="answer-option ${index === question.correctIndex ? 'is-correct' : ''}"><span class="answer-letter">${'ABCD'[index]}.</span><span>${escapeHtml(answer)}</span>${index === question.correctIndex ? '<strong class="correct-label">ĐÚNG</strong>' : ''}</div>`).join('')}</div>
      <div class="question-footer"><button class="mark-button ${learned ? 'is-learned' : ''}" data-action="learn" data-id="${question.id}">${learned ? '✓ Đã đánh dấu đã học' : 'Đánh dấu đã học'}</button></div>
    </article>`;
  }

  function renderExamPage() {
    document.getElementById('breadcrumb-current').textContent = 'Thi thử 30 câu';
    if (!exam) {
      pageContent.innerHTML = `<section class="welcome-line">
          <div><p class="eyebrow">KIỂM TRA KIẾN THỨC</p><h1>Thi thử 30 câu</h1>
          <p>Đề thi trộn ngẫu nhiên từ toàn bộ câu hỏi. Đáp án chỉ hiện sau khi nộp bài.</p></div>
        </section>
        <article class="card exam-intro-card">
          <span class="exam-hero-icon">✎</span>
          <h2>Sẵn sàng thử sức?</h2>
          <p>Đề gồm 30 câu được chọn ngẫu nhiên, mỗi câu có 4 lựa chọn. Bạn có thể nộp bài bất cứ lúc nào để xem điểm và đáp án đúng.</p>
          <ul><li>30 câu hỏi ngẫu nhiên, không lặp trong cùng đề</li><li>Chấm điểm tự động và xem lại đáp án</li><li>Không tính vào tiến độ học cá nhân</li></ul>
          <button class="button button-primary" data-start-exam>Bắt đầu thi thử →</button>
        </article>`;
      return;
    }

    const examQuestions = exam.questions.map(id => window.CDR_QUESTIONS.find(question => question.id === id));
    const answeredCount = Object.keys(exam.answers).length;
    const correctCount = examQuestions.filter(question => exam.answers[question.id] === question.correctIndex).length;
    const review = examQuestions.map((question, index) => renderExamQuestion(question, index + 1)).join('');
    const status = exam.submitted
      ? `<div class="exam-result ${correctCount >= 21 ? 'is-pass' : 'is-retry'}">
          <span class="exam-result-score">${correctCount}<small> / 30</small></span>
          <div><strong>${correctCount >= 21 ? 'Làm tốt lắm!' : 'Cùng ôn lại nhé!'}</strong>
          <p>Bạn trả lời đúng ${correctCount} câu, đạt ${Math.round(correctCount / 30 * 100)}%.</p></div>
        </div>`
      : `<div class="exam-progress">
          <span id="exam-answered">${answeredCount}</span> / 30 câu đã chọn
          <span class="exam-progress-track"><span style="width:${answeredCount / 30 * 100}%"></span></span>
        </div>`;
    pageContent.innerHTML = `<section class="welcome-line">
        <div><p class="eyebrow">${exam.submitted ? 'KẾT QUẢ BÀI THI' : 'ĐỀ THI NGẪU NHIÊN'}</p><h1>${exam.submitted ? 'Kết quả thi thử' : 'Thi thử 30 câu'}</h1>
          <p>${exam.submitted ? 'Xem lại các câu đã làm và đáp án đúng.' : 'Chọn một đáp án cho mỗi câu rồi nộp bài để xem điểm.'}</p></div>
      </section>
      <section class="card exam-status-card">${status}
        ${exam.submitted
          ? '<button class="button button-primary" data-start-exam>Làm đề mới →</button>'
          : '<button class="button button-primary" data-submit-exam>Nộp bài →</button>'}
      </section>
      <section class="question-list exam-question-list">${review}</section>
      ${exam.submitted ? '<div class="exam-bottom-action"><button class="button button-primary" data-start-exam>Làm đề mới →</button></div>' : ''}`;
  }

  function renderExamQuestion(question, number) {
    const selected = exam.answers[question.id];
    return `<article class="card exam-question-card" id="exam-question-${question.id}">
      <div class="exam-question-heading"><span class="question-number">${number}</span><span class="question-topic">${escapeHtml(topicForQuestion(question).name)} · Câu ${question.id} trong bộ đề</span></div>
      <h2 class="question-title">${escapeHtml(question.question)}</h2>
      <div class="exam-options">${question.answers.map((answer, index) => {
        const isSelected = selected === index;
        const classes = ['exam-option'];
        if (isSelected) classes.push('is-selected');
        if (exam.submitted && index === question.correctIndex) classes.push('is-correct');
        if (exam.submitted && isSelected && index !== question.correctIndex) classes.push('is-wrong');
        return `<button class="${classes.join(' ')}" data-exam-answer data-id="${question.id}" data-answer="${index}" ${exam.submitted ? 'disabled' : ''}>
          <span class="answer-letter">${'ABCD'[index]}.</span><span>${escapeHtml(answer)}</span>
          ${exam.submitted && index === question.correctIndex ? '<strong class="correct-label">ĐÁP ÁN ĐÚNG</strong>' : ''}
          ${exam.submitted && isSelected && index !== question.correctIndex ? '<strong class="wrong-label">BẠN CHỌN</strong>' : ''}
        </button>`;
      }).join('')}</div>
    </article>`;
  }

  function startExam() {
    const shuffled = [...window.CDR_QUESTIONS];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    exam = { questions: shuffled.slice(0, 30).map(question => question.id), answers: {}, submitted: false };
    renderExamPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openQuestion(id) {
    const question = window.CDR_QUESTIONS.find(item => item.id === Number(id));
    if (!question) return;
    selectedTopic = question.topic;
    currentView = 'topic';
    questionFilter = 'all';
    searchInput.value = '';
    const topicQuestions = window.CDR_QUESTIONS.filter(item => item.topic === question.topic);
    const index = topicQuestions.findIndex(item => item.id === question.id);
    currentPage = Math.floor(index / PAGE_SIZE) + 1;
    document.querySelectorAll('.primary-nav [data-view]').forEach(button => button.classList.remove('is-active'));
    renderTopicNav();
    renderQuestionPage();
    document.getElementById('sidebar').classList.remove('is-open');
    window.setTimeout(() => document.getElementById(`question-${question.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name')).trim();
    const email = normalizeEmail(String(formData.get('email')));
    const password = String(formData.get('password'));
    try {
      if (password.length < 8) throw new Error('Mật khẩu cần có ít nhất 8 ký tự.');
      const accounts = getAccounts();
      if (accounts.some(user => user.email === email)) throw new Error('Email này đã có tài khoản trên trình duyệt.');
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const hash = await passwordHash(password, salt);
      const user = { name, email, salt, hash };
      accounts.push(user);
      writeJson(ACCOUNT_KEY, accounts);
      setAuthenticatedUser(user);
      notify('Tài khoản đã được tạo. Chúc bạn học tốt!');
    } catch (error) {
      notify(error.message || 'Không thể tạo tài khoản. Vui lòng thử lại.', true);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = normalizeEmail(String(formData.get('email')));
    const password = String(formData.get('password'));
    try {
      const user = getAccounts().find(item => item.email === email);
      if (!user) throw new Error('Email hoặc mật khẩu chưa chính xác.');
      const hash = await passwordHash(password, user.salt);
      if (hash !== user.hash) throw new Error('Email hoặc mật khẩu chưa chính xác.');
      setAuthenticatedUser(user);
      notify(`Chào mừng trở lại, ${user.name}!`);
    } catch (error) {
      notify(error.message || 'Không thể đăng nhập. Vui lòng thử lại.', true);
    }
  }

  function handleGuestAccess() {
    try {
      setAuthenticatedUser({ name: 'Khách', email: GUEST_SESSION });
      notify('Bạn đang học với tài khoản khách. Tiến độ được lưu trên trình duyệt này.');
    } catch (error) {
      notify(error.message || 'Không thể mở không gian học.', true);
    }
  }

  function toggleProgress(action, id) {
    const numberId = Number(id);
    if (!window.CDR_QUESTIONS.some(question => question.id === numberId)) return;
    const previousProgress = {
      learned: [...progress.learned],
      saved: [...progress.saved],
      recent: [...progress.recent],
      practicalHistory: [...progress.practicalHistory]
    };
    const list = action === 'learn' ? progress.learned : progress.saved;
    const index = list.indexOf(numberId);
    if (index >= 0) list.splice(index, 1);
    else {
      list.push(numberId);
      if (action === 'learn') progress.recent = [numberId, ...progress.recent.filter(item => item !== numberId)].slice(0, 20);
    }
    try {
      persistProgress();
      renderTopicNav();
      if (currentView === 'home') renderPage();
      else if (currentView === 'practice') renderPracticePage();
      else renderQuestionPage();
      notify(action === 'learn'
        ? (index >= 0 ? 'Đã bỏ đánh dấu câu hỏi.' : 'Đã lưu câu hỏi vào tiến độ học.')
        : (index >= 0 ? 'Đã bỏ câu hỏi khỏi danh sách đã lưu.' : 'Đã lưu câu hỏi để xem lại.'));
    } catch (error) {
      progress = previousProgress;
      notify(error.message || 'Không thể lưu tiến độ học.', true);
    }
  }

  document.querySelectorAll('[data-auth-switch]').forEach(button => {
    button.addEventListener('click', () => showAuthForm(button.dataset.authSwitch));
  });
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('guest-button').addEventListener('click', handleGuestAccess);
  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    account = null;
    progress = { learned: [], saved: [], recent: [], practicalHistory: [] };
    currentView = 'home';
    selectedTopic = null;
    questionFilter = 'all';
    currentPage = 1;
    studySession = null;
    studyTopicFilter = '';
    exam = null;
    practicalExam = null;
    practicalTemplateFilter = 'random';
    officeExam = null;
    officeTemplateFilters = { word: 'random', powerpoint: 'random' };
    searchInput.value = '';
    appView.classList.add('is-hidden');
    authView.classList.remove('is-hidden');
    showAuthForm('login');
    notify('Bạn đã đăng xuất.');
  });
  document.getElementById('topic-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-topic]');
    if (button) setView('topic', button.dataset.topic);
  });
  document.querySelector('.primary-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-view]');
    if (button) setView(button.dataset.view);
  });
  pageContent.addEventListener('click', event => {
    const studyAnswer = event.target.closest('[data-study-answer]');
    if (studyAnswer && studySession && studySession.selectedIndex === null) {
      studySession.selectedIndex = Number(studyAnswer.dataset.answer);
      renderPracticePage();
      return;
    }
    if (event.target.closest('[data-start-study]')) {
      startStudySession(studyTopicFilter);
      return;
    }
    if (event.target.closest('[data-next-study]')) {
      studySession.index += 1;
      studySession.selectedIndex = null;
      renderPracticePage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const markStudyButton = event.target.closest('[data-mark-study-learned]');
    if (markStudyButton) {
      toggleProgress('learn', markStudyButton.dataset.markStudyLearned);
      return;
    }
    if (event.target.closest('[data-finish-study]')) {
      studySession = null;
      renderPracticePage();
      return;
    }
    const studyTopicButton = event.target.closest('[data-study-topic]');
    if (studyTopicButton) {
      studyTopicFilter = studyTopicButton.dataset.studyTopic;
      startStudySession(studyTopicFilter);
      return;
    }
    const openTopicButton = event.target.closest('[data-open-topic-button]');
    if (openTopicButton) {
      setView('topic', openTopicButton.dataset.openTopicButton);
      return;
    }
    if (event.target.closest('[data-start-practical]')) {
      startPracticalExam(practicalTemplateFilter);
      return;
    }
    const startOfficeButton = event.target.closest('[data-start-office]');
    if (startOfficeButton) {
      const appKind = startOfficeButton.dataset.startOffice;
      startOfficeExercise(appKind, officeTemplateFilters[appKind]);
      return;
    }
    const downloadOfficeButton = event.target.closest('[data-download-office]');
    if (downloadOfficeButton) {
      downloadOfficeExercise(downloadOfficeButton.dataset.downloadOffice);
      return;
    }
    if (event.target.closest('[data-finish-office]')) {
      saveOfficeResult();
      return;
    }
    const newOfficeButton = event.target.closest('[data-new-office]');
    if (newOfficeButton) {
      if (!officeExam.completed && !window.confirm('Đề hiện tại chưa lưu kết quả tự chấm. Bạn vẫn muốn tạo đề mới?')) return;
      officeExam = null;
      renderOfficePracticalPage(newOfficeButton.dataset.newOffice);
      return;
    }
    if (event.target.closest('[data-download-practical]')) {
      downloadPracticalCsv();
      return;
    }
    if (event.target.closest('[data-finish-practical]')) {
      savePracticalResult();
      return;
    }
    if (event.target.closest('[data-new-practical]')) {
      if (!practicalExam.completed && !window.confirm('Đề hiện tại chưa lưu kết quả tự chấm. Bạn vẫn muốn tạo đề mới?')) return;
      practicalExam = null;
      renderPracticalPage();
      return;
    }
    const examAnswer = event.target.closest('[data-exam-answer]');
    if (examAnswer && exam && !exam.submitted) {
      const questionId = Number(examAnswer.dataset.id);
      exam.answers[questionId] = Number(examAnswer.dataset.answer);
      pageContent.querySelectorAll(`[data-exam-answer][data-id="${questionId}"]`).forEach(button => {
        button.classList.toggle('is-selected', button === examAnswer);
      });
      document.getElementById('exam-answered').textContent = Object.keys(exam.answers).length;
      const progressFill = pageContent.querySelector('.exam-progress-track span');
      progressFill.style.width = `${Object.keys(exam.answers).length / 30 * 100}%`;
      return;
    }
    if (event.target.closest('[data-start-exam]')) {
      startExam();
      return;
    }
    if (event.target.closest('[data-submit-exam]')) {
      exam.submitted = true;
      const unanswered = exam.questions.length - Object.keys(exam.answers).length;
      renderExamPage();
      if (unanswered) notify(`Đã nộp bài. ${unanswered} câu chưa trả lời được tính là sai.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action) {
      toggleProgress(action.dataset.action, action.dataset.id);
      return;
    }
    const topicCard = event.target.closest('[data-open-topic]');
    if (topicCard) {
      setView('topic', topicCard.dataset.openTopic);
      return;
    }
    const continueButton = event.target.closest('[data-continue]');
    if (continueButton) {
      openQuestion(continueButton.dataset.continue);
      return;
    }
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      setView(viewButton.dataset.view);
      return;
    }
    const pageButton = event.target.closest('[data-page]');
    if (pageButton && !pageButton.disabled) {
      currentPage = Number(pageButton.dataset.page);
      if (currentView === 'tips') renderTipsPage();
      else renderQuestionPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  pageContent.addEventListener('change', event => {
    const officeCheckbox = event.target.closest('[data-office-check]');
    if (officeCheckbox && officeExam && !officeExam.completed) {
      officeExam.checks[Number(officeCheckbox.dataset.officeCheck)] = officeCheckbox.checked;
      renderOfficePracticalPage(officeExam.appKind);
      return;
    }
    const checkbox = event.target.closest('[data-practical-check]');
    if (!checkbox || !practicalExam || practicalExam.completed) return;
    practicalExam.checks[Number(checkbox.dataset.practicalCheck)] = checkbox.checked;
    renderPracticalPage();
  });
  pageContent.addEventListener('keydown', event => {
    const topicCard = event.target.closest('[data-open-topic]');
    if (topicCard && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setView('topic', topicCard.dataset.openTopic);
    }
  });
  searchInput.addEventListener('input', () => {
    if (!account) return;
    if (['home', 'topics', 'exam', 'practice', 'practical'].includes(currentView)) {
      currentView = 'questions';
      selectedTopic = null;
      document.querySelectorAll('.primary-nav [data-view]').forEach(button => button.classList.toggle('is-active', button.dataset.view === 'questions'));
      renderTopicNav();
    }
    currentPage = 1;
    if (currentView === 'tips') renderTipsPage();
    else renderQuestionPage();
  });
  document.getElementById('menu-button').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('is-open');
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchInput.focus();
    }
  });

  try {
    if (!Array.isArray(window.CDR_QUESTIONS) || window.CDR_QUESTIONS.length !== 285) {
      throw new Error('Bộ câu hỏi chưa tải đủ 285 câu. Hãy kiểm tra tệp questions.js.');
    }
    if (!Array.isArray(window.CDR_PRACTICAL_TEMPLATES) || window.CDR_PRACTICAL_TEMPLATES.length !== 4) {
      throw new Error('Không tải đủ 4 dạng đề thực hành. Hãy kiểm tra tệp practical.js.');
    }
    const currentEmail = localStorage.getItem(SESSION_KEY);
    if (currentEmail === GUEST_SESSION) {
      setAuthenticatedUser({ name: 'Khách', email: GUEST_SESSION });
    } else if (currentEmail) {
      const existing = getAccounts().find(user => user.email === currentEmail);
      if (existing) setAuthenticatedUser(existing);
      else localStorage.removeItem(SESSION_KEY);
    }
  } catch (error) {
    notify(error.message || 'Không thể khởi tạo ứng dụng.', true);
  }
})();
