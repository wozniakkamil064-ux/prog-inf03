import { mountLab } from './lab.mjs?v=4';
import { mountRecall } from './recall.mjs?v=4';
import { mountExams, mountArchive } from './exams.mjs';
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

const warmups = [
  {subject:'JavaScript',title:'Co wypisze ten kod?',code:'const cena = "12";\nconsole.log(cena + 5);',options:['17','"125"','Błąd'],answer:1,why:'Wartość cena jest tekstem. Operator + łączy ją z zapisem liczby 5. Użyj Number(cena), aby dodawać liczby.'},
  {subject:'PHP',title:'Której wartości szuka PHP?',code:'<input id="email" name="kontakt">\n\n<?php $email = $_POST["kontakt"];',options:['name="kontakt"','id="email"','typu pola'],answer:0,why:'Atrybut name określa klucz wysyłany do PHP. id pozwala powiązać pole z etykietą lub odnaleźć je w JavaScripcie.'},
  {subject:'SQL',title:'Jaka będzie kolejność cen?',code:'SELECT cena FROM produkty\nORDER BY cena DESC;\n\n-- W bazie: 12, 45, 28',options:['12, 28, 45','45, 28, 12','28, 45, 12'],answer:1,why:'DESC sortuje malejąco. Najwyższa cena pojawi się jako pierwsza.'},
  {subject:'CSS',title:'Ile miejsca zajmie obrys?',code:'.karta {\n  width: 200px;\n  padding: 10px;\n  box-sizing: border-box;\n}',options:['200 px','220 px','180 px'],answer:0,why:'Przy border-box szerokość obejmuje padding i obramowanie. Obrys ma 200 px, a miejsce na treść ma 180 px.'},
  {subject:'HTML',title:'Co połączy etykietę z polem?',code:'<label for="imie">Imię</label>\n<input name="osoba" id="...">',options:['id="osoba"','id="label"','id="imie"'],answer:2,why:'Wartość for w label odpowiada identyfikatorowi id pola. Kliknięcie etykiety ustawi w nim fokus.'}
];
let warmupIndex=0;
const warmupOptions=q('#warmup-options');
const warmupFeedback=q('#warmup-feedback');
const warmupNext=q('#warmup-next');
function showWarmup(focus=false) {
  const current=warmups[warmupIndex];
  q('#warmup-subject').textContent=current.subject;
  q('#warmup-heading').textContent=current.title;
  q('#warmup-code code').textContent=current.code;
  warmupOptions.innerHTML=current.options.map((option,index)=>
    '<button type="button" class="warmup-option" data-answer="'+index+'">'+e(option)+'</button>').join('');
  warmupFeedback.textContent='Spróbuj odpowiedzieć z pamięci.';
  warmupFeedback.className='warmup-feedback';
  warmupNext.hidden=true;
  if(focus) q('button',warmupOptions).focus({preventScroll:true});
}
warmupOptions.addEventListener('click',event=>{
  const button=event.target.closest('[data-answer]');
  if(!button || button.disabled) return;
  const current=warmups[warmupIndex];
  const correct=Number(button.dataset.answer)===current.answer;
  qa('button',warmupOptions).forEach(item=>{
    item.disabled=true;
    if(Number(item.dataset.answer)===current.answer) item.classList.add('correct');
  });
  if(!correct) button.classList.add('incorrect');
  warmupFeedback.classList.add('answered');
  warmupFeedback.textContent=(correct?'Dobrze. ':'Poprawna odpowiedź: '+current.options[current.answer]+'. ')+current.why;
  warmupNext.hidden=false;
});
warmupNext.addEventListener('click',()=>{warmupIndex=(warmupIndex+1)%warmups.length;showWarmup(true);});
showWarmup();

function mountCourse(data) {
  const area = q('#course');
  const modules = data.moduly;
  const all = modules.flatMap(group => group.lessons.map(item => ({...item, group})));
  const byId = new Map(all.map(item => [item.id,item]));
  const index = all.map(item => ({item,text:plain([item.group.title,item.title,item.body,item.code,item.trap,item.practice].join(' '))}));
  let lesson = byId.get(state.last) || all[0];
  let module = lesson.group;
  const header = q('#header-progress');
  const continueButton = q('#continue');
  const lessonCount = () => all.filter(item => state.lessons[item.id]).length;
  area.innerHTML = '<div class="course-toolbar"><div class="course-current"><span class="small-label">OTWARTY MODUŁ</span>'+
    '<strong id="course-module-title"></strong><span class="small" id="course-module-status"></span></div>'+
    '<label class="course-search" for="lesson-search"><span>Szukaj lekcji</span><input type="search" id="lesson-search" placeholder="Temat lub fragment kodu" autocomplete="off" aria-describedby="lesson-search-status"></label></div>'+
    '<div class="course-search-results" id="course-search-results" hidden><p id="lesson-search-status" role="status"></p><div id="lesson-search-matches"></div></div>'+
    '<div class="course-layout"><nav class="course-modules" aria-label="Moduły kursu"></nav><div class="course-reader" id="course-reader"></div></div>';
  const search = q('#lesson-search',area);
  const moduleList = q('.course-modules',area);
  const reader = q('#course-reader',area);
  const resultsPanel = q('#course-search-results',area);
  const matches = q('#lesson-search-matches',area);
  const status = q('#lesson-search-status',area);
  const currentTitle = q('#course-module-title',area);
  const currentStatus = q('#course-module-status',area);
  function progressText(item) {
    return item.lessons.filter(x=>state.lessons[x.id]).length+'/'+item.lessons.length;
  }
  function updateProgress() {
    header.textContent = lessonCount() + ' / ' + all.length + ' lekcji';
    continueButton.textContent = state.last ? 'Wróć do lekcji' : 'Zacznij naukę';
    currentTitle.textContent = module.title;
    currentStatus.textContent = progressText(module) + ' ukończonych lekcji';
    moduleList.innerHTML = modules.map(item =>
      '<button type="button" class="course-module" data-module="'+e(item.id)+'" aria-pressed="'+(item===module)+'">'+
      '<span class="course-module-title">'+e(item.title)+'</span><span class="course-module-count">'+progressText(item)+'</span></button>'
    ).join('');
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
  function renderMatches() {
    const words = plain(search.value.trim()).split(/\s+/).filter(Boolean);
    resultsPanel.hidden = words.length===0;
    if (!words.length) {
      status.textContent = '';
      matches.innerHTML = '';
      return;
    }
    const results = index.filter(row=>words.every(word=>row.text.includes(word))).map(row=>row.item);
    status.textContent = countText(results.length,['wynik','wyniki','wyników']);
    matches.innerHTML = results.length ? results.map(item =>
      '<button class="course-search-match" type="button" data-result="'+e(item.id)+'"><strong>'+e(item.title)+'</strong><span>'+e(item.group.title)+'</span></button>'
    ).join('') : '<p class="small">Spróbuj krótszego hasła albo nazwy języka.</p>';
  }
  function render() {
    reader.innerHTML = lessonMarkup();
    updateProgress();
  }
  function choose(next, focus) {
    if (!next) return;
    module = next.group;
    lesson = next;
    state.last = next.id;
    search.value = '';
    save();
    renderMatches();
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
      chooseModule(moduleButton.dataset.module,true);
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
      updateProgress();
    }
  });
  search.addEventListener('input',renderMatches);
  document.addEventListener('keydown',event=>{
    if (event.target===search && event.key==='Escape' && search.value) { search.value=''; renderMatches(); return; }
    if (event.key==='/' && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !event.target.closest('input,textarea,select,[contenteditable]')) { event.preventDefault(); search.focus(); }
  });
  continueButton.addEventListener('click',()=>choose(lesson,false));
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
