import express from 'express';
import * as ss from 'simple-statistics';   // Node package: npmjs.com/package/simple-statistics

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// ---------------------------------------------------------------------------
// Worked example from The Math page, verified with the simple-statistics package
// ---------------------------------------------------------------------------
const examplePoints = [[1, 2], [2, 4], [3, 5], [4, 4], [5, 5]];

function fitExample() {
  const line = ss.linearRegression(examplePoints);        // { m: slope, b: intercept }
  const predict = ss.linearRegressionLine(line);
  return {
    slope: line.m,
    intercept: line.b,
    r2: ss.rSquared(examplePoints, predict),
    predictionAt6: predict(6)
  };
}

// ---------------------------------------------------------------------------
// Web API: World Bank Indicators API (no key required)
// https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
// ---------------------------------------------------------------------------
const WB_BASE = 'https://api.worldbank.org/v2';
const YEAR = 2022;
const GDP_INDICATOR = 'NY.GDP.PCAP.CD';   // GDP per capita (current US$)
const LIFE_INDICATOR = 'SP.DYN.LE00.IN';  // Life expectancy at birth (years)

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`World Bank API returned ${response.status}`);
  }
  return response.json();
}

// The World Bank returns [metadata, rows]; rows is the array we want
async function getIndicator(indicator) {
  const url = `${WB_BASE}/country/all/indicator/${indicator}?format=json&date=${YEAR}&per_page=500`;
  const [, rows] = await getJson(url);
  return rows || [];
}

// Country list, used to drop regional aggregates such as "World" or "Euro area"
async function getRealCountries() {
  const [, rows] = await getJson(`${WB_BASE}/country?format=json&per_page=500`);
  return new Set(
    (rows || [])
      .filter(c => c.region && c.region.value.trim() !== 'Aggregates')
      .map(c => c.id)
  );
}

// Cache the result for an hour so every page view doesn't hit the API
let cache = { data: null, time: 0 };
const CACHE_MS = 60 * 60 * 1000;

async function getWorldData() {
  if (cache.data && Date.now() - cache.time < CACHE_MS) {
    return cache.data;
  }

  const [gdpRows, lifeRows, countries] = await Promise.all([
    getIndicator(GDP_INDICATOR),
    getIndicator(LIFE_INDICATOR),
    getRealCountries()
  ]);

  // Look up life expectancy by country code
  const lifeByCode = new Map();
  for (const row of lifeRows) {
    if (row.value !== null) lifeByCode.set(row.countryiso3code, row.value);
  }

  // Keep countries that have both values
  const records = [];
  for (const row of gdpRows) {
    const code = row.countryiso3code;
    if (!countries.has(code) || row.value === null || !lifeByCode.has(code)) continue;
    records.push({
      code,
      name: row.country.value,
      gdp: row.value,
      logGdp: Math.log10(row.value),
      life: lifeByCode.get(code)
    });
  }

  if (records.length < 10) {
    throw new Error('Not enough data returned by the World Bank API');
  }

  // Fit life expectancy = b + m * log10(GDP per capita) with simple-statistics
  const pairs = records.map(r => [r.logGdp, r.life]);
  const line = ss.linearRegression(pairs);
  const predict = ss.linearRegressionLine(line);

  for (const r of records) {
    r.predicted = predict(r.logGdp);
    r.residual = r.life - r.predicted;
  }

  const byResidual = [...records].sort((a, b) => b.residual - a.residual);

  const data = {
    year: YEAR,
    count: records.length,
    slope: line.m,
    intercept: line.b,
    r2: ss.rSquared(pairs, predict),
    correlation: ss.sampleCorrelation(pairs.map(p => p[0]), pairs.map(p => p[1])),
    medianGdp: ss.median(records.map(r => r.gdp)),
    meanLife: ss.mean(records.map(r => r.life)),
    above: byResidual.slice(0, 5),               // live longer than the line predicts
    below: byResidual.slice(-5).reverse(),       // live shorter than the line predicts
    chart: buildChart(records, line)
  };

  cache = { data, time: Date.now() };
  return data;
}

// Convert data values to SVG pixel coordinates for the scatter plot
function buildChart(records, line) {
  const width = 560, height = 360, pad = 50;
  const xMin = Math.floor(ss.min(records.map(r => r.logGdp)));
  const xMax = Math.ceil(ss.max(records.map(r => r.logGdp)));
  const yMin = Math.floor(ss.min(records.map(r => r.life)) / 10) * 10;
  const yMax = Math.ceil(ss.max(records.map(r => r.life)) / 10) * 10;

  const sx = x => pad + ((x - xMin) / (xMax - xMin)) * (width - 2 * pad);
  const sy = y => height - pad - ((y - yMin) / (yMax - yMin)) * (height - 2 * pad);

  const xTicks = [];
  for (let x = xMin; x <= xMax; x++) {
    xTicks.push({ pos: sx(x), label: '$' + Math.pow(10, x).toLocaleString('en-US') });
  }
  const yTicks = [];
  for (let y = yMin; y <= yMax; y += 10) {
    yTicks.push({ pos: sy(y), label: y });
  }

  return {
    width, height, pad,
    points: records.map(r => ({ x: sx(r.logGdp), y: sy(r.life), name: r.name })),
    line: {
      x1: sx(xMin), y1: sy(line.b + line.m * xMin),
      x2: sx(xMax), y2: sy(line.b + line.m * xMax)
    },
    xTicks, yTicks
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', active: '/' });
});

app.get('/math', (req, res) => {
  res.render('math', { title: 'The Math', active: '/math', example: fitExample() });
});

app.get('/assumptions', (req, res) => {
  res.render('assumptions', { title: 'Assumptions', active: '/assumptions' });
});

app.get('/python', (req, res) => {
  res.render('python', { title: 'In Python', active: '/python' });
});

app.get('/data', async (req, res) => {
  try {
    const world = await getWorldData();
    res.render('data', { title: 'Real Data', active: '/data', world, error: null });
  } catch (err) {
    console.error(err);
    res.render('data', { title: 'Real Data', active: '/data', world: null, error: err.message });
  }
});

// Anything else
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found', active: '' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
