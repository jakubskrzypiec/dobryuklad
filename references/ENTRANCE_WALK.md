# Spacer sterowany scrollem — wersja 2D

Źródło dostarczone przez użytkownika: `D:/pobrane/kling_20261106_VIDEO_Create_a_2_2011_0.mp4`. 1920 × 1080, 24 fps, 481 klatek, 20,041667 s. Bez zmian kolorów, bez interpolacji, bez usuwania znaku wodnego. Audio nie jest wykorzystywane. Oryginalny MP4 nie jest potrzebny przeglądarce.

Zakres: tylko `/wersja-2d/`, pozostałe wersje repo zachowane.

## Zasoby

`dist/wersja-2d/assets/entrance-walk/{desktop,mobile}/frame-0000.webp` … `frame-0480.webp`.

Obie wersje mają 1280 × 720; jakość WebP 77 komputer / 75 telefon. Końcowy statyczny plakat `hero-final.webp` ma oryginalne 1920 × 1080.

Przykład odtworzenia z FFmpeg (uruchomić w katalogu repo; katalogi docelowe muszą istnieć):

```powershell
ffmpeg -i 'D:/pobrane/kling_20261106_VIDEO_Create_a_2_2011_0.mp4' -map 0:v:0 -an -vf 'scale=1280:720' -c:v libwebp -quality 77 -compression_level 4 -start_number 0 'dist/wersja-2d/assets/entrance-walk/desktop/frame-%04d.webp'
ffmpeg -i 'D:/pobrane/kling_20261106_VIDEO_Create_a_2_2011_0.mp4' -map 0:v:0 -an -vf 'scale=1280:720' -c:v libwebp -quality 75 -compression_level 4 -start_number 0 'dist/wersja-2d/assets/entrance-walk/mobile/frame-%04d.webp'
ffmpeg -i 'D:/pobrane/kling_20261106_VIDEO_Create_a_2_2011_0.mp4' -vf 'select=eq(n\,480)' -frames:v 1 -c:v libwebp -quality 90 'dist/wersja-2d/assets/entrance-walk/hero-final.webp'
```

## Zachowanie

Sekcja ma wysokość 700 svh: ekran przyklejony do góry, pięć wysokości ekranu na spacer i jedna na nieruchome końcowe hero. Po tym sekcja naturalnie opuszcza ekran. Ten sam canvas trzyma ostatnią klatkę; nie ma podmiany na inny projekt.

Hasło i opis sprzedażowy oraz CTA są stale widoczne po lewej, poza canvas. Są dostępne dla czytników ekranu. „Pomiń spacer” przechodzi na początek końcowego hero. Nawigacja opuszcza ekran razem z hero.

Ładowanie: cztery równoległe zadania dekodowania wokół aktualnej klatki i dwa pobierania wyprzedzające skompresowane klatki. Bufor bitmap jest ograniczony do 24 na telefonie / 40 na komputerze; odległe bitmapy są zamykane. Ruch w obie strony używa tych samych klatek. Ukryta karta wstrzymuje renderowanie.

`prefers-reduced-motion`, `saveData`, brak canvas lub błąd pierwszej klatki wyłączają spacer. Brak JS pozostawia normalne statyczne hero. Na wolnym połączeniu wyświetlana jest najbliższa dostępna klatka, bez migania pustego canvas; pierwsze przejście zależy od szybkości pobierania.

Testy: `node scripts/check-entrance-walk.mjs`, `node scripts/check-2d-refresh.mjs`. Ręczna kontrola: wejście, ruch do przodu, zatrzymanie bez scrolla, cofanie, pominięcie, nieruchomy odcinek hero, naturalne wyjście do „O nas”, telefon 390 × 844.
