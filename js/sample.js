/* ============================================================
   Jeu d'exemple — corpus fictif « Mode africaine & durabilité »
   (pour découvrir l'outil ; remplaçable par vos propres sources)
   ============================================================ */

const SAMPLE_DATA = {
  projectName: 'Exemple — Mode africaine & durabilité',
  sources: [
    {
      title: 'Sustainable fashion : towards circular business models',
      authors: 'K. Niinimäki', year: '2018', type: 'article', status: 'lu', importance: 3,
      abstract: 'Circular economy and innovative business models in the fashion industry, sustainability transitions.',
      themeLabels: ['mode durable', 'modèles économiques', 'économie circulaire']
    },
    {
      title: 'Corporate responsibility in the global apparel sector',
      authors: 'M. Anner', year: '2020', type: 'article', status: 'lu', importance: 2,
      abstract: 'Corporate responsibility, environmental consciousness and labour in the apparel supply chain.',
      themeLabels: ['responsabilité des entreprises', 'mode durable', 'industrie textile']
    },
    {
      title: 'Fashion and sustainability : design for change',
      authors: 'K. Fletcher, L. Grose', year: '2012', type: 'ouvrage', status: 'exploite', importance: 3,
      abstract: 'Design, creativity and sustainability in the fashion sector; environmental consciousness.',
      themeLabels: ['mode durable', 'créativité', 'design vestimentaire']
    },
    {
      title: 'Greenwashing et communication RSE dans le prêt-à-porter',
      authors: 'C. Dekhili', year: '2021', type: 'article', status: 'a_lire', importance: 2,
      abstract: "Responsabilité sociale des entreprises, communication environnementale et sens économique du secteur.",
      themeLabels: ['responsabilité des entreprises', 'économie circulaire']
    },
    {
      title: 'African fashion, global style : histories, innovations, ideas',
      authors: 'V. L. Rovine', year: '2015', type: 'ouvrage', status: 'exploite', importance: 3,
      abstract: 'African fashion between tradition and innovation; appearances, identity and independence.',
      themeLabels: ['mode africaine', 'identité', 'apparences']
    },
    {
      title: 'The poetics of cloth : wax prints and migrations of style',
      authors: 'S. Gott', year: '2017', type: 'chapitre', status: 'lu', importance: 2,
      abstract: 'Migrations, diaspora and the circulation of African textile aesthetics.',
      themeLabels: ['mode africaine', 'migrations', 'industrie textile']
    },
    {
      title: 'Fashioning independence : dress and decolonization in West Africa',
      authors: 'E. Allman', year: '2004', type: 'chapitre', status: 'lu', importance: 3,
      abstract: 'Dress, appearances and political independence in West Africa.',
      themeLabels: ['mode africaine', 'indépendance', 'apparences']
    },
    {
      title: 'Diaspora et création : la mode africaine à Paris',
      authors: 'A. Sylvanus', year: '2019', type: 'article', status: 'a_lire', importance: 2,
      abstract: 'Créateurs de la diaspora, migrations et reconnaissance dans le champ de la mode.',
      themeLabels: ['mode africaine', 'migrations', 'créativité']
    },
    {
      title: 'Symbols of status : beauty and social recognition in dress',
      authors: 'J. Entwistle', year: '2000', type: 'ouvrage', status: 'lu', importance: 2,
      abstract: 'Cultural studies of dress: symbols, beauty, social recognition and the fashioned body.',
      themeLabels: ['études culturelles', 'symboles', 'reconnaissance sociale']
    },
    {
      title: 'Beauty, the body and social cognition',
      authors: 'A. Kwan', year: '2013', type: 'article', status: 'a_lire', importance: 1,
      abstract: 'Beauty norms, symbols and social recognition from a cultural studies perspective.',
      themeLabels: ['études culturelles', 'symboles', 'beauté']
    },
    {
      title: 'Fast fashion, mass market and garment design styles',
      authors: 'S. Bhardwaj, A. Fairhurst', year: '2010', type: 'article', status: 'lu', importance: 2,
      abstract: 'Fashion mass market dynamics, garment design styles and data on consumer demand.',
      themeLabels: ['marché de masse', 'design vestimentaire', 'industrie textile']
    },
    {
      title: 'Innovative business models in the second-hand clothing trade',
      authors: 'K. T. Hansen', year: '2014', type: 'article', status: 'a_lire', importance: 2,
      abstract: 'Organization and development of second-hand clothing markets; innovative business models and data.',
      themeLabels: ['modèles économiques', 'marché de masse', 'développement']
    },
    {
      title: 'Textile upcycling and development: evidence from Accra',
      authors: 'R. Amankwah', year: '2022', type: 'rapport', status: 'inbox', importance: 2,
      abstract: 'Upcycling, développement local et organisation des filières textiles au Ghana.',
      themeLabels: ['développement', 'économie circulaire', 'industrie textile']
    },
    {
      title: 'Dress, modernity and development discourses',
      authors: 'J. Comaroff', year: '1996', type: 'chapitre', status: 'a_lire', importance: 1,
      abstract: 'Développement, modernité et vêtement dans les discours postcoloniaux.',
      themeLabels: ['développement', 'indépendance']
    }
  ]
};
