/* Statik arayüz + basit API. Veriler tek bir JSON dosyasında tutulur. */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DEFAULT_FILE = path.join(DATA_DIR, 'schedule.json');
const TARİH_JSON = path.join(__dirname, 'Tarih.json');

// Dosya seçimi önceliği: env > mevcut Tarih.json > data/schedule.json
const DATA_FILE = process.env.SCHEDULE_FILE
  ? path.resolve(process.env.SCHEDULE_FILE)
  : (fs.existsSync(TARİH_JSON) ? TARİH_JSON : DEFAULT_FILE);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function ensureDataFile() {
  try {
    await fsp.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fsp.access(DATA_FILE, fs.constants.F_OK);
  } catch {
    const initial = { events: [] };
    await fsp.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

async function readState() {
  await ensureDataFile();
  const txt = await fsp.readFile(DATA_FILE, 'utf-8');
  if (!txt.trim()) return { events: [] };
  try {
    const parsed = JSON.parse(txt);
    return parsed && typeof parsed === 'object' && Array.isArray(parsed.events)
      ? parsed
      : { events: [] };
  } catch {
    return { events: [] };
  }
}

async function writeState(state) {
  // Basit atomic yazım: önce .tmp, sonra rename
  const tmp = DATA_FILE + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), 'utf-8');
  await fsp.rename(tmp, DATA_FILE);
}

function parseHHMM(str) {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(str || ''));
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function validateEvent(evt) {
  const errors = [];
  if (!evt || typeof evt !== 'object') return ['Geçersiz gövde'];
  const { name, day, start, end } = evt;
  if (!name || typeof name !== 'string' || !name.trim()) errors.push('name (kişi) zorunlu');
  if (!Number.isInteger(day) || day < 0 || day > 6) errors.push('day 0..6 olmalı (Pzt=0)');
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  if (s == null) errors.push('start HH:MM olmalı');
  if (e == null) errors.push('end HH:MM olmalı');
  if (s != null && e != null && e <= s) errors.push('end, start\'tan büyük olmalı');
  return errors;
}

// API
app.get('/api/events', async (_req, res) => {
  try {
    const state = await readState();
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Okuma hatası' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const errors = validateEvent(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const state = await readState();
    const now = new Date().toISOString();
    const id = 'evt_' + Math.random().toString(36).slice(2, 10);
    const event = { id, createdAt: now, ...req.body };
    state.events.push(event);
    await writeState(state);
    res.status(201).json({ ok: true, event, state });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yazma hatası' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const state = await readState();
    const before = state.events.length;
    state.events = state.events.filter(e => e.id !== id);
    if (state.events.length === before) return res.status(404).json({ error: 'Bulunamadı' });
    await writeState(state);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Silme hatası' });
  }
});

app.get('/api/meta', (_req, res) => {
  res.json({ dataFile: DATA_FILE });
});

// Sunucu
app.listen(PORT, async () => {
  await ensureDataFile();
  console.log(`Sunucu http://localhost:${PORT} üzerinde çalışıyor`);
  console.log(`Veri dosyası: ${DATA_FILE}`);
});