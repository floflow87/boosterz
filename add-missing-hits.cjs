const fs = require('fs');
const { Client } = require('pg');

async function addMissingHitCards() {
  // Lire le fichier CSV
  const csvContent = fs.readFileSync('attached_assets/Checklist-Score-Ligue-1-23-24 (2)_1751532821021.csv', 'utf-8');
  const lines = csvContent.split('\n');
  
  // Connecter à la base de données
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  // Extraire les cartes Next Up, Pennants et Intergalactic
  const missingCards = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split('","').map(part => part.replace(/^"|"$/g, ''));
    
    if (parts.length >= 12) {
      const [collection_id, reference, player_name, team_name, card_type, card_sub_type, season, is_rookie_card, rarity, numerotation, variants, numberings] = parts;
      
      // Rechercher les cartes Next Up, Pennants et Intergalactic
      if (card_type === 'Hit' && (card_sub_type === 'Next Up' || card_sub_type === 'Pennants' || card_sub_type === 'Intergalactic')) {
        missingCards.push({
          collection_id: parseInt(collection_id),
          reference: reference.trim(),
          player_name: player_name.trim(),
          team_name: team_name.trim(),
          card_type: card_type.trim(),
          card_sub_type: card_sub_type.trim(),
          season: season.trim(),
          is_rookie_card: is_rookie_card.trim().toUpperCase() === 'TRUE',
          rarity: rarity.trim(),
          numerotation: numerotation.trim() === 'NA' ? null : numerotation.trim(),
          variants: variants.trim() === 'NA' ? null : variants.trim(),
          numberings: numberings.trim() === 'NA' ? null : numberings.trim()
        });
      }
    }
  }
  
  console.log(`Trouvé ${missingCards.length} cartes manquantes`);
  
  // Insérer les cartes manquantes
  for (const card of missingCards) {
    try {
      await client.query(`
        INSERT INTO checklist_cards (
          collection_id, reference, player_name, team_name, card_type, card_sub_type,
          season, is_rookie_card, rarity, numerotation, variants, numberings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        card.collection_id,
        card.reference,
        card.player_name,
        card.team_name,
        card.card_type,
        card.card_sub_type,
        card.season,
        card.is_rookie_card,
        card.rarity,
        card.numerotation,
        card.variants,
        card.numberings
      ]);
      
      console.log(`✅ Ajouté: ${card.player_name} (${card.card_sub_type})`);
    } catch (error) {
      console.error(`❌ Erreur pour ${card.player_name}:`, error.message);
    }
  }
  
  // Vérifier le résultat
  const result = await client.query("SELECT COUNT(*) as total FROM checklist_cards WHERE card_type = 'Hit'");
  console.log(`\n📊 Nouveau total de cartes Hit: ${result.rows[0].total}`);
  
  const typeResult = await client.query(`
    SELECT card_sub_type, COUNT(*) as count 
    FROM checklist_cards 
    WHERE card_type = 'Hit' 
    GROUP BY card_sub_type 
    ORDER BY count DESC
  `);
  
  console.log('\n📈 Répartition des cartes Hit:');
  typeResult.rows.forEach(row => {
    console.log(`  ${row.card_sub_type}: ${row.count}`);
  });
  
  await client.end();
}

addMissingHitCards().catch(console.error);