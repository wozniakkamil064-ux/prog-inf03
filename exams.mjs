import { elapsed } from './recall.mjs';

export function mountExams(area,data,{q,qa,e,code,fold,btn,state,save}) {
  const exams=data.probne;
  let active=exams.find(item=>item.id===state.examId) || exams[0];
  area.innerHTML = '<div class="tabs" aria-label="Wybierz temat próby">'+exams.map(item=>
    '<button class="tab" type="button" data-exam="'+e(item.id)+'">'+e(item.title.replace('Próbny egzamin / ',''))+'</button>').join('')+
    '</div><div class="exam-grid" id="exam-body"></div>';
  const body=q('#exam-body',area);
  const status=()=> state.exam[active.id] ||= { done:{} };
  const cap=()=>active.minutes*60000;
  const remaining=()=>status().deadline ? Math.max(0,status().deadline-Date.now()) : (status().remaining ?? cap());
  const total=()=>active.sections.reduce((sum,section)=>sum+section.items.length,0);
  function update() {
    const value=remaining();
    const progress=Object.values(status().done).filter(Boolean).length;
    if(status().deadline&&value===0) { status().deadline=null; status().remaining=0; save(); }
    q('#exam-time',area).textContent=elapsed(value,true);
    const toggle=q('[data-action=toggle]',area);
    toggle.disabled=value===0;
    toggle.textContent=status().deadline?'Wstrzymaj':value===0?'Czas minął':value<cap()?'Wznów':'Uruchom zegar';
    q('#exam-status',area).textContent=progress+' / '+total()+' kryteriów wykonanych';
    q('#exam-progress',area).value=progress;
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
      btn('Uruchom zegar','data-action="toggle"','primary')+btn('Wyzeruj','data-action="reset"')+'</div>'+
      '<p class="small" id="exam-status"></p><progress id="exam-progress" value="0" max="'+total()+'" aria-label="Ukończone kryteria"></progress></aside>';
    update();
  }
  area.addEventListener('click',event=>{
    const exam=event.target.closest('[data-exam]')?.dataset.exam;
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(exam) { active=exams.find(item=>item.id===exam); state.examId=active.id; save(); render(); }
    if(action==='toggle') {
      if(status().deadline) { status().remaining=remaining(); status().deadline=null; }
      else status().deadline=Date.now()+remaining();
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
