# Rzeczywisty spacer przez model wnętrza

Podgląd: `dist/wejscie.html`. Obecna strona główna `dist/index.html` pozostaje bez zmian. Plik podglądu powstaje z niej przez `node scripts/build-walkthrough.cjs`.

To scena 3D renderowana przez WebGL, nie skalowanie zdjęcia ani pokaz slajdów. Własna geometria w `dist/interior-model.js`: hol, otwór wejściowy, ściany i sufit, przeszklenia, kuchnia z kamienną wyspą, modułowa sofa, fotele, stoliki, wyposażenie i taras. Ruch kamery: hol → przejście przez drzwi → wejście do salonu → obrót w stronę sofy. Ścieżka w `dist/walkthrough.js`; jednostki modelu to metry, wysokość kamery 1,65 m. Ruch i spojrzenie mają osobne krzywe przestrzenne.

Scroll działa natywnie, bez przechwytywania kółka ani dotyku. Można cofać, pominąć przejście lub otworzyć klasyczny widok strony. Podczas przejścia scena pozostaje przypięta do ekranu; po jej zakończeniu wraca normalna strona. Tekst hero pozostaje statyczny. Ustawienie systemowe ograniczonego ruchu daje nieruchomy kadr i wyłącza długą sekcję przewijania.

Materiały PBR używają wygenerowanych tekstur drewna i kamienia oraz proceduralnej faktury tkaniny. Światło i cienie powstają w scenie; na komputerze dodano SSAO i wygładzanie krawędzi, a na telefonie wyłączono SSAO i ograniczono rozdzielczość renderowania. Renderowanie zatrzymuje się po ustaniu ruchu i poza widoczną sekcją. Brak WebGL lub utrata kontekstu pozostawia widok zastępczy i odnośnik do klasycznej strony.

To **roboczy model koncepcyjny**, a nie realizacja klientki ani finalna fotorealistyczna wizualizacja. Pokazuje działającą mechanikę spaceru i parallaxę. Docelowy wygląd można oprzeć na zatwierdzonym modelu projektu studia i dopracowanych materiałach. Nie wykorzystano zdjęć ani modeli stron inspiracyjnych.

Inspiracje obejrzane w przeglądarce: [HILIGHT](https://hilight.design/) — przejście przestrzenne podczas scrollowania, [LA.BURO](https://la-buro.ru/) — spokojna kompozycja, [HEDO](https://hedoarchitects.pl/) — duża rola fotografii. Wcześniejszy płaski eksperyment został zastąpiony prawdziwą sceną.

Biblioteka: Three.js 0.180.0 z oficjalnej paczki npm, lokalnie w `dist/vendor/three`, z oryginalną licencją MIT w pliku `LICENSE`. Kod nie wymaga CDN podczas otwierania podglądu. Wybrane dodatki: RoundedBoxGeometry, RoomEnvironment, EffectComposer, SSAOPass i OutputPass wraz z zależnościami.

Źródła generowanych tekstur i pełne prompty: [IMAGE_PROMPTS_WALKTHROUGH.md](IMAGE_PROMPTS_WALKTHROUGH.md).
