/* ============================================================
   Corpus du tutoriel
   ------------------------------------------------------------
   Reconstitue l'état de l'art d'un mémoire réel portant sur les
   outils numériques et la mise en avant des créateurs de mode
   africaine (cartographié à l'origine avec Gargantext).
   Les familles de thèmes reprennent celles de ce travail :
   mode africaine / durabilité / industrie / études culturelles,
   plus les outils numériques.
   Ce corpus ne sert qu'à la démonstration : l'outil lui-même est
   neutre et fonctionne pour n'importe quel sujet.
   ============================================================ */

const TUTORIAL_DATA = {
  projectName: 'Tutoriel — exemple tiré d\'un mémoire',
  sources: [
    /* --- famille « mode africaine » --- */
    {
      title: 'African fashion, global style : histories, innovations, ideas',
      authors: 'V. L. Rovine', year: '2015', type: 'ouvrage', status: 'exploite', importance: 3,
      abstract: 'La mode africaine entre tradition et innovation : apparences, créativité et circulation mondiale des styles.',
      themeLabels: ['mode africaine', 'apparences', 'créativité']
    },
    {
      title: 'Fashioning independence : vêtement et décolonisation en Afrique de l\'Ouest',
      authors: 'J. Allman (dir.)', year: '2004', type: 'chapitre', status: 'lu', importance: 3,
      abstract: 'Le vêtement comme langage politique : apparences et indépendance dans les décolonisations ouest-africaines.',
      themeLabels: ['mode africaine', 'indépendance', 'apparences']
    },
    {
      title: 'Wax prints : migrations des étoffes et des styles',
      authors: 'S. Gott, K. Loughran', year: '2017', type: 'chapitre', status: 'lu', importance: 2,
      abstract: 'Circulations transnationales du wax : migrations, diasporas et symboles vestimentaires.',
      themeLabels: ['mode africaine', 'migrations', 'symboles']
    },
    {
      title: 'La Sape : élégance, diaspora et reconnaissance',
      authors: 'D. Gondola', year: '2010', type: 'article', status: 'lu', importance: 2,
      abstract: 'Les sapeurs entre Brazzaville et Paris : migrations, apparences et quête de reconnaissance sociale.',
      themeLabels: ['mode africaine', 'migrations', 'reconnaissance sociale', 'apparences']
    },

    /* --- famille « durabilité » --- */
    {
      title: 'Sustainable fashion : towards circular business models',
      authors: 'K. Niinimäki', year: '2018', type: 'article', status: 'lu', importance: 3,
      abstract: 'Durabilité et modèles économiques innovants dans la filière mode : vers une économie circulaire.',
      themeLabels: ['durabilité', 'modèles économiques innovants', 'mode durable']
    },
    {
      title: 'Corporate responsibility in the global apparel sector',
      authors: 'M. Anner', year: '2020', type: 'article', status: 'a_lire', importance: 2,
      abstract: 'Responsabilité des entreprises et conditions de production dans le secteur mondial de l\'habillement.',
      themeLabels: ['responsabilité des entreprises', 'durabilité', 'secteur']
    },
    {
      title: 'Fashion and sustainability : design for change',
      authors: 'K. Fletcher, L. Grose', year: '2012', type: 'ouvrage', status: 'exploite', importance: 3,
      abstract: 'Créativité et conscience environnementale au service d\'une mode durable.',
      themeLabels: ['mode durable', 'créativité', 'conscience environnementale']
    },
    {
      title: 'Matières premières textiles, biodiversité et sens économique',
      authors: 'Rapport sectoriel', year: '2021', type: 'rapport', status: 'a_lire', importance: 1,
      abstract: 'Impact des fibres textiles sur la biodiversité ; arbitrages entre conscience environnementale et sens économique du secteur.',
      themeLabels: ['conscience environnementale', 'durabilité', 'sens économique']
    },

    /* --- famille « industrie de la mode » --- */
    {
      title: 'Fast fashion : mass market response and garment design styles',
      authors: 'V. Bhardwaj, A. Fairhurst', year: '2010', type: 'article', status: 'lu', importance: 2,
      abstract: 'Le marché de masse de la mode et l\'accélération des styles de design vestimentaire.',
      themeLabels: ['marché de masse', 'design vestimentaire', 'secteur']
    },
    {
      title: 'Salaula : the world of second-hand clothing in Zambia',
      authors: 'K. T. Hansen', year: '2014', type: 'article', status: 'a_lire', importance: 2,
      abstract: 'La friperie (salaula) en Zambie : modèles économiques innovants, marché de masse et pratiques vestimentaires africaines.',
      themeLabels: ['modèles économiques innovants', 'marché de masse', 'développement', 'mode africaine']
    },
    {
      title: 'Organisation des filières textiles et développement local',
      authors: 'Étude de cas', year: '2019', type: 'rapport', status: 'a_lire', importance: 2,
      abstract: 'Organisation, données de production et développement dans les filières textiles.',
      themeLabels: ['organisation', 'développement', 'données']
    },
    {
      title: 'Data-driven trend forecasting in the fashion industry',
      authors: 'E. Silva et al.', year: '2020', type: 'article', status: 'a_lire', importance: 1,
      abstract: 'Prévision des tendances par les données : design vestimentaire et marché de masse.',
      themeLabels: ['données', 'design vestimentaire', 'marché de masse']
    },

    /* --- famille « études culturelles » --- */
    {
      title: 'The fashioned body : fashion, dress and modern social theory',
      authors: 'J. Entwistle', year: '2000', type: 'ouvrage', status: 'lu', importance: 2,
      abstract: 'Études culturelles du vêtement : symboles, corps et reconnaissance sociale.',
      themeLabels: ['études culturelles', 'symboles', 'reconnaissance sociale']
    },
    {
      title: 'Normes de beauté et symboles vestimentaires',
      authors: 'A. Kwan', year: '2013', type: 'article', status: 'a_lire', importance: 1,
      abstract: 'Beauté, symboles et distinction : une lecture par les études culturelles.',
      themeLabels: ['études culturelles', 'symboles', 'beauté']
    },

    /* --- famille « outils numériques » ---
       Documentée, mais jamais croisée avec « mode africaine » :
       c'est l'angle mort que le tutoriel fait découvrir —
       et c'était précisément le sujet du mémoire d'origine. */
    {
      title: 'E-commerce platforms and independent fashion retail',
      authors: 'L. Crewe', year: '2017', type: 'article', status: 'lu', importance: 2,
      abstract: 'Plateformes de vente en ligne : données clients et accès des créateurs indépendants au marché de masse.',
      themeLabels: ['outils numériques', 'marché de masse', 'données']
    },
    {
      title: 'Instagram et visibilité des créateurs indépendants',
      authors: 'B. Marwick', year: '2015', type: 'article', status: 'lu', importance: 2,
      abstract: 'Réseaux sociaux, économie de l\'attention et reconnaissance sociale des créateurs.',
      themeLabels: ['outils numériques', 'réseaux sociaux', 'reconnaissance sociale']
    },
    {
      title: 'Social media marketing in the fashion sector',
      authors: 'A. Godey et al.', year: '2016', type: 'article', status: 'a_lire', importance: 1,
      abstract: 'Stratégies des marques du secteur mode sur les réseaux sociaux.',
      themeLabels: ['outils numériques', 'réseaux sociaux', 'secteur']
    },
    {
      title: 'Vendre la mode en ligne : modèles économiques des plateformes créatives',
      authors: 'Étude de cas', year: '2022', type: 'web', status: 'a_lire', importance: 2,
      abstract: 'Les plateformes créatives et les réseaux sociaux comme modèles économiques innovants pour les créateurs indépendants.',
      themeLabels: ['outils numériques', 'réseaux sociaux', 'modèles économiques innovants']
    }
  ]
};
