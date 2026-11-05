// NeoScribVisu-BM : tableau d'évolution d'une bibliothèque (remplace le Looker « Tableau BM évolutions »).
import {
  $, app, nf, nb, echapper, chargerDonnees, agreger, disponible, libelle, libelleEpci, cleTriEpci, formater,
  htmlTuiles, htmlEvolution, htmlBarresH, htmlJauge, texteTypo, couleurTypo, texteProvisoire,
  activerInfobulles, preparerExport, NOTES_GENERALES, notesUtilisees,
} from './commun.js';

// ------------------------------------------------------------------ pages
const PAGES = [
  { id: 'situation', titre: 'Situation actuelle', blocs: [
    { type: 'identite' },
    { type: 'tuiles', ids: ['surface', 'heures_hebdo', 'jours_hebdo', 'dimanche', 'acq_total', 'acq_par_hab', 'accessible', 'gratuite', 'sigb', 'catalogue_informatise'] },
    { type: 'grille', blocs: [
      { type: 'jauge' },
      { type: 'fonds', titre: 'Fonds au 31 décembre', ids: ['livres_fonds', 'livres_bdp', 'cd_fonds', 'dvd_fonds', 'jv_fonds', 'presse_abonnements'] },
    ] },
  ] },
  { id: 'diverses', titre: 'Évolutions diverses', blocs: [
    { type: 'grille', blocs: [
      { type: 'evolution', titre: 'Personnel (personnes)', ids: ['personnel_total', 'salaries', 'benevoles', 'benevoles_qualifies'] },
      { type: 'evolution', titre: 'Personnel (équivalents temps plein)', ids: ['etp_total', 'etp_salaries', 'etp_benevoles'] },
      { type: 'evolution', titre: 'Fonctionnaires de la filière culturelle', ids: ['conservateurs', 'bibliothecaires', 'assistants', 'adjoints'] },
      { type: 'evolution', titre: 'Dépenses d\'acquisition documentaire', ids: ['acq_total'] },
      { type: 'evolution', titre: 'Fréquentation (entrées dans l\'établissement)', ids: ['frequentation'] },
      { type: 'evolution', titre: 'Classes accueillies', ids: ['ecoles_classes', 'colleges_classes', 'lycees_classes'] },
    ] },
  ] },
  { id: 'usagers', titre: 'Usagers', blocs: [
    { type: 'grille', blocs: [
      { type: 'evolution', titre: 'Nouveaux inscrits', ids: ['nouveaux_inscrits', 'nouveaux_residents'] },
      { type: 'evolution', titre: 'Nouveaux inscrits par tranche d\'âge', ids: ['nouveaux_enfants', 'nouveaux_adultes', 'nouveaux_seniors', 'nouveaux_collectivites'] },
      { type: 'evolution', titre: 'Emprunteurs actifs', ids: ['emprunteurs', 'emprunteurs_residents'] },
      { type: 'evolution', titre: 'Emprunteurs actifs par tranche d\'âge', ids: ['emprunteurs_enfants', 'emprunteurs_adultes', 'emprunteurs_seniors', 'emprunteurs_collectivites'] },
    ] },
  ] },
  { id: 'livres', titre: 'Collections : livres', blocs: [
    { type: 'grille', blocs: [
      { type: 'evolution', titre: 'Fonds de livres selon la provenance', ids: ['livres_fonds', 'livres_bdp'], note: 'Fonds propre (hors dépôt) et livres déposés par biblio.gironde.' },
      { type: 'evolution', titre: 'Fonds propre de livres par public', ids: ['livres_fonds_adultes', 'livres_fonds_enfants'] },
      { type: 'evolution', titre: 'Budget d\'acquisition de livres imprimés', ids: ['acq_livres'] },
      { type: 'evolution', titre: 'Acquisitions de livres', ids: ['livres_acq_adultes', 'livres_acq_enfants'] },
      { type: 'evolution', titre: 'Éliminations (désherbage) de livres', ids: ['livres_pilons_adultes', 'livres_pilons_enfants'] },
    ] },
  ] },
  { id: 'autres', titre: 'Collections : autres supports', blocs: [
    { type: 'grille', blocs: [
      { type: 'evolution', titre: 'Fonds', ids: ['cd_fonds', 'dvd_fonds', 'jv_fonds'] },
      { type: 'evolution', titre: 'Abonnements de presse en cours', ids: ['presse_abonnements'] },
      { type: 'evolution', titre: 'Acquisitions', ids: ['cd_acq', 'dvd_acq', 'jv_acq'] },
      { type: 'evolution', titre: 'Éliminations', ids: ['cd_pilons', 'dvd_pilons', 'jv_pilons'] },
      { type: 'evolution', titre: 'Budgets d\'acquisition', ids: ['acq_sonores', 'acq_dvd', 'acq_jv', 'acq_presse'] },
    ] },
  ] },
  { id: 'emprunts', titre: 'Emprunts', blocs: [
    { type: 'grille', blocs: [
      { type: 'evolution', titre: 'Prêts de livres', ids: ['prets_livres'] },
      { type: 'evolution', titre: 'Prêts des autres supports', ids: ['prets_presse', 'prets_sonores', 'prets_video', 'prets_autres'] },
      { type: 'evolution', titre: 'Prêts par public', ids: ['prets_adultes', 'prets_enfants', 'prets_collectivites'] },
      { type: 'evolution', titre: 'Livres empruntés par emprunteur actif', ids: ['livres_par_emprunteur'] },
    ] },
  ] },
  { id: 'typologie', titre: 'Calcul de la typologie', blocs: [{ type: 'criteres' }] },
];

// Libellés au singulier pour une bibliothèque (ceux de NeoScribVisu décrivent des ensembles de lieux).
const LIBELLES = {
  dimanche: 'Ouverture le dimanche',
  accessible: 'Accessible (loi de 2005)',
  population: 'Population de la commune',
};

// Les 9 critères de la typologie départementale, notés de 1 à 5 dans le fichier de l'enquête.
const CRITERES = {
  EMPRUNTEUR: 'Emprunteurs actifs',
  NBACTIONS: 'Actions culturelles',
  SURFACE: 'Surface',
  DEP_DOC: 'Dépenses documentaires',
  PRETS: 'Prêts',
  INTERNET: 'Accès à internet',
  NHHO: 'Heures d\'ouverture hebdomadaires',
  DIVERSITE_OFFRE: 'Diversité de l\'offre',
  PERSONNEL_QUAL: 'Personnel qualifié',
};

// ------------------------------------------------------------------ état
const etat = { page: 'situation', annee: null, code: '' };
let catalogue = []; // { code, nom, commune, epci, type } : tous les établissements connus, toutes années confondues

const fiche = (annee) => (app.donnees[annee] ?? []).find((e) => e.code === etat.code);
const ctx = (interactif = true) => ({
  annee: etat.annee,
  interactif,
  plusieurs: false,
  libelles: LIBELLES,
  lignes: (a) => { const e = fiche(a); return e ? [e] : []; },
});
const entree = () => catalogue.find((c) => c.code === etat.code);
const libelleEntree = (c) => `${c.nom}${c.type === 'reseau' ? ' (réseau)' : ''} – ${c.commune}`;

function lireAdresse() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (PAGES.some((pg) => pg.id === p.get('page'))) etat.page = p.get('page');
  if (p.has('annee') && app.annees.includes(Number(p.get('annee')))) etat.annee = Number(p.get('annee'));
  etat.code = catalogue.some((c) => c.code === p.get('bib')) ? p.get('bib') : '';
}
function ecrireAdresse() {
  const p = new URLSearchParams({ page: etat.page, annee: etat.annee });
  if (etat.code) p.set('bib', etat.code);
  history.replaceState(null, '', `#${p}`);
}

// ------------------------------------------------------------------ rendu des blocs
function rendreBloc(b, c) {
  switch (b.type) {
    case 'grille': return `<div class="grille">${b.blocs.map((x) => rendreBloc(x, c)).join('')}</div>`;
    case 'tuiles': return htmlTuiles(b.ids, c);
    case 'evolution': return htmlEvolution(b, c);
    case 'identite': return htmlIdentite(c);
    case 'jauge': return htmlJaugeEmprunteurs(c);
    case 'fonds': return htmlFonds(b, c);
    case 'criteres': return htmlCriteres(c);
  }
  return '';
}

function htmlIdentite(c) {
  const e = fiche(c.annee);
  if (!e) return `<p class="avertissement">Pas de réponse à l'enquête ${c.annee} pour cet établissement.</p>`;
  const lignes = [
    ['Commune', e.commune],
    ['Intercommunalité', e.epci ? libelleEpci(e.epci) : '–'],
    ['Population de la commune', e.v.population != null ? `${nf().format(e.v.population)} hab.` : '–'],
    ['Nature', e.type === 'reseau' ? 'Réseau multi-sites (ligne de saisie commune à plusieurs lieux)' : 'Lieu de lecture'],
    ['Rattachement administratif', e.rattachement ?? '–'],
    ['Code de l\'enquête', e.code],
  ];
  return `<dl class="identite">${lignes.map(([k, v]) => `<div><dt>${k}</dt><dd>${echapper(v)}</dd></div>`).join('')}</dl>`;
}

function htmlJaugeEmprunteurs(c) {
  const e = fiche(c.annee);
  const taux = e ? agreger('taux_emprunteurs', [e], c.annee)?.valeur : null;
  return htmlJauge({
    titre: 'Emprunteurs actifs rapportés à la population',
    valeur: taux,
    texte: taux == null ? 'non renseigné' : `${nf(1).format(taux)} %`,
    detail: taux == null ? '' : `${nf().format(e.v.emprunteurs)} emprunteurs actifs pour ${nf().format(e.v.population)} habitants. Pour un réseau ou une commune à plusieurs lieux, la population est celle de toute la commune.`,
  });
}

function htmlFonds(b, c) {
  const e = fiche(c.annee);
  const items = e ? b.ids.filter((id) => disponible(id, c.annee) && e.v[id] != null && e.v[id] > 0).map((id) => ({ nom: libelle(id), v: e.v[id] })) : [];
  return htmlBarresH({ titre: `${b.titre} ${c.annee}`, items, id: 'livres_fonds' });
}

function htmlCriteres(c) {
  const e = fiche(c.annee);
  if (!e) return '';
  if (e.type === 'reseau') return `<p class="texte-page">La typologie est calculée pour chaque lieu de lecture : choisissez un des lieux de ce réseau.</p>`;
  if (!e.criteres) return `<p class="texte-page">Aucun calcul de typologie dans les fichiers de l'enquête ${c.annee} pour ce lieu.</p>`;
  const notes = Object.entries(CRITERES).map(([k, nom]) => ({ nom, v: e.criteres[k] }));
  const compte = [5, 4, 3, 2, 1].map((n) => ({ n, v: notes.filter((x) => x.v === n).length }));
  const lignes = notes.map((x) => `<div class="critere" data-info="${echapper(`${x.nom} : ${x.v ?? '–'} sur 5`)}">
      <span class="critere-nom">${echapper(x.nom)}</span>
      <span class="critere-points">${[1, 2, 3, 4, 5].map((n) => `<span class="${x.v != null && n <= x.v ? 'plein' : ''}"></span>`).join('')}</span>
      <span class="critere-note">${x.v ?? '–'}</span></div>`).join('');
  return `<div class="grille">
    <figure class="graphique"><figcaption>Note obtenue sur chacun des 9 critères (de 1 à 5)</figcaption><div class="criteres">${lignes}</div></figure>
    <figure class="graphique"><figcaption>Résultat ${c.annee}</figcaption>
      <p class="typo-resultat">${texteTypo(e.nouvelle_typologie ?? e.typologie)}</p>
      <table class="table-notes"><thead><tr><th>Note</th>${compte.map((x) => `<th>${x.n}</th>`).join('')}</tr></thead>
      <tbody><tr><th scope="row">Nombre de critères</th>${compte.map((x) => `<td>${x.v}</td>`).join('')}</tr></tbody></table>
      <p class="graphique-note">Notes et typologie reprises telles quelles du fichier « typologie » de l'enquête.</p>
    </figure></div>`;
}

const rendrePage = (p, interactif = true) => p.blocs.map((b) => rendreBloc(b, ctx(interactif))).join('');

// ------------------------------------------------------------------ affichage
function afficher() {
  ecrireAdresse();
  for (const a of document.querySelectorAll('#liste-pages a')) {
    if (a.dataset.page === etat.page && etat.code) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  $('.filtres select[name="annee"]').value = etat.annee;
  const c = entree();
  $('.ouvrir-export').disabled = !c;
  $('#choix-bib').value = c ? libelleEntree(c) : '';
  if (!c) { afficherAccueil(); return; }
  const page = PAGES.find((p) => p.id === etat.page);
  const e = fiche(etat.annee) ?? fiche(app.annees.filter((a) => fiche(a)).at(-1));
  document.title = `${c.nom} – ${page.titre} – NeoScribVisu`;
  $('.entete-page').innerHTML = `<p class="surtitre">${echapper(page.titre)}</p><h1>${echapper(c.nom)}</h1>
    <p class="perimetre">${echapper(sousTitre())}</p>${e?.typologie ? `<p class="typologie-ligne">${texteTypo(e.typologie)}</p>` : ''}`;
  const avert = fiche(etat.annee) ? texteProvisoire(etat.annee, [fiche(etat.annee)]) : '';
  $('.avertissement').hidden = !avert;
  $('.avertissement').textContent = avert;
  $('.page').innerHTML = rendrePage(page);
  afficherMethode();
}

function sousTitre() {
  const c = entree();
  if (!c) return '';
  const presentes = app.annees.filter((a) => fiche(a));
  const absentes = app.annees.filter((a) => !fiche(a));
  return `${c.commune}${c.epci ? `, ${libelleEpci(c.epci)}` : ''} – chiffres clés ${etat.annee}, évolution ${presentes[0]}–${presentes.at(-1)}`
    + (absentes.length ? ` (pas de réponse en ${absentes.join(', ')})` : '');
}

function afficherAccueil() {
  document.title = 'NeoScribVisu – évolution d\'une bibliothèque';
  $('.avertissement').hidden = true;
  $('.entete-page').innerHTML = `<h1>Évolution d'une bibliothèque</h1>
    <p class="perimetre">Choisissez une bibliothèque dans le champ de recherche, ou dans la liste par intercommunalité.</p>`;
  const parEpci = new Map();
  for (const c of catalogue) {
    const cle = c.epci ?? '';
    if (!parEpci.has(cle)) parEpci.set(cle, []);
    parEpci.get(cle).push(c);
  }
  const groupes = [...parEpci].map(([code, liste]) => [code ? libelleEpci(code) : 'Sans intercommunalité', liste])
    .sort((a, b) => cleTriEpci(a[0]).localeCompare(cleTriEpci(b[0]), 'fr'));
  $('.page').innerHTML = `<div class="accueil">${groupes.map(([nom, liste]) => `<details><summary>${echapper(nom)} <span class="compte">${liste.length}</span></summary>
    <ul>${liste.sort((a, b) => a.commune.localeCompare(b.commune, 'fr') || a.nom.localeCompare(b.nom, 'fr'))
      .map((c) => `<li><a href="#page=situation&annee=${etat.annee}&bib=${c.code}" data-bib="${c.code}">${echapper(c.commune)}<span> – ${echapper(c.nom)}${c.type === 'reseau' ? ' (réseau)' : ''}</span></a></li>`).join('')}</ul></details>`).join('')}</div>`;
  afficherMethode();
}

function afficherMethode() {
  $('.a-savoir ul').innerHTML = [...NOTES_GENERALES, ...notesUtilisees()].map((n) => `<li>${echapper(n)}</li>`).join('');
}

// ------------------------------------------------------------------ interface
function preparer() {
  // Catalogue : la fiche la plus récente de chaque établissement.
  const parCode = new Map();
  for (const a of app.annees) for (const e of app.donnees[a]) parCode.set(e.code, { code: e.code, nom: e.nom, commune: e.commune || '–', epci: e.epci, type: e.type });
  catalogue = [...parCode.values()].sort((a, b) => a.commune.localeCompare(b.commune, 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  $('#liste-bib').innerHTML = catalogue.map((c) => `<option value="${echapper(libelleEntree(c))}"></option>`).join('');

  $('#liste-pages').innerHTML = PAGES.map((p) => `<li><a href="#page=${p.id}" data-page="${p.id}">${echapper(p.titre)}</a></li>`).join('');
  $('#liste-pages').addEventListener('click', (ev) => {
    const a = ev.target.closest('a[data-page]');
    if (!a) return;
    ev.preventDefault();
    etat.page = a.dataset.page;
    if (matchMedia('(max-width: 860px)').matches) basculerMenu(false);
    afficher();
    scrollTo({ top: 0 });
  });
  $('.bouton-menu').addEventListener('click', () => basculerMenu($('.bouton-menu').getAttribute('aria-expanded') !== 'true'));
  if (matchMedia('(max-width: 860px)').matches) basculerMenu(false);

  const annee = $('.filtres select[name="annee"]');
  annee.innerHTML = [...app.annees].reverse().map((a) => `<option value="${a}">${a}</option>`).join('');
  annee.addEventListener('change', () => { etat.annee = Number(annee.value); afficher(); });

  const champ = $('#choix-bib');
  const choisir = () => {
    const c = catalogue.find((x) => libelleEntree(x) === champ.value);
    if (c && c.code !== etat.code) { etat.code = c.code; afficher(); champ.blur(); }
  };
  champ.addEventListener('change', choisir);
  champ.addEventListener('input', () => { if (catalogue.some((x) => libelleEntree(x) === champ.value)) choisir(); });
  champ.addEventListener('focus', () => champ.select());
  $('.changer').addEventListener('click', () => { etat.code = ''; afficher(); champ.focus(); });

  $('.page').addEventListener('click', (ev) => {
    const a = ev.target.closest('a[data-bib]');
    if (!a) return;
    ev.preventDefault();
    etat.code = a.dataset.bib;
    etat.page = 'situation';
    afficher();
    scrollTo({ top: 0 });
  });

  preparerExport({
    pages: () => PAGES,
    rendrePage,
    titreDocument: () => `${entree()?.nom ?? ''} – NeoScribVisu`,
    sousTitre,
  });
  activerInfobulles();
}

function basculerMenu(ouvert) {
  $('.bouton-menu').setAttribute('aria-expanded', String(ouvert));
  $('#liste-pages').dataset.ferme = String(!ouvert);
}

// ------------------------------------------------------------------ démarrage
try {
  await chargerDonnees();
  etat.annee = Math.max(...app.annees);
  preparer();
  lireAdresse();
  addEventListener('hashchange', () => { lireAdresse(); afficher(); });
  afficher();
} catch (err) {
  $('.page').innerHTML = `<p class="avertissement">Les données n'ont pas pu être chargées depuis ${echapper(app.source)} (${echapper(err.message)}).</p>`;
  console.error(err);
}
