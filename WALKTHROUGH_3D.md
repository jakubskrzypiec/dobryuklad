# Spacer przez model wnętrza

Podgląd: dist/wejscie.html. Strona główna dist/index.html pozostaje bez zmian. Podgląd jest generowany poleceniem node scripts/build-walkthrough.cjs.

To jeden ciągły model WebGL. Kamera wchodzi przez prawy hol, przechodzi przed sofą, zatacza łuk przy oknie, zagląda za sofę i wraca do szerokiego ujęcia końcowego. Pozycja i cel spojrzenia mają osobne krzywe, zsynchronizowane wspólnym parametrem. Droga omija meble i ściany; scenę można przewijać w obu kierunkach. Sekcja ma 950svh na komputerze i 850svh na telefonie. Długość została lekko skrócona względem wersji room-3.

Fazy w dist/walkthrough-timing.js: kamera kończy przy 89% przewinięcia. Od 89% do 94,5% pojawiają się wyłącznie tekst i przyciski. Pozostałe 5,5% utrzymuje gotowe hero. Nie ma przejścia w fotografię ani obrazu hero-v2.webp w tej sekcji. Model pozostaje widoczny. Gdy nie ma ruchu, nie działa ciągła pętla renderowania. Przycisk Pomiń spacer prowadzi do tej samej pozycji końcowej z aktywnymi linkami.

Przy ograniczonym ruchu systemowym model od razu jest renderowany w docelowej pozycji, bez spaceru. Bez WebGL dostępne pozostają tekst i przyciski na neutralnym ciemnym tle. Na telefonie ograniczono DPR i wyłączono SSAO. Na komputerze są SSAO, MSAA i dokładniejsza mapa cieni.

Materiały używają wcześniejszych wygenerowanych map orzecha, marmuru, kamienia i lnu. Zmniejszono nadmierną wysokość mikrofaktury, rozjaśniono światło pośrednie i złagodzono kontrast słońca. Dodano odkształconą narzutę z fałdami, półprzezroczystą zasłonę, szwy tapicerki widoczne z tyłu, zlew i drobne przedmioty kuchenne. Odbicia są oparte na przechwyconym otoczeniu modelu. Nowych obrazów nie generowano.

Scena jest koncepcyjną wizualizacją czasu rzeczywistego, nie fotografią ani realizacją klientki. Nadal występują uproszczenia geometrii i oświetlenia względem pełnego renderingu architektonicznego.

Three.js 0.180.0 pochodzi z oficjalnej paczki npm. Biblioteka i dodatki są lokalne w dist/vendor/three, z licencją MIT. Inspiracje obejrzane wcześniej: HILIGHT, LA.BURO i HEDO Architects; ich modeli i fotografii nie użyto.

Prompty wcześniejszych map: IMAGE_PROMPTS_WALKTHROUGH.md oraz IMAGE_PROMPTS_INTERIOR_REALISM.md. Poprzedni układ kończący fotografią zachowuje historia Git.

## Płynność smooth-4
Tor ma tablicę 1600 próbek pozycji i orientacji. Czas przejścia uwzględnia dystans oraz kąt obrotu (3,6 m równoważnika na radian), więc zakręt otrzymuje odpowiednią długość scrollowania. Orientacja jest interpolowana kwaternionem. Zamiast gwałtownego przyspieszenia w środku całego spaceru zastosowano prawie równomierne tempo, z krótkimi rampami na początku i końcu. Postęp ma tłumienie krytyczne, limit prędkości i ochronę przed przestrzeleniem celu. Test regresji: node scripts/check-walkthrough-motion.mjs — 3001 próbek trasy, kolizje, wielkość obrotów, przód/tył i 30/60/120 fps.

Realizm: filtrowane cienie VSM, jaśniejsze światło odbite, 512-pikselowe przechwycenie otoczenia na komputerze, spokojniejszy połysk kamienia i delikatne zróżnicowanie szorstkości powierzchni drewna, marmuru, podłogi i lnu. Finał nadal pozostaje tym samym modelem 3D.
