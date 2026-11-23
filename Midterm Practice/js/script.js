// ===================== Config =====================
const API = "https://csumb.space/api/famousQuotes";
const PIXABAY_KEY = "58757220-068bee1cebcd565aac9912d8b"; // swap in your own key

// Field names returned by the quotes API. Check the console logs on first run
// and adjust these if the API uses different names.
const F = {
  id: "quoteId",
  text: "quoteText",
  first: "firstName",
  last: "lastName",
  picture: "picture",
  bio: "bio",
  translation: "translation"
};

const LANGUAGES = [
  { code: "EN", name: "English",   flag: "img/english_flag.png" }, // placeholder flag paths
  { code: "ES", name: "Esperanto", flag: "img/es.png" },
  { code: "FR", name: "French",    flag: "img/fr.png" },
  { code: "SP", name: "Spanish",   flag: "img/sp.png" }
];

let currentQuote = null; // holds the random quote so other features can use it

// ===================== Events =====================
document.querySelector("#translateBtn").addEventListener("click", translateQuote);
document.querySelector("#authorBtn").addEventListener("click", displayAuthorInfo);
document.querySelector("#getQuotesBtn").addEventListener("click", getQuotes);

// ===================== On page load =====================
displayRandomQuote();
displayLanguages();
setBackground();

// ---- 1. Random quote ----
async function displayRandomQuote() {
  try {
    const response = await fetch(`${API}/getRandomQuote.php`);
    const data = await response.json();
    console.log("getRandomQuote:", data);

    currentQuote = Array.isArray(data) ? data[0] : data;
    document.querySelector("#quote").textContent = currentQuote[F.text];
    document.querySelector("#author").textContent =
      `-${currentQuote[F.first]} ${currentQuote[F.last]}`;
  } catch (err) {
    document.querySelector("#quote").textContent = "Could not load a quote.";
    console.error(err);
  }
}

// ---- 2. Author info (two-column layout is in the HTML) ----
function displayAuthorInfo() {
  if (!currentQuote) return;
  document.querySelector("#authorPic").src = currentQuote[F.picture];
  document.querySelector("#authorBio").textContent = currentQuote[F.bio];
  document.querySelector("#authorInfo").classList.remove("d-none");
}

// ---- 3. Language radios in random order ----
function displayLanguages() {
  const shuffled = [...LANGUAGES].sort(() => Math.random() - 0.5);
  const container = document.querySelector("#languages");
  container.innerHTML = "";

  for (const lang of shuffled) {
    container.innerHTML += `
      <input type="radio" name="lang" id="lang${lang.code}" value="${lang.code}">
      <label for="lang${lang.code}">${lang.name}</label>`;
  }
}

// ---- 4. Translate + flag ----
async function translateQuote() {
  const error = document.querySelector("#translateError");
  error.textContent = "";

  const selected = document.querySelector("input[name='lang']:checked");
  if (!selected) {
    error.textContent = "Please select a language.";
    return;
  }
  if (!currentQuote) return;

  const lang = LANGUAGES.find(l => l.code === selected.value);
  const flag = document.querySelector("#flag");
  flag.src = lang.flag;
  flag.alt = `${lang.name} flag`;
  flag.classList.remove("d-none");

  try {
    const url = `${API}/translateQuote.php?lang=${lang.code}&quoteId=${currentQuote[F.id]}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("translateQuote:", data);

    const result = Array.isArray(data) ? data[0] : data;
    // Fall back to quoteText in case the API reuses that field name
    document.querySelector("#quote").textContent = result[F.translation] ?? result[F.text];
  } catch (err) {
    error.textContent = "Translation failed.";
    console.error(err);
  }
}

// ---- 5. Get N quotes with validation ----
async function getQuotes() {
  const error = document.querySelector("#quotesError");
  const list = document.querySelector("#quotesList");
  error.textContent = "";
  list.innerHTML = "";

  const n = Number(document.querySelector("#numQuotes").value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    error.textContent = "Please enter a whole number between 1 and 5.";
    return;
  }

  try {
    const response = await fetch(`${API}/getQuotes.php?n=${n}`);
    const data = await response.json();
    console.log("getQuotes:", data);

    for (const q of data) {
      list.innerHTML += `
        <blockquote class="mb-3">
          <p class="mb-1">"${q[F.text]}"</p>
          <footer class="fst-italic">-${q[F.first]} ${q[F.last]}</footer>
        </blockquote>`;
    }
  } catch (err) {
    error.textContent = "Could not load quotes.";
    console.error(err);
  }
}

// ---- 6. Random Pixabay background ----
async function setBackground() {
  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&per_page=50&orientation=horizontal&q=flowers`;
    const response = await fetch(url);
    const data = await response.json();
    const randomIndex = Math.floor(Math.random() * data.hits.length);
    document.body.style.backgroundImage = `url('${data.hits[randomIndex].largeImageURL}')`;
  } catch (err) {
    console.error("Background failed:", err);
  }
}