# Ujednolicenie strony według briefu (36 stron)

Zachowano kolejność sekcji, istniejące filmowe wejście na głównej, kontroler przewijania i pliki eksperymentalnego 3D. Wspólny kierunek obejmuje Playfair Display + Manrope, biel/czerń/grafit/taupe, proste krawędzie, tekstowe odnośniki oraz delikatne odsłanianie sekcji.

Zastąpiono dwa przerywniki: detal kamienia i drewna przy portfolio oraz biurko z materiałami przed sklepem. Istniejąca karuzela zachowuje strukturę; otrzymała obrazy koncepcyjne z repozytorium i jawne podpisy. Zapowiedź sklepu prowadzi do prawdziwych kart produktów. Oferta ponownie prezentuje trzy ilustracje, tabelę i ośmiostopniową ścieżkę z nawrotem.

Style docelowe: `dist/site-ui.css`. Ruch: `dist/site-motion.css` i `dist/site-motion.js`. `dist/story.css` zachowuje wyłącznie zakończenie filmowego wejścia. Po pracy ze starszymi generatorami uruchomić `node scripts/build-site-motion.cjs`; kończy on pracę ponownym zastosowaniem `scripts/apply-brief-rework.cjs`. Eksperymenty w osobnych plikach HTML pozostają archiwalne i nie są objęte tą normalizacją.

Materiały koncepcyjne pochodzą z istniejącego repozytorium (patrz ASSETS.md). Nie dodano zdjęć klientów ani fikcyjnych opinii. Zespół, rzeczywiste portfolio i para wizualizacja/realizacja nadal oczekują na materiały studia. Nie wdrożono płatności, CMS ani wysyłki formularza: zakres tej zmiany dotyczy oprawy wizualnej.

Weryfikacja: 16 stron bez brakujących lokalnych odnośników i zasobów; nienaruszony kod i markup hero; trzy pakiety, trzy odnośniki produktów i osiem etapów procesu. Podgląd przeglądarkowy na komputerze oraz przy szerokości 390 px, kontrola menu mobilnego i braku poziomego przepełnienia na głównej i dziewięciu reprezentatywnych podstronach.
