# Sklep dla architektów — podgląd

Katalog: `dist/sklep.html`. Siedem samodzielnych kart `dist/produkt-*.html`, wspólny styl `dist/shop.css` i filtry `dist/shop.js`. Nawigacja całej witryny prowadzi do nowego katalogu.

Treści pochodzą z przekazanych plansz: kurs podstawowy, zaawansowany, pakiet pCon.planner, Poradnik Projektanta, Poradnik + DWG, Zrozum wnętrza, Ankieta do projektu wnętrza. Zestawienie danych i uwag przed sprzedażą: `content/products.json`. Generowanie katalogu i kart: `node scripts/build-shop.cjs`. Dodanie pozycji w danych tworzy kolejną kartę bez zmiany szablonu; pole `group` wybiera sekcję (`training` albo `publications`).

To katalog bez płatności, koszyka, kont i pobierania plików. Przyciski „Zapytaj o dostępność” otwierają wiadomość do studia z tytułem produktu; niczego samodzielnie nie wysyłają. Nie podano cen, okresów dostępu, liczby lekcji, liczby stron ani niepotwierdzonych licencji. Brak fikcyjnych opinii. Makiety okładek są typograficznymi elementami HTML/CSS i nie przedstawiają finalnych plików. Miejsca na podgląd oryginalnych materiałów są opisane jako oczekujące na uzupełnienie.

Przed uruchomieniem sprzedaży właścicielka potwierdza oryginalne materiały, finalne okładki i fragmenty do publikacji, ceny, dokładny zakres pakietów, zgodność kursów z wersją programu, warunki dostępu, formaty plików i licencję. Ankieta do publikacji musi być czystym wzorem bez danych klientów. Dla „Zrozum wnętrza” nie odtworzono nieznanego spisu treści.

Filtry: Wszystkie 7, Szkolenia 2, E-booki 3, Narzędzia 2 (w tym Poradnik + DWG), Pakiety 1. Kategorie mogą się nakładać.
