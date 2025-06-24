import { db } from "./db";
import { cards } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function fixMissingCards() {
  console.log("🔄 Vérification et ajout des cartes manquantes...");

  try {
    // Vérifier les cartes existantes
    const allCards = await db.select().from(cards).where(eq(cards.collectionId, 1));
    const basesCount = allCards.filter(c => c.cardType?.includes('Parallel')).length;
    const autographsCount = allCards.filter(c => c.cardType === 'Autographe').length;
    
    console.log(`📊 État actuel: ${basesCount} bases, ${autographsCount} autographes, ${allCards.length} total`);

    let cardId = allCards.length > 0 ? Math.max(...allCards.map(c => c.id)) + 1 : 1;
    const cardsToInsert: any[] = [];

    // Liste des 200 joueurs exacte
    const players = [
      { id: 1, playerName: "Wissam Ben Yedder", teamName: "AS Monaco", isRookie: false },
      { id: 2, playerName: "Philipp Köhn", teamName: "AS Monaco", isRookie: false },
      { id: 3, playerName: "Eliesse Ben Seghir", teamName: "AS Monaco", isRookie: true },
      { id: 4, playerName: "Aleksandr Golovin", teamName: "AS Monaco", isRookie: false },
      { id: 5, playerName: "Youssouf Fofana", teamName: "AS Monaco", isRookie: false },
      { id: 6, playerName: "Mohamed Camara", teamName: "AS Monaco", isRookie: false },
      { id: 7, playerName: "Vanderson", teamName: "AS Monaco", isRookie: false },
      { id: 8, playerName: "Maghnes Akliouche", teamName: "AS Monaco", isRookie: false },
      { id: 9, playerName: "Takumi Minamino", teamName: "AS Monaco", isRookie: false },
      { id: 10, playerName: "Wilfried Singo", teamName: "AS Monaco", isRookie: false },
      { id: 11, playerName: "Caio Henrique", teamName: "AS Monaco", isRookie: false },
      { id: 12, playerName: "Edan Diop", teamName: "AS Monaco", isRookie: true },
      { id: 13, playerName: "Folarin Balogun", teamName: "AS Monaco", isRookie: false },
      { id: 14, playerName: "Soungoutou Magassa", teamName: "AS Monaco", isRookie: true },
      { id: 15, playerName: "Denis Zakaria", teamName: "AS Monaco", isRookie: false },
      { id: 16, playerName: "Grejohn Kyei", teamName: "Clermont Foot 63", isRookie: true },
      { id: 17, playerName: "Muhammed Cham", teamName: "Clermont Foot 63", isRookie: false },
      { id: 18, playerName: "Jim Allevinah", teamName: "Clermont Foot 63", isRookie: false },
      { id: 19, playerName: "Andy Pelmard", teamName: "Clermont Foot 63", isRookie: true },
      { id: 20, playerName: "Aïman Maurer", teamName: "Clermont Foot 63", isRookie: true },
      { id: 21, playerName: "Maxime Gonalons", teamName: "Clermont Foot 63", isRookie: false },
      { id: 22, playerName: "Neto Borges", teamName: "Clermont Foot 63", isRookie: true },
      { id: 23, playerName: "Alidu Seidu", teamName: "Clermont Foot 63", isRookie: false },
      { id: 24, playerName: "Bamba Dieng", teamName: "FC Lorient", isRookie: false },
      { id: 25, playerName: "Romain Faivre", teamName: "FC Lorient", isRookie: false },
      { id: 26, playerName: "Jean-Victor Makengo", teamName: "FC Lorient", isRookie: false },
      { id: 27, playerName: "Laurent Abergel", teamName: "FC Lorient", isRookie: false },
      { id: 28, playerName: "Théo Le Bris", teamName: "FC Lorient", isRookie: true },
      { id: 29, playerName: "Julien Ponceau", teamName: "FC Lorient", isRookie: true },
      { id: 30, playerName: "Montassar Talbi", teamName: "FC Lorient", isRookie: false },
      { id: 31, playerName: "Siriné Doucouré", teamName: "FC Lorient", isRookie: true },
      { id: 32, playerName: "Cheikh Sabaly", teamName: "FC Metz", isRookie: true },
      { id: 33, playerName: "Fali Candé", teamName: "FC Metz", isRookie: true },
      { id: 34, playerName: "Lamine Camara", teamName: "FC Metz", isRookie: true },
      { id: 35, playerName: "Malick Mbaye", teamName: "FC Metz", isRookie: true },
      { id: 36, playerName: "Kévin N'Doram", teamName: "FC Metz", isRookie: true },
      { id: 37, playerName: "Danley Jean Jacques", teamName: "FC Metz", isRookie: true },
      { id: 38, playerName: "Kévin Van Den Kerkhof", teamName: "FC Metz", isRookie: true },
      { id: 39, playerName: "Alexandre Oukidja", teamName: "FC Metz", isRookie: true },
      { id: 40, playerName: "Alban Lafont", teamName: "FC Nantes", isRookie: false },
      { id: 41, playerName: "Mostafa Mohamed", teamName: "FC Nantes", isRookie: false },
      { id: 42, playerName: "Moses Simon", teamName: "FC Nantes", isRookie: false },
      { id: 43, playerName: "Adson", teamName: "FC Nantes", isRookie: true },
      { id: 44, playerName: "Quentin Merlin", teamName: "FC Nantes", isRookie: false },
      { id: 45, playerName: "Douglas Augusto", teamName: "FC Nantes", isRookie: true },
      { id: 46, playerName: "Pedro Chirivella", teamName: "FC Nantes", isRookie: false },
      { id: 47, playerName: "Marquinos", teamName: "FC Nantes", isRookie: false },
      { id: 48, playerName: "Nabil Alioui", teamName: "Havre AC", isRookie: false },
      { id: 49, playerName: "Yassine Kechta", teamName: "Havre AC", isRookie: true },
      { id: 50, playerName: "Arthur Desmas", teamName: "Havre AC", isRookie: true },
      { id: 51, playerName: "Daler Kuzyaev", teamName: "Havre AC", isRookie: false },
      { id: 52, playerName: "Rassoul Ndiaye", teamName: "Havre AC", isRookie: true },
      { id: 53, playerName: "Samuel Grandsir", teamName: "Havre AC", isRookie: true },
      { id: 54, playerName: "Arouna Sangante", teamName: "Havre AC", isRookie: true },
      { id: 55, playerName: "Christopher Opéri", teamName: "Havre AC", isRookie: true },
      { id: 56, playerName: "Lucas Chevalier", teamName: "LOSC Lille", isRookie: false },
      { id: 57, playerName: "Jonathan David", teamName: "LOSC Lille", isRookie: false },
      { id: 58, playerName: "Alan Virginius", teamName: "LOSC Lille", isRookie: true },
      { id: 59, playerName: "Adam Ounas", teamName: "LOSC Lille", isRookie: false },
      { id: 60, playerName: "Rémy Cabella", teamName: "LOSC Lille", isRookie: false },
      { id: 61, playerName: "Hákon Arnar Haraldsson", teamName: "LOSC Lille", isRookie: false },
      { id: 62, playerName: "Benjamin André", teamName: "LOSC Lille", isRookie: false },
      { id: 63, playerName: "Angel Gomes", teamName: "LOSC Lille", isRookie: false },
      { id: 64, playerName: "Leny Yoro", teamName: "LOSC Lille", isRookie: true },
      { id: 65, playerName: "Tiago Santos", teamName: "LOSC Lille", isRookie: true },
      { id: 66, playerName: "Alexsandro", teamName: "LOSC Lille", isRookie: true },
      { id: 67, playerName: "Bafodé Diakité", teamName: "LOSC Lille", isRookie: true },
      { id: 68, playerName: "Yusuf Yazici", teamName: "LOSC Lille", isRookie: false },
      { id: 69, playerName: "Edon Zhegrova", teamName: "LOSC Lille", isRookie: false },
      { id: 70, playerName: "Benjamin Lecomte", teamName: "Montpellier Hérault SC", isRookie: false },
      { id: 71, playerName: "Akor Adams", teamName: "Montpellier Hérault SC", isRookie: true },
      { id: 72, playerName: "Mousa Al-Tamari", teamName: "Montpellier Hérault SC", isRookie: true },
      { id: 73, playerName: "Téji Savanier", teamName: "Montpellier Hérault SC", isRookie: false },
      { id: 74, playerName: "Wahbi Khazri", teamName: "Montpellier Hérault SC", isRookie: false },
      { id: 75, playerName: "Jordan Ferri", teamName: "Montpellier Hérault SC", isRookie: false },
      { id: 76, playerName: "Joris Chotard", teamName: "Montpellier Hérault SC", isRookie: false },
      { id: 77, playerName: "Falaye Sacko", teamName: "Montpellier Hérault SC", isRookie: true },
      { id: 78, playerName: "Khalil Fayad", teamName: "Montpellier Hérault SC", isRookie: true },
      { id: 79, playerName: "Kiki Kouyaté", teamName: "Montpellier Hérault SC", isRookie: true },
      { id: 80, playerName: "Arnaud Nordin", teamName: "Montpellier Hérault SC", isRookie: true },
      { id: 81, playerName: "Dante", teamName: "OGC Nice", isRookie: false },
      { id: 82, playerName: "Terem Moffi", teamName: "OGC Nice", isRookie: false },
      { id: 83, playerName: "Gaëtan Laborde", teamName: "OGC Nice", isRookie: false },
      { id: 84, playerName: "Badredine Bouanani", teamName: "OGC Nice", isRookie: true },
      { id: 85, playerName: "Youssouf Ndayishimiye", teamName: "OGC Nice", isRookie: true },
      { id: 86, playerName: "Khéphren Thuram", teamName: "OGC Nice", isRookie: false },
      { id: 87, playerName: "Morgan Sanson", teamName: "OGC Nice", isRookie: false },
      { id: 88, playerName: "Youcef Atal", teamName: "OGC Nice", isRookie: true },
      { id: 89, playerName: "Jean-Clair Todibo", teamName: "OGC Nice", isRookie: false },
      { id: 90, playerName: "Marcin Bułka", teamName: "OGC Nice", isRookie: false },
      { id: 91, playerName: "Melvin Bard", teamName: "OGC Nice", isRookie: false },
      { id: 92, playerName: "Evann Guessand", teamName: "OGC Nice", isRookie: false },
      { id: 93, playerName: "Pablo Rosario", teamName: "OGC Nice", isRookie: false },
      { id: 94, playerName: "Sofiane Diop", teamName: "OGC Nice", isRookie: false },
      { id: 95, playerName: "Pau López", teamName: "Olympique de Marseille", isRookie: false },
      { id: 96, playerName: "Vitinha", teamName: "Olympique de Marseille", isRookie: true },
      { id: 97, playerName: "Ismaïla Sarr", teamName: "Olympique de Marseille", isRookie: false },
      { id: 98, playerName: "François Mughe", teamName: "Olympique de Marseille", isRookie: true },
      { id: 99, playerName: "Geoffrey Kondogbia", teamName: "Olympique de Marseille", isRookie: false },
      { id: 100, playerName: "Valentin Rongier", teamName: "Olympique de Marseille", isRookie: false },
      { id: 101, playerName: "Azzedine Ounahi", teamName: "Olympique de Marseille", isRookie: false },
      { id: 102, playerName: "Jonathan Clauss", teamName: "Olympique de Marseille", isRookie: false },
      { id: 103, playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille", isRookie: false },
      { id: 104, playerName: "Chancel Mbemba", teamName: "Olympique de Marseille", isRookie: false },
      { id: 105, playerName: "Renan Lodi", teamName: "Olympique de Marseille", isRookie: false },
      { id: 106, playerName: "Iliman Ndiaye", teamName: "Olympique de Marseille", isRookie: true },
      { id: 107, playerName: "Jordan Veretout", teamName: "Olympique de Marseille", isRookie: false },
      { id: 108, playerName: "Amine Harit", teamName: "Olympique de Marseille", isRookie: false },
      { id: 109, playerName: "Anthony Lopes", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 110, playerName: "Alexandre Lacazette", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 111, playerName: "Jeffinho", teamName: "Olympique Lyonnais", isRookie: true },
      { id: 112, playerName: "Maxence Caqueret", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 113, playerName: "Rayan Cherki", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 114, playerName: "Corentin Tolisso", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 115, playerName: "Johann Lepenant", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 116, playerName: "Saël Kumbedi", teamName: "Olympique Lyonnais", isRookie: true },
      { id: 117, playerName: "Sinaly Diomandé", teamName: "Olympique Lyonnais", isRookie: true },
      { id: 118, playerName: "Duje Ćaleta-Car", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 119, playerName: "Nicolás Tagliafico", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 120, playerName: "Ainsley Maitland-Niles", teamName: "Olympique Lyonnais", isRookie: false },
      { id: 121, playerName: "Skelly Alvero", teamName: "Olympique Lyonnais", isRookie: true },
      { id: 122, playerName: "Ernest Nuamah", teamName: "Olympique Lyonnais", isRookie: true },
      { id: 123, playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 124, playerName: "Gonçalo Ramos", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 125, playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 126, playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 127, playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 128, playerName: "Manuel Ugarte", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 129, playerName: "Vitinha", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 130, playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 131, playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 132, playerName: "Kang-in Lee", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 133, playerName: "Lucas Hernández", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 134, playerName: "Bradley Barcola", teamName: "Paris Saint-Germain", isRookie: true },
      { id: 135, playerName: "Marquinhos", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 136, playerName: "Marco Asensio", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 137, playerName: "Fabián Ruiz", teamName: "Paris Saint-Germain", isRookie: false },
      { id: 138, playerName: "Brice Samba", teamName: "RC Lens", isRookie: false },
      { id: 139, playerName: "Elye Wahi", teamName: "RC Lens", isRookie: false },
      { id: 140, playerName: "Florian Sotoca", teamName: "RC Lens", isRookie: false },
      { id: 141, playerName: "Angelo Fulgini", teamName: "RC Lens", isRookie: true },
      { id: 142, playerName: "Przemysław Frankowski", teamName: "RC Lens", isRookie: false },
      { id: 143, playerName: "Andy Diouf", teamName: "RC Lens", isRookie: true },
      { id: 144, playerName: "Salis Abdul Samed", teamName: "RC Lens", isRookie: false },
      { id: 145, playerName: "Deiver Machado", teamName: "RC Lens", isRookie: true },
      { id: 146, playerName: "Facundo Medina", teamName: "RC Lens", isRookie: false },
      { id: 147, playerName: "David Pereira da Costa", teamName: "RC Lens", isRookie: true },
      { id: 148, playerName: "Óscar Cortés", teamName: "RC Lens", isRookie: true },
      { id: 149, playerName: "Habib Diarra", teamName: "RC Strasbourg Alsace", isRookie: false },
      { id: 150, playerName: "Emanuel Emegha", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 151, playerName: "Ângelo", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 152, playerName: "Lebo Mothiba", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 153, playerName: "Matz Sels", teamName: "RC Strasbourg Alsace", isRookie: false },
      { id: 154, playerName: "Frédéric Guilbert", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 155, playerName: "Jessy Deminguet", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 156, playerName: "Dilane Bakwa", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 157, playerName: "Ismaël Doukouré", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 158, playerName: "Gerzino Nyamsi", teamName: "RC Strasbourg Alsace", isRookie: false },
      { id: 159, playerName: "Abakar Sylla", teamName: "RC Strasbourg Alsace", isRookie: true },
      { id: 160, playerName: "Bredan Chardonnet", teamName: "Stade Brestois 29", isRookie: false },
      { id: 161, playerName: "Martín Satriano", teamName: "Stade Brestois 29", isRookie: false },
      { id: 162, playerName: "Billal Brahimi", teamName: "Stade Brestois 29", isRookie: true },
      { id: 163, playerName: "Jérémy Le Douaron", teamName: "Stade Brestois 29", isRookie: false },
      { id: 164, playerName: "Romain Del Castillo", teamName: "Stade Brestois 29", isRookie: false },
      { id: 165, playerName: "Pierre Lees-Melou", teamName: "Stade Brestois 29", isRookie: false },
      { id: 166, playerName: "Marco Bizot", teamName: "Stade Brestois 29", isRookie: false },
      { id: 167, playerName: "Lilian Brassier", teamName: "Stade Brestois 29", isRookie: false },
      { id: 168, playerName: "Josh Wilson-Esbrand", teamName: "Stade de Reims", isRookie: true },
      { id: 169, playerName: "Oumar Diakité", teamName: "Stade de Reims", isRookie: true },
      { id: 170, playerName: "Junya Ito", teamName: "Stade de Reims", isRookie: false },
      { id: 171, playerName: "Marshall Munetsi", teamName: "Stade de Reims", isRookie: false },
      { id: 172, playerName: "Valentin Atangana Edoa", teamName: "Stade de Reims", isRookie: true },
      { id: 173, playerName: "Amir Richardson", teamName: "Stade de Reims", isRookie: true },
      { id: 174, playerName: "Azor Matusiwa", teamName: "Stade de Reims", isRookie: false },
      { id: 175, playerName: "Mohamed Daramy", teamName: "Stade de Reims", isRookie: false },
      { id: 176, playerName: "Keito Nakamura", teamName: "Stade de Reims", isRookie: true },
      { id: 177, playerName: "Yunis Abdelhamid", teamName: "Stade de Reims", isRookie: true },
      { id: 178, playerName: "Yehvann Diouf", teamName: "Stade de Reims", isRookie: true },
      { id: 179, playerName: "Arthur Theate", teamName: "Stade Rennais FC", isRookie: false },
      { id: 180, playerName: "Arnaud Kalimuendo", teamName: "Stade Rennais FC", isRookie: false },
      { id: 181, playerName: "Ibrahim Salah", teamName: "Stade Rennais FC", isRookie: true },
      { id: 182, playerName: "Amine Gouiri", teamName: "Stade Rennais FC", isRookie: false },
      { id: 183, playerName: "Benjamin Bourigeaud", teamName: "Stade Rennais FC", isRookie: false },
      { id: 184, playerName: "Désiré Doué", teamName: "Stade Rennais FC", isRookie: false },
      { id: 185, playerName: "Enzo Le Fée", teamName: "Stade Rennais FC", isRookie: false },
      { id: 186, playerName: "Lorenz Assignon", teamName: "Stade Rennais FC", isRookie: true },
      { id: 187, playerName: "Steve Mandanda", teamName: "Stade Rennais FC", isRookie: false },
      { id: 188, playerName: "Warmed Omari", teamName: "Stade Rennais FC", isRookie: true },
      { id: 189, playerName: "Adrien Truffert", teamName: "Stade Rennais FC", isRookie: false },
      { id: 190, playerName: "Fabian Rieder", teamName: "Stade Rennais FC", isRookie: true },
      { id: 191, playerName: "Ludovic Blas", teamName: "Stade Rennais FC", isRookie: false },
      { id: 192, playerName: "Jeanuël Belocian", teamName: "Stade Rennais FC", isRookie: true },
      { id: 193, playerName: "Thijs Dallinga", teamName: "Toulouse FC", isRookie: false },
      { id: 194, playerName: "Zakaria Aboukhlal", teamName: "Toulouse FC", isRookie: false },
      { id: 195, playerName: "Vincent Sierro", teamName: "Toulouse FC", isRookie: true },
      { id: 196, playerName: "Gabriel Suazo", teamName: "Toulouse FC", isRookie: true },
      { id: 197, playerName: "Cristian Cásseres Jr.", teamName: "Toulouse FC", isRookie: false },
      { id: 198, playerName: "Aron Dønnum", teamName: "Toulouse FC", isRookie: true },
      { id: 199, playerName: "Guillaume Restes", teamName: "Toulouse FC", isRookie: true },
      { id: 200, playerName: "Rasmus Nicolaisen", teamName: "Toulouse FC", isRookie: true }
    ];

    // Ajouter les bases manquantes si nécessaire
    if (basesCount < 1800) {
      console.log("🔢 Ajout des cartes Bases num manquantes...");
      
      const basesNumVariants = [
        { type: "Parallel Laser", rarity: "rare", numbering: "1/50", suffix: "-LB" },
        { type: "Parallel Laser", rarity: "rare", numbering: "1/35", suffix: "-LO" },
        { type: "Parallel Swirl", rarity: "rare", numbering: "1/30", suffix: "-SR" },
        { type: "Parallel Swirl", rarity: "rare", numbering: "1/25", suffix: "-SBz" },
        { type: "Parallel Swirl", rarity: "super_rare", numbering: "1/20", suffix: "-SP" },
        { type: "Parallel Swirl", rarity: "super_rare", numbering: "1/15", suffix: "-ST" },
        { type: "Parallel Laser", rarity: "super_rare", numbering: "1/15", suffix: "-LPu" },
        { type: "Parallel Swirl", rarity: "ultra_rare", numbering: "1/10", suffix: "-SG" },
        { type: "Parallel Laser", rarity: "ultra_rare", numbering: "1/5", suffix: "-LG" }
      ];

      for (const player of players) {
        for (const variant of basesNumVariants) {
          const existingCard = allCards.find(c => 
            c.reference === `${player.id.toString().padStart(3, '0')}${variant.suffix}`
          );
          
          if (!existingCard) {
            cardsToInsert.push({
              id: cardId++,
              collectionId: 1,
              reference: `${player.id.toString().padStart(3, '0')}${variant.suffix}`,
              playerName: player.playerName,
              teamName: player.teamName,
              cardType: variant.type,
              cardSubType: player.isRookie ? "Rookie" : null,
              rarity: variant.rarity,
              numbering: variant.numbering,
              isOwned: false,
              imageUrl: null
            });
          }
        }
      }
    }

    // Ajouter les autographes manquantes si nécessaire
    if (autographsCount < 304) {
      console.log("✍️ Ajout des cartes Autographes manquantes...");
      
      const autographPlayers = [
        { id: 1, playerName: "Zinedine Zidane", teamName: "Real Madrid / France" },
        { id: 2, playerName: "Thierry Henry", teamName: "AS Monaco / Arsenal" },
        { id: 3, playerName: "David Ginola", teamName: "Paris Saint-Germain" },
        { id: 4, playerName: "Emmanuel Petit", teamName: "AS Monaco / Arsenal" },
        { id: 5, playerName: "Jean-Pierre Papin", teamName: "Olympique de Marseille" },
        { id: 6, playerName: "Didier Deschamps", teamName: "Olympique de Marseille" },
        { id: 7, playerName: "Fabien Barthez", teamName: "AS Monaco / France" },
        { id: 8, playerName: "Marcel Desailly", teamName: "AC Milan / France" },
        { id: 9, playerName: "Lilian Thuram", teamName: "AS Monaco / France" },
        { id: 10, playerName: "Patrick Vieira", teamName: "AS Monaco / Arsenal" },
        { id: 11, playerName: "Robert Pirès", teamName: "FC Metz / Arsenal" },
        { id: 12, playerName: "Sylvain Wiltord", teamName: "Stade Rennais" },
        { id: 13, playerName: "Christophe Dugarry", teamName: "Olympique de Marseille" },
        { id: 14, playerName: "Bixente Lizarazu", teamName: "Girondins de Bordeaux" },
        { id: 15, playerName: "Claude Makélélé", teamName: "FC Nantes" },
        { id: 16, playerName: "Youri Djorkaeff", teamName: "RC Strasbourg" },
        { id: 17, playerName: "Alain Giresse", teamName: "Girondins de Bordeaux" },
        { id: 18, playerName: "Michel Platini", teamName: "AS Saint-Étienne" },
        { id: 19, playerName: "Just Fontaine", teamName: "Stade de Reims" },
        { id: 20, playerName: "Raymond Kopa", teamName: "Stade de Reims" },
        { id: 21, playerName: "Marius Trésor", teamName: "Girondins de Bordeaux" },
        { id: 22, playerName: "Jean Tigana", teamName: "Olympique Lyonnais" },
        { id: 23, playerName: "Luis Fernandez", teamName: "Paris Saint-Germain" },
        { id: 24, playerName: "Maxime Bossis", teamName: "FC Nantes" },
        { id: 25, playerName: "Manuel Amoros", teamName: "AS Monaco" },
        { id: 26, playerName: "Jean-Luc Ettori", teamName: "AS Monaco" },
        { id: 27, playerName: "Dominique Rocheteau", teamName: "AS Saint-Étienne" },
        { id: 28, playerName: "Oscar Heisserer", teamName: "RC Strasbourg" },
        { id: 29, playerName: "Bernard Lacombe", teamName: "Olympique Lyonnais" },
        { id: 30, playerName: "Joël Bats", teamName: "AJ Auxerre" },
        { id: 31, playerName: "Eric Cantona", teamName: "Olympique de Marseille" },
        { id: 32, playerName: "Basile Boli", teamName: "Olympique de Marseille" },
        { id: 33, playerName: "Abedi Pelé", teamName: "Olympique de Marseille" },
        { id: 34, playerName: "Chris Waddle", teamName: "Olympique de Marseille" },
        { id: 35, playerName: "Dragan Stojković", teamName: "Olympique de Marseille" },
        { id: 36, playerName: "Fabrizio Ravanelli", teamName: "Olympique de Marseille" },
        { id: 37, playerName: "Ronaldinho", teamName: "Paris Saint-Germain" },
        { id: 38, playerName: "Leonardo", teamName: "Paris Saint-Germain" }
      ];

      const autographVariants = [
        { numbering: "1/199", rarity: "legendary" },
        { numbering: "1/99", rarity: "legendary" },
        { numbering: "1/49", rarity: "legendary" },
        { numbering: "1/25", rarity: "legendary" },
        { numbering: "1/10", rarity: "legendary" },
        { numbering: "1/5", rarity: "legendary" },
        { numbering: "1/3", rarity: "legendary" },
        { numbering: "1/2", rarity: "legendary" }
      ];

      for (const player of autographPlayers) {
        for (const variant of autographVariants) {
          const existingCard = allCards.find(c => 
            c.reference === `AU${player.id.toString().padStart(2, '0')}-${variant.numbering.replace('1/', '')}`
          );
          
          if (!existingCard) {
            cardsToInsert.push({
              id: cardId++,
              collectionId: 1,
              reference: `AU${player.id.toString().padStart(2, '0')}-${variant.numbering.replace('1/', '')}`,
              playerName: player.playerName,
              teamName: player.teamName,
              cardType: "Autographe",
              cardSubType: null,
              rarity: variant.rarity,
              numbering: variant.numbering,
              isOwned: false,
              imageUrl: null
            });
          }
        }
      }
    }

    // Insérer les cartes manquantes
    if (cardsToInsert.length > 0) {
      console.log(`💾 Insertion de ${cardsToInsert.length} cartes manquantes...`);
      const batchSize = 500;
      for (let i = 0; i < cardsToInsert.length; i += batchSize) {
        const batch = cardsToInsert.slice(i, i + batchSize);
        await db.insert(cards).values(batch);
        console.log(`✅ Lot ${Math.floor(i/batchSize) + 1}/${Math.ceil(cardsToInsert.length/batchSize)} inséré`);
      }
    }

    console.log(`🎉 Cartes restaurées : ${cardsToInsert.length} cartes ajoutées!`);
    
    return {
      success: true,
      cardsAdded: cardsToInsert.length,
      basesRestored: cardsToInsert.filter(c => c.cardType?.includes('Parallel')).length,
      autographsRestored: cardsToInsert.filter(c => c.cardType === 'Autographe').length
    };

  } catch (error) {
    console.error("❌ Erreur lors de la restauration des cartes:", error);
    throw error;
  }
}

// Exécution du script
fixMissingCards()
  .then(result => {
    console.log("Restauration des cartes terminée:", result);
    process.exit(0);
  })
  .catch(error => {
    console.error("Échec de la restauration des cartes:", error);
    process.exit(1);
  });