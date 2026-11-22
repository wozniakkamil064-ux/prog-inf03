const contexts = [
  {slug:'rower',label:'Rower miejski',name:'model',table:'rowery',group:'typy',price:12,qty:4,limit:3,id:2,color:'#3B5974',width:240},
  {slug:'ksiazka',label:'Atlas podróży',name:'tytul',table:'ksiazki',group:'dzialy',price:18,qty:3,limit:4,id:3,color:'#665174',width:280},
  {slug:'bilet',label:'Bilet do muzeum',name:'bilet',table:'bilety',group:'rodzaje',price:24,qty:2,limit:5,id:4,color:'#46674A',width:320},
  {slug:'kurs',label:'Kurs fotografii',name:'kurs',table:'kursy',group:'poziomy',price:35,qty:5,limit:2,id:5,color:'#805747',width:360},
  {slug:'pokoj',label:'Pokój standardowy',name:'pokoj',table:'pokoje',group:'standardy',price:42,qty:6,limit:6,id:6,color:'#4C637F',width:400},
  {slug:'deser',label:'Deser malinowy',name:'deser',table:'desery',group:'kategorie',price:16,qty:7,limit:7,id:7,color:'#7C4D60',width:440},
  {slug:'trasa',label:'Trasa leśna',name:'trasa',table:'trasy',group:'regiony',price:28,qty:8,limit:8,id:8,color:'#457067',width:480},
  {slug:'usluga',label:'Serwis laptopa',name:'usluga',table:'uslugi',group:'specjalizacje',price:54,qty:9,limit:9,id:9,color:'#6E6239',width:520},
].map(item=>({...item,next:item.id+1,higher:item.price+8,lower:item.price-2,sum:item.price+item.qty,max:item.qty+8,breakpoint:item.width+320,half:item.width/2,initial:item.label[0]}));

// Każda pozycja opisuje jedną umiejętność. Osiem kontekstów zmienia nazwy i dane.
// Prefix i: w odpowiedzi dotyczy wyłącznie tokenów niewrażliwych na wielkość liter.
const specifications = `
HTML¦Dokument¦1¦Język dokumentu¦Wskaż, że treść strony jest po polsku.¦<html ____="pl">↵<head><title>@label@</title></head>↵<body><h1>@label@</h1></body>↵</html>¦i:lang¦Atrybut języka ma cztery litery.¦lang określa język dokumentu i pomaga czytnikom ekranu.
HTML¦Dokument¦1¦Kodowanie znaków¦Wstaw nazwę atrybutu określającego kodowanie.¦<head>↵  <meta ____="utf-8">↵  <title>@label@</title>↵</head>¦i:charset¦Nazwa łączy character i set.¦charset ustawia kodowanie dokumentu. UTF-8 obsługuje polskie litery.
HTML¦Dokument¦1¦Zewnętrzny CSS¦Dołącz arkusz @slug@.css. Uzupełnij rodzaj relacji.¦<link rel="____" href="@slug@.css">¦i:stylesheet¦To angielska nazwa arkusza stylów.¦rel="stylesheet" oznacza, że link wskazuje arkusz CSS.
HTML¦Dokument¦1¦Adres arkusza¦Podaj atrybut ze ścieżką do arkusza CSS.¦<link rel="stylesheet" ____="css/@slug@.css">¦i:href¦Tego samego atrybutu używasz w odnośniku.¦href wskazuje adres zasobu powiązanego elementem link.
HTML¦Dokument¦1¦Skrypt po HTML¦Dodaj atrybut, który odłoży wykonanie zewnętrznego klasycznego skryptu do zakończenia parsowania HTML.¦<script src="@slug@.js" ____></script>¦i:defer¦Słowo ma pięć liter.¦defer pozwala zewnętrznemu skryptowi poczekać na zakończenie parsowania dokumentu.
HTML¦Semantyka¦1¦Główna treść¦Wstaw nazwę elementu głównej treści.¦<____>↵  <h1>@label@</h1>↵  <p>Aktualna oferta.</p>↵</main>¦i:main¦Nazwa oznacza „główny”.¦main reprezentuje główną zawartość strony.
HTML¦Semantyka¦1¦Nawigacja¦Opakuj główne odnośniki w element nawigacyjny.¦<____>↵  <a href="#@slug@">Oferta</a>↵  <a href="#kontakt">Kontakt</a>↵</nav>¦i:nav¦Krótka nazwa od navigation.¦nav grupuje ważne odnośniki nawigacji.
HTML¦Semantyka¦1¦Poziom nagłówka¦Wstaw nagłówek drugiego poziomu.¦<section id="@slug@">↵  <____>@label@</h2>↵  <p>Cena: @price@ zł</p>↵</section>¦i:h2¦Nagłówek to litera h i numer poziomu.¦h2 oznacza nagłówek sekcji podrzędnej względem h1.
HTML¦Odnośniki¦1¦Kotwica¦Uzupełnij wartość href prowadzącą do sekcji poniżej.¦<a href="____">Zobacz ofertę</a>↵<section id="@slug@"><h2>@label@</h2></section>¦#@slug@¦Fragment adresu zaczyna się od #.¦Odnośnik do fragmentu dokumentu używa kratki i wartości id.
HTML¦Media¦1¦Źródło obrazu¦Wstaw atrybut ze ścieżką obrazu.¦<img ____="img/@slug@.jpg" alt="@label@">¦i:src¦Atrybut pochodzi od source.¦src wskazuje adres pliku obrazu.
HTML¦Media¦1¦Opis alternatywny¦Dodaj nazwę atrybutu opisującego obraz.¦<img src="@slug@.jpg" ____="@label@ na jasnym tle">¦i:alt¦Skrót od alternative text.¦alt dostarcza tekst zastępczy dla obrazu informacyjnego.
HTML¦Listy¦1¦Pozycja listy¦Uzupełnij element pozycji listy.¦<ul>↵  <____>@label@</li>↵  <li>Inna oferta</li>↵</ul>¦i:li¦Skrót od list item.¦Pozycjami ul i ol są elementy li.
HTML¦Listy¦1¦Lista z kolejnością¦Zbuduj listę numerowaną z krokami.¦<____>↵  <li>Wybierz: @label@</li>↵  <li>Potwierdź rezerwację.</li>↵</ol>¦i:ol¦Skrót od ordered list.¦ol stosuje się, gdy kolejność punktów ma znaczenie.
HTML¦Tabele¦1¦Nagłówek tabeli¦Dodaj nazwę znacznika komórki nagłówkowej.¦<table>↵  <tr><____ scope="col">Nazwa</th><th scope="col">Cena</th></tr>↵  <tr><td>@label@</td><td>@price@ zł</td></tr>↵</table>¦i:th¦Skrót od table header.¦th oznacza nagłówek tabeli, a td zwykłą komórkę danych.
HTML¦Tabele¦2¦Łączenie kolumn¦Uzupełnij atrybut rozciągający komórkę na dwie kolumny.¦<table>↵  <tr><th>Oferta</th><th>Cena</th></tr>↵  <tr><td ____="2">Brak pozycji: @label@</td></tr>↵</table>¦i:colspan¦Chodzi o kolumny, a nie wiersze.¦colspan określa liczbę kolumn zajmowanych przez komórkę.
HTML¦Formularze¦1¦Metoda wysyłki¦Wyślij dane w ciele żądania metodą POST.¦<form action="@slug@.php" method="____">↵  <input name="@name@">↵  <button>Zapisz</button>↵</form>¦i:post¦Metoda składa się z czterech liter.¦method="post" przekazuje pola formularza w ciele żądania HTTP.
HTML¦Formularze¦1¦Klucz dla PHP¦PHP odczyta $_POST["@name@"]. Podaj atrybut tworzący ten klucz.¦<form method="post">↵  <input id="@slug@" ____="@name@">↵  <button>Zapisz</button>↵</form>¦i:name¦id służy do identyfikacji elementu, szukany atrybut do wysyłki pola.¦name jest nazwą pola wysyłaną do serwera.
HTML¦Formularze¦1¦Etykieta i pole¦Uzupełnij for, aby kliknięcie etykiety ustawiało fokus w polu.¦<label for="____">@label@</label>↵<input id="@slug@" name="@name@">¦@slug@¦Wartość for odpowiada id pola.¦Etykieta odwołuje się przez for do identyfikatora kontrolki.
HTML¦Formularze¦1¦Wymagane pole¦Dodaj atrybut wymagający wypełnienia pola.¦<form>↵  <input type="text" name="@name@" ____>↵  <button>Zapisz</button>↵</form>¦i:required¦Angielskie słowo oznaczające „wymagany”.¦required uruchamia przeglądarkową kontrolę obecności wartości.
HTML¦Formularze¦1¦Przycisk JavaScript¦Przycisk obsłuży JS. Ustaw typ, który sam nie wysyła formularza.¦<form>↵  <input name="@name@">↵  <button type="____">Przelicz @label@</button>↵</form>¦i:button¦Typ ma taką samą nazwę jak element przycisku.¦type="button" nie wykonuje domyślnej wysyłki formularza.
HTML¦Formularze¦1¦Adres poczty¦Dobierz typ pola weryfikującego składnię adresu e-mail.¦<label>E-mail do rezerwacji @slug@↵  <input name="email_@slug@" type="____">↵</label>¦i:email¦To angielskie określenie poczty elektronicznej.¦type="email" włącza walidację składni adresu przez przeglądarkę.
HTML¦Formularze¦2¦Dolna granica¦Liczba sztuk ma wynosić co najmniej @qty@. Wstaw atrybut dolnej granicy.¦<input type="number" name="@name@" ____="@qty@" max="@max@">¦i:min¦Przeciwieństwo max.¦min określa najmniejszą dopuszczalną wartość kontrolki liczbowej.
HTML¦Formularze¦1¦Lista wyboru¦Dodaj nazwę elementu listy rozwijanej.¦<____ name="@name@">↵  <option value="@id@">@label@</option>↵</select>¦i:select¦Angielskie „wybierz”.¦select zawiera opcje reprezentowane przez option.
HTML¦Interakcje¦2¦Rozwijana wskazówka¦Uzupełnij element widoczny jako etykieta rozwijanej sekcji.¦<details>↵  <____>Wskazówka: @label@</summary>↵  <p>Sprawdź ścieżkę @slug@.jpg.</p>↵</details>¦i:summary¦Etykieta znajduje się wewnątrz details.¦summary tworzy klikany opis natywnej sekcji details.
HTML¦Media¦2¦Podpis ilustracji¦Dodaj nazwę elementu podpisu figury.¦<figure>↵  <img src="@slug@.jpg" alt="@label@">↵  <____>@label@ — widok przykładowy</figcaption>↵</figure>¦i:figcaption¦Nazwa łączy figure i caption.¦figcaption opisuje zawartość figure.
CSS¦Selektory¦1¦Selektor klasy¦Wybierz elementy class="@slug@". Wpisz cały selektor.¦____ {↵  color: @color@;↵}¦.@slug@¦Nazwę klasy poprzedza kropka.¦Kropka rozpoczyna selektor klasy. Wartość class nie zawiera kropki.
CSS¦Selektory¦1¦Selektor id¦Wybierz element id="@slug@".¦____ {↵  font-weight: 700;↵  color: @color@;↵}¦#@slug@¦Przed identyfikatorem w CSS występuje #.¦Selektor identyfikatora zaczyna się od kratki.
CSS¦Selektory¦2¦Bezpośrednie dzieci¦Wybierz tylko linki będące bezpośrednimi dziećmi .@slug@. Wstaw kombinator.¦.@slug@ ____ a {↵  text-decoration: none;↵}¦>¦Wybierz relację dziecka.¦Kombinator > pomija linki zagnieżdżone głębiej w innych elementach.
CSS¦Selektory¦1¦Najechanie kursora¦Zmień tło przy najechaniu na przycisk. Wstaw nazwę pseudoklasy.¦.@slug@:____ {↵  background-color: @color@;↵}¦hover¦Pseudoklasa zaczyna się literą h.¦:hover odpowiada stanowi wskazywania elementu kursorem.
CSS¦Selektory¦2¦Parzyste wiersze¦Wybierz parzyste wiersze danych tabeli .@slug@.¦.@slug@ tbody tr:nth-child(____) {↵  background: @color@;↵}¦even;;2n¦Angielskie określenie parzystości.¦even i 2n wybierają pozycje 2, 4, 6 itd.
CSS¦Box model¦1¦Wewnętrzny odstęp¦Ustaw @qty@ px odstępu między treścią a obramowaniem.¦.@slug@ {↵  ____: @qty@px;↵  border: 1px solid @color@;↵}¦padding¦Margin działa na zewnątrz obramowania.¦padding tworzy wewnętrzny odstęp elementu.
CSS¦Box model¦1¦Zewnętrzny odstęp¦Odsuń kartę o @qty@ px od sąsiednich elementów.¦.@slug@ {↵  ____: @qty@px;↵  padding: 10px;↵}¦margin¦Szukasz odstępu poza obramowaniem.¦margin określa zewnętrzny margines elementu.
CSS¦Box model¦1¦Wymiary z paddingiem¦width ma obejmować padding i border. Uzupełnij box-sizing.¦.@slug@ {↵  width: @width@px;↵  padding: @qty@px;↵  border: 2px solid;↵  box-sizing: ____;↵}¦border-box¦W nazwie występuje border.¦border-box wlicza wewnętrzne odstępy i obramowanie do width.
CSS¦Tekst¦1¦Kolor tekstu¦Ustaw kolor tekstu na @color@.¦.@slug@ {↵  ____: @color@;↵}¦color¦Właściwość ma pięć liter.¦color określa kolor tekstu i domyślny kolor niektórych obramowań.
CSS¦Tekst¦1¦Kolor tła¦Ustaw jednolite tło karty.¦.@slug@ {↵  ____: @color@;↵  color: white;↵}¦background-color;;background¦Pełna nazwa wskazuje tło i kolor.¦background-color ustawia kolor tła. Skrót background również pozwala podać sam kolor.
CSS¦Tekst¦1¦Wyrównanie tekstu¦Wyśrodkuj tekst wewnątrz karty.¦.@slug@ {↵  text-align: ____;↵  width: @width@px;↵}¦center¦Wartość oznacza środek.¦text-align: center wyrównuje zawartość liniową w poziomie.
CSS¦Tekst¦1¦Krój pisma¦Wybierz Arial z bezszeryfowym zastępstwem.¦.@slug@ {↵  ____: Arial, sans-serif;↵}¦font-family¦To rodzina czcionki.¦font-family określa uporządkowaną listę krojów.
CSS¦Układ¦1¦Włącz Flexbox¦Ustaw blokowy kontener jako elastyczny.¦.@slug@ {↵  display: ____;↵  gap: @qty@px;↵}¦flex¦Nazwa modelu to Flexbox.¦display: flex uruchamia elastyczny układ bezpośrednich dzieci.
CSS¦Układ¦1¦Odstęp między elementami¦Ustaw @qty@ px odstępu między elementami Flexbox.¦.@slug@ {↵  display: flex;↵  ____: @qty@px;↵}¦gap¦Wspólna właściwość Flexbox i Grid.¦gap ustawia odstępy pomiędzy elementami lub torami.
CSS¦Układ¦2¦Rozkład w rzędzie¦Rozmieść dzieci na końcach rzędu, rozkładając wolne miejsce między nimi.¦.@slug@ {↵  display: flex;↵  justify-content: ____;↵}¦space-between¦Nazwa oznacza przestrzeń pomiędzy.¦space-between pozostawia skrajne elementy przy krawędziach kontenera.
CSS¦Układ¦2¦Pionowy Flexbox¦Ułóż dzieci kontenera pionowo.¦.@slug@ {↵  display: flex;↵  flex-direction: ____;↵  gap: @qty@px;↵}¦column¦Zamiast wiersza wybierz kolumnę.¦column ustawia oś główną Flexbox pionowo.
CSS¦Układ¦1¦Kolumny Grid¦Uzupełnij właściwość definiującą szerokości kolumn.¦.@slug@ {↵  display: grid;↵  ____: 2fr 1fr;↵}¦grid-template-columns¦Właściwość dotyczy wzorca kolumn Grid.¦grid-template-columns określa liczbę i rozmiary kolumn.
CSS¦Responsywność¦2¦Warunek szerokości¦Zastosuj regułę przy szerokości okna nie większej niż @breakpoint@ px.¦@media (____: @breakpoint@px) {↵  .@slug@ { display: block; }↵}¦max-width¦Chodzi o górną granicę szerokości.¦max-width obejmuje wskazaną wartość i mniejsze szerokości.
CSS¦Media¦1¦Obraz w kontenerze¦Obraz nie ma przekraczać szerokości rodzica.¦.@slug@ img {↵  max-width: ____;↵  height: auto;↵}¦100%¦Wartość procentowa odnosi się do szerokości kontenera.¦max-width: 100% ogranicza obraz do szerokości rodzica.
CSS¦Media¦2¦Przycięcie zdjęcia¦Zdjęcie ma wypełnić prostokąt, zachować proporcje i w razie potrzeby zostać przycięte.¦.@slug@ img {↵  width: @width@px;↵  height: @half@px;↵  object-fit: ____;↵}¦cover¦contain zachowałby cały obraz z możliwymi pustymi obszarami.¦cover wypełnia obszar kosztem przycięcia części obrazu.
CSS¦Tabele¦1¦Scalanie obramowań¦Połącz wspólne krawędzie komórek tabeli.¦table.@slug@ {↵  border-collapse: ____;↵}¦collapse¦Wartość jest podobna do nazwy właściwości.¦collapse scala obramowania sąsiednich komórek.
CSS¦Układ¦2¦Ukrycie elementu¦Ukryj element wraz z miejscem, które zajmuje w układzie.¦.@slug@[hidden] {↵  display: ____;↵}¦none¦Wartość wyłącza generowanie pudełka elementu.¦display: none usuwa element z układu strony.
CSS¦Pozycjonowanie¦2¦Kontekst położenia¦Karta ma być punktem odniesienia dla swojego potomka z position:absolute.¦.@slug@ { position: ____; }↵.@slug@ .etykieta { position: absolute; top: 0; right: 0; }¦relative¦To pozycjonowanie względne.¦position: relative tworzy kontekst dla absolutnie pozycjonowanego potomka.
CSS¦Układ¦2¦Zakończenie opływania¦Stopka ma zacząć się poniżej obu wcześniejszych bloków float.¦.@slug@ footer {↵  clear: ____;↵}¦both¦Zakończ opływanie z obu stron.¦clear: both przesuwa element poniżej wcześniejszych floatów.
CSS¦Dostępność¦2¦Fokus klawiatury¦Wyróżnij widoczny fokus, np. po użyciu Tab.¦.@slug@ a:____ {↵  outline: 3px solid @color@;↵}¦focus-visible¦Nazwa łączy focus i visible.¦focus-visible pozwala wyróżnić fokus według heurystyk przeglądarki.
SQL¦Odczyt¦1¦Wybór kolumn¦Rozpocznij zapytanie wybierające nazwę i cenę.¦____ nazwa, cena↵FROM @table@;¦i:SELECT¦Polecenie odczytu.¦SELECT wskazuje kolumny lub wyrażenia wyniku.
SQL¦Odczyt¦1¦Tabela źródłowa¦Wstaw klauzulę poprzedzającą nazwę tabeli.¦SELECT nazwa, cena↵____ @table@;¦i:FROM¦Angielskie „z”.¦FROM określa źródło rekordów.
SQL¦Filtry¦1¦Wybór wierszy¦Zwróć tylko rekordy z ceną powyżej @price@.¦SELECT nazwa FROM @table@↵____ cena > @price@;¦i:WHERE¦Warunek pojedynczych wierszy.¦WHERE filtruje rekordy przed grupowaniem.
SQL¦Filtry¦1¦Dwa warunki¦Pokaż tylko aktywne rekordy z ceną co najmniej @price@. Oba warunki muszą być spełnione.¦SELECT nazwa FROM @table@↵WHERE aktywny = 1 ____ cena >= @price@;¦i:AND¦Wymagana jest koniunkcja.¦AND wymaga prawdziwości obu połączonych warunków.
SQL¦Filtry¦1¦Alternatywa¦Zwróć rekordy o id @id@ albo @next@.¦SELECT nazwa FROM @table@↵WHERE id = @id@ ____ id = @next@;¦i:OR¦Wystarczy jeden z dwóch warunków.¦OR łączy warunki alternatywą.
SQL¦Filtry¦1¦Wzorzec nazwy¦Uzupełnij operator wyszukujący nazwy zaczynające się od @initial@.¦SELECT nazwa FROM @table@↵WHERE nazwa ____ '@initial@%';¦i:LIKE¦Operator obsługuje % i _.¦LIKE porównuje tekst z wzorcem. % zastępuje dowolny ciąg znaków.
SQL¦Filtry¦2¦Brak wartości¦Wybierz wiersze bez podanego opisu.¦SELECT nazwa FROM @table@↵WHERE opis ____ NULL;¦i:IS¦NULL sprawdza się specjalnym operatorem.¦IS NULL wykrywa brak wartości. Zapis = NULL nie daje oczekiwanego filtra.
SQL¦Sortowanie¦1¦Kolejność wierszy¦Dodaj dwuwyrazową klauzulę sortowania.¦SELECT nazwa, cena FROM @table@↵____ cena ASC, nazwa ASC;¦i:ORDER BY¦Klauzula występuje po warunkach i grupowaniu.¦ORDER BY określa kolejność wierszy wyniku.
SQL¦Sortowanie¦1¦Od najwyższej ceny¦Wyświetl ceny malejąco.¦SELECT cena FROM @table@↵ORDER BY cena ____;¦i:DESC¦Skrót od descending.¦DESC ustawia kolejność malejącą.
SQL¦Sortowanie¦1¦Ograniczenie wyniku¦Zwróć najwyżej @limit@ najtańszych rekordów.¦SELECT nazwa, cena FROM @table@↵ORDER BY cena ASC↵____ @limit@;¦i:LIMIT¦Klauzula jest na końcu tego zapytania.¦LIMIT ogranicza liczbę zwracanych wierszy.
SQL¦Odczyt¦2¦Bez duplikatów¦Zwróć unikatowe identyfikatory grup.¦SELECT ____ grupa_id↵FROM @table@;¦i:DISTINCT¦Słowo kluczowe jest po SELECT.¦DISTINCT usuwa powtarzające się wiersze wybranych kolumn.
SQL¦Odczyt¦1¦Alias kolumny¦Nazwij kolumnę ceny w wyniku jako stawka.¦SELECT nazwa, cena ____ stawka↵FROM @table@;¦i:AS¦Jawne nadanie aliasu ma dwie litery.¦AS nadaje nazwę kolumnie lub tabeli w zapytaniu.
SQL¦Agregacje¦1¦Liczba rekordów¦Policz liczbę aktywnych rekordów.¦SELECT ____(*) AS liczba↵FROM @table@ WHERE aktywny = 1;¦i:COUNT¦Funkcja zliczająca wiersze.¦COUNT(*) zlicza wiersze pasujące do warunków.
SQL¦Agregacje¦1¦Średnia cena¦Policz średnią cenę.¦SELECT ____(cena) AS srednia↵FROM @table@;¦i:AVG¦Skrót od average.¦AVG oblicza średnią z wartości różnych od NULL.
SQL¦Agregacje¦1¦Suma wartości¦Zsumuj wszystkie ceny.¦SELECT ____(cena) AS suma↵FROM @table@;¦i:SUM¦Nazwa oznacza sumę.¦SUM dodaje wartości wskazanego wyrażenia.
SQL¦Agregacje¦1¦Najwyższa cena¦Odczytaj najwyższą cenę.¦SELECT ____(cena) AS najwyzsza↵FROM @table@;¦i:MAX¦Funkcja szuka maksimum.¦MAX zwraca największą niepustą wartość.
SQL¦Agregacje¦2¦Podział na grupy¦Policz rekordy osobno dla każdej grupy.¦SELECT grupa_id, COUNT(*) AS liczba↵FROM @table@↵____ grupa_id;¦i:GROUP BY¦Dwuwyrazowa klauzula grupowania.¦GROUP BY tworzy grupy, dla których liczone są agregaty.
SQL¦Agregacje¦2¦Warunek grupy¦Pokaż grupy liczące co najmniej @limit@ rekordów.¦SELECT grupa_id, COUNT(*) AS liczba↵FROM @table@↵GROUP BY grupa_id↵____ COUNT(*) >= @limit@;¦i:HAVING¦WHERE filtruje przed grupowaniem.¦HAVING filtruje gotowe grupy i może używać agregatów.
SQL¦Relacje¦2¦Warunek złączenia¦grupa_id pozycji wskazuje id w słowniku. Uzupełnij warunek złączenia.¦SELECT p.nazwa, g.nazwa↵FROM @table@ AS p↵JOIN @group@ AS g↵ON ____;¦p.grupa_id = g.id;;g.id = p.grupa_id¦Porównaj klucz obcy pozycji z kluczem głównym grupy.¦Warunek ON opisuje powiązanie rekordów obu tabel.
SQL¦Relacje¦2¦Puste grupy¦Pokaż wszystkie grupy, również bez pozycji. Wstaw typ złączenia.¦SELECT g.nazwa, p.nazwa↵FROM @group@ AS g↵____ @table@ AS p ON p.grupa_id = g.id;¦i:LEFT JOIN;;LEFT OUTER JOIN¦Zachowaj wiersze tabeli po lewej.¦LEFT JOIN zwraca lewe wiersze bez dopasowania, z NULL w prawych kolumnach.
SQL¦Modyfikacje¦1¦Aktualizacja¦Zmień cenę rekordu o id @id@ na @price@.¦____ @table@↵SET cena = @price@↵WHERE id = @id@;¦i:UPDATE¦Polecenie aktualizacji danych.¦UPDATE zmienia wartości istniejących rekordów.
SQL¦Modyfikacje¦1¦Nowa wartość kolumny¦Wstaw klauzulę przypisania nowej ceny.¦UPDATE @table@↵____ cena = @price@↵WHERE id = @id@;¦i:SET¦Słowo poprzedza zmieniane kolumny.¦SET określa kolumny i nowe wartości w UPDATE.
SQL¦Modyfikacje¦1¦Dodanie rekordu¦Dodaj rekord. Uzupełnij dwuwyrazowe polecenie.¦____ @table@ (id, nazwa, cena)↵VALUES (@id@, '@label@', @price@);¦i:INSERT INTO¦Polecenie wstawiania i wskazania tabeli.¦INSERT INTO rozpoczyna dodawanie danych.
SQL¦Modyfikacje¦2¦Usunięcie rekordu¦Usuń rekord o id @id@ i zachowaj pozostałe.¦DELETE FROM @table@↵____ id = @id@;¦i:WHERE¦Bez tej klauzuli usuwasz wszystkie wiersze.¦WHERE ogranicza DELETE do wskazanych rekordów.
SQL¦Struktura¦2¦Wymagana wartość¦Kolumna nazwa ma wymagać wartości różnej od NULL.¦CREATE TABLE @table@ (↵  id INT PRIMARY KEY,↵  nazwa VARCHAR(@width@) ____↵);¦i:NOT NULL¦Dwa słowa wykluczające NULL.¦NOT NULL wymaga wartości. Pusty tekst pozostaje osobną kwestią walidacji.
PHP¦Składnia¦1¦Początek skryptu¦Otwórz blok PHP.¦____↵$nazwa = '@label@';↵echo $nazwa;¦<?php¦Znacznik zawiera znak zapytania.¦Standardowy znacznik otwierający kod serwerowy to <?php.
PHP¦Składnia¦1¦Zmienna¦Wstaw znak poprzedzający nazwę zmiennej.¦<?php↵____cena = @price@;↵echo $cena;¦$¦Znak dolara.¦Zmienne w PHP zaczynają się od $.
PHP¦Składnia¦1¦Łączenie tekstu¦Połącz cenę z dopiskiem „ zł”. Wstaw operator.¦<?php↵$cena = @price@;↵echo $cena ____ ' zł';¦.¦W PHP konkatenacja używa kropki.¦Operator . łączy ciągi znaków.
PHP¦Składnia¦1¦Wypisanie wyniku¦Wypisz nazwę do odpowiedzi.¦<?php↵$nazwa = '@label@';↵____ $nazwa;¦echo;;print¦Najczęściej używa się echo.¦echo wypisuje treść do odpowiedzi. print również działa dla jednego wyrażenia.
PHP¦Warunki¦1¦Gałąź warunkowa¦Wykonaj blok, gdy liczba sztuk wynosi co najmniej @qty@.¦<?php↵$sztuki = @max@;↵____ ($sztuki >= @qty@) {↵    echo 'Rabat';↵}¦if¦Słowo warunku ma dwie litery.¦if wykonuje blok przy prawdziwym warunku.
PHP¦Tablice¦1¦Każdy element¦Przejdź przez wszystkie pozycje tablicy.¦<?php↵$nazwy = ['@label@', 'Inna oferta'];↵____ ($nazwy as $nazwa) {↵    echo $nazwa;↵}¦foreach¦Pętla dla każdego elementu.¦foreach przechodzi po wartościach tablicy.
PHP¦Funkcje¦1¦Zwrot wartości¦Funkcja ma zwrócić koszt do miejsca wywołania.¦<?php↵function koszt($n) {↵    ____ $n * @price@;↵}↵echo koszt(@qty@);¦return¦Samo echo wyświetliłoby wynik.¦return przekazuje wartość i kończy wykonanie funkcji.
PHP¦Formularze¦1¦Odczyt POST¦Formularz ma method="post" i name="@name@". Wstaw nazwę tablicy bez $.¦<?php↵$wartosc = $____['@name@'] ?? '';↵echo htmlspecialchars($wartosc, ENT_QUOTES, 'UTF-8');¦_POST¦Nazwa zaczyna się podkreśleniem.¦$_POST zawiera pola przesłane obsługiwanym formularzem POST.
PHP¦Formularze¦1¦Odczyt GET¦Adres zawiera ?@name@=@id@. Wstaw nazwę tablicy parametru bez $.¦<?php↵$id = $____['@name@'] ?? null;¦_GET¦Nazwa odnosi się do metody GET.¦$_GET zawiera parametry zapytania adresu URL.
PHP¦Formularze¦2¦Wartość domyślna¦Gdy klucz nie istnieje lub ma NULL, użyj pustego tekstu.¦<?php↵$nazwa = $_POST['@name@'] ____ '';¦??¦Dwa znaki zapytania.¦?? zwraca prawy argument, gdy lewy nie istnieje lub ma NULL.
PHP¦Walidacja¦1¦Skrajne spacje¦Usuń białe znaki na początku i końcu nazwy.¦<?php↵$tekst = '  @label@  ';↵$nazwa = ____($tekst);¦trim¦Funkcja ma cztery litery.¦trim usuwa skrajne białe znaki.
PHP¦Walidacja¦2¦Liczba całkowita¦Zwaliduj tekst jako liczbę całkowitą.¦<?php↵$tekst = '@qty@';↵$n = filter_var($tekst, ____);¦FILTER_VALIDATE_INT¦Stała zaczyna się od FILTER_VALIDATE_.¦FILTER_VALIDATE_INT zwraca liczbę całkowitą albo false przy błędzie.
PHP¦HTML¦1¦Bezpieczny tekst HTML¦Wypisz dane jako tekst wewnątrz HTML.¦<?php↵$nazwa = '@label@ & dodatki';↵echo ____($nazwa, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');¦htmlspecialchars¦Funkcja koduje specjalne znaki HTML.¦htmlspecialchars zamienia m.in. < i & na encje w kontekście HTML.
PHP¦Liczby¦2¦Format kwoty¦Wyświetl kwotę z dwoma miejscami i polskim separatorem.¦<?php↵$cena = @price@.5;↵echo ____($cena, 2, ',', ' ') . ' zł';¦number_format¦Nazwa zawiera number i format.¦number_format zwraca sformatowany tekst liczby.
PHP¦mysqli¦1¦Połączenie¦Wstaw nazwę klasy połączenia z MySQL/MariaDB.¦<?php↵$db = new ____('localhost', 'uczen', 'haslo', '@table@');¦mysqli¦Nazwa rozszerzenia kończy się literą i.¦new mysqli tworzy obiekt połączenia z bazą.
PHP¦mysqli¦1¦Kodowanie połączenia¦Ustaw kodowanie połączenia na utf8mb4.¦<?php↵// $db to gotowe połączenie mysqli.↵$db->____('utf8mb4');↵$wynik = $db->query('SELECT nazwa FROM @table@');¦set_charset¦Metoda ustawia zestaw znaków.¦set_charset określa kodowanie komunikacji PHP z bazą.
PHP¦mysqli¦1¦Stałe zapytanie¦Wykonaj stały SELECT przy gotowym połączeniu.¦<?php↵$wynik = $db->____('SELECT nazwa FROM @table@ ORDER BY id');¦query¦Angielskie słowo oznaczające zapytanie.¦query wykonuje SQL. Dane użytkownika przekazuj przez parametry.
PHP¦mysqli¦1¦Kolejny rekord¦Pobieraj kolejne rekordy według nazw kolumn.¦<?php↵$wynik = $db->query('SELECT nazwa FROM @table@');↵while ($r = $wynik->____()) {↵    echo htmlspecialchars($r['nazwa'], ENT_QUOTES, 'UTF-8');↵}¦fetch_assoc¦Nazwa zawiera fetch i assoc.¦fetch_assoc pobiera wiersz jako tablicę asocjacyjną.
PHP¦mysqli¦2¦Liczba wyników¦Sprawdź właściwość wyniku oznaczającą liczbę wierszy.¦<?php↵$wynik = $db->query('SELECT nazwa FROM @table@');↵if ($wynik->____ === 0) {↵    echo 'Brak wyników';↵}¦num_rows¦To właściwość, bez nawiasów wywołania.¦num_rows to liczba rekordów w buforowanym wyniku mysqli.
PHP¦mysqli¦2¦Przygotowanie SQL¦Przygotuj zapytanie parametryzowane dla id.¦<?php↵$stmt = $db->____('SELECT nazwa FROM @table@ WHERE id = ?');↵$id = @id@;↵$stmt->bind_param('i', $id);↵$stmt->execute();¦prepare¦Metoda przygotowuje SQL z symbolem ?.¦prepare oddziela konstrukcję SQL od wartości.
PHP¦mysqli¦2¦Typ parametru¦Wybierz literę typu identyfikatora całkowitego.¦<?php↵$stmt = $db->prepare('SELECT nazwa FROM @table@ WHERE id = ?');↵$id = @id@;↵$stmt->bind_param('____', $id);¦i¦Skrót od integer.¦Typ i w bind_param reprezentuje liczbę całkowitą.
PHP¦mysqli¦2¦Wykonanie SQL¦Uruchom przygotowane zapytanie.¦<?php↵$stmt = $db->prepare('SELECT nazwa FROM @table@ WHERE id = ?');↵$id = @id@;↵$stmt->bind_param('i', $id);↵$stmt->____();¦execute¦Metoda wykonująca instrukcję.¦execute uruchamia SQL z powiązanymi wartościami.
PHP¦Sesje¦2¦Uruchomienie sesji¦Uruchom sesję przed zapisem danych.¦<?php↵____();↵$_SESSION['ostatni'] = '@slug@';¦session_start¦Funkcja zaczyna się od session_.¦session_start otwiera lub wznawia sesję przed wysłaniem treści odpowiedzi.
PHP¦Tablice¦1¦Liczba elementów¦Policz elementy tablicy.¦<?php↵$nazwy = ['@label@', '@slug@', 'Oferta'];↵echo ____($nazwy);¦count¦Funkcja zliczająca ma pięć liter.¦count zwraca liczbę elementów tablicy.
PHP¦mysqli¦1¦Zamknięcie połączenia¦Zamknij połączenie po zakończeniu operacji.¦<?php↵$wynik = $db->query('SELECT nazwa FROM @table@');↵// Wynik został obsłużony.↵$db->____();¦close¦Przeciwieństwo open.¦close zwalnia połączenie mysqli z serwerem.
JavaScript¦Podstawy¦1¦Stała nazwa¦Zadeklaruj zmienną, której nie przypiszesz ponownie.¦____ cena = @price@;↵console.log(cena * @qty@);¦const¦Słowo ma pięć liter.¦const blokuje ponowne przypisanie do nazwy. Zawartość obiektu nadal może się zmieniać.
JavaScript¦Podstawy¦1¦Zmienna blokowa¦Wstaw nowoczesną deklarację zmiennej blokowej, którą następnie zwiększamy.¦____ liczba = @qty@;↵liczba += 1;↵console.log(liczba);¦let¦Deklaracja ma trzy litery.¦let pozwala ponownie przypisywać wartość w zakresie blokowym.
JavaScript¦Podstawy¦1¦Tekst na liczbę¦Przekształć tekst na liczbę, by otrzymać @sum@.¦const tekst = "@price@";↵console.log(____(tekst) + @qty@);¦Number¦Konwersja liczbowa zaczyna się wielką literą.¦Number konwertuje cały tekst. Dla pustego tekstu daje 0, więc sprawdzaj też brak wejścia.
JavaScript¦Warunki¦1¦Ścisła równość¦Użyj operatora ścisłej równości.¦const id = @id@;↵if (id ____ @id@) {↵  console.log("Wybrano @slug@");↵}¦===¦Trzy znaki równości.¦=== porównuje wartości bez automatycznej konwersji typu.
JavaScript¦Warunki¦1¦Oba warunki¦Obie nierówności muszą być prawdziwe.¦const n = @qty@;↵if (n >= 1 ____ n <= @max@) {↵  console.log("Poprawna liczba");↵}¦&&¦Dwa znaki ampersand.¦&& wymaga prawdziwości obu warunków.
JavaScript¦Warunki¦1¦Podzielność¦Sprawdź, czy liczba jest podzielna przez @qty@.¦const n = @qty@ * 3;↵if (n ____ @qty@ === 0) {↵  console.log("Podzielna");↵}¦%¦Operator reszty z dzielenia.¦% zwraca resztę z dzielenia.
JavaScript¦Pętle¦1¦Długość tablicy¦Uzupełnij właściwość liczby elementów tablicy.¦const ceny = [@price@, @higher@];↵for (let i = 0; i < ceny.____; i++) {↵  console.log(ceny[i]);↵}¦length¦To właściwość, a nie metoda.¦Ostatni indeks niepustej tablicy wynosi length - 1.
JavaScript¦Pętle¦1¦Po wartościach¦Uzupełnij słowo pętli for…of.¦const nazwy = ["@label@", "Druga oferta"];↵for (const nazwa ____ nazwy) {↵  console.log(nazwa);↵}¦of¦Przejdź po wartościach, a nie kluczach.¦for…of pobiera wartości z obiektu iterowalnego.
JavaScript¦Funkcje¦1¦Zwrot kosztu¦Zwróć wynik mnożenia do miejsca wywołania.¦function koszt(n) {↵  ____ n * @price@;↵}↵console.log(koszt(@qty@));¦return¦Samo console.log nie zwraca wyniku funkcji.¦return przekazuje wartość i kończy wywołanie.
JavaScript¦Tablice¦1¦Dopisanie elementu¦Dodaj nazwę na koniec istniejącej tablicy.¦const nazwy = ["@label@"];↵nazwy.____("Nowa @slug@");¦push¦Metoda dodaje na końcu.¦push modyfikuje tablicę i zwraca nową długość.
JavaScript¦Tablice¦2¦Filtrowanie¦Wybierz wszystkie kwoty nie mniejsze niż @price@.¦const ceny = [@lower@, @price@, @higher@];↵const pasujace = ceny.____(cena => cena >= @price@);¦filter¦Metoda zwraca tablicę elementów pasujących do warunku.¦filter tworzy nową tablicę wybranych wartości.
JavaScript¦Tablice¦2¦Przekształcenie wartości¦Utwórz nową tablicę cen pomnożonych przez @qty@.¦const ceny = [@price@, @higher@];↵const koszty = ceny.____(cena => cena * @qty@);¦map¦Każdy element otrzymuje nową wartość.¦map zwraca tablicę wyników funkcji wywołanej dla elementów.
JavaScript¦Tablice¦2¦Pierwsze trafienie¦Odczytaj pierwszy element większy od @price@.¦const ceny = [@lower@, @sum@, @higher@];↵const pierwsza = ceny.____(cena => cena > @price@);¦find¦filter zwróciłoby tablicę wszystkich trafień.¦find zwraca pierwszą pasującą wartość albo undefined.
JavaScript¦DOM¦1¦Element po id¦Wstaw metodę wyszukującą po samym identyfikatorze.¦const pole = document.____("@slug@");¦getElementById¦Przyjmuje id bez kratki.¦getElementById odnajduje element po jego id.
JavaScript¦DOM¦1¦Selektor CSS¦Wybierz pierwszy element klasy @slug@ selektorem CSS.¦const karta = document.____(".@slug@");¦querySelector¦Metoda przyjmuje pełny selektor.¦querySelector zwraca pierwszy pasujący element albo null.
JavaScript¦DOM¦2¦Wszystkie elementy¦Pobierz wszystkie linki wewnątrz .@slug@.¦const linki = document.____(".@slug@ a");↵linki.forEach(link => console.log(link.href));¦querySelectorAll¦Nazwa kończy się All.¦querySelectorAll zwraca statyczną listę pasujących elementów.
JavaScript¦DOM¦1¦Zwykły tekst¦Wstaw wynik jako tekst bez interpretowania HTML.¦const wynik = document.querySelector("#wynik");↵wynik.____ = "Cena: @price@ zł";¦textContent;;innerText¦Tekstowa zawartość węzła.¦textContent wstawia tekst zamiast parsować znaczniki. innerText również poprawnie zapisuje tutaj zwykły tekst.
JavaScript¦DOM¦1¦Wartość pola¦Odczytaj bieżącą zawartość input.¦const pole = document.querySelector("#@slug@");↵const tekst = pole.____;¦value¦Właściwość kontrolki formularza.¦value zwraca wartość pola, zwykle jako tekst.
JavaScript¦Zdarzenia¦1¦Nasłuch kliknięcia¦Zarejestruj funkcję reagującą na click.¦const przycisk = document.querySelector("#@slug@");↵przycisk.____("click", () => {↵  console.log("Wybrano @label@");↵});¦addEventListener¦Metoda dodaje nasłuchiwanie zdarzenia.¦addEventListener wiąże funkcję z typem zdarzenia.
JavaScript¦Zdarzenia¦2¦Blokada wysyłki¦Lokalny kalkulator ma obsłużyć submit bez przeładowania.¦const form = document.querySelector("#@slug@");↵form.addEventListener("submit", event => {↵  event.____();↵  console.log("Obliczono");↵});¦preventDefault¦Zablokuj domyślną akcję.¦preventDefault zatrzymuje domyślną akcję, np. wysyłkę formularza.
JavaScript¦DOM¦2¦Przełącz klasę¦Po wywołaniu zmień obecność klasy active.¦const karta = document.querySelector(".@slug@");↵karta.classList.____("active");¦toggle¦Dodaj brakującą klasę albo usuń obecną.¦toggle przełącza obecność klasy i zwraca jej stan po zmianie.
JavaScript¦Walidacja¦2¦Pełna liczba¦Sprawdź, czy n jest liczbą całkowitą.¦const n = Number("@qty@");↵if (Number.____(n)) {↵  console.log("Pełna liczba sztuk");↵}¦isInteger¦Nazwa zaczyna się od is.¦Number.isInteger sprawdza typ liczbowy i całkowitą wartość.
JavaScript¦Tekst¦1¦Usunięcie spacji¦Usuń białe znaki z początku i końca tekstu.¦const tekst = "  @label@  ";↵const nazwa = tekst.____();¦trim¦Metoda ma cztery litery.¦trim zwraca nowy tekst bez skrajnych białych znaków.
JavaScript¦Liczby¦2¦Miejsca dziesiętne¦Zwróć tekst kwoty z dokładnie dwiema cyframi po kropce.¦const cena = @price@.5;↵console.log(cena.____(2));¦toFixed¦Metoda przyjmuje liczbę miejsc dziesiętnych.¦toFixed zwraca tekst, np. "12.50".
JavaScript¦DOM¦2¦Dane atrybutu data¦Przycisk ma data-cena="@price@". Uzupełnij właściwość dla atrybutów data-*.¦const przycisk = document.querySelector("#@slug@");↵const cena = Number(przycisk.____.cena);¦dataset¦Właściwość mapuje atrybuty data-* na nazwy.¦dataset zawiera wartości atrybutów data-* jako teksty.
`;

const sequences = {};
const definitions = specifications.trim().split('\n').map(line=>{
  const cells=line.split('¦');
  if(cells.length!==9) throw new Error('Niepełny szablon uzupełniania: '+line);
  const [language,topic,level,title,prompt,code,answer,hint,explanation]=cells;
  sequences[language]=(sequences[language]||0)+1;
  const familyId=language.toLowerCase()+'-'+String(sequences[language]).padStart(2,'0');
  return {familyId,language,topic,level:Number(level),title,prompt,code,answer,hint,explanation};
});
const fill = (text,context) => text.replace(/@(\w+)@/g,(_,name)=>{
  if(!(name in context)) throw new Error('Brak parametru '+name);
  return context[name];
}).replaceAll('↵','\n');

export const gapVariantsPerFamily = contexts.length;
export const gapFamilies = definitions.map(({familyId,language,topic,level,title})=>({id:familyId,language,topic,level,title,variants:contexts.length}));
export const gapTopics = [...new Set(definitions.map(item=>item.language))].map(language=>({
  language,topics:[...new Set(definitions.filter(item=>item.language===language).map(item=>item.topic))]
}));
export const gapCount = definitions.length * contexts.length;
export function getGap(familyId,variant=1) {
  const family=definitions.find(item=>item.familyId===familyId);
  if(!family || !Number.isInteger(variant) || variant<1 || variant>contexts.length) throw new RangeError('Niepoprawny identyfikator zadania lub wariant.');
  const context=contexts[variant-1];
  const caseInsensitive=family.answer.startsWith('i:');
  const answers=fill(caseInsensitive?family.answer.slice(2):family.answer,context).split(';;');
  const code=fill(family.code,context);
  return {id:familyId+'/'+variant,familyId,language:family.language,topic:family.topic,level:family.level,title:family.title,
    variant,prompt:fill(family.prompt,context),code,answers,caseInsensitive,hint:family.hint,explanation:family.explanation,
    solution:code.replace('____',answers[0])};
}
export function getGapById(id) {
  const [familyId,variant]=String(id).split('/');
  return getGap(familyId,Number(variant));
}
export function checkGap(answer,item) {
  const normalize = value => {
    let cleaned=String(value).trim().replace(/\s+/g,' ');
    if(item.familyId==='sql-19') cleaned=cleaned.replace(/\s*=\s*/g,'=');
    return item.caseInsensitive?cleaned.toLocaleLowerCase('en'):cleaned;
  };
  const actual=normalize(answer);
  return actual.length>0 && item.answers.some(expected=>normalize(expected)===actual);
}
