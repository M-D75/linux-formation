export const folderTree = {
  name: 'root',
  type: "d",
  children: [
    {
      name: 'home',
      type: "d",
      children: [
        {
          name: 'user',
          type: "d",
          children: [
            { name: 'documents', type: "d", children: [] },
            { name: 'pictures', type: "d", children: [] },
          ],
        },
      ],
    },
    {
      name: 'var',
      type: "d",
      children: [
        { name: 'log', type: "d", children: [] },
        { name: 'tmp', type: "d", children: [] },
      ],
    },
    {
      name: 'team',
      type: 'd',
      children: [
        {
          name: 'françois',
          type: "d",
          children: [
            { name: 'Truffaut_Collection', type: "d", children: [
                { name: 'Les_400_Coups.mp4', type: "f" },
                { name: 'La_Nuit_Americaine.mp4', type: "f" },
              ] 
            },
            { name: 'Chanson_Francoise', type: "f" },
          ],
        },
        {
          name: 'nora',
          type: "d",
          children: [
            { name: 'Nora_Ephron_Movies', type: "d", children: [
                { name: 'Youve_Got_Mail.mp4', type: "f" },
                { name: 'When_Harry_Met_Sally.mp4', type: "f" },
              ] 
            },
            { name: 'Nora_TheExplorer.txt', type: "f" },
          ],
        },
        {
          name: 'marie',
          type: "d",
          children: [
            { name: 'MarieCurie_Lab', type: "d", children: [
                { name: 'Radium_Research.doc', type: "f" },
                { name: 'Nobel_Prize_1903.pdf', type: "f" },
              ] 
            },
            { name: 'Marie_Antoinette.mp4', type: "f" },
          ],
        },
        {
          name: 'christine',
          type: "d",
          children: [
            { name: 'Christine_de_Pisan', type: "d", children: [
                { name: 'La_Cité_des_Dames.pdf', type: "f" },
                { name: 'Le_Livre_du_Repos.mp4', type: "f" },
              ] 
            },
            { name: 'Christine_Automobile_Model.jpg', type: "f" },
          ],
        },
        {
          name: 'nina',
          type: "d",
          children: [
            { name: 'Nina_Ricci_Designs', type: "d", children: [
                { name: 'Perfume_Collection.jpg', type: "f" },
                { name: 'Fashion_Show_2024.mp4', type: "f" },
              ] 
            },
            { name: 'Nina_and_the_Whale.txt', type: "f" },
          ],
        },
        {
          name: 'camille',
          type: "d",
          children: [
            { name: 'Camille_Desmoulins', type: "d", children: [
                { name: 'Revolution_France_1789.txt', type: "f" },
                { name: 'Le_Vieux_Cordelier.pdf', type: "f" },
              ] 
            },
            { name: 'Camille_Lacourt_Swimming.mp4', type: "f" },
          ],
        },
      ],
    },
  ],
};
