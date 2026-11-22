import { gapTopics, gapFamilies, gapCount, gapVariantsPerFamily, getGap, checkGap } from './gaps-data.mjs';

const shuffle = values => {
  const result=[...values];
  for(let i=result.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
};
const allTasks=gapFamilies.flatMap(family=>Array.from({length:family.variants},(_,index)=>getGap(family.id,index+1)));
const known=new Map(allTasks.map(item=>[item.id,item]));
const selectorOptions=(values,current,e)=>values.map(([value,label])=>'<option value="'+e(value)+'"'+(value===current?' selected':'')+'>'+e(label)+'</option>').join('');

export function mountGaps(area,{q,e,code,fold,btn,countText,state,save}) {
  state.gapPractice ??= {};
  const memory=state.gapPractice;
  memory.completed ??= {};
  memory.missed ??= {};
  memory.queues ??= {};
  let language=gapTopics.some(item=>item.language===memory.language)?memory.language:'all';
  let topic=memory.topic || 'all';
  let level=['1','2'].includes(memory.level)?memory.level:'all';
  let review=Boolean(memory.review);
  let active=known.get(memory.current);
  let draft='';
  let revealed=false;
  let checked=false;
  const chosenTopics=()=>language==='all'?[...new Set(gapFamilies.map(item=>item.topic))]:gapTopics.find(item=>item.language===language).topics;
  if(topic!=='all'&&!chosenTopics().includes(topic)) topic='all';
  const pool=()=>allTasks.filter(item=>(language==='all'||item.language===language)&&(topic==='all'||item.topic===topic)&&
    (level==='all'||String(item.level)===level)&&(!review||memory.missed[item.id]));
  const filterKey=()=>[language,topic,level,review?'missed':'all'].join('|');
  function persist() {
    Object.assign(memory,{language,topic,level,review,current:active?.id});
    save();
  }
  function next() {
    const available=pool();
    if(!available.length) { active=null; draft=''; persist(); render(); return; }
    const key=filterKey();
    const allowed=new Set(available.map(item=>item.id));
    let queue=(memory.queues[key]||[]).filter(id=>allowed.has(id));
    if(!queue.length) {
      queue=shuffle([...allowed]);
      if(queue.length>1&&queue[0]===active?.id) [queue[0],queue[1]]=[queue[1],queue[0]];
    }
    active=known.get(queue.shift());
    memory.queues[key]=queue;
    draft='';
    revealed=false;
    checked=false;
    persist();
    render();
  }
  function stats() {
    const done=Object.keys(memory.completed).filter(id=>known.has(id)&&memory.completed[id]).length;
    const missed=Object.keys(memory.missed).filter(id=>known.has(id)&&memory.missed[id]).length;
    return {done,missed};
  }
  function updateStats() {
    const {done,missed}=stats();
    q('#gap-progress',area).textContent=countText(done,['ukończone zadanie','ukończone zadania','ukończonych zadań'])+' · '+missed+' do powtórzenia';
  }
  function render() {
    const items=pool();
    const topics=chosenTopics();
    if(topic!=='all'&&!topics.includes(topic)) topic='all';
    const total=gapCount.toLocaleString('pl-PL');
    area.innerHTML='<div class="gap-shell"><div class="gap-intro"><div><h2>Uzupełnij brakujący fragment</h2>'+
      '<p>'+gapFamilies.length+' umiejętności · '+total+' wariantów. Wpisz słowo, operator albo krótki fragment kodu w miejsce <code>____</code>.</p></div>'+
      '<p class="gap-progress" id="gap-progress"></p></div><div class="gap-filters">'+
      '<label class="control">Technologia<select id="gap-language">'+selectorOptions([['all','Wszystkie'],...gapTopics.map(item=>[item.language,item.language])],language,e)+'</select></label>'+
      '<label class="control">Temat<select id="gap-topic">'+selectorOptions([['all','Wszystkie tematy'],...topics.map(item=>[item,item])],topic,e)+'</select></label>'+
      '<label class="control">Poziom<select id="gap-level">'+selectorOptions([['all','Oba poziomy'],['1','Podstawy'],['2','Zastosowanie']],level,e)+'</select></label>'+
      '<label class="check gap-review"><input id="gap-review" type="checkbox"'+(review?' checked':'')+'> Powtórka błędów</label></div><div id="gap-question"></div></div>';
    updateStats();
    const question=q('#gap-question',area);
    if(!active || !items.some(item=>item.id===active.id)) {
      question.innerHTML='<div class="gap-empty"><h3>'+(review?'Brak błędów w tym zestawie.':'Brak zadań dla wybranych filtrów.')+'</h3>'+
        '<p>'+(review?'Rozwiązuj nowe zadania. Po błędnej odpowiedzi trafią do powtórki.':'Zmień technologię, temat lub poziom.')+'</p>'+
        btn('Pokaż wszystkie zadania','data-gap="all"')+'</div>';
      return;
    }
    const displayCode=e(active.code).replace('____','<mark class="gap-marker">____</mark>');
    question.innerHTML='<article class="gap-card"><div class="gap-meta"><span>'+e(active.language)+' · '+e(active.topic)+' · '+(active.level===1?'Podstawy':'Zastosowanie')+'</span>'+
      '<span>'+countText(items.length,['zadanie w zestawie','zadania w zestawie','zadań w zestawie'])+'</span></div>'+
      '<h3 tabindex="-1">'+e(active.title)+'</h3><p>'+e(active.prompt)+'</p>'+
      '<pre class="codebox gap-code"><code>'+displayCode+'</code></pre>'+
      '<form id="gap-form" autocomplete="off"><label class="control" for="gap-answer">Brakujący fragment</label>'+
      '<textarea rows="2" id="gap-answer" class="gap-answer" spellcheck="false" autocapitalize="off" placeholder="Wpisz sam fragment, bez pozostałego kodu"></textarea>'+
      '<div class="tool-row">'+btn('Sprawdź','data-gap="check"','primary')+btn('Kolejne zadanie','data-gap="next"')+'</div></form>'+
      '<div id="gap-feedback" class="gap-feedback" aria-live="polite"></div>'+
      fold('Podpowiedź','<p>'+e(active.hint)+'</p>')+
      '<details class="fold" id="gap-solution"><summary>Pokaż rozwiązanie</summary><p><strong>'+e(active.answers[0])+'</strong></p><p>'+e(active.explanation)+'</p>'+code(active.solution)+'</details>'+
      '<p class="small gap-counter">Wariant '+active.variant+' z '+gapVariantsPerFamily+' dla tej umiejętności.</p></article>';
    q('#gap-answer',area).value=draft;
    q('#gap-form',area).addEventListener('submit',event=>{event.preventDefault();check();});
    const solution=q('#gap-solution',area);
    solution.addEventListener('toggle',()=>{
      if(solution.isConnected&&solution.open&&!checked) {
        revealed=true;
        memory.missed[active.id]=true;
        persist();
        updateStats();
      }
    });
  }
  function check() {
    if(!active) return;
    const answer=q('#gap-answer',area).value;
    const output=q('#gap-feedback',area);
    if(!answer.trim()) {
      output.innerHTML='<div class="note">Wpisz brakujący fragment, zanim sprawdzisz.</div>';
      q('#gap-answer',area).focus();
      return;
    }
    const correct=checkGap(answer,active);
    checked=correct;
    if(correct&&!revealed) {
      memory.completed[active.id]=true;
      delete memory.missed[active.id];
    } else if(!correct) {
      memory.missed[active.id]=true;
    }
    const result=correct?(revealed?'Fragment pasuje. Wróć do tego zadania później i spróbuj bez podglądania.':'Dobrze. Fragment pasuje do kodu.'):'Jeszcze nie. Sprawdź składnię i spróbuj ponownie. Możesz skorzystać z podpowiedzi.';
    output.innerHTML='<div class="note '+(correct?'ok':'error')+'"><strong>'+e(result)+'</strong>'+
      (correct?'<p>'+e(active.explanation)+'</p>':'')+'</div>';
    persist();
    updateStats();
  }
  area.addEventListener('input',event=>{
    if(event.target.id==='gap-answer') draft=event.target.value;
  });
  area.addEventListener('change',event=>{
    const target=event.target;
    if(target.id==='gap-language') { language=target.value; topic='all'; next(); }
    if(target.id==='gap-topic') { topic=target.value; next(); }
    if(target.id==='gap-level') { level=target.value; next(); }
    if(target.id==='gap-review') { review=target.checked; next(); }
  });
  area.addEventListener('click',event=>{
    const action=event.target.closest('[data-gap]')?.dataset.gap;
    if(action==='check') check();
    if(action==='next') { next(); q('#gap-question h3',area)?.focus({preventScroll:true}); }
    if(action==='all') { language='all'; topic='all'; level='all'; review=false; next(); }
  });
  if(active&&pool().some(item=>item.id===active.id)) render();
  else next();
}
