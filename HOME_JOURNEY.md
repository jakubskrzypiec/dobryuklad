# Strona główna: globus → miasto → jasne wnętrze

Baza: aktualny `main` Claude’a z jasnym globusem i przerywnikiem planetarnym (`d566ecd`). Zmiany dotyczą bieżącego `dist/index.html`; dolny globus, treść sekcji i podstrony są zachowane. Wcześniejszy eksperyment `wejscie.html` pozostaje oddzielnym wariantem.

Wejście pomija planszę Koszalina, pinezkę i zatrzymanie na mapie ulic. Globus zbliża się przez chmury do koncepcyjnej zabudowy. Kamera leci do budynku z istniejącym salonem, przejeżdża przez prawdziwy otwór korytarza i skręca bezpośrednio do końcowego kadru. Dopiero po zatrzymaniu następuje mieszanie z wygenerowanym jasnym hero, a potem pojawiają się hasło i przyciski.

- `home-journey-motion.js`: wspólna oś czasu oraz ciągły tor kamery z lotu do istniejącej trasy we wnętrzu.
- `home-city.js`: koncepcyjna zabudowa i rama wejścia. Nie przedstawia konkretnej nieruchomości ani planu Koszalina.
- `home-interior.js`: osobny render sceny 3D; jasne materiały w `createInterior({daylight:true})`, światło HDR i ograniczony DPR. Renderer globusu przestaje rysować po pełnym wejściu w miasto, renderer wnętrza po odsłonięciu fotografii.
- `planeta-dzien.js`: zachowany globus i animacja Claude’a, skrócona faza geograficzna, bez pobierania mapy ulic. Jeden postęp scrolla steruje obiema scenami.
- `home-journey.css`: jasne hero z ciemną typografią, czytelne przyciski i wspólna paleta. Przy ograniczonym ruchu lub błędzie WebGL dostępne jest statyczne jasne hero.
- `scripts/build-home-journey.cjs`: idempotentna aktualizacja bieżącej strony głównej, uruchamiana przez `node scripts/build-home-journey.cjs`.
- `scripts/check-home-journey.mjs`: kontroluje skończone pozycje, płynne łączenie tras, przejazd pod nadprożem i identyczny końcowy kadr; fotografia pojawia się dopiero po zakończeniu ruchu kamery.

Nowy obraz i finalny prompt: [IMAGE_PROMPT_HERO_DAYLIGHT.md](references/IMAGE_PROMPT_HERO_DAYLIGHT.md). Istniejące tekstury skanowane i biblioteki zachowują dotychczasowe licencje oraz źródła.
