# DOBRY UKŁAD

Strona główna studia projektowania wnętrz Sandry Białkowskiej.

**[Otwórz podgląd strony](https://jakubskrzypiec.github.io/dobryuklad/)**

[Podstrona O nas](https://jakubskrzypiec.github.io/dobryuklad/o-nas.html) — dwa zdjęcia Sandry, trzy zespołowe, osiem portretów i kontakt. Fotografie oraz podpisy portretów czekają na materiały studia.

## Pliki i publikowanie

Strona znajduje się w katalogu `dist/`. Nie wymaga instalowania zależności ani kompilacji.

Każdy push zmian w `dist/` na `main` uruchamia GitHub Actions i publikuje stronę w GitHub Pages. Konfiguracja: `.github/workflows/pages.yml`.

Pracujemy bezpośrednio w tym repozytorium. Podgląd i publikowanie odbywają się przez GitHub Pages.

## Uruchomienie lokalne

Uruchom dowolny serwer HTTP z katalogiem `dist`, np.:

```sh
python -m http.server 4173 --directory dist
```

Następnie otwórz `http://localhost:4173`.

## Stan projektu

- Jasna paleta z grafitem i taupe; Playfair Display i Manrope, bez kursywy.
- Hero z animowanymi cieniami, opis studia, karuzela portfolio, trzy pakiety, porównanie, opinie, kursy, kontakt i social media.
- Zdjęcia projektów, portret studia, dopasowana para wizualizacja–realizacja i cztery autentyczne opinie czekają na materiały od studia.
- Obrazy koncepcyjne opisano w `ASSETS.md`; nie są realizacjami studia.
- Formularz przygotowuje wiadomość w aplikacji pocztowej. Nie wysyła jej samodzielnie.
- Bez płatności, koszyka, kont użytkowników i CMS na tym etapie.

[Podstrona Oferta](https://jakubskrzypiec.github.io/dobryuklad/oferta.html) — trzy pakiety, tabela zakresów i osiem etapów procesu z nawrotem. Dane rozliczeń bez cen, do potwierdzenia w indywidualnej ofercie i umowie.
