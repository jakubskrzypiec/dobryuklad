# Od projektu do efektu końcowego

Bieżący wariant: dist/wejscie.html, budowany poleceniem node scripts/build-walkthrough.cjs z zatwierdzonej strony głównej. Standardowy dist/index.html pozostaje bez zmian.

## Trzy etapy project-7

1. Projekt: techniczny rzut z góry na jasnym tle, z liniami ścian, szklenia i wyposażenia odpowiadającymi temu samemu wnętrzu. Brak fikcyjnych metraży i wymiarów klientki. Kamera ma stabilny pionowy kierunek, z północą rzutu na górze.
2. Wizualizacja: rzeczywista geometria modelu zostaje spłaszczona do planu i płynnie nabiera wysokości. Kamera opada bez obrotu wokół osi widoku. Biała makieta przechodzi w kolorowe materiały i oświetlenie. Spacer rozpoczyna się we wnętrzu w tej samej pozycji, orientacji i polu widzenia, w których zakończył się przelot z góry.
3. Efekt końcowy: kamera zatrzymuje się w kadrze dopasowanym do wygenerowanego obrazu, a scroll powoli odsłania fotorealistyczne hero. Następnie pojawiają się hasło i przyciski. To koncepcja, nie zdjęcie realizacji studia.

## Podział scrolla

Sekcja: 1350svh na komputerze, 1200svh na telefonie. Scroll jest natywny, bez przechwytywania kółka czy dotyku; cała historia działa w obie strony.

| Fragment | Zakres postępu |
| --- | --- |
| Ściany i wyposażenie nabierają wysokości | 3,5–17,5% |
| Kamera opada z rzutu do wnętrza | 7,5–27,5% |
| Makieta dostaje materiały i światło | 21,5–32,5% |
| Spacer we wnętrzu | 32,5–74% |
| Przenikanie do fotograficznego finału | 76,5–93% |
| Hasło i przyciski | 88–95,5% |
| Zatrzymanie gotowego hero | ostatnie 4,5% |

Pomiń spacer prowadzi do pełnego końcowego hero. Dalsze przewijanie przechodzi do sekcji O nas. Preferencja ograniczonego ruchu i brak WebGL pokazują fotograficzny finał. Bez poprawnego wczytania obrazu spacer pozostaje funkcjonalny i kończy się modelem.

## Implementacja

- interior-project.js: rzut i biała kopia tej samej geometrii. Sufity oraz otoczenie są pomijane w makiecie. Oryginalne materiały i scena pozostają nienaruszone. Zewnętrzne elementy oraz sufity mają oddzielne znaczniki zachowywane przez łączenie statycznych geometrii.
- interior-stage-pass.js: zgodne kadry makiety i materiałów są mieszane w przybliżeniu percepcyjnym. Podwójny render działa wyłącznie podczas pojawiania się materiałów.
- walkthrough-motion.js: osobny tor z góry kończy się dokładnie na początku skróconej trasy pieszej. Główna trasa nadal rozkłada postęp według drogi i kąta obrotu, z interpolacją kwaternionów, tłumieniem krytycznym i limitem szybkości.
- walkthrough-timing.js: fazy, wzrost geometrii, zanik linii, materiały, fotografia i tekst.
- walkthrough.js: sterowanie renderem, rozmiarem i kontrastem menu oraz aktywnymi podpisami etapów. DPR jest ograniczony, a renderowanie modelu zatrzymuje się po pełnym odsłonięciu fotografii i poza widoczną sekcją.

Materiały używają fotograficznych map orzecha i lnu z Poly Haven oraz autorskich map marmuru i podłogi. HDR Forest Slope służy wyłącznie jako źródło radiancji; widok za oknem jest własnym modelem dziedzińca. Szczegóły mebli, zlew, reliefy, narzuta, książki i rośliny to własna geometria. Three.js 0.180.0 oraz lokalne dodatki pochodzą z oficjalnej paczki npm i mają lokalną licencję MIT.

## Weryfikacja

Przed publikacją GitHub Pages uruchamiane są:

- node scripts/check-walkthrough-motion.mjs — ciągłość trasy, kolizje, granice obrotów, ruch w obie strony, spójność przy 30/60/120 fps i dopasowanie projekcji do zdjęcia.
- node scripts/check-interior-craft.mjs — skończona geometria, UV, normalne, rzeczywisty otwór zlewu, zachowanie granic przy łączeniu obiektów.
- node scripts/check-project-story.mjs — rzut i kopia modelu, ukrywanie sufitu/otoczenia, brak mutacji materiałów, pionowy kadr początkowy, ciągłość orientacji do spaceru, bezpieczne wejście pod sufit i poprawna kolejność faz na różnych proporcjach ekranu.

Źródła materiałów: INTERIOR_ASSET_SOURCES.md i INTERIOR_ASSET_MANIFEST.json. Referencja, obraz i pełny prompt końcowego hero: IMAGE_PROMPT_COURTYARD_HERO.md. Warianty wcześniejszych makiet i przejść zachowuje historia Git. Tryb autora ?capture=hero nadal pokazuje sam końcowy model, bez interfejsu i fotografii.
