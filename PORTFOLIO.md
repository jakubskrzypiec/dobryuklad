# Portfolio — stan podglądu

`dist/portfolio.html` to wejście z podziałem na Projekty i Realizacje. `dist/projekty.html` zawiera osiem miejsc w asymetrycznej galerii, a `dist/realizacje.html` trzy większe kadry. `dist/projekt.html?typ=projekty&nr=1` jest szablonem jednej inwestycji; parametr `typ=realizacje` przełącza na realizacje.

Wszystkie pola zdjęć projektowych są białe i mają cienkie obrysy. Zdjęcia koncepcyjne występują wyłącznie w hero i przerywniku kontaktowym. Nazwy „Projekt 01” i „Realizacja 01”, przypisania kategorii oraz stylów są demonstracyjnymi danymi do sprawdzenia filtrów, nie danymi inwestycji studia. Nie podano fikcyjnych metraży, lokalizacji ani nazw inwestycji.

Przed uzupełnieniem galerii potrzebne są zatwierdzone fotografie, opisy, kategorie i metryczki studia. Zachować oryginalny kadr, geometrię i temperaturę barwową zdjęć. Kolejność nawigacji Poprzedni/Następny obecnie przechodzi przez miejsca 01–08 albo 01–03 i zawija na końcu. Wyszukiwanie, kategorie i style działają łącznie; pusty wynik wyświetla komunikat.

Wspólna typografia: Playfair Display i Manrope. Style galerii: `dist/portfolio.css`; filtrowanie i nawigacja: `dist/portfolio.js`. Bez CMS i publikowanych rzeczywistych materiałów na tym etapie.
