# Rzeczywisty spacer przez model wnętrza

Podgląd: `dist/wejscie.html`. Obecna strona główna `dist/index.html` pozostaje bez zmian. Plik podglądu powstaje z niej przez `node scripts/build-walkthrough.cjs`.

To scena 3D renderowana przez WebGL. Aktualna geometria w `dist/interior-scene.js` została przebudowana pod zatwierdzony kadr hero: sofa L po lewej, marmurowa wyspa po prawej, wysoka ściana z orzecha i przeszklenie boczne. Poduszki mają zaokrągloną, delikatnie odkształconą geometrię, wypukłość i drobne szwy. Dodano lnianą fakturę, żyłkowany marmur, ciemną podłogę i fizyczne materiały z połyskiem tkaniny. Pierwszy model pozostaje w historii i pliku `dist/interior-model.js`, ale nie jest ładowany przez aktualny podgląd.

Scroll działa natywnie, bez przechwytywania kółka ani dotyku. Kamera przechodzi prawym holem przez otwór wejściowy, obraca się w salonie i kończy ujęciem zbliżonym do fotografii hero. Ruch i spojrzenie mają osobne krzywe, a obiektyw delikatnie zmienia ogniskową. Jednostki to metry. Można cofać cały przebieg. „Pomiń spacer” prowadzi do gotowego hero, z działającymi przyciskami.

Fazy w `dist/walkthrough-timing.js`: kamera kończy ruch przy 68% przewinięcia sekcji, od 71% do 81% następuje przenikanie w oryginalną fotografię, a ostatnie 19% to zatrzymanie na pełnym hero. W finale kopiowany jest cały oryginalny hero strony głównej, ze zdjęciem, fontem, tekstem i przyciskami. Kamera pozostaje w dokładnie tej samej pozycji, a ukryta scena przestaje się renderować. Dalszy scroll prowadzi do „O nas”. Zmniejszony ruch systemowy i brak WebGL od razu pokazują fotograficzne hero, z pominięciem całego spaceru.

Materiały PBR używają wygenerowanych tekstur drewna, marmuru, podłogi i lnu. Odbicia przechwytują rzeczywiste otoczenie modelu przez kamerę sześcienną. Duże światła powierzchniowe doświetlają okno i kuchnię, słońce rzuca cienie geometrycznych ram okna. Na komputerze są SSAO, wygładzanie MSAA i dokładniejsza mapa cieni; na telefonie ograniczono rozdzielczość i wyłączono SSAO. Renderowanie zatrzymuje się po ustaniu ruchu, poza widoczną sekcją i po pełnym przykryciu fotografią. System ograniczonego ruchu nie uruchamia geometrii ani renderera.

To model koncepcyjny, a nie realizacja klientki. Materiały, światło i geometria zostały dopracowane, ale rendering czasu rzeczywistego nadal ma uproszczenia względem fotografii. Fotorealistyczny finał zapewnia dokładnie zatwierdzone zdjęcie hero. Przenikanie jest połączeniem dwóch ujęć, nie rekonstrukcją wnętrza ze zdjęcia. Nie wykorzystano zdjęć ani modeli stron inspiracyjnych.

Inspiracje obejrzane w przeglądarce: [HILIGHT](https://hilight.design/) — przejście przestrzenne podczas scrollowania, [LA.BURO](https://la-buro.ru/) — spokojna kompozycja, [HEDO](https://hedoarchitects.pl/) — duża rola fotografii. Wcześniejszy płaski eksperyment został zastąpiony prawdziwą sceną.

Biblioteka: Three.js 0.180.0 z oficjalnej paczki npm, lokalnie w `dist/vendor/three`, z oryginalną licencją MIT w pliku `LICENSE`. Kod nie wymaga CDN podczas otwierania podglądu. Wybrane dodatki: RoundedBoxGeometry, RoomEnvironment, EffectComposer, SSAOPass i OutputPass wraz z zależnościami.

Źródła generowanych tekstur i pełne prompty: [pierwsze tekstury](IMAGE_PROMPTS_WALKTHROUGH.md), [marmur, podłoga i len](IMAGE_PROMPTS_INTERIOR_REALISM.md).
