# Od przestrzennej makiety do efektu końcowego

Bieżący wariant: dist/wejscie.html, budowany poleceniem node scripts/build-walkthrough.cjs z zatwierdzonej strony głównej. Standardowy dist/index.html pozostaje bez zmian.

## Trzy etapy clay-8

1. Projekt: od razu widoczna jest przestrzenna, biała makieta z góry, z wyraźną wysokością ścian i mebli. Etap płaskiego rzutu został usunięty także z renderowanej sceny. Pozostają tylko dyskretne nazwy pomieszczeń, bez fikcyjnych metraży.
2. Wizualizacja: makieta spokojnie nabiera pełnej wysokości, kamera opada bez obrotu wokół osi widoku. Białe powierzchnie przechodzą w materiały i światło. Skrócony spacer biegnie łukiem do boku sofy i wraca do końcowego kadru; pomija dawną trasę za sofą i wokół kuchni.
3. Efekt końcowy: kamera zatrzymuje się w kadrze dopasowanym do wygenerowanego obrazu, a scroll powoli odsłania fotorealistyczne hero. Następnie pojawiają się hasło i przyciski. To koncepcja, nie zdjęcie realizacji studia.

## Podział scrolla

Sekcja: 900svh na komputerze, 800svh na telefonie. Aktywna długość przewijania to 8/7 wysokości ekranu zamiast 12,5/11, czyli około 36% mniej. Scroll jest natywny, bez przechwytywania kółka czy dotyku; cała historia działa w obie strony.

| Fragment | Zakres postępu |
| --- | --- |
| Dokończenie wzrostu już przestrzennej makiety (72→100%) | 2–15% |
| Kamera opada z rzutu do wnętrza | 1,5–27% |
| Makieta dostaje materiały i światło | 20–34% |
| Spacer we wnętrzu | 34–72% |
| Przenikanie do fotograficznego finału | 75–92% |
| Hasło i przyciski | 86,5–95,5% |
| Zatrzymanie gotowego hero | ostatnie 4,5% |

Pomiń spacer prowadzi do pełnego końcowego hero. Dalsze przewijanie przechodzi do sekcji O nas. Preferencja ograniczonego ruchu i brak WebGL pokazują fotograficzny finał. Bez poprawnego wczytania obrazu spacer pozostaje funkcjonalny i kończy się modelem.

## Implementacja

- interior-project.js: biała kopia tej samej geometrii i nazwy pomieszczeń. Płaskie linie planu nie są generowane. Sufity oraz otoczenie są pomijane w makiecie. Oryginalne materiały i scena pozostają nienaruszone. Zewnętrzne elementy oraz sufity mają oddzielne znaczniki zachowywane przez łączenie statycznych geometrii.
- interior-stage-pass.js: zgodne kadry makiety i materiałów są mieszane w przybliżeniu percepcyjnym. Podwójny render działa wyłącznie podczas pojawiania się materiałów.
- walkthrough-motion.js: osobny tor z góry kończy się dokładnie na początku skróconej trasy pieszej. Główna trasa nadal rozkłada postęp według drogi i kąta obrotu, z interpolacją kwaternionów, tłumieniem krytycznym i limitem szybkości.
- walkthrough-timing.js: fazy, wzrost geometrii, zanik linii, materiały, fotografia i tekst.
- walkthrough.js: sterowanie renderem, rozmiarem i kontrastem menu oraz aktywnymi podpisami etapów. DPR jest ograniczony, a renderowanie modelu zatrzymuje się po pełnym odsłonięciu fotografii i poza widoczną sekcją.

Materiały używają fotograficznych map orzecha i lnu z Poly Haven oraz autorskich map marmuru i podłogi. HDR Forest Slope służy wyłącznie jako źródło radiancji; widok za oknem jest własnym modelem dziedzińca. Szczegóły mebli, zlew, reliefy, narzuta, książki i rośliny to własna geometria. Three.js 0.180.0 oraz lokalne dodatki pochodzą z oficjalnej paczki npm i mają lokalną licencję MIT.

## Weryfikacja

Przed publikacją GitHub Pages uruchamiane są:

- node scripts/check-walkthrough-motion.mjs — ciągłość trasy, kolizje, granice obrotów, ruch w obie strony, spójność przy 30/60/120 fps i dopasowanie projekcji do zdjęcia.
- node scripts/check-interior-craft.mjs — skończona geometria, UV, normalne, rzeczywisty otwór zlewu, zachowanie granic przy łączeniu obiektów.
- node scripts/check-project-story.mjs — przestrzenny start bez płaskiego rysunku i kopia modelu, ukrywanie sufitu/otoczenia, brak mutacji materiałów, lekko pochylony kadr początkowy, ciągłość orientacji do spaceru, bezpieczne wejście pod sufit i poprawna kolejność faz na różnych proporcjach ekranu.

Źródła materiałów: INTERIOR_ASSET_SOURCES.md i INTERIOR_ASSET_MANIFEST.json. Referencja, obraz i pełny prompt końcowego hero: IMAGE_PROMPT_COURTYARD_HERO.md. Warianty wcześniejszych makiet i przejść zachowuje historia Git. Tryb autora ?capture=hero nadal pokazuje sam końcowy model, bez interfejsu i fotografii.

## Dopracowanie ruchu clay-8
Trasa piesza ma około 22,85 jednostki ważonej drogi i obrotu wobec poprzednich 53,84. Krótszy scroll nie wynika z przyspieszenia kamery: nowy łuk pomija znaczną część dawnej trasy. Zachowano tłumienie krytyczne, rampy prędkości, dokładne dopasowanie pozycji i orientacji na łączeniach oraz możliwość cofania całej sekwencji. Test obejmuje także odcinki tuż przed i tuż po połączeniu faz, skróconą trasę i start od 72% wysokości modelu. Zmiany koloru menu są delikatnie wygładzane, a systemowe ograniczenie ruchu wyłącza te przejścia.

Bufory przejściowe makiety i materiałów mają MSAA 4×. Podczas mieszania AO korzysta z geometrii makiety, a po pełnym odsłonięciu materiałów z właściwej sceny; ogranicza to niestabilne krawędzie i cienie na przezroczystych elementach. Limit DPR i liczby pikseli ogranicza obciążenie dodatkowych buforów.
