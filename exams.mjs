import { elapsed, mountRecall } from './recall.mjs?v=5';

function timerStatus(record, maximum) {
  const source=record && typeof record==='object' ? record : {};
  source.done ??= {};
  if (!Number.isFinite(source.remaining)) source.remaining=maximum;
  if (!Number.isFinite(source.deadline)) source.deadline=null;
  return source;
}

function timerRemaining(record, maximum, now=Date.now()) {
  return Math.max(0,Math.min(maximum,record.deadline ? record.deadline-now : record.remaining));
}

export function mountExams(area,data,{q,qa,e,code,fold,btn,state,save}) {
  const exams=data.probne;
  state.exam ??= {};
  let active=exams.find(item=>item.id===state.examId) || exams[0];
  area.innerHTML = '<div class="tabs" aria-label="Wybierz temat próby">'+exams.map(item=>
    '<button class="tab" type="button" data-exam="'+e(item.id)+'">'+e(item.title.replace('Próbny egzamin / ',''))+'</button>').join('')+
    '</div><div class="exam-grid" id="exam-body"></div>';
  const body=q('#exam-body',area);
  const cap=()=>active.minutes*60000;
  const status=()=> state.exam[active.id]=timerStatus(state.exam[active.id],cap());
  const remaining=()=>timerRemaining(status(),cap());
  const total=()=>active.sections.reduce((sum,section)=>sum+section.items.length,0);
  function update() {
    const value=remaining();
    const record=status();
    const validIDs=active.sections.flatMap((section,i)=>section.items.map((_,n)=>i+'-'+n));
    const progress=validIDs.filter(id=>record.done[id]).length;
    if(record.deadline&&value===0) { record.deadline=null; record.remaining=0; record.finished=true; record.expired=true; save(); }
    q('#exam-time',area).textContent=elapsed(value,true);
    const toggle=q('[data-action=toggle]',area);
    toggle.disabled=record.finished || value===0;
    toggle.textContent=record.finished?'Próba zakończona':record.deadline?'Wstrzymaj':value<cap()?'Wznów':'Uruchom zegar';
    q('[data-action=finish]',area).disabled=record.finished || (!record.deadline && value===cap());
    q('#exam-status',area).textContent=progress+' / '+total()+' kryteriów wykonanych';
    q('#exam-progress',area).value=progress;
    const message=record.expired?'Czas minął. Porównaj oddane pliki z kluczem i testami odbioru.':
      record.finished?'Próba zakończona. Sprawdź pliki z kluczem. Checklista służy do samooceny.':
      record.deadline?'Zegar biegnie także po przejściu na inną stronę.':'Uruchom zegar, gdy masz przygotowane pliki i stanowisko.';
    q('#exam-message',area).textContent=message;
  }
  function render() {
    qa('[data-exam]',area).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exam===active.id)));
    body.innerHTML='<article class="exam-card"><h3>'+e(active.title.replace('Próbny egzamin / ',''))+'</h3><p>'+e(active.brief)+'</p>'+
      '<a class="button quiet" href="'+e(active.sqlFile)+'" download>Pobierz bazę SQL</a>'+
      active.sections.map((step,i)=>fold(step.title,step.items.map((item,n)=>{
        const id=i+'-'+n;
        return '<label class="check"><input type="checkbox" data-check="'+id+'" '+(status().done[id]?'checked':'')+'><span>'+e(item)+'</span></label>';
      }).join(''))).join('')+
      fold('Klucz i testy odbioru',code(active.queries.join('\n\n'))+'<ul>'+active.smoke.map(item=>'<li>'+e(item)+'</li>').join('')+'</ul>')+
      '</article><aside class="exam-card exam-sticky"><p class="small-label">CZAS POZOSTAŁY</p><p id="exam-time" class="exam-time"></p><div class="tool-row">'+
      btn('Uruchom zegar','data-action="toggle"','primary')+btn('Zakończ próbę','data-action="finish"')+btn('Nowa próba','data-action="reset"')+'</div>'+
      '<p class="small" id="exam-message" role="status"></p><p class="small" id="exam-status"></p><progress id="exam-progress" value="0" max="'+total()+'" aria-label="Ukończone kryteria"></progress></aside>';
    update();
  }
  area.addEventListener('click',event=>{
    const exam=event.target.closest('[data-exam]')?.dataset.exam;
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(exam) { active=exams.find(item=>item.id===exam); state.examId=active.id; save(); render(); }
    if(action==='toggle') {
      if(status().finished) return;
      if(status().deadline) { status().remaining=remaining(); status().deadline=null; }
      else status().deadline=Date.now()+remaining();
      save(); update();
    }
    if(action==='finish') {
      status().remaining=remaining();
      status().deadline=null;
      status().finished=true;
      save(); update();
    }
    if(action==='reset' && confirm('Wyzerować zegar i checklistę tej próby?')) {
      state.exam[active.id]={done:{}};
      save(); render();
    }
  });
  area.addEventListener('change',event=>{
    if (!event.target.dataset.check) return;
    status().done[event.target.dataset.check]=event.target.checked;
    save(); update();
  });
  setInterval(()=>{ if(status().deadline) update(); },1000);
  render();
}

export function mountArchive(area,data,{q,e,plain,countText}) {
  const count=data.counts.requirements;
  area.innerHTML='<div class="tool-row">'+[['HTML i CSS',count.html5],['SQL',count.sql],['PHP',count.php],['JavaScript',count.js]].map(([label,n])=>
    '<span class="chip"><b>'+n+'</b> / '+data.coverage.count+' · '+label+'</span>').join('')+
    '</div><div class="controls"><label class="control">Znajdź arkusz<input type="search" id="archive-search" placeholder="np. Islandia 2026"></label><p id="archive-count" role="status"></p></div>'+
    '<div id="archive-list"></div><p class="source"><a href="https://mahlik.ucz.edu.pl/kursy/materialy/">Katalog arkuszy</a> · <a href="https://egzaminy.gov.pl/cke/tresc/o-egzaminie-egzamin-zawodowy-formula-2019">Zasady CKE</a></p>';
  const input=q('#archive-search',area);
  const list=q('#archive-list',area);
  const link=(label,url)=>'<a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>';
  function render() {
    const terms=plain(input.value.trim()).split(/\s+/).filter(Boolean);
    const found=data.variants.filter(item=>terms.every(term=>plain([item.title,item.id,item.session,...item.tech].join(' ')).includes(term)));
    q('#archive-count',area).textContent=countText(found.length,['arkusz','arkusze','arkuszy']);
    list.innerHTML=Object.keys(data.coverage.sessions).map((session,i)=>{
      const rows=found.filter(item=>item.session===session);
      return rows.length?'<details class="fold" '+(i===0||terms.length?'open':'')+'><summary>'+session+' · '+rows.length+'</summary><ul class="archive-list">'+
        rows.map(item=>'<li><span><strong>'+e(item.title)+'</strong><br><span class="small">'+e(item.id+' · '+item.tech.join(', '))+'</span></span><span class="archive-links">'+
          link('Arkusz',item.pdf)+(item.rubric?link('Klucz',item.rubric):'')+item.materials.map((f,n)=>link('Pliki'+(item.materials.length>1?' '+(n+1):''),f.url)).join('')+
        '</span></li>').join('')+'</ul></details>':'';
    }).join('');
  }
  input.addEventListener('input',render);
  render();
}

function mountArchiveTrial(area,archive,{q,e,fold,btn,plain,countText,state,save}) {
  const variants=archive.variants;
  const maximum=150*60000;
  state.archivedExams ??= {};
  let active=variants.find(item=>item.id===state.archiveExamId) || variants[0];
  const checklist=[
    'Odczytałem wymagania i mam wszystkie pliki wskazane w poleceniu.',
    'Sprawdziłem strukturę strony, style i zgodność z ilustracją w arkuszu.',
    'Przetestowałem wymagane skrypty oraz operacje na danych, jeśli występują w poleceniu.',
    'Przygotowałem wymagane grafiki, zrzuty i pliki tekstowe we właściwych formatach.',
    'Otworzyłem końcowy projekt i porównałem każdy rezultat z zasadami oceniania.',
  ];
  const status=()=>state.archivedExams[active.id]=timerStatus(state.archivedExams[active.id],maximum);
  const remaining=()=>timerRemaining(status(),maximum);
  const link=(label,url)=>'<a class="button quiet" href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+e(label)+'</a>';
  area.innerHTML='<div class="exam-card"><h3>Arkusze z poprzednich sesji</h3>'+
    '<p>Wybierz jeden z '+variants.length+' publicznych arkuszy standardowych terminu głównego. Pobierz polecenie i materiały, przygotuj środowisko, a następnie uruchom 150 minut.</p>'+
    '<div class="controls"><label class="control">Wyszukaj arkusz<input type="search" id="trial-search" placeholder="Tytuł, rok, PHP lub JS"></label>'+
    '<p class="small" id="trial-search-count" role="status"></p></div>'+
    '<details class="fold" open><summary>Wybierz arkusz do próby</summary><div class="exam-archive-list" id="trial-list"></div></details></div>'+
    '<div class="exam-grid" id="trial-body"></div>';
  const list=q('#trial-list',area);
  const search=q('#trial-search',area);
  const body=q('#trial-body',area);
  function renderList() {
    const terms=plain(search.value.trim()).split(/\s+/).filter(Boolean);
    const rows=variants.filter(item=>terms.every(term=>plain([item.id,item.title,item.session,...item.tech].join(' ')).includes(term)));
    q('#trial-search-count',area).textContent=countText(rows.length,['arkusz','arkusze','arkuszy']);
    list.innerHTML=rows.map(item=>'<button class="course-search-match" type="button" data-trial="'+e(item.id)+'" aria-pressed="'+(item===active)+'">'+
      '<strong>'+e(item.title)+'</strong><span>'+e(item.id+' · '+item.tech.join(', '))+'</span></button>').join('') ||
      '<p class="small">Brak wyników. Spróbuj samego roku lub nazwy technologii.</p>';
  }
  function update() {
    const record=status();
    const value=remaining();
    if(record.deadline&&value===0) {
      record.remaining=0;
      record.deadline=null;
      record.finished=true;
      record.expired=true;
      save();
    }
    q('#trial-time',area).textContent=elapsed(value,true);
    const toggle=q('[data-trial-action=toggle]',area);
    toggle.disabled=Boolean(record.finished || value===0);
    toggle.textContent=record.finished?'Próba zakończona':record.deadline?'Wstrzymaj':value<maximum?'Wznów':'Uruchom zegar';
    q('[data-trial-action=finish]',area).disabled=Boolean(record.finished || (!record.deadline && value===maximum));
    const done=checklist.filter((_,index)=>record.done[index]).length;
    q('#trial-status',area).textContent=done+' / '+checklist.length+' pozycji checklisty';
    q('#trial-progress',area).value=done;
    const message=record.expired?'Czas minął. Zatrzymaj pracę i przejdź do zasad oceniania.':
      record.finished?'Próba zakończona. Ocenę wykonujesz samodzielnie według klucza do wybranego arkusza.':
      record.deadline?'Zegar biegnie także po opuszczeniu tej strony.':'Zegar startuje po kliknięciu. Checkboxy są pomocą przy samoocenie.';
    const notice=q('#trial-message',area);
    if(notice.textContent!==message) notice.textContent=message;
  }
  function renderTrial(focus=false) {
    const record=status();
    body.innerHTML='<article class="exam-card"><p class="small-label">'+e(active.id)+'</p><h3 id="trial-title" tabindex="-1">'+e(active.title)+'</h3>'+
      '<p>Wykonaj zadanie lokalnie według pełnego polecenia z PDF. Wymagane technologie: '+e(active.tech.join(', '))+'.</p>'+
      '<div class="tool-row">'+link('Otwórz arkusz PDF',active.pdf)+
      active.materials.map((file,index)=>link(active.materials.length===1?'Pobierz materiały':'Materiały '+(index+1),file.url)).join('')+'</div>'+
      '<h4>Kontrola oddawanej pracy</h4><p class="small">Szczegółowe nazwy plików i kryteria znajdziesz w swoim arkuszu.</p>'+
      checklist.map((item,index)=>'<label class="check"><input type="checkbox" data-trial-check="'+index+'" '+(record.done[index]?'checked':'')+'><span>'+e(item)+'</span></label>').join('')+
      (active.rubric?fold('Sprawdź pracę według klucza','<p>Porównaj pliki i działanie projektu z każdym kryterium. Oficjalny próg zaliczenia praktyki wynosi 75% punktów.</p>'+
      link('Otwórz zasady oceniania',active.rubric)):'')+'</article>'+
      '<aside class="exam-card exam-sticky"><p class="small-label">CZAS POZOSTAŁY</p><p class="exam-time" id="trial-time"></p>'+
      '<div class="tool-row">'+btn('Uruchom zegar','data-trial-action="toggle"','primary')+
      btn('Zakończ próbę','data-trial-action="finish"')+btn('Nowa próba','data-trial-action="reset"')+'</div>'+
      '<p class="small" id="trial-message" role="status"></p><p class="small" id="trial-status"></p>'+
      '<progress id="trial-progress" value="0" max="'+checklist.length+'" aria-label="Ukończone pozycje checklisty"></progress></aside>';
    update();
    if(focus) q('#trial-title',area).focus({preventScroll:true});
  }
  area.addEventListener('click',event=>{
    const choice=event.target.closest('[data-trial]')?.dataset.trial;
    const action=event.target.closest('[data-trial-action]')?.dataset.trialAction;
    if(choice) {
      const selected=variants.find(item=>item.id===choice);
      if(!selected) return;
      active=selected;
      state.archiveExamId=active.id;
      save();
      renderList();
      renderTrial(true);
      return;
    }
    if(action==='toggle') {
      const record=status();
      if(record.finished) return;
      if(record.deadline) { record.remaining=remaining(); record.deadline=null; }
      else record.deadline=Date.now()+remaining();
      save(); update();
    }
    if(action==='finish') {
      const record=status();
      record.remaining=remaining();
      record.deadline=null;
      record.finished=true;
      save(); update();
    }
    if(action==='reset' && confirm('Rozpocząć tę próbę od nowa? Zegar i checklista zostaną wyzerowane.')) {
      state.archivedExams[active.id]={done:{}};
      save(); renderTrial();
    }
  });
  area.addEventListener('change',event=>{
    if(event.target.dataset.trialCheck===undefined) return;
    status().done[event.target.dataset.trialCheck]=event.target.checked;
    save(); update();
  });
  search.addEventListener('input',renderList);
  setInterval(()=>{if(status().deadline) update();},1000);
  renderList();
  renderTrial();
}

export function mountExamCenter(area,data,archive,kit) {
  const {q,qa,e,state,save}=kit;
  const modes=[
    ['written','Pisemny · 60 min'],
    ['practice','Praktyczny · 150 min'],
    ['archive','Arkusze · 150 min'],
  ];
  let selected=modes.some(([id])=>id===state.examCenterMode)?state.examCenterMode:'written';
  area.innerHTML='<div class="tabs exam-center-tabs" aria-label="Rodzaj egzaminu">'+modes.map(([id,label])=>
    '<button class="tab" type="button" data-center-mode="'+id+'" aria-pressed="'+(id===selected)+'">'+e(label)+'</button>').join('')+
    '</div><section class="panel exam-center-pane" id="exam-written" aria-label="Próba pisemna"></section>'+
    '<section class="exam-center-pane" id="exam-practice" aria-label="Autorskie próby praktyczne" hidden></section>'+
    '<section class="exam-center-pane" id="exam-archive" aria-label="Próba z archiwalnym arkuszem" hidden></section>';
  mountRecall(q('#exam-written',area),data,{...kit,examOnly:true});
  mountExams(q('#exam-practice',area),data,kit);
  mountArchiveTrial(q('#exam-archive',area),archive,kit);
  function renderMode() {
    qa('[data-center-mode]',area).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.centerMode===selected)));
    modes.forEach(([id])=>{q('#exam-'+id,area).hidden=id!==selected;});
  }
  area.addEventListener('click',event=>{
    const mode=event.target.closest('[data-center-mode]')?.dataset.centerMode;
    if(!modes.some(([id])=>id===mode)) return;
    selected=mode;
    state.examCenterMode=mode;
    save();
    renderMode();
  });
  renderMode();
}
