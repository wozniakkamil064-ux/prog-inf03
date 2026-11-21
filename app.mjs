import { mountLab } from './lab.mjs';
import { mountRecall } from './recall.mjs';
import { mountExams, mountArchive } from './exams.mjs';

const demo = {
  HTML: ['index.html', '<form>\n  <label for="email">E-mail</label>\n  <input id="email" type="email">\n</form>', 'Etykieta i pole działają razem.', 'Kliknięcie etykiety ustawia fokus w polu.'],
  CSS: ['style.css', '.karty {\n  display: grid;\n  grid-template-columns: 2fr 1fr;\n  gap: 16px;\n}', 'Jak ułożą się kolumny?', 'Dwie kolumny w proporcji 2:1 i odstęp 16 px.'],
  SQL: ['kwerendy.sql', 'SELECT nazwa, cena\nFROM rowery\nWHERE dostepny = 1\nORDER BY cena ASC\nLIMIT 2;', 'Co zwróci zapytanie?', 'Dwie najtańsze dostępne pozycje.'],
  JS: ['app.js', 'const stawka = 12.50;\nconst godziny = Number("4");\nconst koszt = stawka * godziny;\nconsole.log(koszt);', 'Jaki będzie wynik?', '50'],
  PHP: ['index.php', '<?php\n$wynik = $db->query("SELECT nazwa FROM rowery");\nwhile ($r = $wynik->fetch_assoc()) {\n  echo htmlspecialchars($r["nazwa"], ENT_QUOTES, "UTF-8");\n}', 'Jak dane trafią do HTML?', 'Pętla wypisze kolejne nazwy jako bezpieczny tekst.']
};
let selected = 'HTML';
const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
const e = escapeHTML;
const code = (value) => '<pre class="codebox"><code>' + e(value) + '</code></pre>';
const fold = (title, inner) => '<details class="fold"><summary>' + e(title) + '</summary>' + inner + '</details>';
const btn = (label, attrs='', style='') => '<button type="button" class="button '+style+'" '+attrs+'>'+e(label)+'</button>';
const plain = value => String(value).toLocaleLowerCase('pl').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/ł/g,'l');
const countText = (n, forms) => n+' '+forms[n===1?0:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?1:2];
let state;
try { state = JSON.parse(localStorage.getItem('prog-inf03-kurs-2')) || {}; } catch { state = {}; }
const save = () => { try { localStorage.setItem('prog-inf03-kurs-2',JSON.stringify(state)); } catch {} };
state.lessons ??= {};
state.completed ??= {};
state.variants ??= {};
state.drafts ??= {};
state.missed ??= {};
state.exam ??= {};
const kit = { q,qa,e,code,fold,btn,plain,countText,state,save };

const demoTabs = q('#demo-tabs');
const demoResult = q('#demo-result');
const demoRun = q('#demo-run');
demoTabs.innerHTML = Object.keys(demo).map(key => '<button type="button" data-demo="'+key+'" aria-pressed="'+(key===selected)+'">'+key+'</button>').join('');
demoRun.hidden = false;
demoTabs.addEventListener('click',event => {
  const button = event.target.closest('[data-demo]');
  if (!button) return;
  selected = button.dataset.demo;
  for (const tab of qa('[data-demo]',demoTabs)) tab.setAttribute('aria-pressed',String(tab===button));
  const [file,sample,initial] = demo[selected];
  q('#demo-file').textContent = file;
  q('#demo-code code').textContent = sample;
  demoResult.textContent = initial;
  delete demoResult.dataset.ran;
});
demoRun.addEventListener('click',() => {
  demoResult.textContent = '› ' + demo[selected][3];
  delete demoResult.dataset.ran;
  requestAnimationFrame(() => { demoResult.dataset.ran = 'yes'; });
});
demoResult.setAttribute('role','status');

function mountCourse(data) {
  const area = q('#course');
  const modules = data.moduly;
  const all = modules.flatMap(module => module.lessons);
  const previous = modules.find(module => module.lessons.some(item => item.id === state.last));
  let module = previous || modules[0];
  let lesson = module.lessons.find(item => item.id === state.last) || module.lessons[0];
  const header = q('#header-progress');
  const continueButton = q('#continue');
  const lessonCount = () => all.filter(item => state.lessons[item.id]).length;
  let used = Boolean(state.last);
  function updateProgress() {
    header.textContent = lessonCount() + ' / ' + all.length + ' lekcji';
    continueButton.textContent = used ? 'Wróć do lekcji' : 'Zacznij naukę';
  }
  function render() {
    const i = module.lessons.indexOf(lesson);
    const global = all.indexOf(lesson);
    area.innerHTML = '<aside class="sidebar"><p class="small-label">MODUŁY</p><div class="contacts">'+modules.map((item,n) =>
      '<button class="side-button" type="button" data-module="'+item.id+'" aria-pressed="'+(item===module)+'">'+(n+1)+'. '+e(item.title)+
      '<span>'+item.lessons.filter(x=>state.lessons[x.id]).length+'/'+item.lessons.length+'</span></button>'
    ).join('')+'</div></aside><article class="main-panel"><p class="small-label">'+e(module.title)+'</p><h3 tabindex="-1">'+e(lesson.title)+'</h3>'+
    '<div class="lesson-select"><label for="lesson-select">Lekcja '+(i+1)+' z '+module.lessons.length+'</label><select id="lesson-select">'+
    module.lessons.map((item,n)=>'<option value="'+item.id+'"'+(item===lesson?' selected':'')+'>'+(n+1)+'. '+e(item.title)+'</option>').join('')+'</select></div>'+
    '<p>'+e(lesson.body)+'</p>'+code(lesson.code)+'<div class="note"><strong>'+(lesson.priority===1?'Zapamiętaj na egzamin':'Uzupełnienie')+'</strong><p>'+e(lesson.trap)+
    '</p></div><p><strong>Sprawdź się.</strong> '+e(lesson.practice)+'</p>'+
    fold('Cel modułu','<p>'+e(module.finish)+'</p>')+
    '<div class="tool-row">'+btn('Poprzednia','data-lesson="-1" '+(global===0?'disabled':''))+btn('Następna','data-lesson="1" '+(global===all.length-1?'disabled':''),'primary')+
    '<label class="check"><input id="lesson-done" type="checkbox" '+(state.lessons[lesson.id]?'checked':'')+'> Umiem wykonać</label></div></article>';
    updateProgress();
  }
  function choose(next, focus) {
    if (!next) return;
    module = modules.find(group => group.lessons.includes(next));
    lesson = next;
    used = true;
    state.last = next.id;
    save();
    render();
    if(focus) q('h3',area).focus({preventScroll:true});
  }
  area.addEventListener('click',event => {
    const moduleButton = event.target.closest('[data-module]');
    const step = event.target.closest('[data-lesson]');
    if (moduleButton) {
      const group = modules.find(item=>item.id===moduleButton.dataset.module);
      choose(group.lessons.find(item=>!state.lessons[item.id]) || group.lessons[0],true);
    } else if(step) choose(all[all.indexOf(lesson)+Number(step.dataset.lesson)],true);
  });
  area.addEventListener('change',event => {
    if(event.target.id==='lesson-select') { choose(all.find(item=>item.id===event.target.value),false); q('#lesson-select').focus(); }
    if(event.target.id==='lesson-done') {
      state.lessons[lesson.id] = event.target.checked;
      state.last = lesson.id;
      used = true;
      save();
      const active = q('[data-module="'+module.id+'"] span',area);
      active.textContent = module.lessons.filter(item=>state.lessons[item.id]).length+'/'+module.lessons.length;
      updateProgress();
    }
  });
  render();
}

const nav = qa('#nav a');
if ('IntersectionObserver' in window) {
  const watch = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = nav.find(item => item.hash === '#'+entry.target.id);
      if (entry.isIntersecting) link?.setAttribute('aria-current','location');
      else link?.removeAttribute('aria-current');
    });
  },{ rootMargin:'-18% 0px -63% 0px' });
  nav.forEach(item=>watch.observe(q(item.hash)));
}

async function get(file) {
  const response = await fetch(file);
  if (!response.ok) throw new Error(file+' HTTP '+response.status);
  return response.json();
}
try {
  const [data,archive] = await Promise.all([get('materialy.json'),get('archiwum.json')]);
  mountCourse(data);
  mountLab(q('#lab'),kit);
  mountRecall(q('#recall'),data,kit);
  mountExams(q('#exams'),data,kit);
  mountArchive(q('#archive'),archive,kit);
} catch (error) {
  console.error(error);
  const errorMarkup = '<div class="notice">Nie udało się wczytać interaktywnej części. <a href="lektura.html">Otwórz wersję do czytania</a> lub odśwież stronę.</div>';
  for(const selector of ['#course','#lab','#recall','#exams','#archive']) q(selector).innerHTML = errorMarkup;
}
