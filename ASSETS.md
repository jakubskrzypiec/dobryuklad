# Obrazy koncepcyjne — imagegen (wbudowane narzędzie)

Wszystkie obrazy zapisano jako WebP w `dist/assets/`. Zastosowane jako materiały koncepcyjne do wymiany na zatwierdzone materiały studia.

- `hero-v2.webp`: szeroki kadr salonu otwartego na kuchnię zgodny z górą makiety ze strony 5. Ciemny orzech, sofa taupe, kamienna wyspa, srebrny wazon z drobnymi gałązkami, popołudniowe słońce, ciemna pusta ściana po lewej do nagłówka. Bez tekstu, logo, UI i ludzi; bez zielonej i pomarańczowej dominanty.
- `dining-v2.webp`: jadalnia w tym samym koncepcyjnym apartamencie. Owalny kamienny stół, cztery zaokrąglone krzesła taupe, srebrny wazon, zasłony po lewej, ściana orzechowa, widok na sofę przez przejście po prawej. Fotografia architektoniczna, prostowane piony, spokojne naturalne materiały, brak napisów i interfejsu.
- `bathroom-v2.webp`: kadr łazienki według sekcji porównania na makiecie. Wisząca gruba umywalka trawertynowa, czarny dozownik, ciemna armatura, lustro, jasny brązowy kamień po lewej, ciemny marmur i natrysk po prawej, orzechowy detal. Miękkie światło z lewej, bez tekstu, UI, roślin i ludzi.
- `books-v2.webp`: fotografia trzech poziomo ułożonych książek taupe na kamiennym biurku, płyta kamienna po lewej, fragment srebrnego laptopa po prawej. Tytuły na grzbietach: pCon.planner, Poradnik Projektanta, Zrozum wnętrza. Matowe płótno, naturalne światło, żadnych unoszących się lub ukośnych okładek i ozdobnej grafiki.
- `shadow.webp`: tekstura z https://github.com/jakubskrzypiec/mothiform/blob/main/assets/shadow-texture-v6.png. Animowana tylko jako dekoracyjny cień w koncepcyjnym detalu.

- logo-white.svg: oryginalny PNG dostarczony przez użytkownika, osadzony bez przerysowywania w masce luminancji SVG. Czarne tło jest przezroczyste, obszar dopasowano do granic znaku i napisów. Nie użyto wygenerowanego przerysowania logo.

- portfolio-divider-v3.webp: przerywnik wygenerowany wbudowanym imagegen. Prompt: szeroka fotografia architektoniczna 2400x1050, neutralna ściana taupe zajmująca lewą część, drzwi po prawej odsłaniające fotel i kamienny postument, orzechowe drewno, grafit, cienie liści z okna, spokojne światło dzienne. Bez napisów, interfejsu, ludzi, roślin i złotych ozdób. Ruch dodano wyłącznie do osobnej tekstury cienia w CSS; architektura pozostaje nieruchoma.

## O nas — nowe kadry, 02.11.2026

Wbudowane narzędzie image_gen. To koncepcyjne obrazy wnętrz, nie realizacje studia. Pliki PNG pozostawiono w katalogu wygenerowanych obrazów; kopie WebP umieszczono w projekcie. Nie generowano twarzy ani zdjęć zespołu.

- `dist/assets/about-hero-v2.webp` — szeroki kadr 1983 × 793, grafitowa ściana, trawertynowa konsola po prawej, czarna misa, orzech i lniana zasłona. Pusta lewa część pod tytuł, spokojne światło i cień okna.
- `dist/assets/about-contact-v2.webp` — szeroki kadr 1983 × 793, miękki jasny fotel po lewej, neutralna ściana, kamienna podłoga i zasłona; spokojny środek pod wyśrodkowany tekst.

Prompty końcowe:

1. Photorealistic natural architectural photograph for a high-end Polish interior studio About hero, 2.5:1. Empty charcoal mineral plaster wall on the left two thirds; pale travertine console, low black ceramic bowl, dark walnut panel and translucent linen curtain on the far right. Neutral taupe, graphite, off-white, deep walnut; no orange or golden cast. Broad soft window shadow, tactile matte materials, straight verticals, editorial magazine photography. Generous negative space. No people, faces, plants, text, logos or UI.
2. Photorealistic natural architectural editorial contact banner, 2.5:1. Curved ivory bouclé chair on the left third, honed limestone floor, quiet dark taupe plaster wall at center and right, translucent linen curtain at the far right, diffused diagonal daylight. Calm medium-dark center for centered white HTML typography. Graphite, neutral taupe, off-white, muted walnut. No orange, gold, dining table, kitchen, vase, branches, plants, people, faces, text, logos or UI.

## Oferta — przerywnik, 02.11.2026

`dist/assets/offer-contact-v1.webp` (1983 × 793) — nowy koncepcyjny kadr wygenerowany wbudowanym narzędziem image_gen. Kopia WebP w repozytorium; źródłowy PNG zachowano w katalogu wygenerowanych obrazów. Hero oferty korzysta z tego samego `about-hero-v2.webp` co O nas. Fotografie przy pakietach są koncepcyjnymi ilustracjami usług, nie opisanymi realizacjami studia.

Prompt końcowy:

Photorealistic-natural architectural editorial photograph, ultra wide 2.5:1, for a high-end Polish interior studio contact banner. A quiet sculptural limestone staircase ascending on the far left, matte dark taupe plaster wall occupying the calm center and right, slim walnut doorway at the far right and restrained soft daylight with broad window shadows falling over stone steps. Contemporary European interior, tactile real honed stone and matte plaster, rigorous straight verticals, sophisticated understated magazine photography. Palette graphite, neutral taupe, off-white stone and dark walnut. Keep the center visually uncluttered and dark enough for centered white HTML title to be added later. No furniture, no vases, no plants, no people, no text, no logo, no UI, no orange or golden cast. New conceptual interior, not a real client project.

## Duże kafelki oferty

Trzy nowe obrazy koncepcyjne, wygenerowane wbudowanym image_gen: `dist/assets/offer-functional-v1.webp`, `dist/assets/offer-complete-v1.webp`, `dist/assets/offer-supervision-v1.webp` (1122 × 1402). Pełne prompty oraz zapisane ścieżki: [IMAGE_PROMPTS_OFFER_CARDS.md](IMAGE_PROMPTS_OFFER_CARDS.md).

## Tematyczne rysunki oferty

Aktualne kafelki używają ilustracji zamiast fotografii: `dist/assets/offer-functional-drawing-v1.webp`, `dist/assets/offer-complete-drawing-v1.webp`, `dist/assets/offer-supervision-drawing-v1.webp`. Wygenerowano wbudowanym image_gen; rozmiar 1122 × 1402. Tematy: układ mieszkania, kompletny projekt wnętrza, detal wykonawczy. [Pełne prompty i ścieżki](IMAGE_PROMPTS_OFFER_DRAWINGS.md). Ilustracje nie stanowią dokumentacji technicznej ani prac studia.

## Ilustracje zakresów po analizie ofert pracowni

Aktualne pliki kafelków: `dist/assets/offer-functional-scope-v2.webp`, `dist/assets/offer-complete-scope-v2.webp`, `dist/assets/offer-supervision-scope-v2.webp`. Wbudowane image_gen, 1122 × 1402. Tematy: warianty rzutu 2D; komplet dokumentacji, wizualizacja i materiały; sprawdzanie prac z dokumentacją na miejscu realizacji. [Źródła, założenia, ścieżki i pełne prompty](OFFER_VISUAL_RESEARCH.md).

## Zmieniona druga ilustracja i mniejsze kafelki

Drugi kafelek używa teraz `dist/assets/offer-complete-workstation-v3.webp`: stanowisko z wizualizacją i próbkami materiałów, wyraźnie odmienne od rzutu 2D. Wygenerowano wbudowanym image_gen. [Prompt i zapisane ścieżki](IMAGE_PROMPT_OFFER_WORKSTATION.md). Pierwsza i trzecia ilustracja zakresów pozostają bez zmian.

## Hero sklepu dla architektów

`dist/assets/shop-hero-v1.webp` — wygenerowane wbudowanym image_gen zdjęcie koncepcyjne biurka z książkami, ołówkami i lampą. [Prompt i ścieżka oryginału](IMAGE_PROMPT_SHOP.md). Okładki sklepu to makiety typograficzne HTML/CSS, do zastąpienia zatwierdzoną oprawą produktów.

## Materiały rzeczywistego modelu 3D

`dist/assets/walkthrough-walnut.webp` i `dist/assets/walkthrough-stone.webp` — tekstury drewna i kamienia wygenerowane wbudowanym image_gen, po 1024 × 1024 px. [Pełne prompty i ścieżki](IMAGE_PROMPTS_WALKTHROUGH.md). Geometria wnętrza jest własną sceną koncepcyjną, a nie realizacją studia.

## Realistyczniejsze wnętrze i fotograficzny finał

`dist/assets/interior-marble-v2.webp`, `dist/assets/interior-floor-v2.webp`, `dist/assets/interior-linen-v2.webp` — mapy marmuru, podłogi i tapicerki 1024 × 1024, wygenerowane wbudowanym image_gen. [Prompty i pliki źródłowe](IMAGE_PROMPTS_INTERIOR_REALISM.md). Kamera kończy na kadrze dopasowanym kompozycyjnie do istniejącego hero, a przenikanie odsłania jego oryginalną fotografię i treść.

## Aktualny finał spaceru
Od wersji room-3 hero w wejscie.html pozostaje sceną 3D. Usunięto obraz hero-v2.webp z tej sekcji; jego użycie na standardowej stronie głównej pozostaje bez zmian. Detale narzuty i zasłony to autorska geometria, bez nowych obrazów.

## Atelier-5 — fotograficzne mapy powierzchni i HDR
Bieżący model używa map lnu i orzecha oraz panoramy Forest Slope z Poly Haven (CC0), lokalnie w dist/assets/interior. Pełne źródła i autorzy: [INTERIOR_ASSET_SOURCES.md](INTERIOR_ASSET_SOURCES.md). Narzuta, detale sofy, zlew, książki, rośliny, profile stolika i wykończenia są własną geometrią 3D.
