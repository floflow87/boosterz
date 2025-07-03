const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

// Configuration base de données
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Liste exacte des cartes Hit basée sur l'image Excel de l'utilisateur
const hitPlayersFromExcel = [
  'Folarin Balogun', 'Eliesse Ben Seghir', 'Randal Kolo Muani', 'Terem Moffi', 'Gonçalo Ramos',
  'Fabián Ruiz', 'Kylian Mbappé', 'Jonathan David', 'Warren Zaïre-Emery', 'Marco Asensio',
  'Alexandre Lacazette', 'Gianluigi Donnarumma', 'David Trezeguet', 'Edinson Cavani', 'William Saliba',
  'Marquinhos', 'Rayan Cherki', 'Wissam Ben Yedder', 'Takumi Minamino', 'Amine Gouiri',
  'David Beckham', 'Eric Cantona', 'Adam Ounas', 'Achraf Hakimi', 'Gonçalo Ramos',
  'Bradley Barcola', 'Randal Kolo Muani', 'Ousmane Dembélé', 'Lee Kang-in', 'Fabián Ruiz',
  'Manuel Ugarte', 'Vitinha', 'Milan Škriniar', 'Lucas Hernández', 'Marquinhos',
  'Achraf Hakimi', 'Gianluigi Donnarumma', 'Arnau Tenas', 'Kylian Mbappé', 'Marco Asensio',
  'Carlos Soler', 'Nordi Mukiele', 'Danilo Pereira', 'Lucas Beraldo', 'Senny Mayulu',
  'Yoram Zague', 'Ibrahim Mbaye', 'Ayman Kari', 'Ethan Mbappé', 'Alexandre Lacazette',
  'Ernest Nuamah', 'Mama Baldé', 'Saïd Benrahma', 'Rayan Cherki', 'Corentin Tolisso',
  'Paul Akouokou', 'Nemanja Matić', 'Johann Lepenant', 'Nicolas Tagliafico', 'Dejan Lovren',
  'Duje Ćaleta-Car', 'Clinton Mata', 'Anthony Lopes', 'Rémy Riou', 'Jonathan David',
  'Edon Zhegrova', 'Rémy Cabella', 'Angel Gomes', 'Hákon Arnar Haraldsson', 'Gabriel Gudmundsson',
  'Benjamin André', 'Nabil Bentaleb', 'Leny Yoro', 'Bafodé Diakité', 'Alexsandro Ribeiro',
  'Tiago Santos', 'Ismaily', 'Lucas Chevalier', 'Vito Mannone', 'Folarin Balogun',
  'Eddie Nketiah', 'Gabriel Jesus', 'Leandro Trossard', 'Bukayo Saka', 'Martin Ødegaard',
  'Kai Havertz', 'Declan Rice', 'Jorginho', 'Thomas Partey', 'Takehiro Tomiyasu',
  'Ben White', 'William Saliba', 'Gabriel Magalhães', 'Oleksandr Zinchenko', 'David Raya',
  'Aaron Ramsdale', 'Terem Moffi', 'Andy Delort', 'Morgan Guilavogui', 'Marshall Munetsi',
  'Azor Matusiwa', 'Teddy Teuma', 'Thomas Foket', 'Joseph Okumu', 'Emmanuel Agbadou',
  'Sergio Akieme', 'Yehvann Diouf', 'Alexandre Oukidja', 'Mostafa Mohamed', 'Lamine Camara',
  'Pape Diallo', 'Danley Jean Jacques', 'Kévin N\'Doram', 'Fali Candé', 'Ismaël Traoré',
  'Matthieu Udol', 'Koffi Kouao', 'Alexandre Oukidja', 'Mory Diaw', 'Gaëtan Laborde',
  'Téji Savanier', 'Arnaud Nordin', 'Wahbi Khazri', 'Jordan Ferri', 'Joris Chotard',
  'Léo Leroy', 'Falaye Sacko', 'Khalil Fayad', 'Kiki Kouyaté', 'Christopher Jullien',
  'Maxime Estève', 'Enzo Tchato', 'Benjamin Lecomte', 'Dimitry Bertaud', 'Wissam Ben Yedder',
  'Takumi Minamino', 'Breel Embolo', 'Myron Boadu', 'Maghnes Akliouche', 'Ismaïla Sarr',
  'Denis Zakaria', 'Youssouf Fofana', 'Mohamed Camara', 'Aleksandr Golovin', 'Vanderson',
  'Wilfried Singo', 'Thilo Kehrer', 'Guillermo Maripán', 'Caio Henrique', 'Radosław Majecki',
  'Philipp Köhn', 'Mostafa Mohamed', 'Evann Guessand', 'Gaëtan Laborde', 'Terem Moffi',
  'Badredine Bouanani', 'Hicham Boudaoui', 'Youssouf Ndayishimiye', 'Khéphren Thuram', 'Morgan Sanson',
  'Pablo Rosario', 'Youcef Atal', 'Jordan Lotomba', 'Dante', 'Jean-Clair Todibo',
  'Melvin Bard', 'Marcin Bułka', 'Kasper Dolberg', 'Pierre-Emerick Aubameyang', 'Vítinha',
  'Ismaïla Sarr', 'Amine Harit', 'Azzedine Ounahi', 'Valentin Rongier', 'Geoffrey Kondogbia',
  'Pape Gueye', 'Jordan Veretout', 'Jonathan Clauss', 'Leonardo Balerdi', 'Samuel Gigot',
  'Chancel Mbemba', 'Quentin Merlin', 'Pau López', 'Rubén Blanco', 'Thijs Dallinga',
  'Shavy Babicka', 'Yann Gboho', 'Zakaria Aboukhlal', 'Frank Magri', 'Niklas Schmidt',
  'Vincent Sierro', 'Stijn Spierings', 'Gabriel Suazo', 'Christian Mawissa', 'Logan Costa',
  'Moussa Diarra', 'Guillaume Restes', 'Álex Domínguez', 'Nabil Alioui', 'Reda Khadra',
  'Hugo Ekitike', 'Junya Ito', 'Oumar Diakité', 'Marshall Munetsi', 'Yunis Abdelhamid',
  'Emmanuel Agbadou', 'Thibault De Smet', 'Yehvann Diouf', 'Folarin Balogun', 'Moussa Sissoko',
  'Paul Pogba', 'Adrien Rabiot', 'Pierre-Emile Højbjerg', 'Houssem Aouar', 'Mattéo Guendouzi',
  'Eduardo Camavinga', 'Aurélien Tchouaméni', 'Jude Bellingham', 'Federico Valverde', 'Luka Modrić',
  'Toni Kroos', 'Vinícius Jr.', 'Rodrygo', 'Karim Benzema', 'Kylian Mbappé',
  'Erling Haaland', 'Kevin De Bruyne', 'Bernardo Silva', 'Phil Foden', 'Jack Grealish',
  'Riyad Mahrez', 'İlkay Gündoğan', 'Rodri', 'John Stones', 'Rúben Dias',
  'Josko Gvardiol', 'Kyle Walker', 'Ederson', 'Stefan Ortega', 'Óscar Cortés',
  'Pablo Pagis', 'Steve Mandanda', 'Saël Kumbedi', 'Yvon Mvogo'
];

// Fonction pour nettoyer les noms de joueurs
function cleanPlayerName(name) {
  if (!name) return '';
  return name.toString().trim().replace(/\s+/g, ' ').replace(/"/g, '');
}

// Fonction pour vérifier si c'est une carte Hit selon la liste Excel
function isHitCard(playerName) {
  const cleanName = cleanPlayerName(playerName);
  return hitPlayersFromExcel.some(hitPlayer => {
    const cleanHitPlayer = cleanPlayerName(hitPlayer);
    return cleanName === cleanHitPlayer || 
           cleanName.includes(cleanHitPlayer) || 
           cleanHitPlayer.includes(cleanName);
  });
}

async function main() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connexion à la base de données réussie');

    // Mettre à jour toutes les cartes qui correspondent aux joueurs Hit selon Excel
    let updateCount = 0;
    
    for (const hitPlayer of hitPlayersFromExcel) {
      const cleanHitPlayer = cleanPlayerName(hitPlayer);
      
      const result = await client.query(`
        UPDATE cards 
        SET card_type = 'Hit'
        WHERE LOWER(TRIM(player_name)) LIKE LOWER($1)
        AND card_type != 'Hit'
      `, [`%${cleanHitPlayer.toLowerCase()}%`]);
      
      if (result.rowCount > 0) {
        console.log(`✅ ${result.rowCount} cartes mises à jour pour ${hitPlayer}`);
        updateCount += result.rowCount;
      }
    }

    console.log(`\n🎯 RÉSULTAT FINAL:`);
    console.log(`📊 ${updateCount} cartes total mises à jour vers cardType "Hit"`);
    
    // Vérification finale
    const hitCardsCount = await client.query(`
      SELECT COUNT(*) as count FROM cards WHERE card_type = 'Hit'
    `);
    
    console.log(`🔍 Vérification: ${hitCardsCount.rows[0].count} cartes Hit dans la base`);
    
    await client.end();
    console.log('✅ Script terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

main();