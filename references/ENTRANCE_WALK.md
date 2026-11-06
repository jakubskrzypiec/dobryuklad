# Spacer na piętro — wersja 2D, v3

Źródło użytkownika: `D:/pobrane/kling_20261106_VIDEO_Create_a_3_2118_0.mp4`. 1920 × 1080, 24 fps, 721 klatek, 30,041667 s, oryginalny MP4 59,8 MB. Bez zmiany barw, interpolacji ani wyostrzania. Audio nie jest wykorzystywane. Starszy spacer można odzyskać z commita `056c6df`.

Wykończenie v4: wyświetlany obraz pomija dolne 76 pikseli (około 7% wysokości), aby znak wodny pozostawał poza kadrem. Nie retuszujemy źródła ani nie rekompresujemy paczek filmu. Plakaty `opening-crop.webp` i `hero-final-crop.webp` mają identyczne przycięcie 1920 × 1004, WebP 94; canvas wyświetla ten sam obszar źródła, bez skoku kadru przy ładowaniu.

Zakres wdrożenia: `/wersja-2d/`, inne wersje strony zachowane.

## Przygotowanie i rozmiary

```powershell
node scripts/prepare-upstairs-walk.cjs 'D:/pobrane/kling_20261106_VIDEO_Create_a_3_2118_0.mp4'
node scripts/wire-entrance-walk.cjs
```

Klatki robocze trafiają do `work/upstairs-frames-v3` poza repo; strona korzysta z `dist/wersja-2d/assets/entrance-upstairs-v3`:

- komputer: 1920 × 1080, WebP 86, 81 622 614 bajtów;
- telefon w pionie: środkowy kadr 608 × 1080, bez skalowania, WebP 86, 30 961 780 bajtów;
- oba profile: 16 paczek `.bin`, każda zawiera do 48 kompletnych obrazów WebP; `index.json` opisuje granice obrazów;
- `opening.webp` i `hero-final.webp`: oryginalne 1920 × 1080, jakość 92 / 94.

Pełna rozdzielczość i wyższa jakość oznaczają większy transfer. Początkowy ekran logo pokazuje procent przygotowania; wszystkie skompresowane paczki wybranego profilu są pobierane przed odblokowaniem spaceru. Na wolnym łączu trwa to dłużej. Po błędzie lub 60 sekundach strona przechodzi na statyczne hero, bez blokady przewijania.

## Interakcja

Na początku: większe centralne logo na miękkiej nieregularnej poświacie, zdanie „Wnętrza zaprojektowane wokół Ciebie.”, „Scroll down” oraz Instagram i Facebook w lewym dolnym rogu. Kliknięcie przesuwa użytkownika tylko o początkowy odcinek; dalszym ruchem steruje scroll. Logo i sociale gasną po pierwszych klatkach. W trakcie nie ma tekstu, przycisków ani menu. Nawigacja, nagłówek i osobna grupa CTA są nieaktywne (`inert`) do końcowego hero. CTA są przy dolnej krawędzi w odcieniu beżu i grafitu.

Sekcja ma 1000 svh: siedem wysokości ekranu na film, dwie na nieruchome hero i wysokość samego ekranu. Tempo przejścia przez film zachowane; końcowe zatrzymanie jest dwa razy dłuższe. Ta sama ostatnia klatka pozostaje w canvas. Po odcinku zatrzymania sekcja naturalnie odsłania „O nas”. Cofanie działa na tych samych klatkach i ponownie ukrywa tekst. Przycisk pominięcia jest dostępny po nawigacji klawiaturą, bez elementów na środku filmu.

Ruch v4: tłumiony model sprężyny przenoszący prędkość między impulsami scrolla, ograniczenie przyspieszenia do 700 i prędkości do 125 klatek źródła/s. Stałe podkroki do 1/120 s dają zgodne zachowanie na 30/60/120 Hz. Kierunek buforowania wynika z faktycznego ruchu kamery, także podczas łagodnej zmiany kierunku. Playhead przesuwa się tylko do dostępnych bitmap, więc nie rośnie ukryty dług buforowania kończący się skokiem obrazu. Duży skok kółkiem lub paskiem ma łagodne opóźnienie dojścia do celu. Nie generujemy fikcyjnych klatek ani rozmywającego mieszania obrazów; źródło pozostaje 24 fps.

Dekodowanie wyprzedzające: 4 zadania komputer / 3 telefon. Limit bitmap 24 / 28, odległe są zamykane; pierwsza i ostatnia pozostają dostępne. To ogranicza pamięć rozpakowanych klatek, zamiast trzymać 721 obrazów w RAM. Canvas nie jest sztucznie powiększany ponad gęstość źródła. `overflow:clip` zapobiega wewnętrznemu przesuwaniu warstw przy fokusie.

Ograniczone animacje, oszczędzanie danych, brak canvas lub brak JavaScript dają normalne statyczne hero. Ukryta karta wstrzymuje renderowanie.

## Kontrole

`node scripts/check-entrance-walk.mjs`: kompletność 721 obrazów w każdym profilu, granice wszystkich paczek, sygnatury i rzeczywiste wymiary WebP, monotoniczność ruchu w obie strony, ograniczenie szybkości na 30/60/120 Hz, odcinek końcowego hero i struktura wejścia.

`node scripts/check-2d-refresh.mjs`: 16 podstron, odnośniki, wspólne hero podstron i zachowana karuzela.

Przeglądarka: otwarcie i przygotowanie, Scroll down, brak interfejsu podczas ruchu, cofanie, brak widocznego znaku wodnego, końcowe hero z CTA przy dolnej krawędzi, dwie wysokości zatrzymania, wyjście do następnej sekcji, telefon 390 × 844, brak błędów konsoli.
