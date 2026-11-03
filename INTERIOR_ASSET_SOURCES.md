# Źródła materiałów wnętrza 3D

Wersja atelier-5 używa własnej geometrii oraz fotograficznych materiałów biblioteki Poly Haven. Zasoby biblioteki są udostępnione na [CC0](https://polyhaven.com/license). Modele sof 02/03 były sprawdzone jako kandydaci, ale nie zostały użyte. Modeli ani zdjęć realizacji studia nie dodawano.

| Zasób | Autorzy | Lokalne pliki |
| --- | --- | --- |
| [Black Walnut Veneer 02](https://polyhaven.com/a/black_walnut_veneer_02) | Jenelle van Heerden | dist/assets/interior/walnut-color.webp, walnut-normal.webp, walnut-roughness.webp |
| [Rough Linen](https://polyhaven.com/a/rough_linen) | colormass — fotografia; Rico Cilliers — przetwarzanie | dist/assets/interior/linen-color.webp, linen-normal.webp, linen-roughness.webp |
| [Forest Slope](https://polyhaven.com/a/forest_slope) | Andreas Mischok | dist/assets/interior/forest-slope-1k.hdr, forest-slope-2k.hdr |

Mapy koloru mają około 2K, normalne i szorstkość około 1K. Obrazy przekonwertowano do WebP, bezstratnie w przypadku map normalnych. HDR pozostaje w oryginalnym RGBE. Telefon pobiera 1K HDR, komputer 2K. Wszystko jest serwowane z repozytorium, bez runtime CDN.

Oryginalny len ma niebieski barwnik. W materiale 3D kolor został zneutralizowany i przyciemniony do palety beżu/taupe; fizyczny wzór splotu i mapy normalnych zachowano. Fornir i len zastępują wcześniejsze mapy generowane. Marmur oraz podłoga nadal korzystają z autorskich map opisanych w IMAGE_PROMPTS_INTERIOR_REALISM.md. Nie generowano nowych obrazów w tej iteracji.

Pełne adresy pobrań, rozdzielczości, nazwy autorów, rozmiary i SHA-256 plików zawiera INTERIOR_ASSET_MANIFEST.json.

Dodatki HDRLoader, LightProbeGenerator i BufferGeometryUtils pochodzą z oficjalnej paczki npm Three.js 0.180.0 i są objęte lokalną licencją MIT w dist/vendor/three/LICENSE. W BufferGeometryUtils zmieniono ścieżkę importu three na lokalny moduł, aby ten sam plik działał w przeglądarce i testach Node.
