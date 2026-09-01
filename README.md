# Portfolio Riccardo Uras — GitHub Pages (IT/EN)

Sito portfolio statico bilingue (Italiano/Inglese), con switch lingua in alto a destra e stile moderno dark.
Pensato per essere aggiornato in pochi secondi modificando solo file JSON, senza toccare HTML.

## Novita in questa versione

- Switch di lingua IT/EN in ogni pagina (in alto a destra). La lingua scelta viene ricordata (localStorage).
- Stile grafico rinnovato: font Inter, sfondo con gradienti sottili, card con hover ed elevazione, bottoni con gradiente.
- Tutti i testi statici (nav, hero, about, label filtri) sono in `data/strings.json`.
- Progetti e ricerche hanno campi separati `_it` e `_en` per titolo/descrizione, cosi il contenuto e disponibile in entrambe le lingue.

## Struttura

```
portfolio-site/
├── index.html            Home page
├── projects.html          Elenco progetti con filtri per tag
├── research.html          Elenco ricerche con filtri per tag
├── about.html              Pagina "chi sono"
├── assets/
│   ├── css/style.css       Stile del sito (dark, moderno)
│   └── js/main.js          Logica: caricamento JSON, switch lingua, filtri
└── data/
    ├── strings.json         Testi statici IT/EN (nav, hero, about, label)
    ├── projects.json        I TUOI PROGETTI (bilingue)
    └── research.json        LE TUE RICERCHE (bilingue)
```

## Come aggiungere un nuovo progetto

Apri `data/projects.json` e aggiungi un blocco (virgola tra un blocco e l'altro):

```json
{
  "title_it": "Titolo in italiano",
  "title_en": "Title in English",
  "date": "2026-09-01",
  "role_it": "Il tuo ruolo",
  "role_en": "Your role",
  "description_it": "Descrizione in italiano.",
  "description_en": "Description in English.",
  "tags": ["Composites", "FEA"],
  "link": "https://link-esterno-o-vuoto"
}
```

Se non hai tempo di tradurre, puoi lasciare lo stesso testo in entrambi i campi `_it`/`_en`: funziona comunque.

## Come aggiungere una nuova ricerca

Apri `data/research.json`:

```json
{
  "title_it": "Titolo in italiano",
  "title_en": "Title in English",
  "date": "2026-09-01",
  "summary_it": "Riassunto in italiano.",
  "summary_en": "Summary in English.",
  "tags": ["Career", "Materials"],
  "link": ""
}
```

`date` deve essere `YYYY-MM-DD`. Gli elementi piu recenti compaiono per primi automaticamente, in entrambe le pagine.

## Come modificare i testi fissi (nav, hero, about, filtri)

Apri `data/strings.json`: contiene due blocchi, `it` ed `en`, con le stesse chiavi. Modifica il valore della chiave che vuoi cambiare in entrambe le lingue.

## Come pubblicare su GitHub Pages

1. Crea un repository su GitHub (es. `portfolio`, oppure `<tuo-username>.github.io` per il sito principale del tuo account).
2. Copia tutti i file di questa cartella nel repository, mantenendo la struttura.
3. Fai commit e push:
   ```
   git init
   git add .
   git commit -m "Sito portfolio bilingue con nuovo stile"
   git branch -M main
   git remote add origin https://github.com/<tuo-username>/<nome-repo>.git
   git push -u origin main
   ```
4. Su GitHub vai in **Settings > Pages**.
5. In "Build and deployment" scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`.
6. Dopo qualche minuto il sito e live su `https://<tuo-username>.github.io/<nome-repo>/`.

## Personalizzazioni da fare subito

- In `about.html`: sostituisci email, LinkedIn e GitHub con i tuoi reali.
- In `data/projects.json` e `data/research.json`: sostituisci gli esempi con i tuoi lavori/ricerche reali.
- Se vuoi cambiare colori/font, tutto e definito all'inizio di `assets/css/style.css` nelle variabili `:root` (es. `--accent`, `--accent-2`).

## Flusso di aggiornamento

1. Apri il JSON giusto (`projects.json`, `research.json` o `strings.json`).
2. Copia un blocco esistente, incolla, modifica i valori.
3. Commit + push. Il sito si aggiorna da solo, senza toccare HTML.
