# Imiona nadawane dzieciom w Polsce

Strona: https://kotymek.github.io/imiona-nadawane/

Rankingi pierwszych imion dla pełnych lat 2000–2025 i pierwszych półroczy 2019–2026, wyszukiwanie bez polskich znaków, filtry płci, sortowanie i wykres historii każdego imienia (liczba nadań, udział, miejsce). Link do imienia zachowuje stan wykresu. Responsywny interfejs, obsługa klawiatury, dostępna tabela danych wykresu. Bez frameworka i zależności npm; pliki statyczne działają w podkatalogu GitHub Pages.

## Źródła i metodologia

[Dane.gov.pl — zbiór 219](https://dane.gov.pl/pl/dataset/219,imiona-nadawane-dzieciom-w-polsce). Dokładne adresy wykorzystanych plików, identyfikatory zasobów i daty modyfikacji zapisano w `data/names.json` i pokazano na stronie. Zbiorczy plik 2000–2019, krajowe zestawienia roczne od 2020 i krajowe pierwsze półrocza. Pomijamy drugie imiona, zestawienia wojewódzkie i USC oraz powielone formaty plików.

- Pełne lata i półrocza stanowią osobne szeregi. Domyślny ranking: ostatni pełny rok, imiona żeńskie.
- Każdy zapis imienia i płeć to osobny rekord. Wyszukiwanie obejmuje wszystkie okresy, także imiona bez wpisu w wybranym roku.
- Remisy: miejsca 1, 1, 3. Filtrowanie tekstowe i sortowanie nie zmieniają miejsca. Filtr płci określa populację rankingu.
- Brak rekordu nie jest zerem: źródła mogą pomijać rzadkie imiona. Wykres ma wówczas przerwę.
- Udział liczony w sumie opublikowanych nadań danej płci i okresu (dla filtra „Wszystkie” w obu płciach). Nie jest to odsetek wszystkich urodzeń.
- Wykres miejsca i udziału zawsze odnosi się do płci wybranego imienia.
- Oficjalny CSV za I półrocze 2020 nie ma nagłówka; importer zachowuje pierwszy rekord.

## Uruchomienie i aktualizacja

Node.js 22 lub nowszy:

```sh
npm start
npm test
npm run update-data
```

Podgląd: http://127.0.0.1:4173/imiona-nadawane/ . Aktualizacja pobiera katalog zasobów oraz krajowe pliki CSV, waliduje dane i zapisuje nowy snapshot. Sprawdź różnicę, uruchom testy i zatwierdź plik `data/names.json`. Strona korzysta z lokalnej kopii danych, więc nie wymaga dostępności ani CORS API przy każdej wizycie. Aktualizacja jest ręczna.

## Publikacja

W Settings → Pages wybierz „Deploy from a branch”, gałąź `main`, katalog `/ (root)`. GitHub Pages publikuje pliki statyczne po każdym pushu, a `.nojekyll` wyłącza przetwarzanie Jekyll. Osobny workflow `.github/workflows/check.yml` uruchamia testy danych i sprawdzenie składni JavaScript.
