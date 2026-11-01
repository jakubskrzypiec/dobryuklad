# DOBRY UKŁAD — koncepcja strony głównej

Wersja 2 po ponownej analizie wszystkich 36 stron PDF. Wizualnym wzorcem strony głównej jest makieta ze strony 5; zakres i treści określa strona 6. Fonty na bezpośrednie polecenie użytkownika: **Libre Caslon Display + DM Sans**, identyczne jak w MOTHI.form, bez kursywy. Biel #fff, czerń, grafit i taupe. Pozostałe podstrony są poza bieżącym zakresem.

Uruchomienie: dowolny serwer HTTP z katalogiem `dist`, np. `python -m http.server 4173 --directory dist`. Brak zależności i kompilacji.

Strona zawiera krótką prezentację studia, szeroki kadr portfolio, trzy pakiety, suwak, cztery miejsca na autentyczne opinie, niską zapowiedź sklepu i fotograficzny pasek kontaktu. Informacje uzupełniające i formularz są w oknach dialogowych. Menu, galeria, przełączanie kadrów, klawiatura, pauza animacji cienia oraz ograniczenie ruchu są obsługiwane.

## Materiały i ograniczenia

Cztery obrazy `dist/assets/hero-v2.webp`, `dining-v2.webp`, `bathroom-v2.webp`, `books-v2.webp` wygenerowano wbudowanym narzędziem imagegen, zgodnie z koncepcyjnymi fotografiami makiety. To ilustracje, nie realizacje ani finalne okładki studia. Prompty i pochodzenie opisano w ASSETS.md. Tekstura `shadow.webp` pochodzi z repozytorium MOTHI.form.

Nie dodano fikcyjnych opinii ani fałszywej pary przed/po. Cztery sloty opinii czekają na cytaty właścicielki. Suwak wykorzystuje ten sam koncepcyjny kadr po obu stronach, do zastąpienia dopasowaną wizualizacją i zdjęciem realizacji.

Formularz waliduje dane i przygotowuje wiadomość w aplikacji pocztowej. Sam nie wysyła ani nie zapisuje danych. Rzut i inspiracje można dodać w aplikacji pocztowej. Płatności, koszyk, konta użytkownika, CMS/WordPress i panel administracyjny nie zostały wdrożone w tym etapie. Witryna jest oznaczona noindex.

Kontakt pochodzi z aktualnej korespondencji Sandry Białkowskiej, profil Instagram z obecnej witryny https://studiodobryuklad.pl/. Główne źródła: PDF z 01.11.2026 oraz https://github.com/jakubskrzypiec/mothiform.

## Hero — bieżący krok
Nowy hero zajmuje pierwszy ekran. Wycentrowany kadr wnętrza, animowane cienie, dwa przyciski po lewej i hasło przy lewej dolnej krawędzi. Zgodnie z nowym wycinkiem briefu tylko hero używa Playfair Display + Manrope bez kursywy. Style tego kroku: dist/hero.css. Pozostałe sekcje pozostają do dalszej osobnej pracy.

Aktualizacja hero: oryginalne logo u góry, hasło nad przyciskami, przyciski bez strzałek. Usunięto animowaną kopię fotografii; porusza się wyłącznie tekstura cienia, zdjęcie pozostaje nieruchome.
