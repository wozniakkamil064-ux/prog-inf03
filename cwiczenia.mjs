const contexts = [
  ['wypozyczalnia', 'Wypożyczalnia rowerów', 'rowery', 'typy', 'rower'],
  ['biblioteka', 'Biblioteka', 'ksiazki', 'dzialy', 'książka'],
  ['serwis', 'Serwis komputerowy', 'uslugi', 'rodzaje', 'usługa'],
  ['kino', 'Kino', 'seanse', 'gatunki', 'seans'],
  ['muzeum', 'Muzeum', 'wystawy', 'sale', 'wystawa'],
  ['kawiarnia', 'Kawiarnia', 'desery', 'kategorie', 'deser'],
  ['szkola', 'Kursy zawodowe', 'kursy', 'specjalizacje', 'kurs'],
  ['sklep', 'Sklep papierniczy', 'produkty', 'grupy', 'produkt'],
  ['hotel', 'Hotel', 'pokoje', 'standardy', 'pokój'],
  ['klub', 'Klub sportowy', 'zajecia', 'dyscypliny', 'zajęcia'],
  ['galeria', 'Galeria zdjęć', 'zdjecia', 'albumy', 'zdjęcie'],
  ['szkolka', 'Szkółka roślin', 'rosliny', 'gatunki', 'roślina'],
  ['pracownia', 'Pracownia ceramiki', 'warsztaty', 'poziomy', 'warsztat'],
  ['ksiegarnia', 'Księgarnia', 'tytuly', 'serie', 'tytuł'],
  ['bilety', 'Biuro wycieczek', 'wycieczki', 'trasy', 'wycieczka'],
  ['magazyn', 'Magazyn sprzętu', 'urzadzenia', 'strefy', 'urządzenie'],
];

const identities = contexts.map(([id, label, table, catalog, noun], index) => ({ id, label, table, catalog, noun, index }));
const escapeHTML = (value) => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch]);
const sqlString = (value) => "'" + value.replace(/'/g, "''") + "'";
const encode = JSON.stringify;
const taskID = (id, context, form) => [id, context.id, String(form + 1).padStart(2, '0')].join('/');
const outcome = (result, checks) => ({ result, ...checks });
const exercise = (prompt, starter, hint, solution, verification, setup = '') =>
  ({ prompt, starter, hint, solution, verification, ...(setup ? { setup } : {}) });

function dataset(c, form) {
  const serial = c.index * 16 + form;
  const price = 17 + serial;
  const limit = 2 + form % 4;
  const mask = form % 2;
  const order = form % 2 ? 'DESC' : 'ASC';
  const max = 7 + serial;
  const range = 3 + form % 4;
  const discount = 6 + (form + c.index) % 11;
  const suffixes = ['Alfa', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Iota'];
  const rows = suffixes.map((suffix, index) => ({
    id: index + 1, name: c.noun + ' ' + suffix + ' ' + (form + 1),
    price: price + ((index * 5 + form) % 13) * 2, category: (index + form) % 3 + 1,
    active: (index + form + Math.floor(index / 2)) % 3 === 0 ? 0 : 1,
  }));
  const categories = ['Podstawowa', 'Dodatkowa', 'Sezonowa', 'Pusta'].map((name, index) => [index + 1, name]);
  const setup = [
    'CREATE TABLE ' + c.catalog + ' (id INT PRIMARY KEY, nazwa VARCHAR(80) NOT NULL);',
    'CREATE TABLE ' + c.table + ' (id INT PRIMARY KEY, nazwa VARCHAR(80) NOT NULL, cena INT NOT NULL, grupa_id INT NOT NULL, aktywny INT NOT NULL, FOREIGN KEY (grupa_id) REFERENCES ' + c.catalog + '(id));',
    'INSERT INTO ' + c.catalog + ' VALUES ' + categories.map(([id, name]) => '(' + id + ', ' + sqlString(name) + ')').join(', ') + ';',
    'INSERT INTO ' + c.table + ' VALUES ' + rows.map(row => '(' + [row.id, sqlString(row.name), row.price, row.category, row.active].join(', ') + ')').join(', ') + ';'
  ].join('\n');
  return { c, form, price, limit, mask, order, max, range, discount, rows, categories, setup, cut: price + 2 * form };
}

const families = [];
function register(id, category, level, title, build) {
  families.push({ id, category, level, title, build });
}

register('sql-filtr', 'SQL', 1, 'Wybierz rekordy z warunkiem', ({c, cut, mask, rows, setup}) =>
  exercise('Zwróć nazwa i cena dla rekordów z aktywny = ' + mask + ' oraz cena ≥ ' + cut + '. Posortuj według id rosnąco.',
    'SELECT ... FROM ' + c.table + '\nWHERE ...;', 'Połącz warunki operatorem AND. Uwzględnij wartość równą progowi.',
    'SELECT nazwa, cena FROM ' + c.table + ' WHERE aktywny = ' + mask + ' AND cena >= ' + cut + ' ORDER BY id;',
    outcome(rows.filter(row => row.active === mask && row.price >= cut).map(row => [row.name, row.price]), { type:'sql' }), setup));

register('sql-top', 'SQL', 1, 'Posortuj i ogranicz wynik', ({c, limit, order, rows, setup}) =>
  exercise('Zwróć ' + limit + ' rekordy, kolumny id i cena. Sortuj po cenie ' + (order === 'ASC' ? 'rosnąco' : 'malejąco') + ', przy remisie po id rosnąco.',
    'SELECT id, cena FROM ' + c.table + ';', 'Przed LIMIT użyj ORDER BY z dwiema kolumnami.',
    'SELECT id, cena FROM ' + c.table + ' ORDER BY cena ' + order + ', id ASC LIMIT ' + limit + ';',
    outcome([...rows].sort((a,b) => (order === 'ASC' ? a.price-b.price : b.price-a.price) || a.id-b.id).slice(0,limit).map(row => [row.id,row.price]), {type:'sql'}), setup));

register('sql-join', 'SQL', 2, 'Odczytaj nazwę kategorii', ({c, mask, rows, categories, setup}) =>
  exercise('Zwróć nazwę pozycji i nazwę grupy dla rekordów z aktywny = ' + mask + '. Połącz obie tabele i sortuj po id pozycji.',
    'SELECT p.nazwa, g.nazwa FROM ' + c.table + ' AS p\n-- uzupełnij złączenie i filtr',
    'Połącz grupa_id pozycji z id w słowniku grup.',
    'SELECT p.nazwa, g.nazwa FROM ' + c.table + ' AS p INNER JOIN ' + c.catalog + ' AS g ON p.grupa_id = g.id WHERE p.aktywny = ' + mask + ' ORDER BY p.id;',
    outcome(rows.filter(row => row.active === mask).map(row => [row.name, categories[row.category-1][1]]), {type:'sql'}), setup));

register('sql-grupy', 'SQL', 2, 'Zlicz również puste grupy', ({c, cut, rows, categories, setup}) =>
  exercise('Dla każdej grupy zwróć jej nazwę i liczbę pozycji z ceną co najmniej ' + cut + '. Zachowaj grupy o wyniku 0. Sortuj po id grupy.',
    'SELECT g.nazwa, COUNT(...) FROM ' + c.catalog + ' AS g\n-- dodaj złączenie, grupowanie i kolejność',
    'Zastosuj LEFT JOIN, warunek cenowy w ON i COUNT(p.id).',
    'SELECT g.nazwa, COUNT(p.id) AS liczba FROM ' + c.catalog + ' AS g LEFT JOIN ' + c.table + ' AS p ON p.grupa_id = g.id AND p.cena >= ' + cut + ' GROUP BY g.id, g.nazwa ORDER BY g.id;',
    outcome(categories.map(([id,name]) => [name,rows.filter(row => row.category === id && row.price >= cut).length]), {type:'sql'}), setup));

register('sql-update', 'SQL', 2, 'Zmień cenę jednego rekordu', ({c, form, cut, rows, setup}) => {
  const id = form % rows.length + 1;
  const value = cut + 40;
  return exercise('Ustaw cenę ' + value + ' rekordowi o id = ' + id + '. Pozostałe rekordy i ich wartości mają zostać zachowane.',
    'UPDATE ' + c.table + ' SET ... WHERE ...;', 'Porównaj wszystkie wiersze. Użyj id w WHERE.',
    'UPDATE ' + c.table + ' SET cena = ' + value + ' WHERE id = ' + id + ';',
    outcome(rows.map(row => [row.id,row.name,row.id === id ? value : row.price,row.category,row.active]),
      {type:'sql', inspect:'SELECT id, nazwa, cena, grupa_id, aktywny FROM ' + c.table + ' ORDER BY id;'}), setup);
});

register('sql-having', 'SQL', 3, 'Wybierz grupy według liczebności', ({c, cut, limit, rows, setup}) => {
  const minimum = limit % 2 + 1;
  return exercise('Pokaż grupa_id i liczbę pozycji z ceną ≥ ' + cut + '. Wyświetl grupy z co najmniej ' + minimum + ' takimi pozycjami. Sortuj według grupa_id.',
    'SELECT grupa_id, COUNT(*) FROM ' + c.table + ' ...;', 'Najpierw filtr ceny w WHERE, potem filtr liczby w HAVING.',
    'SELECT grupa_id, COUNT(*) AS liczba FROM ' + c.table + ' WHERE cena >= ' + cut + ' GROUP BY grupa_id HAVING COUNT(*) >= ' + minimum + ' ORDER BY grupa_id;',
    outcome([1,2,3].map(id => [id,rows.filter(row => row.category === id && row.price >= cut).length]).filter(row => row[1] >= minimum), {type:'sql'}), setup);
});

register('sql-insert', 'SQL', 2, 'Dodaj rekord przypisany do grupy', ({c, form, price, rows, setup}) => {
  const row = [9, c.noun + ' Nowy ' + (form + 1), price, form % 3 + 1, form % 2];
  return exercise('Dodaj rekord (id, nazwa, cena, grupa_id, aktywny): ' + row.join(', ') + '. Zachowaj istniejące dane.',
    'INSERT INTO ' + c.table + ' (...) VALUES (...);', 'Podaj nazwy kolumn i wartości w tej samej kolejności.',
    'INSERT INTO ' + c.table + ' (id, nazwa, cena, grupa_id, aktywny) VALUES (' + [row[0],sqlString(row[1]),...row.slice(2)].join(', ') + ');',
    outcome([...rows.map(item => [item.id,item.name,item.price,item.category,item.active]),row],
      {type:'sql',inspect:'SELECT id, nazwa, cena, grupa_id, aktywny FROM ' + c.table + ' ORDER BY id;'}), setup);
});

const call = (args, expected) => ({ args, expected });
function js(prompt, body, examples, bug, hint) {
  return exercise(prompt, bug, hint, body, {type:'js', entry:'rozwiaz', cases:examples});
}

register('js-koszt', 'JavaScript', 1, 'Policz koszt z opcjonalną dopłatą', ({price,form}) => {
  const fee = 2 + form;
  return js('Napisz rozwiaz(liczba, dodatek). Stawka wynosi ' + price + ' zł za sztukę. Gdy dodatek jest true, dolicz ' + fee + ' zł raz do całego zamówienia.',
    'function rozwiaz(liczba, dodatek) {\n  return liczba * ' + price + ' + (dodatek ? ' + fee + ' : 0);\n}',
    [call([1,false],price),call([3,true],3*price+fee),call([2,false],2*price),call([5,true],5*price+fee)],
    'function rozwiaz(liczba, dodatek) {\n  // zwróć łączny koszt\n}', 'Najpierw pomnóż liczbę sztuk przez stawkę. Dopłatę dodaj na końcu.');
});

register('js-zakres', 'JavaScript', 1, 'Napraw walidację pola', ({range,max}) => js(
  'W funkcji rozwiaz(tekst) przyjmuj tekst z pola. Zwróć pełną liczbę od ' + range + ' do ' + max + ' albo null dla pozostałych danych. Dopuść zewnętrzne spacje.',
  'function rozwiaz(tekst) {\n  const n = Number(tekst.trim());\n  return tekst.trim() !== "" && Number.isInteger(n) && n >= ' + range + ' && n <= ' + max + ' ? n : null;\n}',
  [call([String(range)],range),call([' '+max+' '],max),call([''],null),call([String(range-1)],null),call([range+'.5'],null),call([String(max+1)],null)],
  'function rozwiaz(tekst) {\n  const n = parseInt(tekst, 10);\n  return n >= '+range+' && n <= '+max+' ? n : null;\n}',
  'parseInt ucina część po przecinku. Użyj Number i Number.isInteger.'));

register('js-rabat', 'JavaScript', 2, 'Zastosuj rabat od progu', ({range,discount,price}) => {
  const result = (n) => Math.round(price * n * (n >= range ? 100 - discount : 100));
  return js('Napisz rozwiaz(n). Cena jednostkowa to ' + price + ' zł. Od ' + range + ' sztuk zastosuj rabat ' + discount + '%. Zwróć koszt jako liczbę groszy.',
    'function rozwiaz(n) {\n  const procentCeny = n >= ' + range + ' ? ' + (100-discount) + ' : 100;\n  return Math.round(n * ' + price + ' * procentCeny);\n}',
    [call([1],result(1)),call([range-1],result(range-1)),call([range],result(range)),call([range+1],result(range+1))],
    'function rozwiaz(n) {\n  return n * ' + price + ' * 100;\n}', 'Sprawdź wynik dokładnie na progu rabatu.');
});

register('js-filtr', 'JavaScript', 2, 'Przefiltruj tablicę obiektów', ({c,cut,mask,rows}) => {
  const items = rows.map(row => ({ id:row.id, cena:row.price, aktywny:row.active }));
  const extract = (values) => values.filter(item => item.cena <= cut && item.aktywny === mask).map(item => item.id);
  return js('Funkcja rozwiaz(pozycje) ma zwrócić identyfikatory obiektów z aktywny = ' + mask + ' i cena ≤ ' + cut + '. Zachowaj kolejność. Dane przykładowe: ' + encode(items),
    'function rozwiaz(pozycje) {\n  return pozycje.filter(p => p.aktywny === ' + mask + ' && p.cena <= ' + cut + ').map(p => p.id);\n}',
    [call([items],extract(items)),call([[]],[]),call([[{id:c.index,cena:cut,aktywny:mask}]], [c.index])],
    'function rozwiaz(pozycje) {\n  return pozycje.map(p => p.id);\n}', 'Najpierw filter, potem map. Testuj również pustą tablicę.');
});

register('js-petla', 'JavaScript', 1, 'Napraw pętlę sumującą', ({c,form,range,rows}) => {
  const values = rows.map(row => row.price);
  const sum = (numbers) => numbers.reduce((total,n) => total+(n%range===0?n:0),0);
  return js('Napraw rozwiaz(liczby), by sumowała elementy podzielne przez ' + range + '. Dane przykładowe: ' + encode(values) + '.',
    'function rozwiaz(liczby) {\n  let suma = 0;\n  for (let i = 0; i < liczby.length; i++) {\n    if (liczby[i] % ' + range + ' === 0) suma += liczby[i];\n  }\n  return suma;\n}',
    [call([values],sum(values)),call([[range,range*2,1]],range*3),call([[]],0),call([[range*(1+c.index+form)]],range*(1+c.index+form))],
    'function rozwiaz(liczby) {\n  let suma = 0;\n  for (let i = 1; i <= liczby.length; i++) {\n    if (liczby[i] % ' + range + ' === 0) suma += liczby[i];\n  }\n  return suma;\n}', 'Pierwszy indeks to 0, ostatni to długość minus 1.');
});

register('js-dom', 'JavaScript', 2, 'Podepnij obliczenie pod kliknięcie', ({c,price,form}) => {
  const id = c.id + '-' + (form + 1);
  const markup = '<label>Liczba <input id="' + id + '" type="number" value="2"></label>\n<button type="button" id="licz">Przelicz</button>\n<output id="wynik"></output>';
  return exercise('W istniejącym HTML obsłuż kliknięcie #licz. Pomnóż liczbę z pola #' + id + ' przez ' + price + ' i wyświetl w #wynik z dopiskiem „ zł”. Przy pustej wartości pokaż „Wpisz liczbę”.',
    'const przycisk = document.querySelector("#licz");\n// dodaj obsługę',
    'Użyj addEventListener i textContent. Sprawdź puste value przed Number.',
    'const pole = document.getElementById(' + encode(id) + ');\nconst wynik = document.querySelector("#wynik");\ndocument.querySelector("#licz").addEventListener("click", () => {\n  wynik.textContent = pole.value === "" ? "Wpisz liczbę" : (Number(pole.value) * ' + price + ') + " zł";\n});',
    {type:'dom', markup, action:'#licz', output:'#wynik', input:'#'+id, cases:[{value:'2',expected:2*price+' zł'},{value:'',expected:'Wpisz liczbę'},{value:'4',expected:4*price+' zł'}]});
});

function manual(prompt, starter, hint, solution, checklist, sampleHtml) {
  return exercise(prompt, starter, hint, solution, {type:'checklist', items:checklist, ...(sampleHtml ? {sampleHtml} : {})});
}

register('html-form', 'HTML', 1, 'Napisz formularz z etykietami', ({c,range,max,form}) => {
  const id = c.id + '-' + form;
  return manual('Zbuduj formularz POST do zapis.php. Pole "' + id + '" ma przyjąć pełną liczbę od ' + range + ' do ' + max + '. Dodaj widoczną etykietę i przycisk wysyłki.',
    '<form><!-- Wstaw kontrolki. --></form>', 'Dopasuj for do id, a klucz przesyłany wpisz w name.',
    '<form action="zapis.php" method="post">\n  <label for="'+id+'">Liczba</label>\n  <input type="number" name="'+id+'" id="'+id+'" min="'+range+'" max="'+max+'" step="1" required>\n  <button type="submit">Zapisz</button>\n</form>',
    ['Akcja i metoda są poprawne.','Kliknięcie etykiety przenosi fokus.','Formularz sprawdza wartość na obu granicach i odrzuca ułamek.']);
});

register('html-tabela', 'HTML', 1, 'Utwórz czytelną tabelę', ({c,limit,rows,form}) => {
  const list = rows.slice(form % 3,form % 3 + limit);
  return manual('Utwórz tabelę z podpisem „' + c.label + '”, kolumnami „Nazwa” i „Cena” oraz poniższymi wierszami: ' + list.map(row => row.name + ' — ' + row.price + ' zł').join(', ') + '.',
    '<table><!-- Wstaw podpis, nagłówki i wiersze. --></table>', 'caption podpisuje tabelę. th scope="col" opisuje kolumnę.',
    '<table>\n  <caption>'+escapeHTML(c.label)+'</caption>\n  <thead><tr><th scope="col">Nazwa</th><th scope="col">Cena</th></tr></thead>\n  <tbody>\n' +
      list.map(row => '    <tr><td>'+escapeHTML(row.name)+'</td><td>'+row.price+' zł</td></tr>').join('\n') + '\n  </tbody>\n</table>',
    ['Tabela ma podpis i nagłówki obu kolumn.', 'Liczba wierszy danych i kolejność pozycji zgadzają się z zadaniem.']);
});

register('html-uklad', 'HTML', 1, 'Połącz semantykę i nawigację', ({c,rows,form}) => {
  const href = 'sekcja-' + (form + 1);
  return manual('W widocznym nagłówku strony daj tytuł „'+c.label+'”. Dodaj odnośnik „Oferta” do #'+href+'. W sekcji oferty wypisz pozycję „'+rows[form%rows.length].name+'”. Dodaj stopkę.',
    '<div>Treść strony</div>', 'Użyj header, nav, main, section i footer. Sprawdź zgodność href i id.',
    '<header><h1>'+escapeHTML(c.label)+'</h1></header>\n<nav><a href="#'+href+'">Oferta</a></nav>\n<main><section id="'+href+'"><h2>Oferta</h2><p>'+escapeHTML(rows[form%rows.length].name)+'</p></section></main>\n<footer>Kontakt</footer>',
    ['Nagłówki mają właściwe poziomy.','Link przenosi do sekcji oferty.','Stopka ma własny element.']);
});

register('html-media', 'HTML', 2, 'Umieść ilustrację i podpis', ({c,form,rows}) => {
  const source = 'img/'+c.id+'-'+(form+1)+'.jpg';
  const motif = rows[form%rows.length].name;
  return manual('Dodaj ilustrację ' + source + ' o wymiarach ' + (480+form*20) + ' × ' + (320+form*10) + ' px. Opis dla osoby bez obrazu to „'+motif+'”. Podpis ma brzmieć „'+c.label+'”.',
    '<figure><!-- Wstaw elementy. --></figure>', 'Opisz zawartość w alt, a podpis ilustracji umieść w figcaption.',
    '<figure>\n  <img src="'+source+'" alt="'+escapeHTML(motif)+'" width="'+(480+form*20)+'" height="'+(320+form*10)+'">\n  <figcaption>'+escapeHTML(c.label)+'</figcaption>\n</figure>',
    ['Ścieżka i atrybuty wymiaru są zgodne.','alt i figcaption mają właściwą treść.']);
});

register('css-grid', 'CSS', 1, 'Ułóż kolumny według projektu', ({c,form}) => {
  const gap = 8+form;
  const breakpoint = 540 + form*12 + c.index;
  const columns = 2+form%3;
  return manual('W .karty ustaw ' + columns + ' równe kolumny i odstęp ' + gap + ' px. Przy szerokości do ' + breakpoint + ' px przełącz na jedną kolumnę.',
    '.karty { }\n@media (...) { }', 'Połącz repeat() i @media (max-width: ...).',
    '.karty { display: grid; grid-template-columns: repeat('+columns+', 1fr); gap: '+gap+'px; }\n@media (max-width: '+breakpoint+'px) { .karty { grid-template-columns: 1fr; } }',
    ['Liczba kolumn przy '+(breakpoint+1)+' px wynosi '+columns+'.','Przy '+breakpoint+' px działa pojedyncza kolumna.','Odstęp wynosi '+gap+' px.'],
    '<div class="karty"><article>A</article><article>B</article><article>C</article><article>D</article></div>');
});

register('css-selektor', 'CSS', 1, 'Dobierz precyzyjny selektor', ({c,form}) => {
  const even = form%2 ? 'odd' : 'even';
  const color = '#' + (0xd9e8f0 + c.index*13 + form).toString(16);
  const selector = '.'+c.id+' tbody tr:nth-child('+even+')';
  return manual('Ustaw tło '+color+' dla '+(even==='odd'?'nieparzystych':'parzystych')+' wierszy danych tabeli klasy '+c.id+'. Zachowaj obecne tło nagłówka.',
    '/* Wpisz selektor i deklarację. */', 'Ogranicz selektor do tbody i użyj :nth-child.',
    selector+' { background-color: '+color+'; }',
    ['Nagłówek i inna tabela są bez zmian.','Zaznaczone wiersze mają zgodną parzystość.'],
    '<table class="'+c.id+'"><thead><tr><th>Pozycja</th></tr></thead><tbody><tr><td>A</td></tr><tr><td>B</td></tr><tr><td>C</td></tr></tbody></table>');
});

register('css-box', 'CSS', 1, 'Napraw szerokość karty', ({c,form}) => {
  const width = 140 + c.index + form*4;
  const pad = 6 + form;
  const border = 1 + form%4;
  return manual('Obrys .karta ma mieć '+width+' px szerokości. Dodaj po '+pad+' px paddingu i po '+border+' px obramowania. Napraw szerokość bez ręcznego odejmowania.',
    '.karta { width: '+width+'px; padding: '+pad+'px; border: '+border+'px solid; }', 'Włącz box-sizing: border-box.',
    '.karta { box-sizing: border-box; width: '+width+'px; padding: '+pad+'px; border: '+border+'px solid; }',
    ['Computed border-box ma '+width+' px.','Padding i obramowanie są zachowane.','Treść ma '+(width-2*(pad+border))+' px szerokości.'], '<article class="karta">Treść</article>');
});

register('css-flex', 'CSS', 2, 'Ustaw kierunek i odstępy w pasku', ({c,form}) => {
  const gap = 6+form+c.index;
  const vertical = form%2 === 0;
  const axis = vertical ? 'column' : 'row';
  const breakpoint = 420 + c.index + form*8;
  return manual('W .'+c.id+' ustaw przyciski '+(vertical?'pionowo':'poziomo')+', z odstępem '+gap+' px. Przy maksymalnie '+breakpoint+' px zastosuj układ odwrotny.',
    '.'+c.id+' { }\n@media (...) { }', 'Włącz flex. flex-direction zmienia kierunek elementów.',
    '.'+c.id+' { display: flex; flex-direction: '+axis+'; gap: '+gap+'px; }\n@media (max-width: '+breakpoint+'px) { .'+c.id+' { flex-direction: '+(vertical?'row':'column')+'; } }',
    ['Układ zmienia kierunek przy wskazanej szerokości.','Odstęp jest taki sam w obu układach.'],
    '<nav class="'+c.id+'"><button>A</button><button>B</button><button>C</button></nav>');
});

function php(prompt, solution, cases, starter, hint) {
  return exercise(prompt, starter, hint, '<?php\n' + solution, {type:'php', entry:'rozwiaz', cases});
}

register('php-zakres', 'PHP', 1, 'Sprawdź dane odebrane z formularza', ({range,max}) => php(
  'Napisz rozwiaz($tekst), która zwraca liczbę całkowitą od '+range+' do '+max+' z pola formularza. Dla błędnej wartości lub braku pola zwróć null.',
  'function rozwiaz($tekst) {\n    if (!is_string($tekst)) { return null; }\n    $n = filter_var(trim($tekst), FILTER_VALIDATE_INT, ["options" => ["min_range" => '+range+', "max_range" => '+max+']]);\n    return $n === false ? null : $n;\n}',
  [call([String(range)],range),call([' '+max+' '],max),call([String(max+1)],null),call([''],null),call([range+'.4'],null),call([null],null)],
  '<?php\nfunction rozwiaz($tekst) {\n    return (int) $tekst;\n}', 'Sprawdź typ, potem FILTER_VALIDATE_INT z zakresem.'));

register('php-wyjscie', 'PHP', 1, 'Wypisz zewnętrzną treść w HTML', ({c,form}) => {
  const cls = c.id+'-'+(form+1);
  return php('Napisz rozwiaz($tekst), która generuje akapit z class="'+cls+'". Zawartość ma pozostać tekstem nawet wtedy, gdy zawiera nawiasy ostre, cudzysłów lub &.',
    'function rozwiaz($tekst) {\n    return \'<p class="'+cls+'">\' . htmlspecialchars($tekst, ENT_QUOTES | ENT_SUBSTITUTE, \'UTF-8\') . \'</p>\';\n}',
    ['A & B','<serwis>','"Nowy"',"Spotkanie 'A'"].map(value => call([value],'<p class="'+cls+'">'+escapeHTML(value)+'</p>')),
    '<?php\nfunction rozwiaz($tekst) {\n    // zbuduj akapit\n}', 'Zastosuj htmlspecialchars na samej treści. Oczekiwany zapis apostrofu to &#039;.');
});

register('php-suma', 'PHP', 2, 'Policz sumę w pętli foreach', ({c,cut,rows}) => {
  const list = rows.map(row => ({cena:row.price}));
  const get = (items) => items.reduce((total,row) => total+(row.cena>=cut?row.cena:0),0);
  return php('Napisz rozwiaz($wiersze) sumującą pole cena, jeśli cena wynosi co najmniej '+cut+'. Dane dla '+c.label+': '+encode(list)+'.',
    'function rozwiaz($wiersze) {\n    $suma = 0;\n    foreach ($wiersze as $r) {\n        if ($r["cena"] >= '+cut+') { $suma += $r["cena"]; }\n    }\n    return $suma;\n}',
    [call([list],get(list)),call([[]],0),call([[{cena:cut},{cena:cut-1}]],cut)],
    '<?php\nfunction rozwiaz($wiersze) {\n    $suma = 0;\n    return $suma;\n}', 'Przechodź po wierszach i dodawaj pole cena tylko przy spełnieniu warunku.');
});

register('php-select', 'PHP', 3, 'Wygeneruj listę po SELECT', ({c,form,cut,rows,setup}) => {
  const ids = rows.filter(row => row.price>=cut).map(row => row.id);
  const order = form%2 ? 'DESC' : 'ASC';
  const results = order==='DESC' ? [...ids].reverse() : ids;
  const task = manual('Zaimportuj podane dane do ćwiczeniowej bazy. Z istniejącego połączenia $db wypisz w HTML nazwy z '+c.table+' przy cena ≥ '+cut+', w kolejności id '+(order==='ASC'?'rosnącej':'malejącej')+'. Pokaż „Brak wyników”, gdy nic nie pasuje.',
    '<?php\n// $db to połączenie mysqli\n', 'Użyj prepare, bind_param, execute oraz bezpiecznego wypisywania tekstu w li.',
    '<?php\n$stmt = $db->prepare(\'SELECT nazwa FROM '+c.table+' WHERE cena >= ? ORDER BY id '+order+'\');\n$prog = '+cut+';\n$stmt->bind_param("i", $prog);\n$stmt->execute();\n$stmt->bind_result($nazwa);\n$items = [];\nwhile ($stmt->fetch()) {\n    $items[] = "<li>" . htmlspecialchars($nazwa, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8") . "</li>";\n}\necho $items ? "<ul>" . implode("", $items) . "</ul>" : "<p>Brak wyników</p>";\n$stmt->close();',
    ['Kolejność nazw: '+(results.map(id => rows[id-1].name).join(', ') || 'brak wyników')+'.',
      'Przy pustym wyniku widoczny jest osobny komunikat.','Znaki specjalne w nazwach pozostają tekstem.']);
  return {...task, setup};
});

register('grafika-eksport', 'Grafika', 1, 'Dobierz format i rozmiar pliku', ({c,form}) => {
  const w = 320+form*24+c.index*4;
  const h = w*3/4;
  const alpha = form%2 === 0;
  const format = alpha ? 'png' : 'jpg';
  const cap = 110+form*12;
  return manual('Przygotuj ilustrację dla „'+c.label+'” o wymiarach '+w+' × '+h+' px. '+(alpha?'Zachowaj przezroczyste narożniki.':'Użyj zdjęcia bez przezroczystości i zmieść się w '+cap+' kB.')+' Zapisz jako '+c.id+'.'+format+'.',
    'Weź własne zdjęcie lub utwórz ikonę w edytorze.','Przytnij do 4:3 przed zmianą wielkości, a następnie przygotuj eksport.',
    'Ustaw kadr 4:3, przeskaluj do '+w+' × '+h+' px i '+(alpha?'wyeksportuj PNG z kanałem alfa.':'wyeksportuj JPEG, w razie potrzeby ustaw niższą jakość przy zachowaniu wymiarów.'),
    ['Wymiary i rozszerzenie są zgodne.',alpha?'Tło w narożnikach jest przezroczyste.':'Plik mieści się w limicie '+cap+' kB.','Obraz zachował proporcje.']);
});

export const katalog = families.map(({build, ...family}) => ({...family, variants: identities.length * 16}));
export const scenariusze = identities.map(({id,label}) => ({id,label}));
export function zadanie(familyID, scenarioID, numer) {
  const family = families.find(item => item.id === familyID);
  const context = identities.find(item => item.id === scenarioID);
  if (!family || !context || !Number.isInteger(numer) || numer < 1 || numer > 16) {
    throw new RangeError('Wybierz id rodziny, id scenariusza i całkowity numer wariantu od 1 do 16.');
  }
  return { id:taskID(familyID,context,numer-1), category:family.category, level:family.level, title:family.title,
    scenario:context.label, ...family.build(dataset(context,numer-1)) };
}
