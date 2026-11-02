# Kontakt — podgląd

`dist/kontakt.html` zawiera hero, wstęp i dane studia po lewej, formularz w trzech częściach po prawej, przerywnik kontaktowy oraz wspólną stopkę. Menu wszystkich stron: O nas, Oferta, Portfolio, Kontakt, Sklep dla architektów. Hero katalogu sklepu ma 460 px na komputerze i 380 px na telefonie, tak jak pozostałe podstrony.

Wymagane pola: imię i nazwisko, e-mail, opis potrzeb. Telefon i informacje o inwestycji są opcjonalne. Przyciski pakietów na stronie głównej prowadzą do kontaktu z wybranym zakresem, przekazywanym parametrem `zakres` i sprawdzanym względem opcji formularza.

Załączniki: PDF, JPG, PNG, WEBP; do pięciu plików, 5 MB każdy, 15 MB łącznie. Lista pozwala usuwać pliki. Dane i pliki pozostają po stronie przeglądarki do chwili wysłania wiadomości przez użytkownika w jego poczcie. Formularz nie korzysta z analityki ani pamięci lokalnej do zapisu wpisanych danych.

Bez serwera pocztowego formularz **nie wysyła wiadomości automatycznie**. Krótkie zapytanie bez plików otwiera szkic przez `mailto:`. Przy załącznikach lub długiej wiadomości pobiera `.eml` z nagłówkiem `X-Unsent`, treścią UTF-8 i załącznikami MIME. Użytkownik otwiera plik w kompatybilnej aplikacji pocztowej, sprawdza i sam wysyła. To nie jest formularz z potwierdzeniem dostarczenia. Przycisk i status opisują przygotowanie szkicu. Bez JavaScript przycisk jest wyłączony, a strona wskazuje bezpośredni e-mail.

Przed wdrożeniem wysyłki bezpośredniej potrzebne są serwer/wybrana usługa pocztowa, adres docelowy zatwierdzony przez studio oraz finalna informacja o przetwarzaniu danych i zasadach przechowywania plików. Nie dodano fikcyjnego telefonu, adresu ulicznego, gotowej polityki prawnej ani obietnicy terminu odpowiedzi.

Generowanie: `node scripts/build-contact.cjs`; po przebudowie sklepu uruchomić ponownie, aby zsynchronizować odnośniki. Kod formularza: `dist/contact.js`, kodowanie wiadomości: `dist/contact-draft.js`, style: `dist/contact.css`. Test lokalny obejmował wybór pliku i pobranie szkicu; parser MIME potwierdził zachowanie polskiego tekstu, oryginalnej nazwy i niezmienionych bajtów załącznika. Nie wysyłano testowej wiadomości do studia.
