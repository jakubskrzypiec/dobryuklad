# Hero: film przewijany scrollem

Hero na stronie głównej (`dist/index.html`, sekcja `.intro`) to przypięty pełny ekran.
Przewijanie przesuwa film kamery przez dom, na wzór hilight.design. Kod znajduje się w
`dist/experience.js` (sekcja „Scroll intro”) i `dist/experience.css` („Scroll-scrubbed entrance film”).

## Obecny stan

- `dist/assets/hero-film/wejscie.mp4`: komputer, 1600×900, GOP 3, bez B-klatek, bez dźwięku.
- `dist/assets/hero-film/wejscie-m.mp4`: telefon, 1280×720, GOP 2.
- `dist/assets/hero-film/wejscie-start.webp`: plakat, pierwsza klatka.
- Źródło: 7-sekundowy klip Kling 4.0 (próg → salon). Znak wodny „KlingAI 4.0” w prawym dolnym
  rogu jest wycięty przez `crop=1776:998:72:0` na materiale 1920×1080.

## Podmiana na pełny, 30-sekundowy przelot

Nowy plik: `D:\gry\kling_20261106_VIDEO_One_single_1484_0.mp4` (około 80 MB, 1080p, 30 s).
Prompt zawiera przystanki: ogród → drzwi → hol → salon → kuchnia/jadalnia → korytarz →
sypialnia → gabinet → taras.

1. Sprawdź film: `ffprobe` (rozdzielczość, fps, długość) oraz kadr z prawego dolnego rogu,
   żeby znaleźć znak wodny. Dobierz `crop` z zachowaniem proporcji 16:9, tak żeby znak wypadł poza kadr.
2. Zakoduj obie wersje (podmień `CROP`):

   ```bash
   ffmpeg -y -i film.mp4 -an -vf "CROP,scale=1600:900:flags=lanczos,unsharp=5:5:0.6:5:5:0.0" \
     -c:v libx264 -preset slow -crf 23 -tune fastdecode -pix_fmt yuv420p \
     -g 3 -keyint_min 3 -bf 0 -sc_threshold 0 -movflags +faststart dist/assets/hero-film/wejscie.mp4
   ffmpeg -y -i film.mp4 -an -vf "CROP,scale=1280:720:flags=lanczos,unsharp=5:5:0.5:5:5:0.0" \
     -c:v libx264 -preset slow -crf 25 -tune fastdecode -pix_fmt yuv420p \
     -g 2 -keyint_min 2 -bf 0 -sc_threshold 0 -movflags +faststart dist/assets/hero-film/wejscie-m.mp4
   ffmpeg -y -i dist/assets/hero-film/wejscie.mp4 -frames:v 1 -q:v 2 start.png   # → wejscie-start.webp
   ```

   Przy 30 s pliki będą większe (szacunkowo 35–45 MB i 25–35 MB). Jeśli to za dużo,
   podnieś CRF o 2–3 albo dla telefonu zejdź do 960×540.
3. Wydłuż przewijanie: w `experience.css` w regule `.intro.is-live` zmień `--intro-run`
   (domyślnie 420vh). Dla 30 s rozsądne jest 1200–1500vh.
4. Ustaw przystanki: w `experience.js` `FILM = [0, .8]` to zakres przewijania, w którym gra
   film. `lineWindows` to okna podpisów `[wejście_od, wejście_do, wyjście_od, wyjście_do]`
   w ułamkach całego intro. Dodaj podpisy w `index.html` (`.intro-line[data-step]`) dla
   salonu, kuchni, sypialni, gabinetu i tarasu, a okna dopasuj do momentów filmu.
5. Przetestuj na komputerze i telefonie, czy obraz nadąża za scrollem bez opóźnienia.

## Płynność

- Lenis (`dist/vendor/lenis.min.js`) wygładza przewijanie z `lerp: .14`. Film podąża
  bezpośrednio za pozycją, bez drugiego wygładzania.
- Nowy skok w filmie startuje dopiero po zakończeniu poprzedniego, a ostatni cel zawsze wygrywa.
- Film ładowany jest jako Blob, więc każda klatka jest dostępna do przewinięcia. Preloader
  pokazuje rzeczywisty postęp pobierania.
- Gęste klatki kluczowe (GOP 2–3, bez B-klatek) skracają dekodowanie przy każdym skoku.
