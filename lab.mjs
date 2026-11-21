import { katalog, scenariusze, zadanie } from './cwiczenia.mjs';

const isVisual = task => ['HTML','CSS'].includes(task.category) || task.verification.type === 'dom';
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const jsonForScript = data => JSON.stringify(data).replace(/</g,'\\u003c');
const confinement = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; worker-src blob:; form-action \'none\'; base-uri \'none\'">';
const runnerCsp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; worker-src blob:; form-action \'none\'; base-uri \'none\'">';
const workerScript = 'self.onmessage = ({data}) => { try { const fn = new Function(data.code + "\\nreturn typeof rozwiaz === \\"function\\" ? rozwiaz : null")(); if (!fn) throw Error("Brakuje funkcji rozwiaz."); const results = data.cases.map(test => fn(...test.args)); self.postMessage({results}); } catch (error) { self.postMessage({error:String(error.message || error)}); } };';

function sandboxRun(container, task, source, onResult) {
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox','allow-scripts');
  frame.title = 'Środowisko testów JavaScript';
  frame.hidden = true;
  const token = crypto.randomUUID?.() || String(Math.random());
  const data = { code:source, cases:task.verification.cases, token, workerScript, verification:task.verification };
  let timeout;
  function receive(event) {
    if (event.source !== frame.contentWindow || event.data?.token !== token) return;
    finish(event.data);
  }
  function finish(result) {
    clearTimeout(timeout);
    window.removeEventListener('message',receive);
    frame.remove();
    onResult(result);
  }
  const footer = 'function respond(payload){ parent.postMessage(Object.assign({token: data.token},payload),"*"); }' +
    'if (data.verification.type === "dom") {' +
    'try { const target=document.querySelector(data.verification.action); const input=document.querySelector(data.verification.input); const output=document.querySelector(data.verification.output); new Function(data.code)(); const results=data.cases.map(test=>{input.value=test.value; target.click(); return output.textContent;}); respond({results}); } catch(error){ respond({error:String(error.message || error)}); }' +
    '} else {' +
    'const url=URL.createObjectURL(new Blob([data.workerScript],{type:"application/javascript"})); try { const worker=new Worker(url); worker.onmessage=event=>{worker.terminate(); URL.revokeObjectURL(url); respond(event.data);}; worker.onerror=()=>{worker.terminate(); URL.revokeObjectURL(url); respond({error:"Nie udało się uruchomić testów."});}; worker.postMessage({code:data.code,cases:data.cases}); } catch (error) { URL.revokeObjectURL(url); respond({error:String(error.message || error)}); } }';
  const markup = task.verification.markup || '';
  frame.srcdoc = '<!doctype html><html lang="pl"><head><meta charset="utf-8">'+runnerCsp+'</head><body>'+markup+
    '<script>const data='+jsonForScript(data)+';'+footer+'</script></body></html>';
  window.addEventListener('message',receive);
  timeout = setTimeout(()=>finish({error:'Test przekroczył limit 4 sekund.'}),4000);
  container.append(frame);
}

function sqlRun(task, query, onResult) {
  const worker = new Worker('./sql-worker.js');
  const timeout = setTimeout(() => finish({error:'Zapytanie przekroczyło limit czasu.'}),8500);
  function finish(result) { clearTimeout(timeout); worker.terminate(); onResult(result); }
  worker.onmessage = ({data}) => finish(data);
  worker.onerror = () => finish({error:'Nie udało się uruchomić silnika SQL.'});
  worker.postMessage({setup:task.setup,query,inspect:task.verification.inspect});
}

export function mountLab(area, {q,qa,e,code,fold,btn,state,save}) {
  const categories = [...new Set(katalog.map(item=>item.category))];
  let category = state.labCategory && categories.includes(state.labCategory) ? state.labCategory : 'JavaScript';
  const familyFor = (id,current) => katalog.find(item=>item.id===id && item.category===current) || katalog.find(item=>item.category===current);
  let family = familyFor(state.labFamily,category);
  let task;
  let runSequence = 0;
  const draft = () => state.drafts[task.id] ?? task.starter;
  function render(focus = false) {
    runSequence++;
    const last = state.variants[family.id] ?? 0;
    const scenario = scenariusze[Math.floor(last/16)%scenariusze.length];
    const n = last % 16 + 1;
    task = zadanie(family.id,scenario.id,n);
    const v = task.verification;
    const visual = isVisual(task);
    const automated = ['sql','js','dom'].includes(v.type);
    const choices = katalog.filter(item=>item.category===category).map(item =>
      '<option value="'+e(item.id)+'" '+(item.id===family.id?'selected':'')+'>'+e(item.title)+'</option>').join('');
    const checks = v.type==='checklist' ? '<ul>'+v.items.map(item=>'<li>'+e(item)+'</li>').join('')+'</ul>' : v.type==='php' ?
      '<p>Uruchom rozwiązanie na lokalnym PHP. Wyniki dla przykładowych danych:</p>'+code(v.cases.map(item=>JSON.stringify(item.args)+' → '+JSON.stringify(item.expected)).join('\n')) : '';
    const starterTable = task.setup ? fold('Schemat tabel i dane startowe',code(task.setup)) : '';
    const tool = automated ? btn('Sprawdź rozwiązanie','data-lab="run"','primary') : visual ? btn('Odśwież podgląd','data-lab="run"','primary') : '';
    const preview = visual ? '<div><label class="control">Podgląd</label><iframe id="preview" class="preview" title="Podgląd zadania" sandbox="allow-scripts"></iframe></div>' : '';
    area.innerHTML = '<aside class="sidebar"><p class="small-label">TECHNOLOGIE</p><div class="contacts">'+categories.map(item=>
      '<button class="side-button" type="button" data-tech="'+e(item)+'" aria-pressed="'+(item===category)+'">'+e(item)+
      '<span>'+katalog.filter(group=>group.category===item).length+' rodzin</span></button>').join('')+
      '</div><p class="small">'+Object.values(state.completed).filter(Boolean).length+' ukończonych wariantów</p></aside>'+
      '<article class="main-panel"><div class="controls"><label class="control">Rodzina zadań<select id="family">'+choices+'</select></label>'+
      '<label class="control">Scenariusz<select id="scenario">'+scenariusze.map(item=>'<option value="'+item.id+'" '+(item===scenario?'selected':'')+'>'+e(item.label)+'</option>').join('')+'</select></label>'+
      '<label class="control">Wariant<input id="variant" type="number" min="1" max="16" value="'+n+'"></label>'+btn('Następny wariant','data-lab="next"')+'</div>'+
      '<p class="small-label">'+e(task.category)+' · Poziom '+task.level+' · '+e(task.scenario)+'</p><h3 tabindex="-1">'+e(task.title)+'</h3><p>'+e(task.prompt)+'</p>'+
      starterTable+
      '<div class="editor-grid '+(visual?'with-preview':'')+'"><div><label class="control" for="editor">'+(task.category==='Grafika'?'Notatki do zadania':'Twój kod')+'</label><textarea id="editor" class="editor" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea></div>'+preview+'</div>'+
      '<div class="tool-row">'+tool+btn('Kod startowy','data-lab="reset"')+'</div><div id="lab-result" aria-live="polite"></div>'+
      fold('Wskazówka','<p>'+e(task.hint)+'</p>')+(checks ? fold('Kryteria sprawdzenia',checks) : '')+
      fold('Przykładowe rozwiązanie',code(task.solution))+
      '<label class="check"><input id="task-done" type="checkbox" '+(state.completed[task.id]?'checked':'')+'> Oznacz jako wykonane</label></article>';
    q('#editor',area).value = task.category==='Grafika' ? (state.drafts[task.id] || '') : draft();
    if (visual) updatePreview();
    if (focus) q('h3',area).focus({preventScroll:true});
  }
  function updatePreview() {
    const frame = q('#preview',area);
    if (!frame) return;
    const source = q('#editor',area).value;
    const start = '<!doctype html><meta charset="utf-8">'+confinement;
    if (task.category==='HTML') frame.srcdoc = start + source.replace(/^\s*<!doctype[^>]*>/i,'');
    if (task.category==='CSS') frame.srcdoc = start + '<style>'+source.replace(/<\/style/gi,'')+'</style>'+task.verification.sampleHtml;
    if (task.verification.type==='dom') frame.srcdoc = start+task.verification.markup+'<script>'+source.replace(/<\/script/gi,'')+'</script>';
  }
  function showResult(output, status, message, result = '') {
    output.innerHTML = '<div class="note '+status+'"><strong>'+e(message)+'</strong>'+result+'</div>';
  }
  function mark(done) {
    state.completed[task.id] = done;
    save();
    q('#task-done',area).checked = done;
    q('.sidebar > .small',area).textContent = Object.values(state.completed).filter(Boolean).length+' ukończonych wariantów';
  }
  function run() {
    const v = task.verification;
    const source = q('#editor',area).value;
    const output = q('#lab-result',area);
    const button = q('[data-lab="run"]',area);
    updatePreview();
    if (v.type==='checklist') { showResult(output,'ok','Sprawdź podgląd według kryteriów.'); return; }
    button.disabled = true;
    showResult(output,'','Sprawdzam…');
    const id = ++runSequence;
    const done = ({error,results,columns}) => {
      if (id !== runSequence) return;
      button.disabled = false;
      if (error) { showResult(output,'error',error); return; }
      const expected = v.type==='sql' ? v.result : v.cases.map(item=>item.expected);
      const passed = !v.inspect && v.type==='sql' ? same(results,expected) && columns.length === (v.result[0]?.length ?? 2) : same(results,expected);
      const result = v.type==='sql' ? code((columns.length ? columns.join(' | ')+'\n' : '')+
        results.slice(0,40).map(row=>row.map(value=>value===null?'NULL':String(value)).join(' | ')).join('\n')) :
        '<p>'+v.cases.filter((item,index)=>same(item.expected,results[index])).length+' / '+v.cases.length+' przypadków. '+(passed?'':'Otrzymany wynik: '+e(JSON.stringify(results)))+'</p>';
      showResult(output,passed?'ok':'error',passed?'Wynik zgodny z wymaganiami.':'Wynik różni się od oczekiwanego.',result);
      if (passed) mark(true);
    };
    try {
      if (v.type==='sql') sqlRun(task,source,done);
      else sandboxRun(area,task,source,done);
    } catch(error) { done({error:error.message}); }
  }
  function selectVariant(number) {
    state.variants[family.id] = (number+family.variants)%family.variants;
    save();
    render();
  }
  area.addEventListener('change',event => {
    const t = event.target;
    if (t.id==='family') { family=familyFor(t.value,category); state.labFamily=family.id; save(); render(); q('#family',area).focus(); }
    if (t.id==='scenario') { selectVariant(scenariusze.findIndex(item=>item.id===t.value)*16 +(state.variants[family.id]??0)%16); q('#scenario',area).focus(); }
    if (t.id==='variant') { selectVariant(Math.floor((state.variants[family.id]??0)/16)*16+Math.max(0,Math.min(15,Math.trunc(Number(t.value)||1)-1))); q('#variant',area).focus(); }
    if (t.id==='task-done') mark(t.checked);
  });
  area.addEventListener('input',event => {
    if(event.target.id!=='editor') return;
    state.drafts[task.id] = event.target.value;
    save();
  });
  area.addEventListener('click',event => {
    const tech = event.target.closest('[data-tech]')?.dataset.tech;
    const action = event.target.closest('[data-lab]')?.dataset.lab;
    if (tech) {
      category = tech;
      family = familyFor(state.labFamily,category);
      state.labCategory = category;
      state.labFamily = family.id;
      save(); render(true);
    }
    if (action==='next') { selectVariant((state.variants[family.id]??0)+1); q('[data-lab="next"]',area).focus(); }
    if (action==='run') run();
    if (action==='reset' && (q('#editor',area).value === task.starter || confirm('Wczytać kod startowy w miejsce bieżącej wersji?'))) {
      delete state.drafts[task.id]; save(); render(); q('#editor',area).focus();
    }
  });
  render();
}
