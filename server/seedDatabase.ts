import { db } from "./db";
import { cards, collections } from "@shared/schema";
import { eq } from "drizzle-orm";

interface BaseCard {
  id: number;
  playerName: string;
  teamName: string;
  isRookie?: boolean;
}

interface AutoCard {
  id: number;
  playerName: string;
  teamName: string;
  numberings: string[];
}

const baseCards: BaseCard[] = [
  { id: 1, playerName: "Wissam Ben Yedder", teamName: "AS Monaco" },
  { id: 2, playerName: "Philipp Köhn", teamName: "AS Monaco" },
  { id: 3, playerName: "Eliesse Ben Seghir", teamName: "AS Monaco", isRookie: true },
  { id: 4, playerName: "Aleksandr Golovin", teamName: "AS Monaco" },
  { id: 5, playerName: "Youssouf Fofana", teamName: "AS Monaco" },
  { id: 6, playerName: "Mohamed Camara", teamName: "AS Monaco" },
  { id: 7, playerName: "Vanderson", teamName: "AS Monaco" },
  { id: 8, playerName: "Maghnes Akliouche", teamName: "AS Monaco" },
  { id: 9, playerName: "Takumi Minamino", teamName: "AS Monaco" },
  { id: 10, playerName: "Wilfried Singo", teamName: "AS Monaco" },
  { id: 11, playerName: "Caio Henrique", teamName: "AS Monaco" },
  { id: 12, playerName: "Edan Diop", teamName: "AS Monaco", isRookie: true },
  { id: 13, playerName: "Folarin Balogun", teamName: "AS Monaco" },
  { id: 14, playerName: "Soungoutou Magassa", teamName: "AS Monaco", isRookie: true },
  { id: 15, playerName: "Denis Zakaria", teamName: "AS Monaco" },
  { id: 16, playerName: "Grejohn Kyei", teamName: "Clermont Foot 63", isRookie: true },
  { id: 17, playerName: "Muhammed Cham", teamName: "Clermont Foot 63" },
  { id: 18, playerName: "Jim Allevinah", teamName: "Clermont Foot 63" },
  { id: 19, playerName: "Andy Pelmard", teamName: "Clermont Foot 63", isRookie: true },
  { id: 20, playerName: "Aïman Maurer", teamName: "Clermont Foot 63", isRookie: true },
  { id: 21, playerName: "Maxime Gonalons", teamName: "Clermont Foot 63" },
  { id: 22, playerName: "Neto Borges", teamName: "Clermont Foot 63", isRookie: true },
  { id: 23, playerName: "Alidu Seidu", teamName: "Clermont Foot 63" },
  { id: 24, playerName: "Bamba Dieng", teamName: "FC Lorient" },
  { id: 25, playerName: "Romain Faivre", teamName: "FC Lorient" },
  { id: 26, playerName: "Jean-Victor Makengo", teamName: "FC Lorient" },
  { id: 27, playerName: "Laurent Abergel", teamName: "FC Lorient" },
  { id: 28, playerName: "Théo Le Bris", teamName: "FC Lorient", isRookie: true },
  { id: 29, playerName: "Julien Ponceau", teamName: "FC Lorient", isRookie: true },
  { id: 30, playerName: "Montassar Talbi", teamName: "FC Lorient" },
  { id: 31, playerName: "Siriné Doucouré", teamName: "FC Lorient", isRookie: true },
  { id: 32, playerName: "Cheikh Sabaly", teamName: "FC Metz", isRookie: true },
  { id: 33, playerName: "Fali Candé", teamName: "FC Metz", isRookie: true },
  { id: 34, playerName: "Lamine Camara", teamName: "FC Metz", isRookie: true },
  { id: 35, playerName: "Malick Mbaye", teamName: "FC Metz", isRookie: true },
  { id: 36, playerName: "Kévin N'Doram", teamName: "FC Metz", isRookie: true },
  { id: 37, playerName: "Danley Jean Jacques", teamName: "FC Metz", isRookie: true },
  { id: 38, playerName: "Kévin Van Den Kerkhof", teamName: "FC Metz", isRookie: true },
  { id: 39, playerName: "Alexandre Oukidja", teamName: "FC Metz", isRookie: true },
  { id: 40, playerName: "Alban Lafont", teamName: "FC Nantes" },
  { id: 41, playerName: "Mostafa Mohamed", teamName: "FC Nantes" },
  { id: 42, playerName: "Moses Simon", teamName: "FC Nantes" },
  { id: 43, playerName: "Adson", teamName: "FC Nantes", isRookie: true },
  { id: 44, playerName: "Quentin Merlin", teamName: "FC Nantes" },
  { id: 45, playerName: "Douglas Augusto", teamName: "FC Nantes", isRookie: true },
  { id: 46, playerName: "Pedro Chirivella", teamName: "FC Nantes" },
  { id: 47, playerName: "Marquinos", teamName: "FC Nantes" },
  { id: 48, playerName: "Nabil Alioui", teamName: "Havre AC" },
  { id: 49, playerName: "Yassine Kechta", teamName: "Havre AC", isRookie: true },
  { id: 50, playerName: "Arthur Desmas", teamName: "Havre AC", isRookie: true },
  { id: 51, playerName: "Daler Kuzyaev", teamName: "Havre AC" },
  { id: 52, playerName: "Rassoul Ndiaye", teamName: "Havre AC", isRookie: true },
  { id: 53, playerName: "Samuel Grandsir", teamName: "Havre AC", isRookie: true },
  { id: 54, playerName: "Arouna Sangante", teamName: "Havre AC", isRookie: true },
  { id: 55, playerName: "Christopher Opéri", teamName: "Havre AC", isRookie: true },
  { id: 56, playerName: "Lucas Chevalier", teamName: "LOSC Lille" },
  { id: 57, playerName: "Jonathan David", teamName: "LOSC Lille" },
  { id: 58, playerName: "Alan Virginius", teamName: "LOSC Lille", isRookie: true },
  { id: 59, playerName: "Adam Ounas", teamName: "LOSC Lille" },
  { id: 60, playerName: "Rémy Cabella", teamName: "LOSC Lille" },
  { id: 61, playerName: "Hákon Arnar Haraldsson", teamName: "LOSC Lille" },
  { id: 62, playerName: "Benjamin André", teamName: "LOSC Lille" },
  { id: 63, playerName: "Angel Gomes", teamName: "LOSC Lille" },
  { id: 64, playerName: "Leny Yoro", teamName: "LOSC Lille", isRookie: true },
  { id: 65, playerName: "Tiago Santos", teamName: "LOSC Lille", isRookie: true },
  { id: 66, playerName: "Alexsandro", teamName: "LOSC Lille", isRookie: true },
  { id: 67, playerName: "Bafodé Diakité", teamName: "LOSC Lille", isRookie: true },
  { id: 68, playerName: "Yusuf Yazici", teamName: "LOSC Lille" },
  { id: 69, playerName: "Edon Zhegrova", teamName: "LOSC Lille" },
  { id: 70, playerName: "Benjamin Lecomte", teamName: "Montpellier Hérault SC" },
  { id: 71, playerName: "Akor Adams", teamName: "Montpellier Hérault SC", isRookie: true },
  { id: 72, playerName: "Mousa Al-Tamari", teamName: "Montpellier Hérault SC", isRookie: true },
  { id: 73, playerName: "Téji Savanier", teamName: "Montpellier Hérault SC" },
  { id: 74, playerName: "Wahbi Khazri", teamName: "Montpellier Hérault SC" },
  { id: 75, playerName: "Jordan Ferri", teamName: "Montpellier Hérault SC" },
  { id: 76, playerName: "Joris Chotard", teamName: "Montpellier Hérault SC" },
  { id: 77, playerName: "Falaye Sacko", teamName: "Montpellier Hérault SC", isRookie: true },
  { id: 78, playerName: "Khalil Fayad", teamName: "Montpellier Hérault SC", isRookie: true },
  { id: 79, playerName: "Kiki Kouyaté", teamName: "Montpellier Hérault SC", isRookie: true },
  { id: 80, playerName: "Arnaud Nordin", teamName: "Montpellier Hérault SC", isRookie: true },
  { id: 81, playerName: "Dante", teamName: "OGC Nice" },
  { id: 82, playerName: "Terem Moffi", teamName: "OGC Nice" },
  { id: 83, playerName: "Gaëtan Laborde", teamName: "OGC Nice" },
  { id: 84, playerName: "Badredine Bouanani", teamName: "OGC Nice", isRookie: true },
  { id: 85, playerName: "Youssouf Ndayishimiye", teamName: "OGC Nice", isRookie: true },
  { id: 86, playerName: "Khéphren Thuram", teamName: "OGC Nice" },
  { id: 87, playerName: "Morgan Sanson", teamName: "OGC Nice" },
  { id: 88, playerName: "Youcef Atal", teamName: "OGC Nice", isRookie: true },
  { id: 89, playerName: "Jean-Clair Todibo", teamName: "OGC Nice" },
  { id: 90, playerName: "Marcin Bułka", teamName: "OGC Nice" },
  { id: 91, playerName: "Melvin Bard", teamName: "OGC Nice" },
  { id: 92, playerName: "Evann Guessand", teamName: "OGC Nice" },
  { id: 93, playerName: "Pablo Rosario", teamName: "OGC Nice" },
  { id: 94, playerName: "Sofiane Diop", teamName: "OGC Nice" },
  { id: 95, playerName: "Pau López", teamName: "Olympique de Marseille" },
  { id: 96, playerName: "Vitinha", teamName: "Olympique de Marseille", isRookie: true },
  { id: 97, playerName: "Ismaïla Sarr", teamName: "Olympique de Marseille" },
  { id: 98, playerName: "François Mughe", teamName: "Olympique de Marseille", isRookie: true },
  { id: 99, playerName: "Geoffrey Kondogbia", teamName: "Olympique de Marseille" },
  { id: 100, playerName: "Valentin Rongier", teamName: "Olympique de Marseille" },
  { id: 101, playerName: "Azzedine Ounahi", teamName: "Olympique de Marseille" },
  { id: 102, playerName: "Jonathan Clauss", teamName: "Olympique de Marseille" },
  { id: 103, playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille" },
  { id: 104, playerName: "Chancel Mbemba", teamName: "Olympique de Marseille" },
  { id: 105, playerName: "Renan Lodi", teamName: "Olympique de Marseille" },
  { id: 106, playerName: "Iliman Ndiaye", teamName: "Olympique de Marseille", isRookie: true },
  { id: 107, playerName: "Jordan Veretout", teamName: "Olympique de Marseille" },
  { id: 108, playerName: "Amine Harit", teamName: "Olympique de Marseille" },
  { id: 109, playerName: "Anthony Lopes", teamName: "Olympique Lyonnais" },
  { id: 110, playerName: "Alexandre Lacazette", teamName: "Olympique Lyonnais" },
  { id: 111, playerName: "Jeffinho", teamName: "Olympique Lyonnais", isRookie: true },
  { id: 112, playerName: "Maxence Caqueret", teamName: "Olympique Lyonnais" },
  { id: 113, playerName: "Rayan Cherki", teamName: "Olympique Lyonnais" },
  { id: 114, playerName: "Corentin Tolisso", teamName: "Olympique Lyonnais" },
  { id: 115, playerName: "Johann Lepenant", teamName: "Olympique Lyonnais" },
  { id: 116, playerName: "Saël Kumbedi", teamName: "Olympique Lyonnais", isRookie: true },
  { id: 117, playerName: "Sinaly Diomandé", teamName: "Olympique Lyonnais", isRookie: true },
  { id: 118, playerName: "Duje Ćaleta-Car", teamName: "Olympique Lyonnais" },
  { id: 119, playerName: "Nicolás Tagliafico", teamName: "Olympique Lyonnais" },
  { id: 120, playerName: "Ainsley Maitland-Niles", teamName: "Olympique Lyonnais" },
  { id: 121, playerName: "Skelly Alvero", teamName: "Olympique Lyonnais", isRookie: true },
  { id: 122, playerName: "Ernest Nuamah", teamName: "Olympique Lyonnais", isRookie: true },
  { id: 123, playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain" },
  { id: 124, playerName: "Gonçalo Ramos", teamName: "Paris Saint-Germain" },
  { id: 125, playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain" },
  { id: 126, playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain" },
  { id: 127, playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain" },
  { id: 128, playerName: "Manuel Ugarte", teamName: "Paris Saint-Germain" },
  { id: 129, playerName: "Vitinha", teamName: "Paris Saint-Germain" },
  { id: 130, playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain" },
  { id: 131, playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain" },
  { id: 132, playerName: "Kang-in Lee", teamName: "Paris Saint-Germain" },
  { id: 133, playerName: "Lucas Hernández", teamName: "Paris Saint-Germain" },
  { id: 134, playerName: "Bradley Barcola", teamName: "Paris Saint-Germain", isRookie: true },
  { id: 135, playerName: "Marquinhos", teamName: "Paris Saint-Germain" },
  { id: 136, playerName: "Marco Asensio", teamName: "Paris Saint-Germain" },
  { id: 137, playerName: "Fabián Ruiz", teamName: "Paris Saint-Germain" },
  { id: 138, playerName: "Brice Samba", teamName: "RC Lens" },
  { id: 139, playerName: "Elye Wahi", teamName: "RC Lens" },
  { id: 140, playerName: "Florian Sotoca", teamName: "RC Lens" },
  { id: 141, playerName: "Angelo Fulgini", teamName: "RC Lens", isRookie: true },
  { id: 142, playerName: "Przemysław Frankowski", teamName: "RC Lens" },
  { id: 143, playerName: "Andy Diouf", teamName: "RC Lens", isRookie: true },
  { id: 144, playerName: "Salis Abdul Samed", teamName: "RC Lens" },
  { id: 145, playerName: "Deiver Machado", teamName: "RC Lens", isRookie: true },
  { id: 146, playerName: "Facundo Medina", teamName: "RC Lens" },
  { id: 147, playerName: "David Pereira da Costa", teamName: "RC Lens", isRookie: true },
  { id: 148, playerName: "Óscar Cortés", teamName: "RC Lens", isRookie: true },
  { id: 149, playerName: "Habib Diarra", teamName: "RC Strasbourg Alsace" },
  { id: 150, playerName: "Emanuel Emegha", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 151, playerName: "Ângelo", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 152, playerName: "Lebo Mothiba", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 153, playerName: "Matz Sels", teamName: "RC Strasbourg Alsace" },
  { id: 154, playerName: "Frédéric Guilbert", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 155, playerName: "Jessy Deminguet", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 156, playerName: "Dilane Bakwa", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 157, playerName: "Ismaël Doukouré", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 158, playerName: "Gerzino Nyamsi", teamName: "RC Strasbourg Alsace" },
  { id: 159, playerName: "Abakar Sylla", teamName: "RC Strasbourg Alsace", isRookie: true },
  { id: 160, playerName: "Brendan Chardonnet", teamName: "Stade Brestois 29" },
  { id: 161, playerName: "Martín Satriano", teamName: "Stade Brestois 29" },
  { id: 162, playerName: "Billal Brahimi", teamName: "Stade Brestois 29", isRookie: true },
  { id: 163, playerName: "Jérémy Le Douaron", teamName: "Stade Brestois 29" },
  { id: 164, playerName: "Romain Del Castillo", teamName: "Stade Brestois 29" },
  { id: 165, playerName: "Pierre Lees-Melou", teamName: "Stade Brestois 29" },
  { id: 166, playerName: "Marco Bizot", teamName: "Stade Brestois 29" },
  { id: 167, playerName: "Lilian Brassier", teamName: "Stade Brestois 29" },
  { id: 168, playerName: "Josh Wilson-Esbrand", teamName: "Stade de Reims", isRookie: true },
  { id: 169, playerName: "Oumar Diakité", teamName: "Stade de Reims", isRookie: true },
  { id: 170, playerName: "Junya Ito", teamName: "Stade de Reims" },
  { id: 171, playerName: "Marshall Munetsi", teamName: "Stade de Reims" },
  { id: 172, playerName: "Valentin Atangana Edoa", teamName: "Stade de Reims", isRookie: true },
  { id: 173, playerName: "Amir Richardson", teamName: "Stade de Reims", isRookie: true },
  { id: 174, playerName: "Azor Matusiwa", teamName: "Stade de Reims" },
  { id: 175, playerName: "Mohamed Daramy", teamName: "Stade de Reims" },
  { id: 176, playerName: "Keito Nakamura", teamName: "Stade de Reims", isRookie: true },
  { id: 177, playerName: "Yunis Abdelhamid", teamName: "Stade de Reims", isRookie: true },
  { id: 178, playerName: "Yehvann Diouf", teamName: "Stade de Reims", isRookie: true },
  { id: 179, playerName: "Arthur Theate", teamName: "Stade Rennais FC" },
  { id: 180, playerName: "Arnaud Kalimuendo", teamName: "Stade Rennais FC" },
  { id: 181, playerName: "Ibrahim Salah", teamName: "Stade Rennais FC", isRookie: true },
  { id: 182, playerName: "Amine Gouiri", teamName: "Stade Rennais FC" },
  { id: 183, playerName: "Benjamin Bourigeaud", teamName: "Stade Rennais FC" },
  { id: 184, playerName: "Désiré Doué", teamName: "Stade Rennais FC" },
  { id: 185, playerName: "Enzo Le Fée", teamName: "Stade Rennais FC" },
  { id: 186, playerName: "Lorenz Assignon", teamName: "Stade Rennais FC", isRookie: true },
  { id: 187, playerName: "Steve Mandanda", teamName: "Stade Rennais FC" },
  { id: 188, playerName: "Warmed Omari", teamName: "Stade Rennais FC", isRookie: true },
  { id: 189, playerName: "Adrien Truffert", teamName: "Stade Rennais FC" },
  { id: 190, playerName: "Fabian Rieder", teamName: "Stade Rennais FC", isRookie: true },
  { id: 191, playerName: "Ludovic Blas", teamName: "Stade Rennais FC" },
  { id: 192, playerName: "Jeanuël Belocian", teamName: "Stade Rennais FC", isRookie: true },
  { id: 193, playerName: "Thijs Dallinga", teamName: "Toulouse FC" },
  { id: 194, playerName: "Zakaria Aboukhlal", teamName: "Toulouse FC" },
  { id: 195, playerName: "Vincent Sierro", teamName: "Toulouse FC", isRookie: true },
  { id: 196, playerName: "Gabriel Suazo", teamName: "Toulouse FC", isRookie: true },
  { id: 197, playerName: "Cristian Cásseres Jr.", teamName: "Toulouse FC" },
  { id: 198, playerName: "Aron Dønnum", teamName: "Toulouse FC", isRookie: true },
  { id: 199, playerName: "Guillaume Restes", teamName: "Toulouse FC", isRookie: true },
  { id: 200, playerName: "Rasmus Nicolaisen", teamName: "Toulouse FC", isRookie: true }
];

// Bases non numérotées - 2 variantes par carte de base (Laser et Swirl)
const baseVariants = [
  { type: "Parallel Laser", numbering: null, rarity: "Base" },
  { type: "Parallel Swirl", numbering: null, rarity: "Base" }
];

// Bases numérotées - 9 variantes par carte de base
const numberedVariants = [
  { type: "Parallel Numbered", numbering: "1/50", rarity: "Rare", subType: null },
  { type: "Parallel Numbered", numbering: "1/35", rarity: "Rare", subType: null },
  { type: "Parallel Numbered", numbering: "1/30", rarity: "Rare", subType: null },
  { type: "Parallel Numbered", numbering: "1/25", rarity: "Ultra Rare", subType: null },
  { type: "Parallel Numbered", numbering: "1/20", rarity: "Ultra Rare", subType: null },
  { type: "Parallel Numbered", numbering: "1/15", rarity: "Ultra Rare", subType: "swirl" },
  { type: "Parallel Numbered", numbering: "1/15", rarity: "Ultra Rare", subType: "laser" },
  { type: "Parallel Numbered", numbering: "1/10", rarity: "Super Rare", subType: null },
  { type: "Parallel Numbered", numbering: "1/5", rarity: "Super Rare", subType: null }
];

const insertBreakthrough = [
  { playerName: "Myron Boadu", teamName: "AS Monaco" },
  { playerName: "Bilal Boutobba", teamName: "Clermont Foot 63", isRookie: true },
  { playerName: "Formose Mendy", teamName: "FC Lorient" },
  { playerName: "Benjamin Tetteh", teamName: "FC Metz", isRookie: true },
  { playerName: "Marquinos", teamName: "FC Nantes" },
  { playerName: "Nabil Alioui", teamName: "Havre AC", isRookie: true },
  { playerName: "Hákon Arnar Haraldsson", teamName: "LOSC Lille" },
  { playerName: "Joris Chotard", teamName: "Montpellier Hérault SC" },
  { playerName: "Marcin Bułka", teamName: "OGC Nice" },
  { playerName: "Ismaïla Sarr", teamName: "Olympique de Marseille" },
  { playerName: "Johann Lepenant", teamName: "Olympique Lyonnais" },
  { playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain" },
  { playerName: "Morgan Guilavogui", teamName: "RC Lens", isRookie: true },
  { playerName: "Dilane Bakwa", teamName: "RC Strasbourg Alsace", isRookie: true },
  { playerName: "Mahdi Camara", teamName: "Stade Brestois 29", isRookie: true },
  { playerName: "Reda Khadra", teamName: "Stade de Reims", isRookie: true },
  { playerName: "Arnaud Kalimuendo", teamName: "Stade Rennais FC" },
  { playerName: "Thijs Dallinga", teamName: "Toulouse FC" },
  { playerName: "Habib Diarra", teamName: "RC Strasbourg Alsace" },
  { playerName: "Maxence Caqueret", teamName: "Olympique Lyonnais" }
];

const insertHotRookies = [
  { playerName: "Eliesse Ben Seghir", teamName: "AS Monaco", isRookie: true },
  { playerName: "Bafodé Diakité", teamName: "LOSC Lille", isRookie: true },
  { playerName: "Joel Mvuka", teamName: "FC Lorient", isRookie: true },
  { playerName: "Khalil Fayad", teamName: "Montpellier Hérault SC", isRookie: true },
  { playerName: "Yehvann Diouf", teamName: "Stade de Reims", isRookie: true },
  { playerName: "Badredine Bouanani", teamName: "LOSC Lille", isRookie: true },
  { playerName: "Leny Yoro", teamName: "LOSC Lille", isRookie: true },
  { playerName: "Arouna Sangante", teamName: "Havre AC", isRookie: true },
  { playerName: "Ethan Mbappé", teamName: "Paris Saint-Germain", isRookie: true },
  { playerName: "Adson", teamName: "FC Nantes", isRookie: true },
  { playerName: "Vitinha", teamName: "Olympique de Marseille", isRookie: true },
  { playerName: "Iliman Ndiaye", teamName: "Olympique de Marseille", isRookie: true },
  { playerName: "Bradley Barcola", teamName: "Paris Saint-Germain", isRookie: true },
  { playerName: "Saël Kumbedi", teamName: "Olympique Lyonnais", isRookie: true },
  { playerName: "Emanuel Emegha", teamName: "RC Strasbourg Alsace", isRookie: true },
  { playerName: "Ângelo", teamName: "RC Strasbourg Alsace", isRookie: true },
  { playerName: "Andy Diouf", teamName: "RC Lens", isRookie: true },
  { playerName: "Óscar Cortés", teamName: "RC Lens", isRookie: true },
  { playerName: "Jeanuël Belocian", teamName: "Stade Rennais FC", isRookie: true },
  { playerName: "Eli Junior Kroupi", teamName: "FC Lorient", isRookie: true }
];

// Hits avec variantes (Base, /15, /10)
const insertKeepers = [
  { playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain" },
  { playerName: "Brice Samba", teamName: "RC Lens" },
  { playerName: "Marco Bizot", teamName: "Stade Brestois 29" },
  { playerName: "Alban Lafont", teamName: "FC Nantes" },
  { playerName: "Lucas Chevalier", teamName: "LOSC Lille", isRookie: true },
  { playerName: "Anthony Lopes", teamName: "Olympique Lyonnais" },
  { playerName: "Steve Mandanda", teamName: "Stade Rennais FC" },
  { playerName: "Philipp Köhn", teamName: "AS Monaco" },
  { playerName: "Guillaume Restes", teamName: "Toulouse FC", isRookie: true },
  { playerName: "Mory Diaw", teamName: "Clermont Foot 63" }
];

const insertScoreTeam = [
  { playerName: "Angel Gomes", teamName: "LOSC Lille" },
  { playerName: "Matz Sels", teamName: "RC Strasbourg Alsace" },
  { playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain" },
  { playerName: "Matthieu Udol", teamName: "FC Metz" },
  { playerName: "Quentin Merlin", teamName: "FC Nantes" },
  { playerName: "Corentin Tolisso", teamName: "Olympique Lyonnais" },
  { playerName: "Jean-Clair Todibo", teamName: "OGC Nice" },
  { playerName: "Pau López", teamName: "Olympique de Marseille" },
  { playerName: "Nemanja Matić", teamName: "Stade Rennais FC" },
  { playerName: "Elye Wahi", teamName: "RC Lens" },
  { playerName: "Nicolás Tagliafico", teamName: "Olympique Lyonnais" },
  { playerName: "Folarin Balogun", teamName: "AS Monaco" },
  { playerName: "Montassar Talbi", teamName: "FC Lorient" },
  { playerName: "Mohamed Daramy", teamName: "Stade de Reims" },
  { playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain" },
  { playerName: "Daler Kuzyaev", teamName: "Havre AC" },
  { playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille" },
  { playerName: "Mostafa Mohamed", teamName: "FC Nantes" },
  { playerName: "Takumi Minamino", teamName: "AS Monaco" },
  { playerName: "Terem Moffi", teamName: "OGC Nice" }
];

const insertPureClass = [
  { playerName: "Jonathan David", teamName: "LOSC Lille" },
  { playerName: "Dante", teamName: "OGC Nice" },
  { playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain" },
  { playerName: "Wissam Ben Yedder", teamName: "AS Monaco" },
  { playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain" },
  { playerName: "Jordan Veretout", teamName: "Olympique de Marseille" },
  { playerName: "Khéphren Thuram", teamName: "OGC Nice" },
  { playerName: "Alexandre Lacazette", teamName: "Olympique Lyonnais" },
  { playerName: "Thomas Foket", teamName: "Stade de Reims" },
  { playerName: "Moussa Sissoko", teamName: "FC Nantes" },
  { playerName: "Kevin Danso", teamName: "RC Lens" },
  { playerName: "Yvon Mvogo", teamName: "FC Lorient" },
  { playerName: "Jonathan Clauss", teamName: "Olympique de Marseille" },
  { playerName: "Kévin Gameiro", teamName: "RC Strasbourg Alsace" },
  { playerName: "Youssouf Fofana", teamName: "AS Monaco" },
  { playerName: "Laurent Abergel", teamName: "FC Lorient" },
  { playerName: "Rayan Cherki", teamName: "Olympique Lyonnais" },
  { playerName: "Arthur Theate", teamName: "Stade Rennais FC" },
  { playerName: "Amine Gouiri", teamName: "Stade Rennais FC" },
  { playerName: "Rémy Cabella", teamName: "LOSC Lille" }
];

// Inserts spéciaux sans variantes (base uniquement)
const insertPennants = [
  { playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain" },
  { playerName: "Habib Diarra", teamName: "RC Strasbourg Alsace" },
  { playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain" },
  { playerName: "Eliesse Ben Seghir", teamName: "AS Monaco" },
  { playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain" },
  { playerName: "Terem Moffi", teamName: "OGC Nice" },
  { playerName: "Gonçalo Ramos", teamName: "Paris Saint-Germain" },
  { playerName: "Fabián Ruiz", teamName: "Paris Saint-Germain" },
  { playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain" },
  { playerName: "Jonathan David", teamName: "LOSC Lille" },
  { playerName: "Ângelo", teamName: "RC Strasbourg Alsace" },
  { playerName: "Folarin Balogun", teamName: "AS Monaco" },
  { playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain" },
  { playerName: "Marco Asensio", teamName: "Paris Saint-Germain" },
  { playerName: "Thijs Dallinga", teamName: "Toulouse FC" },
  { playerName: "Alexandre Lacazette", teamName: "Olympique Lyonnais" },
  { playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain" },
  { playerName: "David Trezeguet", teamName: "AS Monaco" },
  { playerName: "Edinson Cavani", teamName: "Paris Saint-Germain" },
  { playerName: "William Saliba", teamName: "OGC Nice" }
];

const insertNextUp = [
  { playerName: "Eliesse Ben Seghir", teamName: "AS Monaco", isRookie: true },
  { playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain" },
  { playerName: "Martín Satriano", teamName: "Stade Brestois 29" },
  { playerName: "Bafodé Diakité", teamName: "LOSC Lille" },
  { playerName: "Arnaud Kalimuendo", teamName: "Stade Rennais FC" },
  { playerName: "Marquinos", teamName: "FC Nantes" },
  { playerName: "Vitinha", teamName: "Olympique de Marseille" },
  { playerName: "Lucas Chevalier", teamName: "LOSC Lille", isRookie: true },
  { playerName: "Ethan Mbappé", teamName: "Paris Saint-Germain", isRookie: true },
  { playerName: "Rayan Cherki", teamName: "Olympique Lyonnais" },
  { playerName: "Elye Wahi", teamName: "RC Lens" },
  { playerName: "Mohamed Daramy", teamName: "Stade de Reims" },
  { playerName: "Bradley Barcola", teamName: "Paris Saint-Germain", isRookie: true },
  { playerName: "Saël Kumbedi", teamName: "Olympique Lyonnais" },
  { playerName: "Adson", teamName: "FC Nantes", isRookie: true },
  { playerName: "Ângelo", teamName: "RC Strasbourg Alsace", isRookie: true },
  { playerName: "Désiré Doué", teamName: "Stade Rennais FC" },
  { playerName: "Khéphren Thuram", teamName: "OGC Nice" },
  { playerName: "Thijs Dallinga", teamName: "Toulouse FC" },
  { playerName: "Leny Yoro", teamName: "LOSC Lille" }
];

const insertIntergalactic = [
  { playerName: "Folarin Balogun", teamName: "AS Monaco" },
  { playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain" },
  { playerName: "Marquinos", teamName: "FC Nantes" },
  { playerName: "Elye Wahi", teamName: "RC Lens" },
  { playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain" },
  { playerName: "Khéphren Thuram", teamName: "OGC Nice" },
  { playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain" },
  { playerName: "Rayan Cherki", teamName: "Olympique Lyonnais" },
  { playerName: "Mohamed Daramy", teamName: "Stade de Reims" },
  { playerName: "Leny Yoro", teamName: "LOSC Lille", isRookie: true },
  { playerName: "Jonathan David", teamName: "LOSC Lille" },
  { playerName: "Wissam Ben Yedder", teamName: "AS Monaco" },
  { playerName: "Takumi Minamino", teamName: "AS Monaco" },
  { playerName: "Amine Gouiri", teamName: "Stade Rennais FC" },
  { playerName: "Gonçalo Ramos", teamName: "Paris Saint-Germain" },
  { playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain" },
  { playerName: "Bradley Barcola", teamName: "Paris Saint-Germain", isRookie: true },
  { playerName: "David Beckham", teamName: "Paris Saint-Germain" },
  { playerName: "William Saliba", teamName: "Olympique de Marseille" },
  { playerName: "Eric Cantona", teamName: "Olympique de Marseille" }
];

// Cartes d'autographes EXACTES selon la checklist Excel Score Ligue 1 23/24
const autographCards: AutoCard[] = [
  // Les variantes selon la checklist: /199, /99, /49, /25, /10, /5, /3, /2
  { id: 1, playerName: "Dragan Stojković", teamName: "Olympique de Marseille", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 2, playerName: "Fabrizio Ravanelli", teamName: "Olympique de Marseille", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 3, playerName: "Leonardo", teamName: "Paris Saint-Germain", numberings: ["/199"] },
  { id: 4, playerName: "Nabil Fekir", teamName: "Olympique Lyonnais", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 5, playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 6, playerName: "Joe Cole", teamName: "LOSC Lille", numberings: ["/199"] },
  { id: 7, playerName: "Patrice Evra", teamName: "AS Monaco", numberings: ["/199"] },
  { id: 8, playerName: "Takumi Minamino", teamName: "AS Monaco", numberings: ["/199"] },
  { id: 9, playerName: "Anthony Martial", teamName: "AS Monaco", numberings: ["/199"] },
  { id: 10, playerName: "Marco Asensio", teamName: "Paris Saint-Germain", numberings: ["/199"] },
  { id: 11, playerName: "Claude Makélélé", teamName: "FC Nantes", numberings: ["/199"] },
  { id: 12, playerName: "Rafael Márquez", teamName: "AS Monaco", numberings: ["/199"] },
  { id: 13, playerName: "Chris Waddle", teamName: "Olympique de Marseille", numberings: ["/199"] },
  { id: 14, playerName: "John Arne Riise", teamName: "AS Monaco", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 15, playerName: "Diego Carlos", teamName: "FC Nantes", numberings: ["/199"] },
  { id: 16, playerName: "Denis Zakaria", teamName: "AS Monaco", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 17, playerName: "David Trezeguet", teamName: "AS Monaco", numberings: ["/199"] },
  { id: 18, playerName: "Eric Cantona", teamName: "Olympique de Marseille", numberings: ["/199"] },
  { id: 19, playerName: "Alexis Sánchez", teamName: "Olympique de Marseille", numberings: ["/199", "/99", "/49", "/25", "/10", "/5", "/3", "/2"] },
  { id: 7, playerName: "Patrice Evra", teamName: "AS Monaco", numberings: ["/199", "/1"] },
  { id: 8, playerName: "Takumi Minamino", teamName: "AS Monaco", numberings: ["/25", "/1"] },
  { id: 9, playerName: "Anthony Martial", teamName: "AS Monaco", numberings: ["/1"] },
  { id: 10, playerName: "Marco Asensio", teamName: "Paris Saint-Germain", numberings: ["/1"] },
  { id: 11, playerName: "Claude Makélélé", teamName: "FC Nantes", numberings: ["/99", "/1"] },
  { id: 12, playerName: "Rafael Márquez", teamName: "AS Monaco", numberings: ["/99", "/1"] },
  { id: 13, playerName: "Eric Cantona", teamName: "Olympique de Marseille", numberings: ["/99", "/1"] },
  { id: 14, playerName: "David Beckham", teamName: "Paris Saint-Germain", numberings: ["/99", "/1"] },
  { id: 15, playerName: "William Saliba", teamName: "Olympique de Marseille", numberings: ["/99", "/1"] },
  { id: 16, playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 17, playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 18, playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 19, playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 20, playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 21, playerName: "Vitinha", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 22, playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 23, playerName: "Folarin Balogun", teamName: "AS Monaco", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 24, playerName: "Wissam Ben Yedder", teamName: "AS Monaco", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 25, playerName: "Takumi Minamino", teamName: "AS Monaco", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 26, playerName: "Jonathan David", teamName: "LOSC Lille", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 27, playerName: "Lucas Chevalier", teamName: "LOSC Lille", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 28, playerName: "Angel Gomes", teamName: "LOSC Lille", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 29, playerName: "Rémy Cabella", teamName: "LOSC Lille", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 30, playerName: "Alexandre Lacazette", teamName: "Olympique Lyonnais", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 31, playerName: "Rayan Cherki", teamName: "Olympique Lyonnais", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 32, playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 33, playerName: "Téji Savanier", teamName: "Montpellier Hérault SC", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 34, playerName: "Khéphren Thuram", teamName: "OGC Nice", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 35, playerName: "Elye Wahi", teamName: "RC Lens", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 36, playerName: "Habib Diarra", teamName: "RC Strasbourg Alsace", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 37, playerName: "Amine Gouiri", teamName: "Stade Rennais FC", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] },
  { id: 38, playerName: "Thijs Dallinga", teamName: "Toulouse FC", numberings: ["/199", "/25", "/10", "/3", "/2", "/1"] }
];

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Check if collection exists
    const existingCollection = await db.select().from(collections).where(eq(collections.id, 1)).limit(1);
    
    if (existingCollection.length === 0) {
      console.log("❌ Collection with ID 1 not found. Please create a collection first.");
      return;
    }

    // Clear existing cards for this collection
    console.log("🗑️ Clearing existing cards...");
    await db.delete(cards).where(eq(cards.collectionId, 1));

    const cardsToInsert = [];
    let cardId = 1;

    // 1. Create base cards (200 cards normales + 400 variantes = 600 total)
    console.log("📦 Creating base cards...");
    for (const baseCard of baseCards) {
      // Carte de base normale
      cardsToInsert.push({
        id: cardId++,
        collectionId: 1,
        reference: baseCard.id.toString().padStart(3, '0'),
        playerName: baseCard.playerName,
        teamName: baseCard.teamName,
        cardType: "Base",
        cardSubType: baseCard.isRookie ? "Rookie" : null,
        rarity: "Base",
        numbering: null,
        season: "23/24",
        isOwned: false,
        imageUrl: null
      });

      // 2 variantes par carte de base (Laser et Swirl)
      for (const variant of baseVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `${baseCard.id.toString().padStart(3, '0')}-${variant.type.includes('Laser') ? 'L' : 'S'}`,
          playerName: baseCard.playerName,
          teamName: baseCard.teamName,
          cardType: variant.type,
          cardSubType: baseCard.isRookie ? "Rookie" : null,
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // 2. Create numbered variants - 9 variants per base card
    console.log("🔢 Creating numbered variants...");
    for (const baseCard of baseCards) {
      for (const variant of numberedVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `${baseCard.id.toString().padStart(3, '0')}-${variant.numbering?.replace('1/', '')}${variant.subType ? `-${variant.subType}` : ''}`,
          playerName: baseCard.playerName,
          teamName: baseCard.teamName,
          cardType: variant.type,
          cardSubType: variant.subType || (baseCard.isRookie ? "Rookie" : null),
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // 3. Create Insert cards
    console.log("🎯 Creating Insert cards...");
    
    // Hit variants (Base, /15, /10)
    const hitVariants = [
      { numbering: null, rarity: "Hit" },
      { numbering: "1/15", rarity: "Super Hit" },
      { numbering: "1/10", rarity: "Ultra Hit" }
    ];
    
    // Breakthrough with variants
    for (let i = 0; i < insertBreakthrough.length; i++) {
      const card = insertBreakthrough[i];
      for (const variant of hitVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `BT-${(i + 1).toString().padStart(2, '0')}${variant.numbering ? `-${variant.numbering.replace('1/', '')}` : ''}`,
          playerName: card.playerName,
          teamName: card.teamName,
          cardType: "Insert Breakthrough",
          cardSubType: card.isRookie ? "Rookie" : null,
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // Hot Rookies with variants
    for (let i = 0; i < insertHotRookies.length; i++) {
      const card = insertHotRookies[i];
      for (const variant of hitVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `HR-${(i + 1).toString().padStart(2, '0')}${variant.numbering ? `-${variant.numbering.replace('1/', '')}` : ''}`,
          playerName: card.playerName,
          teamName: card.teamName,
          cardType: "Insert Hot Rookies",
          cardSubType: "Rookie",
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // Keepers with variants
    for (let i = 0; i < insertKeepers.length; i++) {
      const card = insertKeepers[i];
      for (const variant of hitVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `KEP-${(i + 1).toString().padStart(2, '0')}${variant.numbering ? `-${variant.numbering.replace('1/', '')}` : ''}`,
          playerName: card.playerName,
          teamName: card.teamName,
          cardType: "Insert Keepers",
          cardSubType: null,
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // Score Team with variants
    for (let i = 0; i < insertScoreTeam.length; i++) {
      const card = insertScoreTeam[i];
      for (const variant of hitVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `ST-${(i + 1).toString().padStart(2, '0')}${variant.numbering ? `-${variant.numbering.replace('1/', '')}` : ''}`,
          playerName: card.playerName,
          teamName: card.teamName,
          cardType: "Insert Score Team",
          cardSubType: null,
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // Pure Class with variants
    for (let i = 0; i < insertPureClass.length; i++) {
      const card = insertPureClass[i];
      for (const variant of hitVariants) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `PC-${(i + 1).toString().padStart(2, '0')}${variant.numbering ? `-${variant.numbering.replace('1/', '')}` : ''}`,
          playerName: card.playerName,
          teamName: card.teamName,
          cardType: "Insert Pure Class",
          cardSubType: null,
          rarity: variant.rarity,
          numbering: variant.numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // Special inserts (base versions only)
    // Pennants
    for (let i = 0; i < insertPennants.length; i++) {
      const card = insertPennants[i];
      cardsToInsert.push({
        id: cardId++,
        collectionId: 1,
        reference: `PEN-${(i + 1).toString().padStart(2, '0')}`,
        playerName: card.playerName,
        teamName: card.teamName,
        cardType: "Insert Pennants",
        cardSubType: null,
        rarity: "Ultra Rare",
        numbering: null,
        season: "23/24",
        isOwned: false,
        imageUrl: null
      });
    }

    // Next Up
    for (let i = 0; i < insertNextUp.length; i++) {
      const card = insertNextUp[i];
      cardsToInsert.push({
        id: cardId++,
        collectionId: 1,
        reference: `NU-${(i + 1).toString().padStart(2, '0')}`,
        playerName: card.playerName,
        teamName: card.teamName,
        cardType: "Insert Next Up",
        cardSubType: "Rookie",
        rarity: "Ultra Rare",
        numbering: null,
        season: "23/24",
        isOwned: false,
        imageUrl: null
      });
    }

    // Intergalactic
    for (let i = 0; i < insertIntergalactic.length; i++) {
      const card = insertIntergalactic[i];
      cardsToInsert.push({
        id: cardId++,
        collectionId: 1,
        reference: `IG-${(i + 1).toString().padStart(2, '0')}`,
        playerName: card.playerName,
        teamName: card.teamName,
        cardType: "Insert Intergalactic",
        cardSubType: null,
        rarity: "Legendary",
        numbering: null,
        season: "23/24",
        isOwned: false,
        imageUrl: null
      });
    }

    // 4. Create Autograph cards with player-specific variants (excluding /1)
    console.log("✍️ Creating player-specific autograph variants...");
    for (const autoCard of autographCards) {
      // Each player has their own specific numberings from the file
      for (const numbering of autoCard.numberings) {
        // Skip 1/1 cards (they go to special 1/1 tab)
        if (numbering === "/1") continue;
        
        const getRarityFromNumbering = (num: string) => {
          if (num === "/2" || num === "/3") return "Super Rare";
          if (num === "/10") return "Ultra Rare";
          if (num === "/25" || num === "/49") return "Rare";
          if (num === "/99" || num === "/199") return "Autograph";
          return "Autograph";
        };

        const getVariantType = (num: string) => {
          if (num === "/2") return "Autograph Gold";
          if (num === "/3") return "Autograph Red";
          if (num === "/10") return "Autograph Silver";
          if (num === "/25") return "Autograph Blue";
          if (num === "/49") return "Autograph Green";
          if (num === "/99") return "Autograph Bronze";
          if (num === "/199") return "Autograph Numbered";
          return "Autograph Numbered";
        };

        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `AUTO-${autoCard.id.toString().padStart(2, '0')}-${numbering.replace('/', '')}`,
          playerName: autoCard.playerName,
          teamName: autoCard.teamName,
          cardType: getVariantType(numbering),
          cardSubType: "Numbered",
          rarity: getRarityFromNumbering(numbering),
          numbering: numbering,
          season: "23/24",
          isOwned: false,
          imageUrl: null
        });
      }
    }

    // Insert all cards in batches
    console.log("💾 Inserting cards in batches...");
    const batchSize = 100;
    for (let i = 0; i < cardsToInsert.length; i += batchSize) {
      const batch = cardsToInsert.slice(i, i + batchSize);
      await db.insert(cards).values(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cardsToInsert.length / batchSize)}`);
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Total cards created: ${cardsToInsert.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}