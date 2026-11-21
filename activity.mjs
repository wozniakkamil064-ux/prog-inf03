const key = 'prog-inf03-activity-1';
const change = 'prog-inf03:activity';
const kinds = ['lesson', 'exercise', 'quiz'];
const words = {
  lesson: ['lekcja', 'lekcje', 'lekcji'],
  exercise: ['ćwiczenie', 'ćwiczenia', 'ćwiczeń'],
  quiz: ['quiz', 'quizy', 'quizów'],
};
const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'full' });
const shortDate = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('pl-PL', { month: 'short' });
const yearFormat = new Intl.DateTimeFormat('pl-PL', { year: 'numeric' });
const weekCount = 52;
let inMemory = {};
let memoryOnly = false;

function localKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-');
}

function plusDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function history() {
  if (memoryOnly) return inMemory;
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  } catch {}
  return inMemory;
}

function tally(entries) {
  const count = { lesson: 0, exercise: 0, quiz: 0, total: 0 };
  if (!Array.isArray(entries)) return count;
  for (const entry of entries) {
    if (typeof entry !== 'string') continue;
    const kind = entry.split(':', 1)[0];
    if (!kinds.includes(kind)) continue;
    count[kind]++;
    count.total++;
  }
  return count;
}

export function trackActivity(kind, id) {
  if (!kinds.includes(kind) || id == null || String(id).length === 0) return;
  const date = localKey(new Date());
  const log = history();
  const events = Array.isArray(log[date]) ? log[date] : [];
  const entry = kind + ':' + id;
  if (events.includes(entry)) return;
  const updated = { ...log, [date]: [...events, entry] };
  inMemory = updated;
  try {
    localStorage.setItem(key, JSON.stringify(updated));
    inMemory = {};
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(change));
}

function calendar(log) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const weekday = (today.getDay() + 6) % 7;
  const monday = plusDays(today, -(weekCount - 1) * 7 - weekday);
  const days = Array.from({ length: weekCount * 7 }, (_, index) => {
    const date = plusDays(monday, index);
    return { date, count: tally(log[localKey(date)]), future: date > today };
  });
  let cumulative = Object.keys(log).filter(date => date < localKey(monday))
    .reduce((sum, date) => sum + tally(log[date]).total, 0);
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const values = days.slice(index * 7, index * 7 + 7).filter(day => !day.future);
    const count = { lesson: 0, exercise: 0, quiz: 0, total: 0 };
    for (const day of values) {
      for (const kind of kinds) count[kind] += day.count[kind];
      count.total += day.count.total;
    }
    cumulative += count.total;
    return { first: values[0].date, last: values.at(-1).date, count, cumulative };
  });
  return { today, days, weeks };
}

export function mountActivity(area, _data, { q, qa, e, countText }) {
  if (!area) return;
  const views = { days: 'Dni', weeks: 'Tygodnie', total: 'Narastająco' };
  let view = 'days';
  let active = 0;
  let items = [];
  const activities = count => countText(count, ['aktywność', 'aktywności', 'aktywności']);
  const card = document.createElement('div');
  card.className = 'activity-card';
  card.innerHTML = '<div class="activity-header"><div class="activity-title"><i aria-hidden="true"></i>Aktywność nauki</div>'
    + '<div class="activity-tabs" role="group" aria-label="Zakres wykresu">'
    + Object.entries(views).map(([id, label]) => '<button type="button" data-activity-view="' + id + '">' + label + '</button>').join('')
    + '</div></div><div class="activity-scroll" id="activity-chart"></div>'
    + '<div class="activity-footer"><p id="activity-detail" aria-live="polite"></p><div class="activity-legend" aria-hidden="true"></div></div>';
  const summary = document.createElement('dl');
  summary.className = 'activity-summary';
  const note = document.createElement('p');
  note.className = 'activity-note';
  area.replaceChildren(card, summary, note);
  const plot = q('#activity-chart', card);
  const detail = q('#activity-detail', card);
  const legend = q('.activity-legend', card);

  function describe(item, detailed = false) {
    const period = view === 'days' ? dateFormat.format(item.date) : shortDate.format(item.first) + ' – ' + shortDate.format(item.last) + ' ' + yearFormat.format(item.last);
    const parts = kinds.filter(kind => item.count[kind]).map(kind => countText(item.count[kind], words[kind]));
    const value = detailed && parts.length ? parts.join(', ') : activities(item.count.total);
    const total = view === 'total' ? ' · Łącznie do tej daty: ' + item.cumulative : '';
    return period + ' · ' + value + total;
  }

  function select(index, focus = false) {
    const next = Math.max(0, Math.min(items.length - 1, index));
    const previous = q('[data-activity-point="' + active + '"]', plot);
    if (previous) {
      previous.tabIndex = -1;
      previous.removeAttribute('data-selected');
    }
    active = next;
    const button = q('[data-activity-point="' + active + '"]', plot);
    button.tabIndex = 0;
    button.dataset.selected = 'true';
    detail.textContent = describe(items[active], true);
    if (focus) button.focus({ preventScroll: true });
    const bounds = plot.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    if (buttonBounds.right > bounds.right) plot.scrollLeft += buttonBounds.right - bounds.right + 4;
    if (buttonBounds.left < bounds.left) plot.scrollLeft -= bounds.left - buttonBounds.left + 4;
  }

  function labels(weeks) {
    let previous = -1;
    let previousColumn = -3;
    return weeks.map((week, index) => {
      const month = week.first.getMonth();
      if (month === previous || index - previousColumn < 3) return '';
      previous = month;
      previousColumn = index;
      return '<span style="grid-column:' + (index + 1) + '">' + monthFormat.format(week.first) + '</span>';
    }).join('');
  }

  function render(reset = false) {
    const log = history();
    const { today, days, weeks } = calendar(log);
    items = view === 'days' ? days.filter(day => !day.future) : weeks;
    const max = Math.max(1, ...weeks.map(week => view === 'total' ? week.cumulative : week.count.total));
    const daily = view === 'days';
    const counts = Object.keys(log).filter(date => date <= localKey(today)).map(date => tally(log[date]));
    const daysUsed = counts.filter(count => count.total).length;
    qa('[data-activity-view]', card).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.activityView === view)));
    plot.innerHTML = '<div class="activity-chart-inner" style="--activity-columns:' + weekCount + '">'
      + '<div class="activity-months" aria-hidden="true">' + labels(weeks) + '</div>'
      + '<div class="activity-plot ' + (daily ? 'activity-daily' : 'activity-bars') + '" role="group" aria-label="' + (daily ? 'Ostatnie 52 tygodnie, według dni' : 'Ostatnie 52 tygodnie, według tygodni') + '">'
      + items.map((item, index) => {
        const value = view === 'total' ? item.cumulative : item.count.total;
        const level = value <= 0 ? 0 : value <= 1 ? 1 : value <= 3 ? 2 : value <= 6 ? 3 : 4;
        const info = e(describe(item));
        return '<button type="button" class="activity-point" tabindex="-1" data-activity-point="' + index + '" data-level="' + level
          + '" aria-label="' + info + '" title="' + info + '"' + (daily ? '' : ' style="--activity-value:' + Math.max(0, value / max * 100) + '%"')
          + '>' + (daily ? '' : '<span></span>') + '</button>';
      }).join('')
      + (daily ? days.filter(day => day.future).map(() => '<span class="activity-future" aria-hidden="true"></span>').join('') : '')
      + '</div></div>';
    legend.innerHTML = daily ? '<span>Mniej</span>' + [0, 1, 2, 3, 4].map(level => '<i data-level="' + level + '"></i>').join('') + '<span>Więcej</span>'
      : '<span>' + (view === 'weeks' ? 'Suma aktywności w tygodniu' : 'Aktywności od początku zapisu') + '</span>';
    summary.innerHTML = [
      ['Lekcje', counts.reduce((sum, count) => sum + count.lesson, 0)],
      ['Ćwiczenia', counts.reduce((sum, count) => sum + count.exercise, 0)],
      ['Quizy', counts.reduce((sum, count) => sum + count.quiz, 0)],
      ['Dni nauki', daysUsed],
    ].map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>').join('');
    note.textContent = daysUsed ? 'Zapis w tej przeglądarce nalicza każde ukończenie raz dziennie. Wybierz pole, aby zobaczyć szczegóły.'
      : 'Ukończ lekcję, ćwiczenie lub quiz, a pojawi się tu pierwsza aktywność. Zapis jest lokalny dla tej przeglądarki.';
    select(reset ? items.length - 1 : active);
  }

  card.addEventListener('click', event => {
    const tab = event.target.closest('[data-activity-view]');
    const point = event.target.closest('[data-activity-point]');
    if (tab && view !== tab.dataset.activityView) {
      view = tab.dataset.activityView;
      render(true);
    }
    if (point) select(Number(point.dataset.activityPoint));
  });
  plot.addEventListener('keydown', event => {
    if (!event.target.matches('[data-activity-point]')) return;
    const column = view === 'days' ? 7 : 1;
    const offsets = { ArrowLeft: -column, ArrowRight: column, ArrowUp: -1, ArrowDown: 1 };
    if (!Object.hasOwn(offsets, event.key) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    select(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : active + offsets[event.key], true);
  });
  window.addEventListener(change, () => render(true));
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) render(true); });
  render(true);
}
