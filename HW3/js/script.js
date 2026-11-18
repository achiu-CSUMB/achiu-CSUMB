// Stock Price Grapher
// Gets daily prices from the Alpha Vantage API and graphs them with Chart.js.

const API_URL = "https://www.alphavantage.co/query";
const TABLE_ROW_COUNT = 5;

// Letters, digits, dots and dashes, e.g. AAPL, BRK-B, TSCO.LON
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;

const form = document.getElementById("stock-form");
const tickerInput = document.getElementById("ticker");
const apiKeyInput = document.getElementById("api-key");
const rangeSelect = document.getElementById("range");
const submitButton = document.getElementById("submit-button");
const statusMessage = document.getElementById("status");
const resultsSection = document.getElementById("results");

let chart = null;
let currentSymbol = "";
let currentPrices = []; // Oldest first

form.addEventListener("submit", handleSubmit);

// Changing the range redraws saved data, so it doesn't use up an API request.
rangeSelect.addEventListener("change", () => {
  if (currentPrices.length > 0) {
    showResults();
  }
});

async function handleSubmit(event) {
  event.preventDefault();

  const symbol = tickerInput.value.trim().toUpperCase();
  const apiKey = apiKeyInput.value.trim();

  if (!validateForm(symbol, apiKey)) {
    return;
  }

  tickerInput.value = symbol;
  setStatus(`Loading ${symbol}...`);
  submitButton.disabled = true;

  try {
    currentPrices = await fetchDailyPrices(symbol, apiKey);
    currentSymbol = symbol;
    showResults();
    setStatus("");
  } catch (error) {
    currentPrices = [];
    resultsSection.hidden = true;
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
}

function validateForm(symbol, apiKey) {
  let tickerError = "";
  let apiKeyError = "";

  if (symbol === "") {
    tickerError = "Please enter a ticker symbol.";
  } else if (!TICKER_PATTERN.test(symbol)) {
    tickerError = "Use up to 12 letters, numbers, dots or dashes.";
  }

  if (apiKey === "") {
    apiKeyError = "Please enter your API key.";
  }

  showFieldError(tickerInput, "ticker-error", tickerError);
  showFieldError(apiKeyInput, "api-key-error", apiKeyError);

  return tickerError === "" && apiKeyError === "";
}

function showFieldError(input, errorId, message) {
  document.getElementById(errorId).textContent = message;
  input.classList.toggle("invalid", message !== "");
  input.setAttribute("aria-invalid", String(message !== ""));
}

async function fetchDailyPrices(symbol, apiKey) {
  // Returns the latest 100 trading days by default.
  const url = `${API_URL}?function=TIME_SERIES_DAILY` +
    `&symbol=${encodeURIComponent(symbol)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Could not reach Alpha Vantage. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(`Alpha Vantage returned an error (HTTP ${response.status}).`);
  }

  const data = await response.json();

  // Alpha Vantage reports most problems with HTTP 200 and a message in the JSON.
  if (data["Error Message"]) {
    throw new Error(`No data found for "${symbol}". Check the ticker symbol.`);
  }
  if (data["Note"] || data["Information"]) {
    throw new Error(data["Note"] || data["Information"]);
  }

  const series = data["Time Series (Daily)"];
  if (!series || Object.keys(series).length === 0) {
    throw new Error(`No price data was returned for "${symbol}".`);
  }

  return Object.keys(series)
    .sort()
    .map((date) => ({
      date: date,
      open: Number(series[date]["1. open"]),
      high: Number(series[date]["2. high"]),
      low: Number(series[date]["3. low"]),
      close: Number(series[date]["4. close"]),
      volume: Number(series[date]["5. volume"]),
    }));
}

function showResults() {
  const prices = currentPrices.slice(-Number(rangeSelect.value));

  showSummary(prices);
  showTable(prices);
  resultsSection.hidden = false; // The chart needs a visible container to size itself
  drawChart(prices);
}

function showSummary(prices) {
  const first = prices[0];
  const latest = prices[prices.length - 1];
  const change = latest.close - first.close;
  const percent = (change / first.close) * 100;
  const arrow = change >= 0 ? "▲" : "▼";
  const sign = change >= 0 ? "+" : "−";

  document.getElementById("results-title").textContent = currentSymbol;
  document.getElementById("results-subtitle").textContent =
    `Daily closing price, ${formatDate(first.date)} to ${formatDate(latest.date)}`;
  document.getElementById("stat-latest").textContent = formatPrice(latest.close);
  document.getElementById("stat-change").textContent =
    `${arrow} ${sign}${Math.abs(percent).toFixed(2)}%`;
  document.getElementById("stat-high").textContent =
    formatPrice(Math.max(...prices.map((day) => day.high)));
  document.getElementById("stat-low").textContent =
    formatPrice(Math.min(...prices.map((day) => day.low)));
}

function showTable(prices) {
  const tableBody = document.getElementById("price-rows");
  tableBody.textContent = "";

  prices.slice(-TABLE_ROW_COUNT).reverse().forEach((day) => {
    const row = document.createElement("tr");
    const values = [
      formatDate(day.date),
      formatPrice(day.open),
      formatPrice(day.high),
      formatPrice(day.low),
      formatPrice(day.close),
      day.volume.toLocaleString("en-US"),
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

function drawChart(prices) {
  if (typeof Chart === "undefined") {
    setStatus("The graph library could not load, so only the summary is shown.", true);
    return;
  }

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(document.getElementById("price-chart"), {
    type: "line",
    data: {
      labels: prices.map((day) => formatDate(day.date)),
      datasets: [{
        label: `${currentSymbol} close`,
        data: prices.map((day) => day.close),
        borderColor: "#1f5fbf",
        backgroundColor: "#1f5fbf",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (item) => `Close: ${formatPrice(item.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#566070", maxTicksLimit: 6, maxRotation: 0 },
        },
        y: {
          grid: { color: "#e6e9ed" },
          border: { display: false },
          ticks: { color: "#566070", callback: (value) => formatPrice(value) },
        },
      },
    },
  });
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function formatPrice(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateText) {
  // API dates have no time zone, so read and print them as UTC to keep the same day.
  return new Date(`${dateText}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}