import { mountLab } from './lab.mjs?v=3';
import { mountRecall } from './recall.mjs?v=3';
import { mountExams, mountArchive } from './exams.mjs';
import { mountActivity, trackActivity } from './activity.mjs';
import { mountWalkthrough } from './walkthrough.mjs';

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
const kit = { q,qa,e,code,fold,btn,plain,countText,state,save,trackActivity };

const demoTabs = q('#demo-tabs');
const demoResult = q('#demo-result');
const demoRun = q('#demo-run');
demoTabs.innerHTML = Object.keys(demo).map(key => '<button type="button" data-demo="'+key+'" aria-pressed="'+(key===selected)+'">'+key+'</button>').join('');
demoRun.hidden = false;
function renderDemo() {
  const [file,sample,initial] = demo[selected];
  q('#demo-file').textContent = file;
  const highlighted = line => e(line).replace(/(&lt;\/?)([\w?]+)|\b(SELECT|FROM|WHERE|ORDER BY|LIMIT|const|echo|while|return)\b/g,
    (match,prefix,tag,word) => prefix ? prefix+'<b>'+tag+'</b>' : '<b>'+word+'</b>');
  q('#demo-code code').innerHTML = sample.split('\n').map((line,index,lines) =>
    '<span class="demo-line"><span aria-hidden="true" class="line-number">'+(index+1)+'</span><span>'+highlighted(line)+(index===lines.length-1?'<i class="code-cursor" aria-hidden="true"></i>':'')+'</span></span>'
  ).join('\n');
  demoResult.textContent = initial;
  delete demoResult.dataset.ran;
}
renderDemo();
demoTabs.addEventListener('click',event => {
  const button = event.target.closest('[data-demo]');
  if (!button) return;
  selected = button.dataset.demo;
  for (const tab of qa('[data-demo]',demoTabs)) tab.setAttribute('aria-pressed',String(tab===button));
  renderDemo();
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
  const all = modules.flatMap(group => group.lessons.map(item => ({...item, group})));
  const byId = new Map(all.map(item => [item.id,item]));
  const index = all.map(item => ({item,text:plain([item.group.title,item.title,item.body,item.code,item.trap,item.practice].join(' '))}));
  const topics = {
    start:['Pliki','XAMPP','Organizacja'],html:['Semantyka','Znaczniki','Formularze'],css:['Selektory','Grid','Flexbox'],
    sql:['SELECT','JOIN','Agregacje'],js:['DOM','Zdarzenia','Walidacja'],php:['POST','mysqli','Bezpieczny HTML'],
    media:['Formaty','Kadrowanie','CMS'],pisemny:['HTTP','BHP','Teoria'],proby:['SQL + PHP','SQL + JS','Checklista']
  };
  const previous = modules.find(module => module.lessons.some(item => item.id === state.last));
  let module = previous || modules[0];
  let lesson = byId.get(state.last) || all[0];
  let opened = Boolean(previous);
  const header = q('#header-progress');
  const continueButton = q('#continue');
  const lessonCount = () => all.filter(item => state.lessons[item.id]).length;
  const inputLabel = '<label class="sr-only" for="lesson-search">Szukaj w lekcjach</label>';
  area.innerHTML = '<div class="terminal-search">'+inputLabel+
    '<span aria-hidden="true" class="search-prompt">$ szukaj</span><input type="search" id="lesson-search" placeholder="np. JOIN, formularz, grid" autocomplete="off" aria-describedby="lesson-search-status">'+
    '<span id="lesson-search-status" role="status"></span><kbd aria-hidden="true">/</kbd></div><div class="catalog" id="catalog"></div>';
  const search = q('#lesson-search',area);
  const catalog = q('#catalog',area);
  const status = q('#lesson-search-status',area);
  function updateProgress() {
    header.textContent = lessonCount() + ' / ' + all.length + ' lekcji';
    continueButton.textContent = state.last ? 'Wróć do lekcji' : 'Zacznij naukę';
  }
  function lessonMarkup() {
    const i = module.lessons.findIndex(item=>item.id===lesson.id);
    const global = all.indexOf(lesson);
    return '<article class="main-panel lesson-panel" id="lesson-panel"><h3 tabindex="-1">'+e(lesson.title)+'</h3>'+
    '<div class="lesson-select"><label for="lesson-select">Lekcja '+(i+1)+' z '+module.lessons.length+'</label><select id="lesson-select">'+
    module.lessons.map((item,n)=>'<option value="'+e(item.id)+'"'+(item.id===lesson.id?' selected':'')+'>'+(n+1)+'. '+e(item.title)+'</option>').join('')+'</select></div>'+
    '<p>'+e(lesson.body)+'</p>'+code(lesson.code)+'<div class="note"><strong>'+(lesson.priority===1?'Zapamiętaj na egzamin':'Uzupełnienie')+'</strong><p>'+e(lesson.trap)+
    '</p></div><p><strong>Sprawdź się.</strong> '+e(lesson.practice)+'</p>'+
    fold('Cel modułu','<p>'+e(module.finish)+'</p>')+
    '<div class="tool-row">'+btn('Poprzednia','data-lesson="-1" '+(global===0?'disabled':''))+btn('Następna','data-lesson="1" '+(global===all.length-1?'disabled':''),'primary')+
    '<label class="check"><input id="lesson-done" type="checkbox" '+(state.lessons[lesson.id]?'checked':'')+'> Umiem wykonać</label></div></article>';
  }
  function progressText(item) {
    return item.lessons.filter(x=>state.lessons[x.id]).length+'/'+item.lessons.length;
  }
  function render() {
    const words = plain(search.value.trim()).split(/\s+/).filter(Boolean);
    if (words.length) {
      const results = index.filter(row=>words.every(word=>row.text.includes(word))).map(row=>row.item);
      status.textContent = countText(results.length,['wynik','wyniki','wyników']);
      catalog.innerHTML = results.length ? results.map(item =>
        '<button class="catalog-row match-row" type="button" data-result="'+e(item.id)+'"><span class="catalog-title">'+e(item.title)+'</span><span class="catalog-tags">'+e(item.group.title)+'</span></button>'
      ).join('') : '<p class="notice">Brak dopasowań. Spróbuj krótszej frazy.</p>';
    } else {
      status.textContent = countText(all.length,['lekcja','lekcje','lekcji']);
      catalog.innerHTML = modules.map(item => {
        const active = opened && item===module;
        return '<div class="catalog-entry"><button type="button" class="catalog-row" data-module="'+e(item.id)+'" aria-expanded="'+active+'"'+(active?' aria-controls="lesson-panel"':'')+'>'+
          '<span class="catalog-title"><span aria-hidden="true" class="catalog-arrow"></span>'+e(item.title)+'</span>'+
          '<span class="catalog-tags">'+topics[item.id].map(tag=>'<span>'+e(tag)+'</span>').join('')+'</span>'+
          '<span class="catalog-progress" aria-label="'+e(progressText(item)+' ukończonych lekcji')+'">'+progressText(item)+'</span></button>'+
          (active?lessonMarkup():'')+'</div>';
      }).join('');
    }
    updateProgress();
  }
  function choose(next, focus) {
    if (!next) return;
    module = next.group;
    lesson = next;
    opened = true;
    state.last = next.id;
    search.value = '';
    save();
    render();
    if (focus) {
      const heading = q('#lesson-panel h3',area);
      heading.focus({preventScroll:true});
      heading.scrollIntoView({block:'nearest'});
    }
  }
  function chooseModule(id, focus) {
    const group = modules.find(item=>item.id===id);
    if (!group) return;
    const next = group===module ? lesson : byId.get((group.lessons.find(item=>!state.lessons[item.id]) || group.lessons[0]).id);
    choose(next,focus);
  }
  area.addEventListener('click',event => {
    const moduleButton = event.target.closest('[data-module]');
    const step = event.target.closest('[data-lesson]');
    const result = event.target.closest('[data-result]');
    if (moduleButton) {
      const id = moduleButton.dataset.module;
      if (opened && id===module.id) { opened=false; render(); q('[data-module="'+id+'"]',catalog).focus({preventScroll:true}); }
      else chooseModule(id,true);
    } else if(result) {
      choose(byId.get(result.dataset.result),true);
    } else if(step) choose(all[all.indexOf(lesson)+Number(step.dataset.lesson)],true);
  });
  area.addEventListener('change',event => {
    if(event.target.id==='lesson-select') { choose(byId.get(event.target.value),false); q('#lesson-select').focus(); }
    if(event.target.id==='lesson-done') {
      state.lessons[lesson.id] = event.target.checked;
      state.last = lesson.id;
      save();
      if (event.target.checked) trackActivity('lesson',lesson.id);
      const active = q('[data-module="'+module.id+'"] .catalog-progress',area);
      active.textContent = progressText(module);
      active.setAttribute('aria-label',progressText(module)+' ukończonych lekcji');
      updateProgress();
    }
  });
  search.addEventListener('input',render);
  document.addEventListener('keydown',event=>{
    if (event.target===search && event.key==='Escape' && search.value) { search.value=''; render(); return; }
    if (event.key==='/' && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !event.target.closest('input,textarea,select,[contenteditable]')) { event.preventDefault(); search.focus(); }
  });
  continueButton.addEventListener('click',()=>choose(lesson,false));
  qa('[data-track-module]').forEach(link=>link.addEventListener('click',()=>chooseModule(link.dataset.trackModule,false)));
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
  mountActivity(q('#activity'),data,kit);
  mountWalkthrough(q('#walkthrough'),kit);
} catch (error) {
  console.error(error);
  const errorMarkup = '<div class="notice">Nie udało się wczytać interaktywnej części. <a href="lektura.html">Otwórz wersję do czytania</a> lub odśwież stronę.</div>';
  for(const selector of ['#course','#lab','#recall','#exams','#archive','#activity','#walkthrough']) q(selector).innerHTML = errorMarkup;
}
