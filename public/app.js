const API_BASE = '';

const DAYS_TR = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
];

const MINUTE_PX = 1;

let LAST_EVENTS = [];

/* -------- Time helpers -------- */
function toMinutes(hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function toHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function normalizeTime(str) {
  // Accept "9", "9:0", "09:00" -> "HH:MM"
  if (!str) return null;
  const s = String(str).trim();
  const m1 = /^(\d{1,2}):?(\d{0,2})$/.exec(s);
  if (!m1) return null;
  const h = Math.max(0, Math.min(23, parseInt(m1[1],10)));
  const mm = m1[2] ? Math.max(0, Math.min(59, parseInt(m1[2],10))) : 0;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

/* -------- Intervals drawing -------- */
function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = intervals.slice().sort((a,b) => a.startMin - b.startMin);
  const out = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur.startMin <= last.endMin) {
      last.endMin = Math.max(last.endMin, cur.endMin);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

function buildColumns() {
  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';
  for (let d = 0; d < 7; d++) {
    const col = document.createElement('div');
    col.className = 'day-col';

    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = DAYS_TR[d];
    col.appendChild(header);

    const timeline = document.createElement('div');
    timeline.className = 'timeline';

    // Saat çizgileri ve etiketleri
    for (let h = 0; h <= 24; h++) {
      const y = h * 60 * MINUTE_PX;
      const line = document.createElement('div');
      line.className = 'hour-line';
      line.style.top = `${y}px`;
      timeline.appendChild(line);

      const label = document.createElement('div');
      label.className = 'hour-label';
      label.textContent = `${String(h).padStart(2,'0')}:00`;
      label.style.top = `${y}px`;
      timeline.appendChild(label);
    }

    col.appendChild(timeline);
    grid.appendChild(col);
  }
}

async function fetchEvents() {
  const res = await fetch(`${API_BASE}/api/events`);
  if (!res.ok) throw new Error('Etkinlikleri çekme hatası');
  const json = await res.json();
  return json.events || [];
}

function drawBlocks(events) {
  const perDay = Array.from({ length: 7 }, () => []);
  for (const evt of events) {
    const startMin = toMinutes(evt.start);
    const endMin = toMinutes(evt.end);
    if (Number.isFinite(startMin) && Number.isFinite(endMin)) {
      perDay[evt.day]?.push({ startMin, endMin });
    }
  }

  const grid = document.getElementById('weekGrid');
  for (let d = 0; d < 7; d++) {
    const col = grid.children[d];
    const timeline = col.querySelector('.timeline');

    Array.from(timeline.querySelectorAll('.block')).forEach(n => n.remove());

    const merged = mergeIntervals(perDay[d]);
    for (const m of merged) {
      const top = m.startMin * MINUTE_PX;
      const height = (m.endMin - m.startMin) * MINUTE_PX;

      const block = document.createElement('div');
      block.className = 'block';
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;

      const label = document.createElement('div');
      label.className = 'block-label';
      label.textContent = `${toHHMM(m.startMin)} - ${toHHMM(m.endMin)}`;
      block.appendChild(label);

      timeline.appendChild(block);
    }
  }
}

/* -------- Event list (optional UI) -------- */
function ensureEventListContainer() {
  let list = document.getElementById('eventList');
  if (list) return list;
  const controls = document.querySelector('.controls');
  list = document.createElement('div');
  list.id = 'eventList';
  list.style.maxHeight = '260px';
  list.style.overflow = 'auto';
  list.style.padding = '8px';
  list.style.border = '1px solid #d0d0d0';
  list.style.borderRadius = '8px';
  list.style.background = '#fff';
  list.style.minWidth = '320px';

  const title = document.createElement('div');
  title.textContent = 'Kayıtlı Dersler';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';
  list.appendChild(title);

  controls.appendChild(list);
  return list;
}

function renderEventList(events) {
  const list = ensureEventListContainer();
  Array.from(list.children).forEach((ch, idx) => { if (idx > 0) ch.remove(); });

  if (!events.length) {
    const empty = document.createElement('div');
    empty.textContent = 'Kayıt yok';
    empty.style.color = '#666';
    list.appendChild(empty);
    return;
  }

  const sorted = events.slice().sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return toMinutes(a.start) - toMinutes(b.start);
  });

  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.margin = '0';
  ul.style.padding = '0';
  ul.style.display = 'flex';
  ul.style.flexDirection = 'column';
  ul.style.gap = '6px';

  for (const e of sorted) {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.justifyContent = 'space-between';
    li.style.gap = '8px';
    li.style.padding = '6px 8px';
    li.style.border = '1px solid #eee';
    li.style.borderRadius = '6px';
    li.style.background = '#fafafa';

    const info = document.createElement('div');
    info.textContent = `${DAYS_TR[e.day]} | ${e.start} - ${e.end} | ${e.name}`;
    info.title = `ID: ${e.id}`;
    info.style.fontSize = '13px';

    const del = document.createElement('button');
    del.textContent = 'Sil';
    del.title = `Sil (ID: ${e.id})`;
    del.style.height = '28px';
    del.style.padding = '0 10px';
    del.style.border = '1px solid #d00';
    del.style.background = '#ffeded';
    del.style.color = '#900';
    del.style.borderRadius = '6px';
    del.style.cursor = 'pointer';
    del.addEventListener('click', async () => {
      const ok = confirm(`${DAYS_TR[e.day]} ${e.start}-${e.end} (${e.name}) kaydını silmek istediğinize emin misiniz?`);
      if (!ok) return;
      try {
        const r = await fetch(`${API_BASE}/api/events/${encodeURIComponent(e.id)}`, { method: 'DELETE' });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Silme hatası');
        }
        await refresh();
      } catch (err) {
        alert(err.message || 'Silme sırasında hata oluştu');
      }
    });

    li.appendChild(info);
    li.appendChild(del);
    ul.appendChild(li);
  }

  list.appendChild(ul);
}

/* -------- CSV import (client-side) -------- */
function mapDay(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (/^\d+$/.test(v)) {
    const n = parseInt(v, 10);
    return (n >= 0 && n <= 6) ? n : null;
  }
  const map = {
    'pazartesi': 0, 'pzt': 0,
    'salı': 1, 'sali': 1,
    'çarşamba': 2, 'carsamba': 2, 'çarsamba': 2, 'crs': 2,
    'perşembe': 3, 'persembe': 3, 'prs': 3,
    'cuma': 4,
    'cumartesi': 5, 'cts': 5,
    'pazar': 6
  };
  if (v in map) return map[v];
  // English fallback
  const mapEn = {
    'monday':0,'tuesday':1,'wednesday':2,'thursday':3,'friday':4,'saturday':5,'sunday':6,
    'mon':0,'tue':1,'wed':2,'thu':3,'fri':4,'sat':5,'sun':6
  };
  return (v in mapEn) ? mapEn[v] : null;
}

function parseCSV(text) {
  // Simple CSV parser with quote support
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  const pushField = () => { row.push(field); field=''; };
  const pushRow = () => { rows.push(row); row=[]; };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i+1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { field += c; i++; continue; }
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { pushField(); i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { pushField(); pushRow(); i++; continue; }
      field += c; i++; continue;
    }
  }
  // flush last field/row
  pushField();
  pushRow();
  // remove trailing empty last row if file ends with newline
  if (rows.length && rows[rows.length-1].every(v => v === '')) rows.pop();
  return rows;
}

function rowsToEvents(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  const idx = {
    name: header.findIndex(h => ['name','isim','kişi','kisi','person'].includes(h)),
    day: header.findIndex(h => ['day','gun','gün','dayname'].includes(h)),
    start: header.findIndex(h => ['start','baslangic','başlangıç','from','start_time'].includes(h)),
    end: header.findIndex(h => ['end','bitis','bitiş','to','end_time'].includes(h)),
  };
  const events = [];
  for (let r = 1; r < rows.length; r++) {
    const rec = rows[r];
    const name = idx.name >= 0 ? rec[idx.name]?.trim() : '';
    const dayRaw = idx.day >= 0 ? rec[idx.day] : null;
    const day = mapDay(dayRaw);
    const start = normalizeTime(idx.start >= 0 ? rec[idx.start] : null);
    const end = normalizeTime(idx.end >= 0 ? rec[idx.end] : null);
    if (!name || day == null || !start || !end) continue;
    if (toMinutes(end) <= toMinutes(start)) continue;
    events.push({ name, day, start, end });
  }
  return events;
}

function setupImportUI() {
  const input = document.getElementById('csvFile');
  const btn = document.getElementById('importBtn');
  const sample = document.getElementById('sampleCsv');

  // Sample CSV download
  const sampleCsv = [
    'name,day,start,end',
    'Ayşe,0,09:00,10:00',
    'Ali,Salı,13:30,15:00',
    'Zeynep,çarşamba,08:15,09:45'
  ].join('\n');
  sample.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(sampleCsv);
  sample.download = 'ornek_takvim.csv';

  btn?.addEventListener('click', async () => {
    if (!input?.files?.length) {
      alert('Lütfen bir CSV dosyası seçin.');
      return;
    }
    const file = input.files[0];
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const events = rowsToEvents(rows);

      if (!events.length) {
        alert('Uygun satır bulunamadı. Başlıklar: name, day (0..6 veya gün adı), start, end');
        return;
      }

      const confirmMsg = `${file.name} dosyasından ${events.length} kayıt içe aktarılacak. Onaylıyor musunuz?`;
      if (!confirm(confirmMsg)) return;

      let ok = 0, fail = 0;
      for (const e of events) {
        try {
          const r = await fetch(`${API_BASE}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e)
          });
          if (!r.ok) throw new Error('POST hatası');
          ok++;
        } catch {
          fail++;
        }
      }
      await refresh();
      alert(`İçe aktarma tamamlandı. Başarılı: ${ok}, Hatalı: ${fail}`);
      input.value = '';
    } catch (err) {
      console.error(err);
      alert('CSV okunamadı veya işlenemedi.');
    }
  });
}

/* -------- App lifecycle -------- */
async function refresh() {
  const events = await fetchEvents();
  LAST_EVENTS = events;
  drawBlocks(events);
  renderEventList(events);
}

function setupForm() {
  const form = document.getElementById('addForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const day = parseInt(document.getElementById('day').value, 10);
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!name) return alert('Kişi adı zorunlu');
    if (!start || !end) return alert('Saat aralığı zorunlu');
    if (start >= end) return alert('Bitiş, başlangıçtan büyük olmalı');

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, day, start, end })
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json && json.errors ? json.errors.join(', ') : 'Kayıt hatası';
        throw new Error(msg);
      }
      document.getElementById('start').value = '09:00';
      document.getElementById('end').value = '10:00';
      await refresh();
    } catch (err) {
      alert(err.message || 'Hata oluştu');
    }
  });
}

async function main() {
  buildColumns();
  setupForm();
  setupImportUI();
  await refresh();
}

main().catch(console.error);