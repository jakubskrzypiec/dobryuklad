# DOBRY UKŁAD

Strona główna studia projektowania wnętrz Sandry Białkowskiej.

**Aktualna strona główna.** Jasny globus w odcieniach kamienia i beżu przechodzi przez chmury w koncepcyjną zabudowę, lot do budynku oraz wejście przez korytarz do jasnego salonu. Po zatrzymaniu kamery pojawia się dopasowane fotograficzne hero z jasnym dębem, kremowym kamieniem i naturalnym lnem. Podpis i plansza Koszalina zostały pominięte. Przy cytacie pozostaje jasny globus z granicami Natural Earth oraz miastami studia. [Opis połączenia i testów](HOME_JOURNEY.md), [źródło nowego hero i prompt](references/IMAGE_PROMPT_HERO_DAYLIGHT.md).

Materiały mapowe zachowane w repozytorium: granice i wybrzeża Natural Earth; wcześniejszy plan `dist/assets/planeta/koszalin-osm.json` — © OpenStreetMap contributors, ODbL. Bieżące wejście nie pobiera planu ulic. Nocny eksperyment pozostaje w `planeta.html`.
**[Otwórz podgląd strony](https://jakubskrzypiec.github.io/dobryuklad/)**

[Podstrona O nas](https://jakubskrzypiec.github.io/dobryuklad/o-nas.html) — dwa zdjęcia Sandry, trzy zespołowe, osiem portretów i kontakt. Fotografie oraz podpisy portretów czekają na materiały studia.

## Pliki i publikowanie

Strona znajduje się w katalogu `dist/`. Nie wymaga instalowania zależności ani kompilacji.

Każdy push zmian w `dist/` na `main` uruchamia GitHub Actions i publikuje stronę w GitHub Pages. Konfiguracja: `.github/workflows/pages.yml`.

Pracujemy bezpośrednio w tym repozytorium. Podgląd i publikowanie odbywają się przez GitHub Pages.

## Uruchomienie lokalne

Uruchom dowolny serwer HTTP z katalogiem `dist`, np.:

```sh
python -m http.server 4173 --directory dist
```

Następnie otwórz `http://localhost:4173`.

## Stan projektu

- Jasna paleta z grafitem i taupe; Playfair Display i Manrope, bez kursywy.
- Hero z animowanymi cieniami, opis studia, karuzela portfolio, trzy pakiety, porównanie, opinie, kursy, kontakt i social media.
- Zdjęcia projektów, portret studia, dopasowana para wizualizacja–realizacja i cztery autentyczne opinie czekają na materiały od studia.
- Obrazy koncepcyjne opisano w `ASSETS.md`; nie są realizacjami studia.
- Formularz przygotowuje wiadomość w aplikacji pocztowej. Nie wysyła jej samodzielnie.
- Bez płatności, koszyka, kont użytkowników i CMS na tym etapie.

[Podstrona Oferta](https://jakubskrzypiec.github.io/dobryuklad/oferta.html) — trzy pakiety, tabela zakresów i osiem etapów procesu z nawrotem. Dane rozliczeń bez cen, do potwierdzenia w indywidualnej ofercie i umowie.

Czytelność tekstów jest wspólna dla strony głównej, O nas i Oferty: `dist/readability.css`. Opisy 16 px, przyciski i teksty pomocnicze 14 px, z zachowaniem większych nagłówków. Temat ilustracji oferty zweryfikowano przed generowaniem; źródła i prompty są w `OFFER_VISUAL_RESEARCH.md`.

[Portfolio](https://jakubskrzypiec.github.io/dobryuklad/portfolio.html) — osobne galerie Projektów i Realizacji oraz szablon karty inwestycji. Białe pola zdjęć i demonstracyjne filtry; [opis uzupełnienia materiałów](PORTFOLIO.md).

[Sklep dla architektów](https://jakubskrzypiec.github.io/dobryuklad/sklep.html) — katalog siedmiu produktów i osobne karty, bez płatności na etapie podglądu. [Zakres i uzupełnienie materiałów](SHOP.md).

[Kontakt](https://jakubskrzypiec.github.io/dobryuklad/kontakt.html) — formularz zapytania z informacjami o inwestycji i przygotowaniem szkicu wiadomości z załącznikami. [Zakres działania](CONTACT.md).

[Spacer przez wnętrze 3D — podgląd](https://jakubskrzypiec.github.io/dobryuklad/wejscie.html) — biała makieta → korytarz → bezpośredni skręt na sofę i hero, bez objazdu i cofania. Przed Wiedzą z praktyki fotograficzne wnętrze z warstwą głębi przechodzi w niezależnie animowane firany 3D i odsłania dalszą stronę. Osobny wariant; standardowa strona główna pozostaje bez zmian. [Opis modelu](WALKTHROUGH_3D.md).

[Noc nad Koszalinem — podgląd](https://jakubskrzypiec.github.io/dobryuklad/planeta.html) — wariant wejścia: czarne niebo z gwiazdami i nocna Ziemia w czerni i złocie (złote światła miast, złoty sierp słońca na krawędzi). Scroll prowadzi nad Koszalin, przez warstwę chmur podświetlonych od spodu łuną miasta, do widoku nocnego miasta z wysokości (siatka ulic, drogi wylotowe, okoliczne miejscowości, linia Bałtyku). Obraz rozmywa się i przechodzi w fotograficzne hero z dopiskiem „Koszalin · Studio wnętrz”. Natywny scroll w obie strony, przycisk pominięcia, preferencja ograniczonego ruchu i brak WebGL pokazują zwykłe hero. Budowany poleceniem `node scripts/build-planeta.cjs` z `index.html`; pliki `dist/planeta.js`, `dist/planeta.css`, tekstury Ziemi w `dist/assets/planeta/` (NASA Blue/Black Marble z przykładów three.js), GSAP w `dist/vendor/gsap/`. Standardowa strona główna pozostaje bez zmian.
