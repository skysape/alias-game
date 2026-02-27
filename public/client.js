const socket = io();

let myId = null;
let myNick = '';
let isHost = false;
let state = null;
let timerInterval = null;
let renameTargetTeamId = null;
let reviewResults = {};

const $ = id => document.getElementById(id);

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
}

// ===== REGISTER =====
$('join-btn').addEventListener('click', () => {
  const nick = $('nick-input').value.trim();
  if (!nick) return showError('register-error', 'Введите ник');
  clearError('register-error');
  socket.emit('register', { nick });
});
$('nick-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('join-btn').click(); });

// ===== TOPBAR =====
$('profile-btn').addEventListener('click', () => {
  $('new-nick-input').value = myNick;
  clearError('nick-change-error');
  openModal('modal-profile');
});
$('settings-btn').addEventListener('click', () => openSettingsModal());
$('g-settings-btn').addEventListener('click', () => openRulesModal());

// ===== CREATE TEAM =====
$('create-team-btn').addEventListener('click', () => openModal('modal-create-team'));
$('modal-create-cancel').addEventListener('click', () => closeModal());
$('modal-create-confirm').addEventListener('click', () => {
  const name = $('team-name-input').value.trim();
  if (!name) return showError('create-team-error', 'Введите название');
  clearError('create-team-error');
  socket.emit('create_team', { name });
});
$('team-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('modal-create-confirm').click(); });

// ===== RENAME TEAM =====
$('modal-rename-cancel').addEventListener('click', () => closeModal());
$('modal-rename-confirm').addEventListener('click', () => {
  const name = $('rename-input').value.trim();
  if (!name) return showError('rename-error', 'Введите название');
  clearError('rename-error');
  socket.emit('rename_team', { teamId: renameTargetTeamId, name });
});
$('rename-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('modal-rename-confirm').click(); });

// ===== PROFILE =====
$('modal-profile-close').addEventListener('click', () => closeModal());
$('modal-profile-save').addEventListener('click', () => {
  const nick = $('new-nick-input').value.trim();
  if (!nick) return showError('nick-change-error', 'Введите ник');
  if (nick.length < 2 || nick.length > 20) return showError('nick-change-error', 'Ник: от 2 до 20 символов');
  socket.emit('rename_nick', { nick });
});
$('new-nick-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('modal-profile-save').click(); });

socket.on('nick_changed', ({ nick }) => {
  myNick = nick;
  $('topbar-nick').textContent = nick;
  $('profile-nick-display').textContent = nick;
  showError('nick-change-error', '✓ Готово!');
  setTimeout(() => closeModal(), 900);
});

// ===== SETTINGS =====
$('modal-settings-close').addEventListener('click', () => closeModal());
$('modal-settings-save').addEventListener('click', () => {
  if (!isHost || (state && state.gameState !== 'lobby')) { closeModal(); return; }
  const dur = parseInt($('setting-duration').value);
  const words = parseInt($('setting-words').value);
  const diff = document.querySelector('.diff-btn.active[data-diff]')?.dataset.diff;
  if (!dur || dur < 10 || dur > 300) return showError('settings-error', 'Длительность: 10–300 секунд');
  if (!words || words < 5 || words > 100) return showError('settings-error', 'Слов для победы: 5–100');
  socket.emit('update_settings', { roundDuration: dur, wordsToWin: words, difficulty: diff });
  closeModal();
});
document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!isHost || (state && state.gameState !== 'lobby')) return;
    document.querySelectorAll('.diff-btn[data-diff]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
$('theme-dark').addEventListener('click', () => {
  document.body.classList.remove('light');
  $('theme-dark').classList.add('active');
  $('theme-light').classList.remove('active');
});
$('theme-light').addEventListener('click', () => {
  document.body.classList.add('light');
  $('theme-light').classList.add('active');
  $('theme-dark').classList.remove('active');
});

// ===== COLOR PALETTE =====
function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent2', color);
  document.querySelectorAll('.color-preset').forEach(p => p.classList.toggle('active', p.dataset.color === color));
  $('custom-color-picker').value = color;
  try { localStorage.setItem('alias-accent', color); } catch(e) {}
}
document.querySelectorAll('.color-preset').forEach(p => p.addEventListener('click', () => applyAccentColor(p.dataset.color)));
$('custom-color-picker').addEventListener('input', e => {
  applyAccentColor(e.target.value);
  document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
});
try { const c = localStorage.getItem('alias-accent'); if (c) applyAccentColor(c); } catch(e) {}

// ===== GAME BUTTONS =====
$('modal-rules-close').addEventListener('click', () => closeModal());
$('start-game-btn').addEventListener('click', () => { clearError('start-error'); socket.emit('start_game'); });
$('ready-btn').addEventListener('click', () => {
  socket.emit('player_ready');
  $('ready-btn').disabled = true;
  $('ready-btn').textContent = '✓ Готов!';
});
$('explainer-start-btn').addEventListener('click', () => socket.emit('explainer_start'));
$('next-word-btn').addEventListener('click', () => socket.emit('next_word'));
$('submit-review-btn').addEventListener('click', () => socket.emit('submit_review', { results: reviewResults }));
$('restart-btn').addEventListener('click', () => socket.emit('restart_game'));

// ===== SOCKET =====
socket.on('registered', ({ id, isHost: host }) => {
  myId = id;
  isHost = host;
  myNick = $('nick-input').value.trim();
  $('topbar-nick').textContent = myNick;
  $('profile-nick-display').textContent = myNick;
  if (host) $('host-badge').classList.remove('hidden');
  showScreen('lobby');
});

socket.on('error_msg', (msg) => {
  const overlay = $('modal-overlay');
  if (!overlay.classList.contains('hidden')) {
    let shown = false;
    ['create-team-error','rename-error','settings-error','nick-change-error'].forEach(id => {
      if (shown) return;
      const el = $(id);
      if (!el) return;
      const modal = el.closest('.modal');
      if (modal && !modal.classList.contains('hidden')) { showError(id, msg); shown = true; }
    });
  } else {
    showError('start-error', msg);
  }
});

socket.on('current_word', (word) => {
  const el = $('current-word-display');
  if (!el) return;
  el.classList.remove('blur-word');
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; el.textContent = word; });
});

socket.on('kicked', () => location.reload());

socket.on('state', (s) => {
  state = s;
  if (state.players[myId]) {
    isHost = state.players[myId].isHost;
    // Фикс смены ника: всегда синхронизируем из сервера
    const serverNick = state.players[myId].nick;
    if (serverNick && serverNick !== myNick) {
      myNick = serverNick;
      $('topbar-nick').textContent = myNick;
      $('profile-nick-display').textContent = myNick;
    }
  }
  updateHostBadge();

  if (state.gameState === 'lobby') { showScreen('lobby'); renderLobby(); }
  else if (state.gameState === 'playing') { showScreen('game'); renderGame(); }
  else if (state.gameState === 'game_over') { showScreen('winner'); renderWinner(); }

  // Закрываем модалки после успешных действий
  if (state.gameState === 'lobby') {
    const myTeam = getMyTeam();
    const cm = $('modal-create-team');
    if (cm && !cm.classList.contains('hidden') && myTeam) closeModal();
    const rm = $('modal-rename');
    if (rm && !rm.classList.contains('hidden')) closeModal();
  }
});

// ===== LOBBY =====
function renderLobby() {
  // Синхронизируем ник из стейта
  const me = state.players[myId];
  if (me) { myNick = me.nick; $('topbar-nick').textContent = myNick; }

  if (isHost) {
    $('host-badge').classList.remove('hidden');
    $('host-controls').classList.remove('hidden');
  } else {
    $('host-badge').classList.add('hidden');
    $('host-controls').classList.add('hidden');
  }

  // Команды — используем teamsOrder с сервера для консистентного порядка
  const teamsEl = $('teams-list');
  teamsEl.innerHTML = '';
  const order = state.teamsOrder || Object.keys(state.teams);
  if (order.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text2);font-size:0.85rem;padding:12px 0';
    empty.textContent = 'Нет команд. Создайте первую!';
    teamsEl.appendChild(empty);
  } else {
    order.forEach(teamId => {
      const team = state.teams[teamId];
      if (team) renderTeamCard(team, teamsEl);
    });
  }

  // Наблюдатели
  const obsEl = $('observers-list');
  obsEl.innerHTML = '';
  state.observers.forEach(pid => {
    const p = state.players[pid];
    if (!p) return;
    const div = document.createElement('div');
    div.className = 'observer-item' + (pid === myId ? ' is-me' : '');
    div.innerHTML = `<span>${p.nick}${p.isHost ? ' 👑' : ''}</span>`;
    if (isHost && pid !== myId) {
      const kb = document.createElement('button');
      kb.className = 'btn-danger btn-sm'; kb.textContent = 'Кик';
      kb.addEventListener('click', () => socket.emit('kick_player', { targetId: pid }));
      div.appendChild(kb);
      const hb = document.createElement('button');
      hb.className = 'btn-ghost btn-sm'; hb.textContent = '→ Хост';
      hb.addEventListener('click', () => socket.emit('transfer_host', { targetId: pid }));
      div.appendChild(hb);
    }
    obsEl.appendChild(div);
  });
}

function renderTeamCard(team, container) {
  // Проверяем напрямую по массиву players — надёжнее чем getMyTeam()
  const isMine = team.players.includes(myId);
  // Я в какой-то команде вообще?
  const amInAnyTeam = Object.values(state.teams).some(t => t.players.includes(myId));
  const isCreator = team.creatorId === myId;
  const isFull = team.players.length >= 2;
  // Вступить: только если я не в команде И команда не полная
  const canJoin = !amInAnyTeam && !isFull;

  const card = document.createElement('div');
  card.className = 'team-card' + (isFull ? ' team-full' : '');

  const header = document.createElement('div');
  header.className = 'team-card-header';

  const nameEl = document.createElement('div');
  nameEl.className = 'team-name-display';
  nameEl.textContent = team.name;

  const btns = document.createElement('div');
  btns.className = 'team-card-btns';

  // Переименовать — только создатель
  if (isCreator) {
    const renBtn = document.createElement('button');
    renBtn.className = 'btn-ghost btn-sm';
    renBtn.textContent = '✏';
    renBtn.title = 'Переименовать';
    renBtn.addEventListener('click', () => {
      renameTargetTeamId = team.id;
      $('rename-input').value = team.name;
      clearError('rename-error');
      openModal('modal-rename');
    });
    btns.appendChild(renBtn);
  }

  // Выйти из своей / Вступить в чужую
  if (isMine) {
    const leaveBtn = document.createElement('button');
    leaveBtn.className = 'btn-danger btn-sm';
    leaveBtn.textContent = 'Выйти';
    leaveBtn.addEventListener('click', () => socket.emit('leave_team'));
    btns.appendChild(leaveBtn);
  } else if (canJoin) {
    const joinBtn = document.createElement('button');
    joinBtn.className = 'btn-primary btn-sm';
    joinBtn.textContent = 'Вступить';
    joinBtn.addEventListener('click', () => socket.emit('join_team', { teamId: team.id }));
    btns.appendChild(joinBtn);
  }

  // Кик и передача хоста — только хост, только для чужих
  if (isHost) {
    team.players.forEach(pid => {
      if (pid === myId) return;
      const kickBtn = document.createElement('button');
      kickBtn.className = 'btn-danger btn-sm';
      kickBtn.textContent = `✕ ${state.players[pid]?.nick || '?'}`;
      kickBtn.addEventListener('click', () => socket.emit('kick_player', { targetId: pid }));
      btns.appendChild(kickBtn);
      const thBtn = document.createElement('button');
      thBtn.className = 'btn-ghost btn-sm';
      thBtn.textContent = '→ Хост';
      thBtn.addEventListener('click', () => socket.emit('transfer_host', { targetId: pid }));
      btns.appendChild(thBtn);
    });
  }

  header.appendChild(nameEl);
  header.appendChild(btns);
  card.appendChild(header);

  // Участники + пустые слоты
  const members = document.createElement('div');
  members.className = 'team-members-list';
  team.players.forEach(pid => {
    const p = state.players[pid];
    if (!p) return;
    const row = document.createElement('div');
    row.className = 'team-member-row' + (pid === myId ? ' is-me' : '');
    row.textContent = p.nick + (p.isHost ? ' 👑' : '');
    members.appendChild(row);
  });
  for (let i = team.players.length; i < 2; i++) {
    const slot = document.createElement('div');
    slot.className = 'team-slot-empty';
    slot.textContent = '— свободное место';
    members.appendChild(slot);
  }
  card.appendChild(members);
  container.appendChild(card);
}

// ===== GAME =====
function renderGame() {
  const gd = state.gameData;
  if (!gd) return;

  const teamsEl = $('game-teams-list');
  teamsEl.innerHTML = '';
  gd.teamOrder.forEach((teamId, idx) => {
    const team = state.teams[teamId];
    if (!team) return;
    const card = document.createElement('div');
    card.className = 'game-team-card' + (idx === gd.currentTeamIndex ? ' active-turn' : '');
    const nameEl = document.createElement('div');
    nameEl.className = 'game-team-name';
    nameEl.textContent = team.name;
    const scoreEl = document.createElement('div');
    scoreEl.className = 'game-team-score';
    scoreEl.textContent = gd.scores[teamId] || 0;
    const playersEl = document.createElement('div');
    playersEl.className = 'game-team-players';
    team.players.forEach(pid => {
      const p = state.players[pid];
      if (!p) return;
      const isExplainer = pid === gd.explainerSocketId;
      const nick = document.createElement('div');
      nick.className = 'g-player-nick' + (pid === myId ? ' is-me' : '') + (isExplainer ? ' is-explainer' : '');
      nick.textContent = p.nick + (isExplainer ? ' 🎤' : '');
      playersEl.appendChild(nick);
    });
    card.appendChild(nameEl); card.appendChild(scoreEl); card.appendChild(playersEl);
    teamsEl.appendChild(card);
  });

  const obsEl = $('game-observers-list');
  obsEl.innerHTML = '';
  state.observers.forEach(pid => {
    const p = state.players[pid];
    if (!p) return;
    const d = document.createElement('div');
    d.className = 'observer-item' + (pid === myId ? ' is-me' : '');
    d.textContent = p.nick;
    obsEl.appendChild(d);
  });

  $('phase-ready').classList.add('hidden');
  $('phase-explainer-start').classList.add('hidden');
  $('phase-playing').classList.add('hidden');
  $('phase-review').classList.add('hidden');

  if (gd.phase === 'waiting_ready') renderPhaseReady(gd);
  else if (gd.phase === 'explainer_start') renderPhaseExplainerStart(gd);
  else if (gd.phase === 'playing') renderPhasePlaying(gd);
  else if (gd.phase === 'reviewing') renderPhaseReview(gd);
}

function renderPhaseReady(gd) {
  $('phase-ready').classList.remove('hidden');
  clearInterval(timerInterval);
  $('g-timer').textContent = '—';
  $('g-timer').classList.remove('urgent');
  const teamId = gd.teamOrder[gd.currentTeamIndex];
  const team = state.teams[teamId];
  $('ready-title').textContent = `Ход команды: ${team.name}`;
  $('ready-sub').textContent = 'Оба игрока должны нажать "Готов"';
  const statusEl = $('ready-status');
  statusEl.innerHTML = '';
  team.players.forEach(pid => {
    const p = state.players[pid];
    if (!p) return;
    const isReady = gd.readyPlayers.includes(pid);
    const row = document.createElement('div');
    row.className = 'ready-player-row' + (isReady ? ' is-ready' : '');
    row.innerHTML = `<span>${p.nick}${pid === myId ? ' (вы)' : ''}</span><div class="ready-dot"></div>`;
    statusEl.appendChild(row);
  });
  const amIn = team.players.includes(myId);
  const amReady = gd.readyPlayers.includes(myId);
  const btn = $('ready-btn');
  if (amIn && !amReady) { btn.classList.remove('hidden'); btn.disabled = false; btn.textContent = '✓ Я готов'; }
  else if (amIn && amReady) { btn.classList.remove('hidden'); btn.disabled = true; btn.textContent = '✓ Готов!'; }
  else { btn.classList.add('hidden'); }
}

function renderPhaseExplainerStart(gd) {
  $('phase-explainer-start').classList.remove('hidden');
  clearInterval(timerInterval);
  $('g-timer').textContent = '—';
  $('g-timer').classList.remove('urgent');
  const teamId = gd.teamOrder[gd.currentTeamIndex];
  const team = state.teams[teamId];
  const explainer = state.players[gd.explainerSocketId];
  const amExplainer = myId === gd.explainerSocketId;
  $('explainer-start-title').textContent = `Команда ${team?.name} готова!`;
  $('explainer-start-sub').textContent = amExplainer
    ? 'Вы объясняете — нажмите "Начать раунд" когда готовы!'
    : `Ждём пока ${explainer?.nick || '?'} начнёт раунд...`;
  if (amExplainer) $('explainer-start-btn').classList.remove('hidden');
  else $('explainer-start-btn').classList.add('hidden');
}

function renderPhasePlaying(gd) {
  $('phase-playing').classList.remove('hidden');
  const amExplainer = myId === gd.explainerSocketId;
  const wordDisplay = $('current-word-display');
  if (amExplainer) {
    $('next-word-btn').classList.remove('hidden');
    wordDisplay.classList.remove('blur-word');
  } else {
    wordDisplay.classList.add('blur-word');
    wordDisplay.textContent = '???';
    $('next-word-btn').classList.add('hidden');
  }
  const prevList = $('prev-words-list');
  prevList.innerHTML = '';
  (gd.previousWords || []).forEach(word => {
    const item = document.createElement('div');
    item.className = 'prev-word-item';
    item.textContent = word;
    prevList.appendChild(item);
  });
  startTimer(gd.roundEndTime);
}

function renderPhaseReview(gd) {
  $('phase-review').classList.remove('hidden');
  clearInterval(timerInterval);
  $('g-timer').textContent = '—';
  $('g-timer').classList.remove('urgent');
  $('review-sub').textContent = isHost
    ? 'Снимите галочку с НЕугаданных слов и нажмите "Подтвердить"'
    : 'Хост разбирает результаты раунда...';
  const list = $('review-words-list');
  list.innerHTML = '';
  reviewResults = {};
  (gd.reviewWords || []).forEach(({ word }) => {
    reviewResults[word] = true;
    const row = document.createElement('div');
    row.className = 'review-word-row guessed' + (isHost ? '' : ' readonly');
    row.innerHTML = `<span>${word}</span><div class="review-check">✓</div>`;
    if (isHost) {
      row.addEventListener('click', () => {
        reviewResults[word] = !reviewResults[word];
        row.classList.toggle('guessed', reviewResults[word]);
        row.classList.toggle('not-guessed', !reviewResults[word]);
        row.querySelector('.review-check').textContent = reviewResults[word] ? '✓' : '';
      });
    }
    list.appendChild(row);
  });
  if (isHost) $('submit-review-btn').classList.remove('hidden');
  else $('submit-review-btn').classList.add('hidden');
}

function renderWinner() {
  const gd = state.gameData;
  if (!gd || !gd.winner) return;
  clearInterval(timerInterval);
  const team = state.teams[gd.winner];
  $('winner-team-name').textContent = team.name;
  const playersEl = $('winner-players');
  playersEl.innerHTML = '';
  team.players.forEach(pid => {
    const p = state.players[pid];
    if (!p) return;
    const span = document.createElement('div');
    span.className = 'winner-player-nick';
    span.textContent = p.nick;
    playersEl.appendChild(span);
  });
  if (isHost) $('restart-btn').classList.remove('hidden');
  else $('restart-btn').classList.add('hidden');
}

// ===== TIMER =====
function startTimer(endTime) {
  clearInterval(timerInterval);
  const timerEl = $('g-timer');
  function tick() {
    const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    timerEl.textContent = left + 's';
    timerEl.classList.toggle('urgent', left <= 10);
    if (left <= 0) clearInterval(timerInterval);
  }
  tick();
  timerInterval = setInterval(tick, 200);
}

// ===== MODALS =====
function openModal(id) {
  $('modal-overlay').classList.remove('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  $(id).classList.remove('hidden');
}
function closeModal() {
  $('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}
$('modal-overlay').addEventListener('click', e => {
  if (e.target === $('modal-overlay')) closeModal();
});

function openSettingsModal() {
  const s = state ? state.settings : { roundDuration: 60, wordsToWin: 20, difficulty: 'normal' };
  $('setting-duration').value = s.roundDuration;
  $('setting-words').value = s.wordsToWin;
  document.querySelectorAll('.diff-btn[data-diff]').forEach(b => b.classList.toggle('active', b.dataset.diff === s.difficulty));
  const inGame = state && state.gameState !== 'lobby';
  $('setting-duration').disabled = !isHost || inGame;
  $('setting-words').disabled = !isHost || inGame;
  document.querySelectorAll('.diff-btn[data-diff]').forEach(b => b.style.pointerEvents = (!isHost || inGame) ? 'none' : '');
  $('modal-settings-save').style.display = (!isHost || inGame) ? 'none' : '';
  clearError('settings-error');
  openModal('modal-settings');
}

function openRulesModal() {
  const s = state ? state.settings : { roundDuration: 60, wordsToWin: 20, difficulty: 'normal' };
  const diffMap = { easy: 'Лёгкая', normal: 'Нормальная', hard: 'Сложная' };
  $('rules-content').innerHTML = `
    <div><strong>Длительность раунда:</strong> ${s.roundDuration} сек</div>
    <div><strong>Слов для победы:</strong> ${s.wordsToWin}</div>
    <div><strong>Сложность:</strong> ${diffMap[s.difficulty] || s.difficulty}</div>
    <br>
    <div>Один игрок объясняет слова, другой угадывает. После раунда хост отмечает угаданные слова. Команды чередуются. Побеждает та, что первой наберёт нужное количество слов.</div>
  `;
  openModal('modal-rules');
}

// ===== HELPERS =====
function getMyTeam() {
  if (!state) return null;
  return Object.values(state.teams).find(t => t.players.includes(myId)) || null;
}

function updateHostBadge() {
  if (isHost) {
    $('host-badge').classList.remove('hidden');
    $('host-controls')?.classList.remove('hidden');
  } else {
    $('host-badge').classList.add('hidden');
    $('host-controls')?.classList.add('hidden');
  }
}

function showError(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
}

function clearError(id) {
  const el = $(id);
  if (el) el.textContent = '';
}
