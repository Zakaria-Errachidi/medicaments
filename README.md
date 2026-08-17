# Santé au quotidien

Application web sans installation, avec 3 sections accessibles par un
menu : **Médicaments**, **Aliments** (aux effets proches de certains
médicaments) et **Symptômes**. Fonctionne sur téléphone, peut être
ajoutée à l'écran d'accueil comme une application (PWA), et ne
nécessite aucun serveur : tout est hébergé gratuitement sur GitHub
Pages.

## Contenu du projet

```
medicaments-app/
├── index.html            la page (structure + menu)
├── style.css              l'apparence
├── app.js                  la recherche (tolérante aux fautes/accents)
├── medicaments.csv         données Médicaments  → modifiable
├── aliments.csv            données Aliments      → modifiable
├── symptomes.csv           données Symptômes     → modifiable
├── manifest.json           réglages PWA
├── sw.js                    fonctionnement hors-ligne
└── images/
    ├── tab-medicaments.png  icône du menu (générée, remplaçable)
    ├── tab-aliments.png     icône du menu (générée, remplaçable)
    ├── tab-symptomes.png    icône du menu (générée, remplaçable)
    └── aliments-banner.jpg  bannière décorative (générée, remplaçable)
```

Vous n'avez normalement besoin de modifier que les **3 fichiers CSV**
et, si vous le souhaitez, les images. Le reste peut être laissé tel
quel.

---

## 1. Tester en local avant de publier

Ouvrir `index.html` en double-cliquant ne fonctionne **pas** (le
navigateur bloque le chargement des fichiers CSV en mode `file://`).
Il faut un petit serveur local, juste pour tester :

1. Ouvrez un terminal dans le dossier `medicaments-app`.
2. Tapez : `python3 -m http.server 8000` (essayez `python` si
   `python3` ne fonctionne pas).
3. Ouvrez `http://localhost:8000/` dans votre navigateur (pas
   `file://`).
4. Pour arrêter le serveur : `Ctrl + C` dans le terminal.

Une fois en ligne sur GitHub Pages, ce problème ne se pose plus : le
site fonctionne normalement en `https://`.

---

## 2. Modifier les données (sans toucher au code)

Les 3 fichiers CSV s'éditent exactement de la même façon : sur
GitHub (icône crayon → modifier → **Commit changes**), ou avec Excel /
Google Sheets en réenregistrant en **CSV UTF-8**.

### medicaments.csv
```
nom,dosage,substance,presentation,forme,statut
```

### aliments.csv
```
aliment,agit_comme,substance_liee,effet,niveau_preuve,precaution
```
- `aliment` : nom de l'aliment (ex. Gingembre)
- `agit_comme` : effet en langage simple (ex. Anti-inflammatoire léger)
- `substance_liee` : le médicament/la substance auquel il se
  rapproche (ex. Ibuprofène) — permet de le retrouver en cherchant le
  nom du médicament
- `effet` : description courte de l'effet
- `niveau_preuve` : soyez honnête ici (« Bonnes preuves », « Preuves
  faibles », etc.) — évitez de surestimer l'efficacité
- `precaution` : interactions, contre-indications, mise en garde

### symptomes.csv
```
symptome,causes_possibles,conseils,urgence
```
- `urgence` : laissez vide s'il n'y a pas de signal d'alerte
  particulier, ou décrivez quand consulter en urgence (le mot
  déclenche un encadré rouge dans l'application)

Règle commune à tous les CSV : si un texte contient une virgule,
entourez-le de guillemets (`"0,25 mg"`). Toujours enregistrer en
**UTF-8** pour que les accents s'affichent bien.

**Important — contenu santé :** les sections Aliments et Symptômes
affichent déjà un avertissement fixe rappelant que ce sont des
informations éducatives, pas un avis médical. En ajoutant des lignes,
gardez ce ton prudent : indiquez un niveau de preuve honnête et
rappelez qu'il ne faut jamais arrêter un traitement prescrit sans en
parler à un médecin.

---

## 3. Remplacer les images (facultatif)

Le site fonctionne déjà avec des images générées automatiquement
(icônes et bannière dans le style de l'application). Vous pouvez les
remplacer par vos propres photos en respectant ces dimensions :

| Fichier à remplacer              | Dimensions conseillées | Format | Utilisation |
|-----------------------------------|------------------------|--------|-------------|
| `images/tab-medicaments.png`      | 240 × 240 px (carré)   | PNG    | Icône du menu « Médicaments » |
| `images/tab-aliments.png`         | 240 × 240 px (carré)   | PNG    | Icône du menu « Aliments » |
| `images/tab-symptomes.png`        | 240 × 240 px (carré)   | PNG    | Icône du menu « Symptômes » |
| `images/aliments-banner.jpg`      | 1200 × 400 px (large)  | JPG    | Bannière en haut de la section Aliments |
| `icons/icon-192.png`              | 192 × 192 px (carré)   | PNG    | Icône de l'app sur l'écran d'accueil |
| `icons/icon-512.png`              | 512 × 512 px (carré)   | PNG    | Icône de l'app (haute résolution) |

Conseils :
- Pour les icônes carrées, une image simple et lisible fonctionne
  mieux qu'une photo chargée (le cadre est petit).
  Une photo réelle marche bien pour `aliments-banner.jpg` — 1200×400
  garantit qu'elle reste nette sur tous les écrans, y compris les
  téléphones récents (écrans « Retina »).
- Gardez exactement le même nom de fichier pour ne rien avoir à
  changer dans le code. Pour l'envoyer : sur GitHub, ouvrez le dossier
  `images` (ou `icons`), cliquez sur le fichier existant, puis
  **Add file > Upload files** en choisissant le même nom pour qu'il
  remplace l'ancien.

Si vous voulez ajouter une photo à un aliment ou une bannière pour la
section Symptômes plus tard, le même principe s'applique : créez
l'image aux dimensions ci-dessus, uploadez-la dans `images/`, puis
demandez (ou faites) une petite modification de `index.html` /
`style.css` pour l'afficher au bon endroit.

---

## 4. Déployer sur GitHub Pages (gratuit)

### Étape 1 — Créer un compte GitHub (si besoin)
Sur https://github.com, créez un compte gratuit.

### Étape 2 — Créer un dépôt (« repository »)
1. Cliquez sur **New repository** (bouton vert).
2. Donnez-lui un nom, par exemple `sante-papa`.
3. Laissez-le **Public** (obligatoire pour GitHub Pages gratuit).
4. Cliquez sur **Create repository**.

### Étape 3 — Envoyer les fichiers du projet
1. Sur la page du dépôt, cliquez sur **uploading an existing file**
   (ou **Add file > Upload files**).
2. Glissez-déposez **tous les fichiers et dossiers** du projet
   (`index.html`, `style.css`, `app.js`, les 3 fichiers `.csv`,
   `manifest.json`, `sw.js`, et les dossiers `icons/` et `images/`
   avec leur contenu) — gardez la même organisation de dossiers.
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
   https://votre-nom-utilisateur.github.io/sante-papa/
   ```

C'est ce lien qu'il faut envoyer à votre père (SMS, WhatsApp,
email...).

---

## 5. Installer l'application sur le téléphone (PWA)

**Sur Android (Chrome) :**
1. Ouvrir le lien du site.
2. Appuyer sur le menu ⋮ (trois points en haut à droite).
3. Choisir **Ajouter à l'écran d'accueil** (ou **Installer
   l'application**).
4. Confirmer.

**Sur iPhone (Safari) :**
1. Ouvrir le lien dans **Safari** (obligatoire).
2. Appuyer sur le bouton de partage 􀈂.
3. Choisir **Sur l'écran d'accueil**.
4. Confirmer.

---

## 6. Mettre à jour l'application plus tard

- **Modifier les données** : éditez le CSV concerné sur GitHub. Pas
  besoin de republier autre chose ; les données se rafraîchissent
  automatiquement à la prochaine ouverture avec réseau.
- **Modifier le code ou les images** : remplacez les fichiers sur
  GitHub (Add file > Upload files > Commit changes), puis changez le
  numéro de version dans `sw.js` (`sante-app-v2` → `sante-app-v3`)
  pour que les téléphones ayant déjà installé l'application
  récupèrent bien la nouvelle version.

---

## 7. Comment fonctionne la recherche

Chacune des 3 sections utilise le même moteur de recherche, tolérant
pour quelqu'un peu à l'aise avec un clavier :

- **Majuscules/minuscules** : « Paracetamol » = « paracetamol ».
- **Accents** : « paracetamol » trouve « Paracétamol ».
- **Petites fautes de frappe** : « parcetamol », « gingambre »,
  « douleur thorasique » sont quand même trouvés.
- Dans **Aliments**, la recherche fonctionne aussi bien avec le nom
  de l'aliment (« gingembre ») qu'avec le nom du médicament auquel il
  se rapproche (« ibuprofène »).

Aucune donnée n'est envoyée sur internet lors d'une recherche : tout
se passe directement dans le téléphone, à partir des fichiers CSV déjà
chargés.

## 8. Avertissement santé

Les sections **Aliments** et **Symptômes** sont fournies à titre
purement informatif et éducatif. Elles ne remplacent en aucun cas
l'avis d'un médecin ou d'un pharmacien, et ne doivent jamais conduire
à modifier ou arrêter un traitement prescrit sans en parler
préalablement à un professionnel de santé. En cas d'urgence, contactez
le 15 (SAMU) ou le 112.
