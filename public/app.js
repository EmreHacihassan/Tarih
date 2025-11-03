const API_BASE = '';

const DAYS_TR = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
];

const MINUTE_PX = 1;

let LAST_EVENTS = [];

function toMinutes(hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

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
  // Gün bazında union blokları çiz
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

    // Eski blokları temizle
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

function ensureEventListContainer() {
  let list = document.getElementById('eventList');
  if (list) return list;

  // controls alanının içine ekle
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
  // Başlık dışındaki içerikleri temizle
  Array.from(list.children).forEach((ch, idx) => { if (idx > 0) ch.remove(); });

  if (!events.length) {
    const empty = document.createElement('div');
    empty.textContent = 'Kayıt yok';
    empty.style.color = '#666';
    list.appendChild(empty);
    return;
  }

  // Gün + start sıralı
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

async function refresh() {
  const events = await fetchEvents();
  LAST_EVENTS = events;
  drawBlocks(events);
  renderEventList(events);
}

function setupForm() {
  const form = document.getElementById('addForm');
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
      // Temizle ve yenile
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
  await refresh();
}

main().catch(console.error);