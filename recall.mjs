const shuffle = list => {
  const items = [...list];
  for (let i=items.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [items[i],items[j]]=[items[j],items[i]];
  }
  return items;
};
export const elapsed = (milliseconds, withHours=false) => {
  const n = Math.max(0,Math.ceil(milliseconds/1000));
  const fields = withHours ? [Math.floor(n/3600),Math.floor(n/60)%60,n%60] : [Math.floor(n/60),n%60];
  return fields.map(value=>String(value).padStart(2,'0')).join(':');
};
export function mountRecall(area,data,{q,qa,e,code,fold,btn,plain,countText,state,save,examOnly=false}) {
  const labels = { quiz:'Quiz',flash:'Fiszki',html:'Słownik HTML' };
  const modes = { diagnose:'Diagnoza',test:'Próba pisemna',review:'Powtórka błędów' };
  const modeInfo = { diagnose:'12 pytań. Wyjaśnienie otrzymasz od razu.',test:'40 pytań w 60 minut. Wynik zobaczysz po oddaniu.',review:'Powtórz błędne i pominięte pytania.' };
  const pool = new Map(data.pytania.map(item=>[item.id,item]));
  const missed = () => data.pytania.filter(item=>state.missed[item.id]);
  const topicNames = {html:'HTML',sql:'SQL',javascript:'JavaScript',css:'CSS',php:'PHP',media:'Multimedia i CMS',foundations:'Podstawy informatyki',workplace:'Praca zawodowa'};
  let tab='quiz', mode=examOnly?'test':'diagnose', quiz=state.quiz;
  let topic='Wszystkie', cardIndex=0, upright=false;
  let tagFilter='', tagPriority=false;
  area.innerHTML = (examOnly?'':'<div class="tabs" aria-label="Tryb powtórki">'+Object.entries(labels).map(([id,label])=>
    '<button class="tab" type="button" data-pane="'+id+'" aria-pressed="'+(tab===id)+'">'+label+'</button>').join('')+
    '</div>')+'<div class="recall-content" id="recall-view"></div>';
  const view=q('#recall-view',area);
  function start() {
    let questions=shuffle(mode==='review'?missed():data.pytania);
    if (mode==='diagnose') {
      const first = [...new Set(questions.map(item=>item.module))].map(name=>questions.find(item=>item.module===name));
      questions=shuffle([...first,...questions.filter(item=>!first.includes(item)).slice(0,Math.max(0,12-first.length))]);
    }
    if (mode==='test') questions=questions.slice(0,40);
    if (!questions.length) return;
    quiz={mode,runId:crypto.randomUUID?.() || String(Date.now()),ids:questions.map(item=>item.id),index:0,answers:{},checked:{},finished:false,
      deadline:mode==='test'?Date.now()+3600000:null,orders:questions.map(()=>shuffle([0,1,2,3]))};
    state.quiz=quiz; state.quizSessions[mode]=quiz; save(); render();
  }
  const hasQuiz = () => quiz?.ids.length && quiz.ids.every(id=>pool.has(id));
  function grade(item) {
    if (quiz.answers[item.id]===item.answer) delete state.missed[item.id];
    else state.missed[item.id]=true;
  }
  function finish(expired=false) {
    if (!hasQuiz() || quiz.finished) return;
    quiz.finished=true;
    quiz.expired=expired;
    quiz.ids.forEach(id=>grade(pool.get(id)));
    save();
  }
  function renderQuiz() {
    if (hasQuiz() && quiz.deadline && Date.now()>=quiz.deadline) finish(true);
    const setup = examOnly?'':'<div class="choice-row">'+Object.entries(modes).map(([id,label])=>
      '<button type="button" class="chip" data-mode="'+id+'" aria-pressed="'+(id===mode)+'">'+label+(id==='review'?' ('+missed().length+')':'')+'</button>'
    ).join('')+'</div>';
    if (!hasQuiz() || quiz.mode!==mode) {
      return setup+'<h3>'+modes[mode]+'</h3><p>'+modeInfo[mode]+(examOnly?' Próg zaliczenia to 20 poprawnych odpowiedzi. Zegar biegnie także po przejściu na inną stronę kursu.':'')+'</p>'+
        (mode==='review'&&!missed().length?'<p>Nie masz jeszcze pytań do powtórzenia.</p>':btn('Rozpocznij','data-quiz="start"','primary'));
    }
    if (quiz.finished) {
      const ids=quiz.ids;
      const points=ids.filter(id=>quiz.answers[id]===pool.get(id).answer).length;
      const wrong=ids.filter(id=>quiz.answers[id]!==pool.get(id).answer);
      const byTopic=[...new Set(ids.map(id=>pool.get(id).module))].map(name=>{
        const subset=ids.filter(id=>pool.get(id).module===name);
        return '<li>'+e(topicNames[name] || name)+': '+subset.filter(id=>quiz.answers[id]===pool.get(id).answer).length+' / '+subset.length+'</li>';
      }).join('');
      const feedback=wrong.map(id=>{
        const item=pool.get(id);
        return fold(item.text,'<p>Twoja odpowiedź: '+e(item.options[quiz.answers[id]] || 'brak')+'</p><p><strong>Poprawna:</strong> '+e(item.options[item.answer])+'</p><p>'+e(item.explanation)+'</p>');
      }).join('');
      return setup+'<h3 tabindex="-1">'+points+' / '+ids.length+' poprawnych</h3>'+
        (quiz.expired?'<p class="note">Czas minął. Test został oddany automatycznie.</p>':'')+
        (mode==='test'?'<p>'+(points>=20?'Próg części pisemnej osiągnięty.':'Wynik poniżej progu 20 punktów.')+'</p>':'')+
        '<ul>'+byTopic+'</ul>'+feedback+btn('Nowa runda','data-quiz="start"','primary');
    }
    const item=pool.get(quiz.ids[quiz.index]);
    const checked=quiz.checked[item.id];
    const test=mode==='test';
    const number=quiz.index+1;
    const options=quiz.orders[quiz.index].map(index=>'<label class="quiz-option"><input type="radio" name="answer" value="'+index+'" '+
      (quiz.answers[item.id]===index?'checked ':'')+(checked?'disabled':'')+'> <span>'+e(item.options[index])+'</span></label>').join('');
    const results=checked?'<div class="note '+(quiz.answers[item.id]===item.answer?'ok':'error')+'"><strong>'+
      (quiz.answers[item.id]===item.answer?'Dobrze.':'Poprawna odpowiedź: '+e(item.options[item.answer]))+'</strong><p>'+e(item.explanation)+'</p></div>':'';
    return setup+'<p class="small-label">Pytanie '+number+' / '+quiz.ids.length+' · '+e(topicNames[item.module]||'INF.03')+
      (test?' · <span id="quiz-time" aria-label="Pozostały czas">'+elapsed(quiz.deadline-Date.now())+'</span>':'')+'</p><h3 class="question" tabindex="-1">'+e(item.text)+'</h3>'+
      '<div role="radiogroup" aria-label="Wybierz odpowiedź">'+options+'</div>'+results+'<div class="tool-row">'+
      (test&&quiz.index?btn('Poprzednie','data-quiz="back"'):'')+
      ((test||checked)&&number<quiz.ids.length?btn('Następne','data-quiz="next"'):'')+
      (!test&&!checked?btn('Sprawdź','data-quiz="check"','primary'):'')+
      (test||(checked&&number===quiz.ids.length)?btn(test?'Oddaj test':'Pokaż wynik','data-quiz="finish"','primary'):'')+
      '</div><p id="quiz-feedback" role="status"></p>';
  }
  const cards = () => data.fiszki.filter(item=>topic==='Wszystkie'||item.topic===topic);
  function renderFlash() {
    const list=cards();
    const item=list[cardIndex];
    return '<label class="control">Temat<select id="flash-topic">'+['Wszystkie',...new Set(data.fiszki.map(item=>item.topic))].map(t=>
      '<option'+(t===topic?' selected':'')+'>'+e(t)+'</option>').join('')+'</select></label><div class="flash-card"><div class="small-label">'+
      e(item.topic)+' · '+(cardIndex+1)+' / '+list.length+'</div><h3>'+e(item.front)+'</h3>'+
      (upright?'<p class="flash-answer">'+e(item.back)+'</p>':'<p class="muted">Odpowiedz z pamięci, a potem odwróć fiszkę.</p>')+
      '</div><div class="tool-row">'+btn('Poprzednia','data-flash="back"')+btn(upright?'Zakryj odpowiedź':'Pokaż odpowiedź','data-flash="flip"','primary')+
      btn('Następna','data-flash="next"')+'</div>';
  }
  function filterTags() {
    const rows=data.znaczniki.filter(item=>(!tagPriority||item.priority===1)&&plain(item.tag+' '+item.group+' '+item.body).includes(plain(tagFilter.trim())));
    q('#tag-count',area).textContent=countText(rows.length,['element','elementy','elementów']);
    q('#tag-list',area).innerHTML=rows.map(item=>'<details class="tag-card"><summary><strong>&lt;'+e(item.tag)+'&gt;</strong> · '+e(item.group)+'</summary><p>'+
      e(item.body)+'</p>'+code(item.code)+'</details>').join('');
  }
  function render() {
    qa('[data-pane]',area).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pane===tab)));
    if (tab==='quiz') view.innerHTML=renderQuiz();
    if (tab==='flash') view.innerHTML=renderFlash();
    if (tab==='html') {
      view.innerHTML='<div class="controls"><label class="control">Szukaj znacznika<input type="search" id="tag-search" value="'+e(tagFilter)+'" placeholder="np. label"></label>'+
        '<label class="check"><input id="tag-priority" type="checkbox" '+(tagPriority?'checked':'')+'> Priorytet egzaminacyjny</label></div>'+
        '<p id="tag-count" role="status"></p><div id="tag-list" class="tag-list"></div><p><a href="https://html.spec.whatwg.org/multipage/indices.html#elements-3">Indeks WHATWG</a></p>';
      filterTags();
    }
  }
  area.addEventListener('input',event=>{
    if(event.target.id==='tag-search') { tagFilter=event.target.value; filterTags(); }
  });
  area.addEventListener('change',event=>{
    const target=event.target;
    if(target.name==='answer'&&hasQuiz()) { quiz.answers[quiz.ids[quiz.index]]=Number(target.value); save(); }
    if(target.id==='flash-topic') { topic=target.value; cardIndex=0; upright=false; render(); q('#flash-topic',area).focus(); }
    if(target.id==='tag-priority') { tagPriority=target.checked; filterTags(); }
  });
  area.addEventListener('click',event=>{
    const pane=event.target.closest('[data-pane]')?.dataset.pane;
    const change=event.target.closest('[data-mode]')?.dataset.mode;
    const action=event.target.closest('[data-quiz]')?.dataset.quiz;
    const flash=event.target.closest('[data-flash]')?.dataset.flash;
    if(pane) { tab=pane; render(); return; }
    if(change) { mode=change; quiz=state.quizSessions[mode]; render(); q('[data-mode="'+mode+'"]',area).focus(); return; }
    if(flash) {
      if(flash==='flip') upright=!upright;
      else { cardIndex=(cardIndex+cards().length+(flash==='next'?1:-1))%cards().length; upright=false; }
      render(); q('[data-flash="'+flash+'"]',area).focus(); return;
    }
    if(!action) return;
    if(action==='start') { start(); q('h3',view)?.focus({preventScroll:true}); return; }
    const id=quiz.ids[quiz.index];
    if(action==='check') {
      if(quiz.answers[id]===undefined) { q('#quiz-feedback').textContent='Wybierz odpowiedź.'; return; }
      quiz.checked[id]=true; grade(pool.get(id));
    }
    if(action==='next') quiz.index++;
    if(action==='back') quiz.index--;
    if(action==='finish') {
      if(mode==='test'&&Object.keys(quiz.answers).length<quiz.ids.length&&!quiz.endConfirmed) {
        quiz.endConfirmed=true; q('#quiz-feedback').textContent='Część pytań jest bez odpowiedzi. Kliknij ponownie, aby oddać.'; return;
      }
      finish();
    } else quiz.endConfirmed=false;
    save(); render(); q('h3',view)?.focus({preventScroll:true});
  });
  state.quizSessions ??= {};
  if (state.quiz?.mode && !state.quizSessions[state.quiz.mode]) state.quizSessions[state.quiz.mode]=state.quiz;
  quiz=state.quizSessions[mode];
  setInterval(()=>{
    const exam=state.quizSessions.test;
    if(!exam?.deadline||exam.finished) return;
    if(Date.now()>=exam.deadline) {
      const previous=quiz;
      quiz=exam; finish(true); quiz=previous;
      if(tab==='quiz'&&mode==='test') render();
      return;
    }
    const clock=q('#quiz-time',area);
    if(clock) clock.textContent=elapsed(exam.deadline-Date.now());
  },1000);
  render();
}
