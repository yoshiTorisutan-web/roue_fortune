const prizes = [
  { name: "iPhone 15 Pro", type: "win", color: "#ff6b6b" },
  { name: "Perdu", type: "lose", color: "#4a4a4a" },
  { name: "PlayStation 5", type: "win", color: "#4ecdc4" },
  { name: "Retenter", type: "retry", color: "#ffe66d" },
  { name: "Voyage à Paris", type: "win", color: "#a8e6cf" },
  { name: "Perdu", type: "lose", color: "#4a4a4a" },
  { name: "MacBook Pro", type: "win", color: "#ff8b94" },
  { name: "Retenter", type: "retry", color: "#ffe66d" },
];

let currentUser = null;
let players = {};
let spinning = false;

// Charger les données du stockage
function loadData() {
  const saved = localStorage.getItem("wheelGameData");
  if (saved) {
    const data = JSON.parse(saved);
    players = data.players || {};
  }
}

// Sauvegarder les données
function saveData() {
  localStorage.setItem("wheelGameData", JSON.stringify({ players }));
}

// Connexion
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();

  if (!username) return;

  if (!players[username]) {
    players[username] = {
      name: username,
      spins: 0,
      wins: 0,
      losses: 0,
      history: [],
      prizes: [],
    };
  }

  currentUser = username;
  saveData();
  showGamePage();
});

function showGamePage() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("navbar").classList.remove("hidden");
  document.getElementById("gamePage").classList.remove("hidden");
  document.getElementById("statsPage").classList.add("hidden");

  document.getElementById("navUsername").textContent = currentUser;
  document.getElementById("navAvatar").textContent =
    currentUser[0].toUpperCase();

  document.getElementById("gameBtn").classList.add("active");
  document.getElementById("statsBtn").classList.remove("active");

  updateStats();
  updateHistory();
  drawWheel();
}

function showStatsPage() {
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("statsPage").classList.remove("hidden");

  document.getElementById("gameBtn").classList.remove("active");
  document.getElementById("statsBtn").classList.add("active");

  displayAllPlayers();
}

document.getElementById("gameBtn").addEventListener("click", showGamePage);
document.getElementById("statsBtn").addEventListener("click", showStatsPage);

document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("navbar").classList.add("hidden");
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("statsPage").classList.add("hidden");
  document.getElementById("username").value = "";
});

// Dessiner la roue
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 20;
  const sliceAngle = (2 * Math.PI) / prizes.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  prizes.forEach((prize, i) => {
    const startAngle = i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 5;
    ctx.fillText(prize.name, radius / 1.6, 5);
    ctx.restore();
  });
}

function getProbability() {
  const userData = players[currentUser];
  const baseWinChance = 0.25;
  const baseLoseChance = 0.3;
  const baseRetryChance = 0.45;
  const spinsModifier = Math.min(userData.spins * 0.02, 0.15);

  return {
    win: baseWinChance + spinsModifier,
    lose: baseLoseChance - spinsModifier * 0.5,
    retry: baseRetryChance - spinsModifier * 0.5,
  };
}

function selectPrize() {
  const prob = getProbability();
  const rand = Math.random();

  let selectedType;
  if (rand < prob.win) {
    selectedType = "win";
  } else if (rand < prob.win + prob.lose) {
    selectedType = "lose";
  } else {
    selectedType = "retry";
  }

  const typePrizes = prizes
    .map((p, i) => ({ ...p, index: i }))
    .filter((p) => p.type === selectedType);
  return typePrizes[Math.floor(Math.random() * typePrizes.length)];
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  document.getElementById("spinBtn").disabled = true;

  const selectedPrize = selectPrize();
  const sliceAngle = 360 / prizes.length;
  const targetAngle = selectedPrize.index * sliceAngle;
  const spins = 5;
  const finalAngle = spins * 360 + (360 - targetAngle) + sliceAngle / 2;

  canvas.style.transform = `rotate(${finalAngle}deg)`;

  setTimeout(() => {
    const userData = players[currentUser];
    userData.spins++;

    if (selectedPrize.type === "win") {
      userData.wins++;
      userData.prizes.push({
        name: selectedPrize.name,
        time: new Date().toLocaleString("fr-FR"),
      });
      createConfetti();
    } else if (selectedPrize.type === "lose") {
      userData.losses++;
    }

    userData.history.unshift({
      prize: selectedPrize.name,
      type: selectedPrize.type,
      time: new Date().toLocaleString("fr-FR"),
    });

    if (userData.history.length > 20) {
      userData.history = userData.history.slice(0, 20);
    }

    saveData();
    showResult(selectedPrize);
    updateStats();
    updateHistory();

    spinning = false;
    document.getElementById("spinBtn").disabled = false;
    canvas.style.transform = "rotate(0deg)";
    canvas.style.transition = "none";
    setTimeout(() => {
      canvas.style.transition =
        "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
    }, 50);
  }, 4000);
}

function showResult(prize) {
  document.getElementById("overlay").classList.add("active");

  if (prize.type === "win") {
    document.getElementById("resultIcon").textContent = "🎉";
    document.getElementById("resultTitle").textContent = "FÉLICITATIONS !";
    document.getElementById("resultTitle").style.color = "#28a745";
    document.getElementById("resultText").textContent =
      `Vous avez gagné : ${prize.name}`;
  } else if (prize.type === "lose") {
    document.getElementById("resultIcon").textContent = "😢";
    document.getElementById("resultTitle").textContent = "Perdu...";
    document.getElementById("resultTitle").style.color = "#dc3545";
    document.getElementById("resultText").textContent =
      "Retentez votre chance !";
  } else {
    document.getElementById("resultIcon").textContent = "🔄";
    document.getElementById("resultTitle").textContent = "Nouvelle chance !";
    document.getElementById("resultTitle").style.color = "#ffc107";
    document.getElementById("resultText").textContent =
      "Vous pouvez retourner la roue !";
  }
}

function createConfetti() {
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#ffe66d",
    "#a8e6cf",
    "#ff8b94",
    "#95e1d3",
  ];
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.top = "-20px";
      confetti.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.3 + "s";
      confetti.style.animationDuration = Math.random() * 2 + 2 + "s";
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3500);
    }, i * 15);
  }
}

function updateStats() {
  const userData = players[currentUser];
  document.getElementById("totalSpins").textContent = userData.spins;
  document.getElementById("totalWins").textContent = userData.wins;
  document.getElementById("totalLosses").textContent = userData.losses;

  const winRate =
    userData.spins > 0 ? Math.round((userData.wins / userData.spins) * 100) : 0;
  document.getElementById("winRate").textContent = winRate + "%";
}

function updateHistory() {
  const userData = players[currentUser];
  const historyList = document.getElementById("historyList");

  if (userData.history.length === 0) {
    historyList.innerHTML =
      '<p style="text-align: center; color: #999; padding: 20px;">Aucun historique pour le moment</p>';
    return;
  }

  historyList.innerHTML = userData.history
    .map(
      (item) => `
                <div class="history-item ${item.type}">
                    <div class="history-content">
                        <span class="history-prize">
                            ${item.type === "win" ? "🏆" : item.type === "lose" ? "❌" : "🔄"} 
                            ${item.prize}
                        </span>
                        <span class="history-time">${item.time.split(" ")[1]}</span>
                    </div>
                </div>
            `,
    )
    .join("");
}

function displayAllPlayers() {
  const playersGrid = document.getElementById("playersGrid");
  const playersList = Object.values(players).sort((a, b) => b.wins - a.wins);

  if (playersList.length === 0) {
    playersGrid.innerHTML =
      '<p style="color: white; text-align: center; font-size: 1.2em;">Aucun joueur pour le moment</p>';
    return;
  }

  playersGrid.innerHTML = playersList
    .map((player) => {
      const winRate =
        player.spins > 0 ? Math.round((player.wins / player.spins) * 100) : 0;

      const prizesHtml =
        player.prizes.length > 0
          ? player.prizes
              .slice(0, 5)
              .map(
                (prize) => `
                        <div class="win-item">
                            <span class="win-name">🎁 ${prize.name}</span>
                            <span class="win-time">${prize.time.split(" ")[1]}</span>
                        </div>
                    `,
              )
              .join("")
          : '<p style="text-align: center; color: #999; padding: 10px;">Aucun gain</p>';

      return `
                    <div class="player-card">
                        <div class="player-header">
                            <div class="player-avatar-large">${player.name[0].toUpperCase()}</div>
                            <div class="player-info">
                                <h3>${player.name}</h3>
                                <p>Membre depuis le ${new Date().toLocaleDateString("fr-FR")}</p>
                            </div>
                        </div>
                        
                        <div class="player-stats">
                            <div class="mini-stat">
                                <div class="mini-stat-label">Tours</div>
                                <div class="mini-stat-value">${player.spins}</div>
                            </div>
                            <div class="mini-stat">
                                <div class="mini-stat-label">Victoires</div>
                                <div class="mini-stat-value">${player.wins}</div>
                            </div>
                            <div class="mini-stat">
                                <div class="mini-stat-label">Défaites</div>
                                <div class="mini-stat-value">${player.losses}</div>
                            </div>
                            <div class="mini-stat">
                                <div class="mini-stat-label">Taux</div>
                                <div class="mini-stat-value">${winRate}%</div>
                            </div>
                        </div>
                        
                        <div class="player-wins">
                            <h4>🏆 Derniers gains (${player.prizes.length})</h4>
                            ${prizesHtml}
                        </div>
                    </div>
                `;
    })
    .join("");
}

document.getElementById("spinBtn").addEventListener("click", spinWheel);
document.getElementById("closeBtn").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("active");
});

loadData();
