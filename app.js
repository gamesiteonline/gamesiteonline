// --- APP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Hide the startup loader after 2 seconds
  setTimeout(() => {
    document.getElementById('app-loader').classList.remove('active');
  }, 2000);
  
  // Load initial category on startup
  fetchCategory('pc');
  
  // Set theme from local storage
  if(localStorage.getItem('appTheme') === 'neon') {
    document.documentElement.setAttribute('data-theme', 'neon');
    document.getElementById('theme-selector').value = 'neon';
  }
});

// --- NAVIGATION SYSTEM ---
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');
  window.scrollTo(0,0);
}

// --- THEME SWITCHER ---
function changeTheme() {
  const theme = document.getElementById('theme-selector').value;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('appTheme', theme);
}

// --- DATA FETCHING FROM GITHUB ---
// Maps your category buttons to your exact GitHub JSON filenames
const categoryFiles = {
  pc: 'pc.json', // Make sure you create this file in your repo!
  mobile: 'mobile.json',
  emulator: 'emulator.json',
  ppsspp: 'ppssppgameslink.json',
  consoles: 'consoles.json', // Make sure you create this file in your repo!
  special: 'specialist.json'
};

let currentGame = null;

async function fetchCategory(category) {
  const grid = document.getElementById('game-grid');
  
  // Show a loading animation while pulling data from GitHub
  grid.innerHTML = `
    <div class="loader-container" style="text-align:center; width:100%;">
      <p style="color:var(--accent);">Fetching games from database...</p>
    </div>`;
  
  const fileName = categoryFiles[category];
  
  // The official way to fetch raw file data from a GitHub repo
  const url = `https://raw.githubusercontent.com/gamesiteonline/gamesiteonline/main/${fileName}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Database file not found");
    
    const data = await response.json();
    
    // Check if the JSON is empty
    if(!data || data.length === 0) {
       grid.innerHTML = '<p style="text-align:center; width:100%;">No games found in this category yet.</p>';
       return;
    }

    // Add a marker so the app knows if a game requires payment
    data.forEach(game => {
      game.type = (category === 'special') ? 'special' : 'standard';
    });

    renderCards(data);
  } catch (error) {
    console.error("Fetch Error: ", error);
    grid.innerHTML = `<p style="text-align:center; width:100%; color: var(--accent);">Failed to load data. Make sure <b>${fileName}</b> is uploaded to your GitHub repository.</p>`;
  }
}

function renderCards(data) {
  const grid = document.getElementById('game-grid');
  grid.innerHTML = '';
  
  data.forEach(game => {
    // Fallback text just in case your JSON is missing a title or image
    const title = game.title || "Unknown Game";
    const platform = game.platform || "Unknown";
    const img = game.img || game.image || 'https://via.placeholder.com/150/000/fff?text=No+Image';
    
    // Safely package the data to be sent to the next page
    const gameJSON = encodeURIComponent(JSON.stringify(game));

    const cardHtml = `
      <div class="game-card-wrapper" onclick="openGame('${gameJSON}')">
        <div class="game-card">
          <div class="game-content" style="background-image: url('${img}')">
            <span class="card-title">${title}</span>
            <span style="font-size:10px; margin-top:10px;">${platform}</span>
          </div>
        </div>
      </div>
    `;
    grid.innerHTML += cardHtml;
  });
}

// --- GAME DETAILS & DOWNLOAD LOGIC ---
function openGame(gameString) {
  // Unpackage the game data
  const game = JSON.parse(decodeURIComponent(gameString));
  currentGame = game;
  
  const title = game.title || "Unknown Game";
  const platform = game.platform || "Unknown";
  const size = game.size || "Unknown Size";
  const link = game.link || game.url || "#";

  document.getElementById('detail-info').innerHTML = `
    <h2>${title}</h2>
    <p><strong>Platform:</strong> ${platform}</p>
    <p><strong>Size:</strong> ${size}</p>
  `;
  
  // Reset buttons
  document.getElementById('prep-download-btn').style.display = 'block';
  document.getElementById('download-loader').style.display = 'none';
  document.getElementById('actual-download-btn').style.display = 'none';
  document.getElementById('actual-download-btn').href = link;
  
  document.getElementById('payment-section').style.display = 'none';
  document.getElementById('download-section').style.display = 'block';

  // If Special Game, Hide Download Area, Show Payment Details
  if(game.type === 'special') {
    document.getElementById('download-section').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('payment-msg').innerText = '';
    document.getElementById('transaction-id').value = '';
  }

  // Force hide the comments and likes area (since we removed Firebase)
  const socialArea = document.querySelector('.social-engagement');
  if (socialArea) socialArea.style.display = 'none';

  navigate('details');
}

function startProgress() {
  document.getElementById('prep-download-btn').style.display = 'none';
  const loader = document.getElementById('download-loader');
  loader.style.display = 'block';
  const progressText = document.getElementById('progress-text');
  
  let p = 0;
  const interval = setInterval(() => {
    p += Math.floor(Math.random() * 15) + 5;
    if(p >= 100) {
      p = 100;
      clearInterval(interval);
      loader.style.display = 'none';
      const actualBtn = document.getElementById('actual-download-btn');
      actualBtn.style.display = 'inline-block';
      actualBtn.style.display = 'block'; 
    }
    progressText.innerText = `Preparing... ${p}%`;
  }, 400);
}

// Payment Verification Logic for Specialist Games
function verifyPayment() {
  const transId = document.getElementById('transaction-id').value.trim();
  const msg = document.getElementById('payment-msg');
  
  if(transId.length < 8) {
    msg.innerText = "Invalid Transaction ID. Please check and try again.";
    msg.style.color = "red";
  } else {
    msg.innerText = "Verifying with Operator... Please wait.";
    msg.style.color = "orange";
    
    // Simulate a checking process, then grant access
    setTimeout(() => {
      msg.innerText = "Payment Verified! Unlock Download.";
      msg.style.color = "var(--accent)";
      document.getElementById('payment-section').style.display = 'none';
      document.getElementById('download-section').style.display = 'block';
    }, 2000);
  }
}

// --- IN-APP BROWSER LOGIC ---
function openInAppBrowser(url) {
  if (!url || url === '#') {
    alert("Download link not available yet.");
    return;
  }
  const browser = document.getElementById('in-app-browser');
  const frame = document.getElementById('browser-frame');
  const title = document.getElementById('browser-title');
  
  // Extract just the website name for the header title
  title.innerText = url.replace(/^https?:\/\//, '').split('/')[0]; 
  frame.src = url;
  browser.classList.add('open');
}

function closeInAppBrowser() {
  const browser = document.getElementById('in-app-browser');
  const frame = document.getElementById('browser-frame');
  browser.classList.remove('open');
  // Clear the iframe after the close animation finishes
  setTimeout(() => { frame.src = ''; }, 400); 
}
