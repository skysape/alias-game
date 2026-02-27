const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));

// ===== WORDS =====
const WORDS = {
  easy: [
    'кошка','собака','дом','машина','дерево','солнце','вода','еда','стол','стул',
    'книга','ручка','телефон','окно','дверь','нос','рот','рука','нога','глаз',
    'мяч','торт','снег','море','река','гора','цветок','птица','рыба','хлеб',
    'молоко','яблоко','банан','апельсин','морковь','картошка','лук','помидор',
    'сыр','масло','чай','кофе','сок','шапка','куртка','ботинки','платье','рубашка',
    'диван','кровать','лампа','зеркало','часы','ключ','замок','лес','поле','небо',
    'луна','звезда','огонь','лёд','дождь','ветер','облако','кот','пёс','конь',
    'корова','свинья','курица','утка','кролик','мышь','волк','лиса','медведь',
    'заяц','белка','ёж','черепаха','попугай','хомяк','слон','жираф','обезьяна',
    'лев','тигр','дельфин','акула','кит','лягушка','бабочка','пчела','муравей',
    'нож','вилка','ложка','тарелка','кружка','чашка','бутылка','кастрюля',
    'холодильник','телевизор','компьютер','планшет','наушники','фотоаппарат',
    'ручей','озеро','пляж','песок','камень','трава','гриб','ягода','клубника',
    'вишня','груша','слива','виноград','арбуз','тыква','огурец','чеснок','капуста',
    'рис','макароны','суп','каша','пицца','бутерброд','пирог','блин','мороженое',
    'шоколад','конфета','печенье','варенье','мёд','сахар','соль','корабль','самолёт',
    'велосипед','автобус','поезд','метро','такси','трактор','мотоцикл','лодка'
  ],
  normal: [
    'зонтик','чемодан','пазл','компас','фонарь','веревка','гамак','аквариум','термос',
    'будильник','фотограф','балкон','подвал','чердак','перекресток','светофор','фонтан',
    'скамейка','памятник','библиотека','аптека','вокзал','аэропорт','стадион','больница',
    'магазин','ресторан','гостиница','парикмахер','плотник','водитель','пожарный',
    'полицейский','врач','учитель','повар','художник','певец','актер','режиссер',
    'журналист','программист','инженер','архитектор','скрипка','барабан','гитара',
    'пианино','флейта','труба','хор','оркестр','балет','опера','театр','кино',
    'выставка','музей','концерт','соревнование','чемпионат','турнир','олимпиада',
    'медаль','трофей','рюкзак','термометр','микроскоп','телескоп','бинокль',
    'гантели','скакалка','теннисная ракетка','шашки','шахматы','карты','монополия',
    'водопад','пещера','вулкан','остров','пустыня','джунгли','тундра','степь',
    'тайга','ледник','трамплин','карусель','качели','батут','боулинг','бильярд',
    'рыбалка','туризм','альпинизм','сёрфинг','дайвинг','парашют','рафтинг',
    'акробат','жонглёр','клоун','фокусник','иллюзионист','танцор','курьер',
    'перчатки','шарф','пальто','свитер','джинсы','носки','пижама','купальник',
    'кольцо','серьги','браслет','ожерелье','галстук','ремень','отвёртка','молоток',
    'пила','дрель','рубанок','гаечный ключ','паспорт','виза','билет','таможня''нарек','меганайт',
    'мама дорофеева','кузя','67','абоба','zov','мать габена','эпштейн','азиец','пендос','абимосик'
  ],
  hard: [
    'абстракция','амбиция','апатия','баланс','бюрократия','вакуум','гипотеза',
    'диссонанс','эмпатия','феномен','иерархия','иллюзия','импульс','интуиция',
    'ирония','катарсис','концепция','коррупция','легитимность','манипуляция',
    'меланхолия','метафора','нарратив','нигилизм','парадокс','патетика',
    'перспектива','пессимизм','плюрализм','постулат','прогресс','пропаганда',
    'реализм','рефлексия','скептицизм','стагнация','субъективность','сюрреализм',
    'тоталитаризм','утопия','философия','харизма','цинизм','эволюция',
    'экзистенция','эклектика','элитаризм','энтропия','эрудиция','эстетика',
    'эфемерность','авторитаризм','дискриминация','консенсус','конформизм',
    'демагогия','дилемма','дипломатия','доминирование','дуализм','идеология',
    'импровизация','инновация','инстинкт','интерпретация','коалиция','коммуникация',
    'компромисс','конкуренция','конституция','координация','либерализм','лицемерие',
    'медиация','менталитет','меритократия','мимикрия','модернизация','монополия',
    'мотивация','нейтралитет','объективность','оппортунизм','оптимизм','патриотизм',
    'перфекционизм','популизм','прагматизм','прецедент','прокрастинация','психоанализ',
    'радикализм','рационализм','релятивизм','риторика','романтизм','сарказм',
    'солидарность','социализация','стереотип','стоицизм','суверенитет','тактика',
    'трансформация','универсализм','фанатизм','федерализм','формализм','хаос',
    'цензура','централизация','эгоизм','экспансия','электорат','эмансипация',
    'этика','эффективность','абсурд','агностицизм','альтруизм','анархизм',
    'антагонизм','антропология','архетип','ассимиляция','атеизм','аутентичность',
    'бихевиоризм','гедонизм','глобализация','гуманизм','детерминизм','диалектика',
    'дискурс','дистопия','догматизм','доктрина','эмпиризм','энтузиазм','эскалация'
  ]
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== STATE =====
let lobby = {
  players: {},
  teams: {},
  settings: { roundDuration: 60, wordsToWin: 20, difficulty: 'normal' },
  gameState: 'lobby',
  gameData: null
};

function getPlayerByNick(nick) {
  return Object.values(lobby.players).find(p => p.nick.toLowerCase() === nick.toLowerCase());
}
function getTeamByName(name) {
  return Object.values(lobby.teams).find(t => t.name.toLowerCase() === name.toLowerCase());
}
function getPlayerTeam(socketId) {
  return Object.values(lobby.teams).find(t => t.players.includes(socketId));
}
function getObservers() {
  const inTeam = new Set(Object.values(lobby.teams).flatMap(t => t.players));
  return Object.values(lobby.players).filter(p => !inTeam.has(p.id)).map(p => p.id);
}

// Удалить команду если пустая
function cleanupTeam(team) {
  if (team && team.players.length === 0) {
    delete lobby.teams[team.id];
    return true;
  }
  return false;
}

function broadcastState() {
  io.emit('state', buildClientState());
}

function buildClientState() {
  // Сортируем команды по времени создания — передаём массив для консистентного порядка
  const teamsArray = Object.values(lobby.teams)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  return {
    players: lobby.players,
    teams: lobby.teams,          // объект для поиска по id
    teamsOrder: teamsArray.map(t => t.id),  // массив id в правильном порядке
    settings: lobby.settings,
    gameState: lobby.gameState,
    gameData: lobby.gameData ? sanitizeGameData() : null,
    observers: getObservers()
  };
}

function sanitizeGameData() {
  const gd = lobby.gameData;
  return {
    currentTeamIndex: gd.currentTeamIndex,
    teamOrder: gd.teamOrder,
    scores: gd.scores,
    roundActive: gd.roundActive,
    roundEndTime: gd.roundEndTime,
    explainerSocketId: gd.explainerSocketId,
    previousWords: gd.previousWords,
    phase: gd.phase,
    readyPlayers: gd.readyPlayers,
    reviewWords: gd.phase === 'reviewing' ? gd.roundWords : null,
    winner: gd.winner || null
  };
}

function pickWord() {
  const gd = lobby.gameData;
  if (!gd || gd.remainingWords.length === 0) return null;
  const idx = Math.floor(Math.random() * gd.remainingWords.length);
  return gd.remainingWords.splice(idx, 1)[0];
}

function sendWordToExplainer() {
  const gd = lobby.gameData;
  if (gd && gd.currentWord && gd.explainerSocketId) {
    io.to(gd.explainerSocketId).emit('current_word', gd.currentWord);
  }
}

function setupNextRound() {
  const gd = lobby.gameData;
  gd.phase = 'waiting_ready';
  gd.readyPlayers = [];
  gd.roundActive = false;
  gd.roundWords = [];
  gd.previousWords = [];
  gd.currentWord = null;

  const teamId = gd.teamOrder[gd.currentTeamIndex];
  const team = lobby.teams[teamId];
  const roundNum = gd.teamRounds[teamId] || 0;

  // Чётный раунд — объясняет создатель, нечётный — второй игрок
  const creatorIndex = team.players.indexOf(team.creatorId);
  const otherIndex = creatorIndex === 0 ? 1 : 0;
  gd.explainerSocketId = team.players[roundNum % 2 === 0 ? creatorIndex : otherIndex];
  gd.teamRounds[teamId] = roundNum + 1;

  broadcastState();
}

function startRound() {
  const gd = lobby.gameData;
  gd.phase = 'playing';
  gd.roundActive = true;
  gd.currentWord = pickWord();
  gd.roundEndTime = Date.now() + lobby.settings.roundDuration * 1000;
  broadcastState();
  sendWordToExplainer();
  gd.timer = setTimeout(() => endRound(), lobby.settings.roundDuration * 1000);
}

function endRound() {
  const gd = lobby.gameData;
  if (!gd) return;
  clearTimeout(gd.timer);
  gd.roundActive = false;
  if (gd.currentWord) {
    gd.roundWords.push({ word: gd.currentWord, guessed: true });
    gd.currentWord = null;
  }
  gd.phase = 'reviewing';
  broadcastState();
}

// ===== SOCKET =====
io.on('connection', (socket) => {

  socket.on('register', ({ nick }) => {
    nick = (nick || '').trim();
    if (nick.length < 2 || nick.length > 20) { socket.emit('error_msg', 'Ник: от 2 до 20 символов'); return; }
    if (getPlayerByNick(nick)) { socket.emit('error_msg', 'Такой ник уже занят'); return; }
    const isHost = Object.keys(lobby.players).length === 0;
    lobby.players[socket.id] = { id: socket.id, nick, isHost };
    socket.emit('registered', { id: socket.id, isHost });
    broadcastState();
  });

  socket.on('rename_nick', ({ nick }) => {
    nick = (nick || '').trim();
    if (nick.length < 2 || nick.length > 20) { socket.emit('error_msg', 'Ник: от 2 до 20 символов'); return; }
    const existing = getPlayerByNick(nick);
    if (existing && existing.id !== socket.id) { socket.emit('error_msg', 'Такой ник уже занят'); return; }
    const p = lobby.players[socket.id];
    if (!p) return;
    p.nick = nick;
    socket.emit('nick_changed', { nick });
    broadcastState();
  });

  socket.on('create_team', ({ name }) => {
    name = (name || '').trim();
    if (!name || name.length > 30) { socket.emit('error_msg', 'Некорректное название'); return; }
    if (lobby.gameState !== 'lobby') { socket.emit('error_msg', 'Игра уже началась'); return; }
    if (getPlayerTeam(socket.id)) { socket.emit('error_msg', 'Вы уже в команде'); return; }
    if (getTeamByName(name)) { socket.emit('error_msg', 'Такое название уже занято'); return; }
    const teamId = uuidv4();
    lobby.teams[teamId] = { id: teamId, name, creatorId: socket.id, players: [socket.id], createdAt: Date.now() };
    broadcastState();
  });

  socket.on('rename_team', ({ teamId, name }) => {
    name = (name || '').trim();
    const team = lobby.teams[teamId];
    if (!team || team.creatorId !== socket.id) { socket.emit('error_msg', 'Нет доступа'); return; }
    if (lobby.gameState !== 'lobby') { socket.emit('error_msg', 'Игра уже началась'); return; }
    if (!name || name.length > 30) { socket.emit('error_msg', 'Некорректное название'); return; }
    const ex = getTeamByName(name);
    if (ex && ex.id !== teamId) { socket.emit('error_msg', 'Такое название уже занято'); return; }
    team.name = name;
    broadcastState();
  });

  socket.on('join_team', ({ teamId }) => {
    if (lobby.gameState !== 'lobby') { socket.emit('error_msg', 'Игра уже началась'); return; }
    const team = lobby.teams[teamId];
    if (!team) return;
    if (team.players.length >= 2) { socket.emit('error_msg', 'Команда уже полная'); return; }
    if (getPlayerTeam(socket.id)) { socket.emit('error_msg', 'Вы уже в команде'); return; }
    team.players.push(socket.id);
    broadcastState();
  });

  socket.on('leave_team', () => {
    if (lobby.gameState !== 'lobby') return;
    const team = getPlayerTeam(socket.id);
    if (!team) return;
    team.players = team.players.filter(id => id !== socket.id);
    if (team.creatorId === socket.id && team.players.length > 0) team.creatorId = team.players[0];
    cleanupTeam(team);
    broadcastState();
  });

  socket.on('update_settings', ({ roundDuration, wordsToWin, difficulty }) => {
    const player = lobby.players[socket.id];
    if (!player || !player.isHost) { socket.emit('error_msg', 'Только хост может менять настройки'); return; }
    if (lobby.gameState !== 'lobby') { socket.emit('error_msg', 'Игра уже началась'); return; }
    if (roundDuration !== undefined) { const v = parseInt(roundDuration); if (v >= 10 && v <= 300) lobby.settings.roundDuration = v; }
    if (wordsToWin !== undefined) { const v = parseInt(wordsToWin); if (v >= 5 && v <= 100) lobby.settings.wordsToWin = v; }
    if (difficulty !== undefined && ['easy','normal','hard'].includes(difficulty)) lobby.settings.difficulty = difficulty;
    broadcastState();
  });

  socket.on('kick_player', ({ targetId }) => {
    const player = lobby.players[socket.id];
    if (!player || !player.isHost) return;
    if (targetId === socket.id || !lobby.players[targetId]) return;
    const team = getPlayerTeam(targetId);
    if (team) {
      team.players = team.players.filter(id => id !== targetId);
      if (team.creatorId === targetId && team.players.length > 0) team.creatorId = team.players[0];
      cleanupTeam(team);  // удаляем если пустая
    }
    delete lobby.players[targetId];
    io.to(targetId).emit('kicked');
    broadcastState();
  });

  socket.on('transfer_host', ({ targetId }) => {
    const player = lobby.players[socket.id];
    if (!player || !player.isHost) return;
    const target = lobby.players[targetId];
    if (!target) return;
    player.isHost = false;
    target.isHost = true;
    broadcastState();
  });

  socket.on('start_game', () => {
    const player = lobby.players[socket.id];
    if (!player || !player.isHost) { socket.emit('error_msg', 'Только хост может начать игру'); return; }
    const teams = Object.values(lobby.teams);
    if (teams.length < 2) { socket.emit('error_msg', 'Нужно минимум 2 команды'); return; }
    const incomplete = teams.find(t => t.players.length !== 2);
    if (incomplete) { socket.emit('error_msg', `В команде "${incomplete.name}" не 2 игрока`); return; }

    lobby.gameState = 'playing';
    const teamOrder = teams.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(t => t.id);
    const scores = {}, teamRounds = {};
    teams.forEach(t => { scores[t.id] = 0; teamRounds[t.id] = 0; });

    lobby.gameData = {
      teamOrder, currentTeamIndex: 0, scores, teamRounds,
      remainingWords: shuffle([...WORDS[lobby.settings.difficulty]]),
      phase: 'waiting_ready', readyPlayers: [],
      roundActive: false, roundEndTime: null,
      explainerSocketId: null, currentWord: null,
      roundWords: [], previousWords: [],
      timer: null, winner: null
    };

    setupNextRound();
  });

  socket.on('player_ready', () => {
    const gd = lobby.gameData;
    if (!gd || gd.phase !== 'waiting_ready') return;
    const teamId = gd.teamOrder[gd.currentTeamIndex];
    const team = lobby.teams[teamId];
    if (!team || !team.players.includes(socket.id)) return;
    if (!gd.readyPlayers.includes(socket.id)) gd.readyPlayers.push(socket.id);
    if (gd.readyPlayers.length >= 2) gd.phase = 'explainer_start';
    broadcastState();
  });

  socket.on('explainer_start', () => {
    const gd = lobby.gameData;
    if (!gd || gd.phase !== 'explainer_start') return;
    if (socket.id !== gd.explainerSocketId) return;
    startRound();
  });

  socket.on('next_word', () => {
    const gd = lobby.gameData;
    if (!gd || gd.phase !== 'playing' || !gd.roundActive) return;
    if (socket.id !== gd.explainerSocketId) return;
    if (gd.currentWord) {
      gd.roundWords.push({ word: gd.currentWord, guessed: true });
      gd.previousWords.unshift(gd.currentWord);
    }
    gd.currentWord = pickWord();
    if (!gd.currentWord) { endRound(); return; }
    broadcastState();
    sendWordToExplainer();
  });

  socket.on('submit_review', ({ results }) => {
    const player = lobby.players[socket.id];
    if (!player || !player.isHost) return;
    const gd = lobby.gameData;
    if (!gd || gd.phase !== 'reviewing') return;
    const teamId = gd.teamOrder[gd.currentTeamIndex];
    let correct = 0;
    gd.roundWords.forEach(w => { if (results[w.word]) correct++; });
    gd.scores[teamId] += correct;
    if (gd.scores[teamId] >= lobby.settings.wordsToWin) {
      gd.winner = teamId;
      gd.phase = 'winner';
      lobby.gameState = 'game_over';
      broadcastState();
      return;
    }
    gd.currentTeamIndex = (gd.currentTeamIndex + 1) % gd.teamOrder.length;
    setupNextRound();
  });

  socket.on('restart_game', () => {
    const player = lobby.players[socket.id];
    if (!player || !player.isHost) return;
    if (lobby.gameData && lobby.gameData.timer) clearTimeout(lobby.gameData.timer);
    lobby.gameState = 'lobby';
    lobby.gameData = null;
    lobby.teams = {};
    broadcastState();
  });

  socket.on('disconnect', () => {
    const player = lobby.players[socket.id];
    if (!player) return;
    const team = getPlayerTeam(socket.id);
    if (team) {
      team.players = team.players.filter(id => id !== socket.id);
      if (team.creatorId === socket.id && team.players.length > 0) team.creatorId = team.players[0];
      cleanupTeam(team);  // удаляем если пустая
    }
    const wasHost = player.isHost;
    delete lobby.players[socket.id];
    if (wasHost) {
      const remaining = Object.values(lobby.players);
      if (remaining.length > 0) remaining[0].isHost = true;
    }
    broadcastState();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Alias: http://localhost:${PORT}`));
