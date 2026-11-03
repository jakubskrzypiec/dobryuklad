# Spacer przez model wnętrza

Podgląd: dist/wejscie.html. Strona główna dist/index.html pozostaje bez zmian. Podgląd jest generowany poleceniem node scripts/build-walkthrough.cjs.

To jeden ciągły model WebGL. Kamera wchodzi przez prawy hol, przechodzi przed sofą, zatacza łuk przy oknie, zagląda za sofę i wraca do szerokiego ujęcia końcowego. Pozycja i cel spojrzenia mają osobne krzywe, zsynchronizowane wspólnym parametrem. Droga omija meble i ściany; scenę można przewijać w obu kierunkach. Sekcja ma 950svh na komputerze i 850svh na telefonie. Długość została lekko skrócona względem wersji room-3.

Fazy w dist/walkthrough-timing.js: kamera kończy przy 89% przewinięcia. Od 89% do 94,5% pojawiają się wyłącznie tekst i przyciski. Pozostałe 5,5% utrzymuje gotowe hero. Nie ma przejścia w fotografię ani obrazu hero-v2.webp w tej sekcji. Model pozostaje widoczny. Gdy nie ma ruchu, nie działa ciągła pętla renderowania. Przycisk Pomiń spacer prowadzi do tej samej pozycji końcowej z aktywnymi linkami.

Przy ograniczonym ruchu systemowym model od razu jest renderowany w docelowej pozycji, bez spaceru. Bez WebGL dostępne pozostają tekst i przyciski na neutralnym ciemnym tle. Na telefonie ograniczono DPR i wyłączono SSAO. Na komputerze są SSAO, MSAA i dokładniejsza mapa cieni.

Aktualne materiały używają fotograficznych map orzecha i lnu z Poly Haven oraz wcześniejszych autorskich map marmuru i kamienia. Zmniejszono nadmierną wysokość mikrofaktury, rozjaśniono światło pośrednie i złagodzono kontrast słońca. Dodano odkształconą narzutę z fałdami, półprzezroczystą zasłonę, szwy tapicerki widoczne z tyłu, zlew i drobne przedmioty kuchenne. Odbicia są oparte na przechwyconym otoczeniu modelu. Nowych obrazów nie generowano.

Scena jest koncepcyjną wizualizacją czasu rzeczywistego, nie fotografią ani realizacją klientki. Nadal występują uproszczenia geometrii i oświetlenia względem pełnego renderingu architektonicznego.

Three.js 0.180.0 pochodzi z oficjalnej paczki npm. Biblioteka i dodatki są lokalne w dist/vendor/three, z licencją MIT. Inspiracje obejrzane wcześniej: HILIGHT, LA.BURO i HEDO Architects; ich modeli i fotografii nie użyto.

Prompty wcześniejszych map: IMAGE_PROMPTS_WALKTHROUGH.md oraz IMAGE_PROMPTS_INTERIOR_REALISM.md. Poprzedni układ kończący fotografią zachowuje historia Git.

## Płynność smooth-4
Tor ma tablicę 1600 próbek pozycji i orientacji. Czas przejścia uwzględnia dystans oraz kąt obrotu (3,6 m równoważnika na radian), więc zakręt otrzymuje odpowiednią długość scrollowania. Orientacja jest interpolowana kwaternionem. Zamiast gwałtownego przyspieszenia w środku całego spaceru zastosowano prawie równomierne tempo, z krótkimi rampami na początku i końcu. Postęp ma tłumienie krytyczne, limit prędkości i ochronę przed przestrzeleniem celu. Test regresji: node scripts/check-walkthrough-motion.mjs — 3001 próbek trasy, kolizje, wielkość obrotów, przód/tył i 30/60/120 fps.

Realizm: filtrowane cienie VSM, jaśniejsze światło odbite, 512-pikselowe przechwycenie otoczenia na komputerze, spokojniejszy połysk kamienia i delikatne zróżnicowanie szorstkości powierzchni drewna, marmuru, podłogi i lnu. Finał nadal pozostaje tym samym modelem 3D.

## Przebudowa atelier-5
Tapicerka ma zamknięte siatki superelipsoidalne, zmienne wyoblenia, nieregularne fałdy oraz rzeczywiste wypustki. Wygładzanie normalnych na szwach UV usuwa fasetowanie po deformacji. UV splotu poduszek używają skali metrycznej. Zmieniono bryłę i krawędź stolika, zamknięto tył sofy i dodano nóżki. W książkach oddzielono okładki, grzbiety, blok i krawędzie kartek. Narzuta i dywan mają frędzle/obszycie. Hokery mają wyściełane oparcia i podnóżki.

Blat kuchenny ma fizyczny otwór w geometrii, oddzielną komorę zlewu, odpływ oraz detale baterii. Szafki mają cofnięty cokół i uchwyty; górna zabudowa łączy się z obniżeniem sufitu, a półki znajdują się we wnęce. Przewody lampy sięgają sufitu. Okna mają uszczelki i kamienny parapet. Ceramiczne naczynia mają wewnętrzne ścianki. Drobne gałązki i zakrzywione liście zastępują wcześniejsze proste patyki i bryłki.

Leśna panorama HDR jest rzeczywistym otoczeniem za oknem. Służy też do wstępnego oświetlenia i przechwycenia odbić wewnątrz pomieszczenia. LightProbe dodaje niskoczęstotliwościowe światło rozproszone na podstawie radiancji przechwyconej w pokoju. To przybliżenie odbicia światła, nie path tracing.

Statyczne elementy o wspólnym materiale są łączone z zachowaniem światowego położenia, UV i cieni. W sprawdzonym ujęciu liczbę siatek zredukowano z 298 do 75 przed ostatnimi drobnymi zmianami. Test check-interior-craft.mjs weryfikuje skończoność geometrii/UV/normalnych, rzeczywisty otwór zlewu oraz zachowanie granic sceny po łączeniu. Oba testy działają też przed publikacją Pages.

Źródła: [INTERIOR_ASSET_SOURCES.md](INTERIOR_ASSET_SOURCES.md).
