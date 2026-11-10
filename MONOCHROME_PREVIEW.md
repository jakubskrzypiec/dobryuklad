# Lokalny podgląd czarno-biały

Gałąź: `design/czarno-bialy-podglad`, utworzona z `main`.

Wariant bazuje na aktualnie rozwijanym katalogu `dist/wersja-2d/`. Zmiany obejmują wyłącznie kolorystykę interfejsu: czerń `#0C0C0C`, grafit `#171717`, jasny tekst `#F2F2F2` i szary tekst pomocniczy `#B5B5B5`. Układ, treści, zdjęcia i film pozostają zachowane. Fotografie nie są desaturowane.

Motyw znajduje się w `dist/wersja-2d/monochrome.css`, ładowanym jako ostatni arkusz na wszystkich 16 stronach tej wersji i we wspólnym podglądzie statycznym. Pozostałe warianty w `dist/`, w tym dotychczasowa strona główna, pozostają bez zmian.

```sh
python -m http.server 4173 --directory dist
```

- Strona z dotychczasowym wejściem: http://localhost:4173/wersja-2d/
- Szybki podgląd bez spaceru: http://localhost:4173/wersja-statyczna/

Wariant jest przeznaczony na osobną gałąź GitHub `design/czarno-bialy-podglad`. Nie scalać z `main` w celu podglądu. Publikacja GitHub Pages nadal uruchamia się wyłącznie po zmianach `main`; sama nowa gałąź nie publikuje strony.

Weryfikacja: istniejące kontrole `check-2d-refresh.mjs` i `check-entrance-walk.mjs`; przegląd stron w Chromium na komputerze i telefonie, sprawdzenie menu i pól formularza. Formularze zachowują dotychczasową obsługę wiadomości, a sklep dotychczasowy tryb demonstracyjny.
