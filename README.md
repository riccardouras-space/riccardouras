# Portfolio Riccardo Uras — GitHub Pages

Sito portfolio statico, pensato per essere aggiornato in pochi secondi senza toccare HTML.

## Struttura

```
portfolio-site/
├── index.html          Home page (mostra ultimi 3 progetti + 3 ricerche)
├── projects.html        Elenco completo progetti con filtri per tag
├── research.html        Elenco completo ricerche con filtri per tag
├── about.html            Pagina "chi sono" (modifica testo a mano)
├── assets/
│   ├── css/style.css     Stile del sito
│   └── js/main.js        Logica che legge i JSON e genera le card
└── data/
    ├── projects.json     I TUOI PROGETTI (modifica questo file)
    └── research.json     LE TUE RICERCHE (modifica questo file)
```

## Come aggiungere un nuovo progetto

Apri `data/projects.json` e aggiungi un nuovo blocco (rispetta le virgole tra un blocco e l'altro):

```json
{
  "title": "Titolo del progetto",
  "date": "2026-08-31",
  "role": "Il tuo ruolo",
  "description": "Breve descrizione del progetto, cosa hai fatto e con quali strumenti.",
  "tags": ["Compositi", "FEA"],
  "link": "https://link-esterno-o-vuoto"
}
```

Salva, fai commit e push: il sito si aggiorna da solo.

## Come aggiungere una nuova ricerca

Apri `data/research.json` e aggiungi:

```json
{
  "title": "Titolo della ricerca",
  "date": "2026-08-31",
  "summary": "Riassunto di cosa hai imparato o approfondito.",
  "tags": ["Carriera", "Materiali"],
  "link": ""
}
```

Nota: `date` deve essere in formato `YYYY-MM-DD`. Gli elementi più recenti compaiono per primi automaticamente.

## Come pubblicare su GitHub Pages

1. Crea un nuovo repository su GitHub, ad esempio chiamato `portfolio` (oppure `<tuo-username>.github.io` se vuoi che sia il sito principale del tuo account).
2. Copia tutti i file di questa cartella (`portfolio-site/`) dentro il repository, mantenendo la struttura delle cartelle.
3. Fai commit e push su GitHub:
   ```
   git init
   git add .
   git commit -m "Sito portfolio iniziale"
   git branch -M main
   git remote add origin https://github.com/<tuo-username>/<nome-repo>.git
   git push -u origin main
   ```
4. Su GitHub vai in **Settings > Pages**.
5. In "Build and deployment", scegli **Deploy from a branch**, seleziona il branch `main` e la cartella `/ (root)`.
6. Salva. Dopo qualche minuto il sito sarà disponibile a:
   - `https://<tuo-username>.github.io/<nome-repo>/` (se il repo si chiama diversamente da `<tuo-username>.github.io`)
   - `https://<tuo-username>.github.io/` (se il repo si chiama esattamente `<tuo-username>.github.io`)

## Personalizzazioni da fare subito

- In `about.html`: sostituisci `tuamail@example.com`, il link LinkedIn e GitHub con i tuoi reali.
- In `data/projects.json` e `data/research.json`: sostituisci gli esempi con i tuoi progetti/ricerche reali (o cancellali e riparti da zero, basta lasciare `[]`).
- Il titolo del sito e i meta tag sono in ogni file `.html`, nel tag `<title>` e `<meta name="description">`.

## Aggiornamenti futuri facili

Ogni volta che vuoi aggiungere un contenuto:
1. Apri il file JSON giusto (`projects.json` o `research.json`).
2. Copia un blocco esistente, incollalo, modifica i valori.
3. Commit + push. Fatto — nessun HTML da toccare.

Se vuoi, in futuro puoi anche collegare un dominio personalizzato da **Settings > Pages > Custom domain**.
