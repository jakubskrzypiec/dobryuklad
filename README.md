[Wersja 2D — aktualnie poprawiany projekt](https://jakubskrzypiec.github.io/dobryuklad/wersja-2d/) — osobny podgląd oparty na wersji ze screena.

Wersja 2D ma nowe naturalne kadry w ciemniejszej palecie studia, jedno wspólne hero wszystkich podstron, nowe przerywniki z niezależnym ruchem cieni liści, jednolite przyciski bez tekstur i strzałek oraz białe płaskie karty oferty bez ilustracji. Paleta materiałów: biel, czerń, grafit, taupe i beż; bez filtrów monochromatycznych. [Cztery finalne obrazy i prompty imagegen](references/STUDIO_REFRESH_IMAGES_V2.md). Generator wcześniejszego odświeżenia i generator archiwum zabezpieczono przed nadpisaniem aktualnej wersji.

**Nowy spacer przez schody na piętro.** Film użytkownika `kling_20261106_VIDEO_Create_a_3_2118_0.mp4` (30,04 s, 24 fps) to 721 klatek: Full HD 1920 × 1080 na komputerze, osobny środkowy kadr 608 × 1080 na telefonie, bez zmniejszania wysokości źródła. Klatki WebP 86 spakowano do 16 zasobów na profil zamiast setek osobnych żądań. Materiał jest wczytywany przed rozpoczęciem; logo i procent pokazują przygotowanie, następnie pojawia się „Click to scroll”. W czasie spaceru nie ma napisów ani menu. Nagłówek, CTA i menu odsłaniają się na końcowej klatce, która zostaje na dodatkową wysokość scrolla. Ruch jest wygładzony i ograniczony prędkością, bufor bitmap ograniczony do 24 na komputerze / 28 na telefonie; playhead nie wyprzedza zdekodowanych klatek. Statyczny wariant dla ograniczonego ruchu, oszczędzania danych, braku JS lub błędu ładowania. [Opis, rozmiary i odtworzenie zasobów](references/ENTRANCE_WALK.md). Kontrole: `node scripts/check-entrance-walk.mjs` i `node scripts/check-2d-refresh.mjs`.

**Portfolio na głównej — przywrócona pierwotna karuzela.** Białe kwadratowe kafelki bez zdjęć, logo na najechaniu, płynny ruch w nieskończonej pętli. Oryginalny układ z wersji 5560e00; bez przycisków, kropek i przejścia 3D. Szablon: `scripts/templates/home-project-carousel.html`, style: `home.css` i `home-atmosphere.css`. Pozostałe sekcje oraz podstrony zachowane.

**Strona główna: wersja 2D (gałąź `claude/strona-2d`).** Wracamy do pierwszej, zwykłej strony bez 3D: fotograficzne hero „Przestrzeń ma znaczenie.”, sekcje oferty i portfolio (`dist/index.html` z commita fb2a94a). Wszystkie wersje 3D zostają w repo do dalszej zabawy: nocna wersja w palecie studia na gałęzi `claude/paleta-studia`, przebudowa `node scripts/build-home-noc.cjs`; jasna wersja z mapą Koszalina: `node scripts/build-home-koszalin.cjs`.

# DOBRY UKŁAD

**Wersja nocna 3D (archiwum).** Cała strona w czerni, brązie i beżu ze złotymi akcentami, na tle z rozmytych, ciepłych świateł i rzadkich gwiazd (`dist/tlo-noc.js`), karty jak przydymione szkło. Wejście: nocna Ziemia od strony Europy pełnej świateł („Każde z tych świateł to czyjeś wnętrze.”), zjazd nad Koszalin na ciemnej mapie (czarny Bałtyk ze złotą linią brzegu, Jamno, lasy, złote łuny miast), ciepły błysk i ciemne hero ze zdjęciem. Przerywnik z globusem też nocą. Pliki: `dist/planeta-noc.js`, `dist/noc-strona.css`, `dist/noc-koszalin.css`, `dist/tlo-noc.js`; przebudowa: `node scripts/build-home-noc.cjs`.

**Strona główna (gałąź `claude/koszalin-mapa`).** Jasna kula obraca się w stronę Polski, kamera zjeżdża nad Koszalin pokazany jak zwykła mapa (ląd, Bałtyk, Jezioro Jamno, zieleń, główne drogi, podpisy: Koszalin, Mielno, Sianów, Góra Chełmska; dane © OpenStreetMap). Napisy najpierw z boku, potem na środku („Poznaj naszą pracownię w Koszalinie.”, „Stąd projektujemy wnętrza w całej Polsce.”). Następnie biały błysk i od razu jasne hero ze zdjęciem — bez przejścia przez wnętrze. Pod całą stroną żywe tło 3D w beżach i brązach (`dist/tlo.js`, `dist/tlo.css`). Pliki: `dist/planeta-koszalin.js`, `dist/koszalin.css`; przebudowa: `node scripts/build-home-koszalin.cjs`. Moduły miasta i wnętrza (`home-city.js`, `home-interior.js`, `home-journey-motion.js`) zostają w repo dla testów, strona główna ich nie ładuje.

Strona główna studia projektowania wnętrz Sandry Białkowskiej.

**Wcześniejszy eksperyment wejścia przez miasto (archiwum).** Jasny globus przechodził przez chmury w koncepcyjną zabudowę, lot do budynku oraz wejście przez korytarz do jasnego salonu. Pliki są zachowane; bieżąca strona główna ich nie ładuje. [Opis połączenia i testów](HOME_JOURNEY.md), [źródło jasnego hero i prompt](references/IMAGE_PROMPT_HERO_DAYLIGHT.md).

Materiały mapowe zachowane w repozytorium: granice i wybrzeża Natural Earth; wcześniejszy plan `dist/assets/planeta/koszalin-osm.json` — © OpenStreetMap contributors, ODbL. Bieżące wejście nie pobiera planu ulic. Nocny eksperyment pozostaje w `planeta.html`.
**[Otwórz podgląd strony](https://jakubskrzypiec.github.io/dobryuklad/)**

[Podstrona O nas](https://jakubskrzypiec.github.io/dobryuklad/o-nas.html) — dwa zdjęcia Sandry, trzy zespołowe, osiem portretów i kontakt. Fotografie oraz podpisy portretów czekają na materiały studia.

## Pliki i publikowanie

Strona znajduje się w katalogu `dist/`. Nie wymaga instalowania zależności ani kompilacji.

Po przebudowie stron starszymi generatorami uruchom na końcu `node scripts/build-site-motion.cjs`. Polecenie ponownie podpina wspólne animacje i galerię; można uruchamiać je wielokrotnie. Główna zachowuje również stonowane tła z `home-atmosphere.css`.

Karuzela korzysta z ciągłej animacji CSS i dwóch identycznych grup, co daje płynną nieskończoną pętlę. Przy ograniczonym ruchu staje się ręcznie przewijaną galerią. Pliki eksperymentalnych przejść pozostają w repo, lecz główna ich nie ładuje.

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
