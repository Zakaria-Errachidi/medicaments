# Recherche de médicaments

Petite application web, sans installation, pour rechercher un médicament
par substance (ou par nom de marque). Fonctionne sur téléphone, peut
être ajoutée à l'écran d'accueil comme une application (PWA), et ne
nécessite aucun serveur : tout est hébergé gratuitement sur GitHub Pages.

## Contenu du projet

```
medicaments-app/
├── index.html          la page (structure)
├── style.css            l'apparence (gros boutons, texte lisible)
├── app.js                la recherche (tolérante aux fautes/accents)
├── medicaments.csv       LES DONNÉES → le seul fichier à modifier
├── manifest.json         réglages de l'application installable
├── sw.js                  permet le fonctionnement hors-ligne
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

Vous ne devez normalement toucher qu'à **medicaments.csv**. Tout le
reste peut être laissé tel quel.

## 1. Format du fichier medicaments.csv

Le fichier a 6 colonnes, séparées par une virgule, avec un en-tête sur
la première ligne :

```
nom,dosage,substance,presentation,forme,statut
Doliprane,1000 mg,Paracétamol,Boîte de 8 comprimés,Comprimé,Disponible
```

Règles importantes :

- La première ligne (`nom,dosage,substance,presentation,forme,statut`)
  ne doit **jamais** être supprimée ou modifiée.
- Une ligne = un médicament.
- Si un texte contient lui-même une virgule (par exemple un dosage
  écrit à la française `0,25 mg`), il faut l'entourer de guillemets :
  `"0,25 mg"`. Sinon, ne mettez pas de guillemets.
- Enregistrez toujours le fichier en **UTF-8** (voir ci-dessous) pour
  que les accents (é, è, ê...) s'affichent correctement.

### Modifier le fichier facilement (sans toucher au code)

**Option simple — directement sur GitHub (recommandée) :**
1. Allez sur la page du dépôt GitHub du projet.
2. Cliquez sur `medicaments.csv`.
3. Cliquez sur l'icône crayon (« Edit this file »).
4. Modifiez, ajoutez ou supprimez des lignes.
5. En bas de page, cliquez sur **Commit changes**.
6. Le site se met à jour automatiquement en 1 à 2 minutes.

**Option avec Excel / Google Sheets :**
1. Ouvrez `medicaments.csv` avec Excel, LibreOffice Calc ou Google Sheets.
2. Modifiez les données (une colonne = une information).
3. Enregistrez / exportez avec le format **CSV UTF-8 (délimité par
   des virgules)** — c'est important, sinon les accents peuvent se
   casser. Dans Excel : *Fichier > Enregistrer sous > CSV UTF-8
   (délimité par des virgules) (*.csv)*.
4. Remplacez l'ancien fichier `medicaments.csv` du projet par le
   nouveau (sur GitHub : ouvrez le dossier, cliquez sur **Add file >
   Upload files**, glissez le fichier, puis **Commit changes**).

## 2. Déployer sur GitHub Pages (gratuit)

### Étape 1 — Créer un compte GitHub (si besoin)
Sur https://github.com, créez un compte gratuit.

### Étape 2 — Créer un dépôt (« repository »)
1. Cliquez sur **New repository** (bouton vert).
2. Donnez-lui un nom, par exemple `medicaments-papa`.
3. Laissez-le **Public** (obligatoire pour GitHub Pages gratuit).
4. Cliquez sur **Create repository**.

### Étape 3 — Envoyer les fichiers du projet
1. Sur la page du dépôt fraîchement créé, cliquez sur **uploading an
   existing file** (ou **Add file > Upload files**).
2. Glissez-déposez **tous les fichiers et dossiers** du projet
   (`index.html`, `style.css`, `app.js`, `medicaments.csv`,
   `manifest.json`, `sw.js`, et le dossier `icons/` avec ses deux
   images) — gardez la même organisation de dossiers.
3. En bas de page, cliquez sur **Commit changes**.

### Étape 4 — Activer GitHub Pages
1. Dans le dépôt, allez dans **Settings** (⚙️ en haut).
2. Dans le menu de gauche, cliquez sur **Pages**.
3. Sous **Build and deployment > Source**, choisissez **Deploy from a
   branch**.
4. Sous **Branch**, choisissez `main` (ou `master`) et le dossier
   `/ (root)`, puis cliquez sur **Save**.
5. Attendez 1 à 2 minutes. Un lien apparaît en haut de la page, du
   type :

   ```
   https://votre-nom-utilisateur.github.io/medicaments-papa/
   ```

C'est ce lien qu'il faut envoyer à votre père (par SMS, WhatsApp,
email...). Il suffit d'y cliquer pour ouvrir l'application.

## 3. Installer l'application sur le téléphone de votre père (PWA)

Une fois le lien ouvert dans le navigateur du téléphone :

**Sur Android (Chrome) :**
1. Ouvrir le lien du site.
2. Appuyer sur le menu ⋮ (trois points en haut à droite).
3. Choisir **Ajouter à l'écran d'accueil** (ou **Installer
   l'application**, selon la version).
4. Confirmer. Une icône apparaît sur l'écran d'accueil, comme une
   vraie application.

**Sur iPhone (Safari) :**
1. Ouvrir le lien du site dans **Safari** (obligatoire, pas Chrome).
2. Appuyer sur le bouton de partage 􀈂 (le carré avec la flèche vers
   le haut).
3. Choisir **Sur l'écran d'accueil**.
4. Confirmer. Une icône apparaît sur l'écran d'accueil.

Une fois installée, l'application s'ouvre en plein écran, sans barre
d'adresse, et fonctionne même avec une connexion faible (les fichiers
de l'application sont mis en cache ; seule la liste des médicaments a
besoin d'un peu de réseau pour être mise à jour).

## 4. Mettre à jour l'application plus tard

- **Modifier les médicaments** : éditez `medicaments.csv` comme
  expliqué plus haut. Pas besoin de republier autre chose.
- **Modifier l'apparence ou le fonctionnement** : remplacez les
  fichiers `index.html`, `style.css` ou `app.js` sur GitHub de la
  même façon (Add file > Upload files > Commit changes). Si vous
  modifiez `app.js` ou `style.css`, changez aussi le numéro dans la
  première ligne utile de `sw.js` (`medicaments-app-v1` →
  `medicaments-app-v2`) pour que les téléphones qui ont déjà
  installé l'application récupèrent bien la nouvelle version.

## 5. Comment fonctionne la recherche

La recherche est volontairement tolérante, pour quelqu'un qui n'est
pas à l'aise avec un clavier :

- **Majuscules/minuscules** : « Paracetamol » = « paracetamol ».
- **Accents** : « paracetamol » trouve « Paracétamol ».
- **Petites fautes de frappe** : « parcetamol », « ibuprofen »
  (au lieu de ibuprofène) sont quand même trouvés.
- La recherche fonctionne à la fois sur le **nom du médicament**
  (ex. « Doliprane ») et sur la **substance** (ex. « Paracétamol »).

Aucune donnée n'est envoyée sur internet lors de la recherche : tout
se passe directement dans le téléphone, à partir du fichier CSV déjà
chargé.
