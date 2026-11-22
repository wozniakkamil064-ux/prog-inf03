import { buildTheorySections, referenceSources } from './reference-data.mjs';

const normalize = value => String(value).toLocaleLowerCase('pl').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/ł/g,'l');
const included = (item, terms, context) => {
  const text = normalize([context,item.title,item.body,item.example,item.trap,...(item.checklist || [])].join(' '));
  return terms.every(word => text.includes(word));
};

export function renderTheoryHTML(data, { e, code }, options = {}) {
  const terms = normalize(options.query || '').trim().split(/\s+/).filter(Boolean);
  const matching = terms.length > 0;
  const sections = buildTheorySections(data);
  let total = 0;
  const contents = sections.map(section => {
    const context = section.title;
    const groups = section.groups.map(group => ({
      ...group,
      items:group.items.filter(item => (!options.priority || item.priority === 1) && included(item,terms,context+' '+group.title))
    })).filter(group => group.items.length);
    const patterns = section.patterns.filter(item => included(item,terms,context));
    const count = groups.reduce((n,group) => n+group.items.length,0);
    total += count + patterns.length;
    if (!count && !patterns.length) return '';
    const patternHTML = patterns.length ? '<details class="reference-group reference-pattern-group"'+(matching?' open':'')+'><summary><span>Struktury do zapamiętania</span><span class="reference-count">'+patterns.length+'</span></summary>'+
      '<p class="reference-intro">Odtwórz schemat z pamięci. Potem porównaj nazwy, kolejność i wymagane elementy z przykładem.</p>'+
      patterns.map((item,index) => '<details class="reference-item reference-pattern"><summary>'+e(item.title)+'</summary><p>'+e(item.body)+'</p>'+
        code(item.example)+'<ul class="reference-checks">'+item.checklist.map(check=>'<li>'+e(check)+'</li>').join('')+'</ul></details>').join('')+'</details>' : '';
    const groupsHTML = groups.map(group => '<details class="reference-group"'+(matching?' open':'')+'><summary><span>'+e(group.title)+'</span><span class="reference-count">'+group.items.length+'</span></summary>'+
      group.items.map(item => '<details class="reference-item"'+(matching?' open':'')+'><summary><span>'+e(item.title)+'</span><span class="reference-priority">'+
      (item.priority===1?'Na egzamin':item.priority===2?'Uzupełnienie':'Rozpoznaj')+'</span></summary><p>'+e(item.body)+'</p>'+code(item.example)+
      '<p class="reference-trap"><strong>Zapamiętaj</strong> '+e(item.trap)+'</p></details>').join('')+'</details>').join('');
    return '<details class="reference-language" id="ref-'+section.id+'"'+(matching || options.openAll || options.openIds?.includes(section.id) || (!options.openIds && section.id==='html')?' open':'')+'>'+
      '<summary class="reference-language-summary"><span><strong>'+e(section.title)+'</strong><span class="reference-description">'+e(section.description)+'</span></span>'+
      '<span class="reference-language-count">'+count+' haseł · '+patterns.length+' wzorców</span></summary><div class="reference-language-body">'+patternHTML+groupsHTML+'</div></details>';
  }).join('');
  const body = contents || '<p class="notice">Brak wyników. Spróbuj nazwy elementu, właściwości lub funkcji, np. label, margin albo COUNT.</p>';
  const sources = '<details class="reference-sources"><summary>Dokumentacja i źródła</summary><p>Katalog obejmuje elementy HTML oraz składnię i wzorce przydatne do INF.03. Przykłady są autorskie. Fragmenty wykonuj w kontekście opisanym przy danym haśle.</p><ul>'+
    referenceSources.map(source=>'<li><a href="'+e(source.url)+'" target="_blank" rel="noopener noreferrer">'+e(source.title)+'</a></li>').join('')+'</ul></details>';
  return '<p class="reference-results" role="status">'+total+' pasujących haseł i wzorców</p><div class="reference-catalog">'+body+'</div>'+sources;
}

export function mountTheory(area, data, { q, qa, e, code }) {
  const all = buildTheorySections(data);
  const termCount = all.reduce((sum,section)=>sum+section.groups.reduce((n,g)=>n+g.items.length,0),0);
  const patternCount = all.reduce((sum,section)=>sum+section.patterns.length,0);
  area.innerHTML = '<div class="reference-tools"><label class="control">Szukaj w teorii<input type="search" id="reference-search" placeholder="np. label, grid, LEFT JOIN, fetch_assoc" autocomplete="off"></label>'+
    '<label class="check"><input id="reference-priority" type="checkbox"> Tylko priorytet egzaminacyjny</label></div>'+
    '<p class="reference-overview">'+termCount+' haseł · '+patternCount+' struktur do zapamiętania · 5 technologii</p>'+
    '<div id="reference-content"></div>';
  const content = q('#reference-content',area);
  const search = q('#reference-search',area);
  const priority = q('#reference-priority',area);
  let opened = ['html'];
  function render() {
    content.innerHTML = renderTheoryHTML(data,{e,code},{query:search.value,priority:priority.checked,openIds:opened});
  }
  content.addEventListener('toggle',event=>{
    if (!event.target.classList.contains('reference-language') || search.value.trim()) return;
    opened = qa('.reference-language[open]',content).map(item=>item.id.replace('ref-',''));
  },true);
  search.addEventListener('input',render);
  priority.addEventListener('change',render);
  search.addEventListener('keydown',event=>{
    if(event.key==='Escape' && search.value) { search.value=''; render(); }
  });
  render();
  const fromHash = location.hash.match(/^#ref-(html|css|sql|php|js)$/);
  if(fromHash) {
    const target = q('#ref-'+fromHash[1],content);
    if(target) { target.open=true; target.scrollIntoView({block:'start'}); }
  }
}
