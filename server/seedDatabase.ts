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
  { id: 200, playerName: "Rasmus Nicolaisen", teamName: "Toulouse FC", isRookie: true },
  
  // Additional players to reach 600 base cards (201-600)
  { id: 201, playerName: "Folarin Balogun", teamName: "AS Monaco" },
  { id: 202, playerName: "Krépin Diatta", teamName: "AS Monaco" },
  { id: 203, playerName: "Breel Embolo", teamName: "AS Monaco" },
  { id: 204, playerName: "Axel Disasi", teamName: "AS Monaco" },
  { id: 205, playerName: "Benoît Badiashile", teamName: "AS Monaco" },
  { id: 206, playerName: "Kevin Volland", teamName: "AS Monaco" },
  { id: 207, playerName: "Gelson Martins", teamName: "AS Monaco" },
  { id: 208, playerName: "Aurélien Tchouaméni", teamName: "AS Monaco" },
  { id: 209, playerName: "Sofiane Diop", teamName: "AS Monaco" },
  { id: 210, playerName: "Ismail Jakobs", teamName: "AS Monaco" },
  { id: 211, playerName: "Ruben Aguilar", teamName: "AS Monaco" },
  { id: 212, playerName: "Jean Lucas", teamName: "AS Monaco" },
  { id: 213, playerName: "Myron Boadu", teamName: "AS Monaco" },
  { id: 214, playerName: "Chrislain Matsima", teamName: "AS Monaco" },
  { id: 215, playerName: "Eliot Matazo", teamName: "AS Monaco" },
  { id: 216, playerName: "Felix Lemaréchal", teamName: "AS Monaco" },
  { id: 217, playerName: "Malang Sarr", teamName: "AS Monaco" },
  { id: 218, playerName: "Radosław Majecki", teamName: "AS Monaco" },
  { id: 219, playerName: "Alexander Nübel", teamName: "AS Monaco" },
  { id: 220, playerName: "Thomas Lemar", teamName: "AS Monaco" },
  { id: 221, playerName: "Dimitri Foulquier", teamName: "AS Monaco" },
  { id: 222, playerName: "Strahinja Pavlović", teamName: "AS Monaco" },
  { id: 223, playerName: "Maghnes Akliouche", teamName: "AS Monaco" },
  { id: 224, playerName: "Kassoum Ouattara", teamName: "AS Monaco" },
  { id: 225, playerName: "Eliesse Ben Seghir", teamName: "AS Monaco" },
  { id: 226, playerName: "Luka Elsner", teamName: "Clermont Foot 63" },
  { id: 227, playerName: "Pascal Gastien", teamName: "Clermont Foot 63" },
  { id: 228, playerName: "Mateusz Wieteska", teamName: "Clermont Foot 63" },
  { id: 229, playerName: "Cheick Konate", teamName: "Clermont Foot 63" },
  { id: 230, playerName: "Johan Gastien", teamName: "Clermont Foot 63" },
  { id: 231, playerName: "Elbasan Rashani", teamName: "Clermont Foot 63" },
  { id: 232, playerName: "Komnen Andric", teamName: "Clermont Foot 63" },
  { id: 233, playerName: "Arial Mendy", teamName: "Clermont Foot 63" },
  { id: 234, playerName: "Yohan Roche", teamName: "Clermont Foot 63" },
  { id: 235, playerName: "Habib Keita", teamName: "Clermont Foot 63" },
  { id: 236, playerName: "Saif-Eddine Khaoui", teamName: "Clermont Foot 63" },
  { id: 237, playerName: "Shamar Nicholson", teamName: "Clermont Foot 63" },
  { id: 238, playerName: "Jodel Dossou", teamName: "Clermont Foot 63" },
  { id: 239, playerName: "Lucas Da Cunha", teamName: "Clermont Foot 63" },
  { id: 240, playerName: "Florent Ogier", teamName: "Clermont Foot 63" },
  { id: 241, playerName: "Yohann Magnin", teamName: "Clermont Foot 63" },
  { id: 242, playerName: "Vital N'Simba", teamName: "Clermont Foot 63" },
  { id: 243, playerName: "Arthur Desmas", teamName: "Clermont Foot 63" },
  { id: 244, playerName: "Mehdi Zeffane", teamName: "Clermont Foot 63" },
  { id: 245, playerName: "Bilal Boutobba", teamName: "Clermont Foot 63" },
  { id: 246, playerName: "Maximiliano Caufriez", teamName: "Clermont Foot 63" },
  { id: 247, playerName: "Chrislain Matsima", teamName: "Clermont Foot 63" },
  { id: 248, playerName: "Brandon Baiye", teamName: "Clermont Foot 63" },
  { id: 249, playerName: "Jeremy Jacquet", teamName: "Clermont Foot 63" },
  { id: 250, playerName: "Iyé Cissé", teamName: "FC Lorient" },
  { id: 251, playerName: "Vincent Le Goff", teamName: "FC Lorient" },
  { id: 252, playerName: "Gedeon Kalulu", teamName: "FC Lorient" },
  { id: 253, playerName: "Julien Laporte", teamName: "FC Lorient" },
  { id: 254, playerName: "Igor Silva", teamName: "FC Lorient" },
  { id: 255, playerName: "Bonke Innocent", teamName: "FC Lorient" },
  { id: 256, playerName: "Enzo Le Fée", teamName: "FC Lorient" },
  { id: 257, playerName: "Armand Laurienté", teamName: "FC Lorient" },
  { id: 258, playerName: "Terem Moffi", teamName: "FC Lorient" },
  { id: 259, playerName: "Dango Ouattara", teamName: "FC Lorient" },
  { id: 260, playerName: "Ibrahima Koné", teamName: "FC Lorient" },
  { id: 261, playerName: "Stéphane Diarra", teamName: "FC Lorient" },
  { id: 262, playerName: "Thomas Monconduit", teamName: "FC Lorient" },
  { id: 263, playerName: "Fabien Lemoine", teamName: "FC Lorient" },
  { id: 264, playerName: "Houboulang Mendes", teamName: "FC Lorient" },
  { id: 265, playerName: "Moritz Jenz", teamName: "FC Lorient" },
  { id: 266, playerName: "Matthieu Dreyer", teamName: "FC Lorient" },
  { id: 267, playerName: "Paul Nardi", teamName: "FC Lorient" },
  { id: 268, playerName: "Yvon Mvogo", teamName: "FC Lorient" },
  { id: 269, playerName: "Quentin Boisgard", teamName: "FC Lorient" },
  { id: 270, playerName: "Adrian Grbic", teamName: "FC Lorient" },
  { id: 271, playerName: "Sambou Soumano", teamName: "FC Lorient" },
  { id: 272, playerName: "Théo Le Bris", teamName: "FC Lorient" },
  { id: 273, playerName: "Darline Yongwa", teamName: "FC Lorient" },
  { id: 274, playerName: "Loris Moussiti", teamName: "FC Lorient" },
  { id: 275, playerName: "Kylian Mbappé", teamName: "Paris Saint-Germain" },
  { id: 276, playerName: "Neymar Jr", teamName: "Paris Saint-Germain" },
  { id: 277, playerName: "Lionel Messi", teamName: "Paris Saint-Germain" },
  { id: 278, playerName: "Achraf Hakimi", teamName: "Paris Saint-Germain" },
  { id: 279, playerName: "Marquinhos", teamName: "Paris Saint-Germain" },
  { id: 280, playerName: "Presnel Kimpembe", teamName: "Paris Saint-Germain" },
  { id: 281, playerName: "Marco Verratti", teamName: "Paris Saint-Germain" },
  { id: 282, playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain" },
  { id: 283, playerName: "Sergio Ramos", teamName: "Paris Saint-Germain" },
  { id: 284, playerName: "Vitinha", teamName: "Paris Saint-Germain" },
  { id: 285, playerName: "Fabián Ruiz", teamName: "Paris Saint-Germain" },
  { id: 286, playerName: "Warren Zaïre-Emery", teamName: "Paris Saint-Germain" },
  { id: 287, playerName: "Hugo Ekitike", teamName: "Paris Saint-Germain" },
  { id: 288, playerName: "Randal Kolo Muani", teamName: "Paris Saint-Germain" },
  { id: 289, playerName: "Ousmane Dembélé", teamName: "Paris Saint-Germain" },
  { id: 290, playerName: "Bradley Barcola", teamName: "Paris Saint-Germain" },
  { id: 291, playerName: "Lucas Hernandez", teamName: "Paris Saint-Germain" },
  { id: 292, playerName: "Milan Škriniar", teamName: "Paris Saint-Germain" },
  { id: 293, playerName: "Manuel Ugarte", teamName: "Paris Saint-Germain" },
  { id: 294, playerName: "Goncalo Ramos", teamName: "Paris Saint-Germain" },
  { id: 295, playerName: "Lee Kang-in", teamName: "Paris Saint-Germain" },
  { id: 296, playerName: "Keylor Navas", teamName: "Paris Saint-Germain" },
  { id: 297, playerName: "Nordi Mukiele", teamName: "Paris Saint-Germain" },
  { id: 298, playerName: "Carlos Soler", teamName: "Paris Saint-Germain" },
  { id: 299, playerName: "Danilo Pereira", teamName: "Paris Saint-Germain" },
  { id: 300, playerName: "Alexandre Lacazette", teamName: "Olympique Lyonnais" },
  { id: 301, playerName: "Rayan Cherki", teamName: "Olympique Lyonnais" },
  { id: 302, playerName: "Maxence Caqueret", teamName: "Olympique Lyonnais" },
  { id: 303, playerName: "Corentin Tolisso", teamName: "Olympique Lyonnais" },
  { id: 304, playerName: "Nicolas Tagliafico", teamName: "Olympique Lyonnais" },
  { id: 305, playerName: "Castello Lukeba", teamName: "Olympique Lyonnais" },
  { id: 306, playerName: "Jake O'Brien", teamName: "Olympique Lyonnais" },
  { id: 307, playerName: "Anthony Lopes", teamName: "Olympique Lyonnais" },
  { id: 308, playerName: "Malick Fofana", teamName: "Olympique Lyonnais" },
  { id: 309, playerName: "Ernest Nuamah", teamName: "Olympique Lyonnais" },
  { id: 310, playerName: "Said Benrahma", teamName: "Olympique Lyonnais" },
  { id: 311, playerName: "Nemanja Matic", teamName: "Olympique Lyonnais" },
  { id: 312, playerName: "Duje Caleta-Car", teamName: "Olympique Lyonnais" },
  { id: 313, playerName: "Ainsley Maitland-Niles", teamName: "Olympique Lyonnais" },
  { id: 314, playerName: "Georges Mikautadze", teamName: "Olympique Lyonnais" },
  { id: 315, playerName: "Moussa Niakhaté", teamName: "Olympique Lyonnais" },
  { id: 316, playerName: "Jordan Veretout", teamName: "Olympique Lyonnais" },
  { id: 317, playerName: "Tanner Tessmann", teamName: "Olympique Lyonnais" },
  { id: 318, playerName: "Abner Vinícius", teamName: "Olympique Lyonnais" },
  { id: 319, playerName: "Gift Orban", teamName: "Olympique Lyonnais" },
  { id: 320, playerName: "Mama Baldé", teamName: "Olympique Lyonnais" },
  { id: 321, playerName: "Lucas Perri", teamName: "Olympique Lyonnais" },
  { id: 322, playerName: "Rémy Descamps", teamName: "Olympique Lyonnais" },
  { id: 323, playerName: "Warmed Omari", teamName: "Olympique Lyonnais" },
  { id: 324, playerName: "Saël Kumbedi", teamName: "Olympique Lyonnais" },
  { id: 325, playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille" },
  { id: 326, playerName: "Dimitri Payet", teamName: "Olympique de Marseille" },
  { id: 327, playerName: "Valentin Rongier", teamName: "Olympique de Marseille" },
  { id: 328, playerName: "Mattéo Guendouzi", teamName: "Olympique de Marseille" },
  { id: 329, playerName: "Jonathan Clauss", teamName: "Olympique de Marseille" },
  { id: 330, playerName: "Chancel Mbemba", teamName: "Olympique de Marseille" },
  { id: 331, playerName: "Leonardo Balerdi", teamName: "Olympique de Marseille" },
  { id: 332, playerName: "Pau López", teamName: "Olympique de Marseille" },
  { id: 333, playerName: "Jordan Veretout", teamName: "Olympique de Marseille" },
  { id: 334, playerName: "Cengiz Ünder", teamName: "Olympique de Marseille" },
  { id: 335, playerName: "Alexis Sánchez", teamName: "Olympique de Marseille" },
  { id: 336, playerName: "Amine Harit", teamName: "Olympique de Marseille" },
  { id: 337, playerName: "Nuno Tavares", teamName: "Olympique de Marseille" },
  { id: 338, playerName: "Samuel Gigot", teamName: "Olympique de Marseille" },
  { id: 339, playerName: "Ruslan Malinovskyi", teamName: "Olympique de Marseille" },
  { id: 340, playerName: "Sead Kolašinac", teamName: "Olympique de Marseille" },
  { id: 341, playerName: "Azzedine Ounahi", teamName: "Olympique de Marseille" },
  { id: 342, playerName: "Iliman Ndiaye", teamName: "Olympique de Marseille" },
  { id: 343, playerName: "Ismaïla Sarr", teamName: "Olympique de Marseille" },
  { id: 344, playerName: "Derek Cornelius", teamName: "Olympique de Marseille" },
  { id: 345, playerName: "Quentin Merlin", teamName: "Olympique de Marseille" },
  { id: 346, playerName: "Elye Wahi", teamName: "Olympique de Marseille" },
  { id: 347, playerName: "Adrien Rabiot", teamName: "Olympique de Marseille" },
  { id: 348, playerName: "Mason Greenwood", teamName: "Olympique de Marseille" },
  { id: 349, playerName: "Gerónimo Rulli", teamName: "Olympique de Marseille" },
  { id: 350, playerName: "Victor Osimhen", teamName: "Paris Saint-Germain" },
  { id: 351, playerName: "João Neves", teamName: "Paris Saint-Germain" },
  { id: 352, playerName: "Désiré Doué", teamName: "Paris Saint-Germain" },
  { id: 353, playerName: "Willian Pacho", teamName: "Paris Saint-Germain" },
  { id: 354, playerName: "Matvey Safonov", teamName: "Paris Saint-Germain" },
  { id: 355, playerName: "Yoram Zague", teamName: "Paris Saint-Germain" },
  { id: 356, playerName: "Senny Mayulu", teamName: "Paris Saint-Germain" },
  { id: 357, playerName: "Ibrahim Mbaye", teamName: "Paris Saint-Germain" },
  { id: 358, playerName: "Lucas Beraldo", teamName: "Paris Saint-Germain" },
  { id: 359, playerName: "Arnau Tenas", teamName: "Paris Saint-Germain" },
  { id: 360, playerName: "Gabriel Moscardo", teamName: "Paris Saint-Germain" },
  { id: 361, playerName: "Khvicha Kvaratskhelia", teamName: "Paris Saint-Germain" },
  { id: 362, playerName: "Yann Sommer", teamName: "Inter Milan" },
  { id: 363, playerName: "Marcus Thuram", teamName: "Inter Milan" },
  { id: 364, playerName: "Lautaro Martínez", teamName: "Inter Milan" },
  { id: 365, playerName: "Federico Dimarco", teamName: "Inter Milan" },
  { id: 366, playerName: "Alessandro Bastoni", teamName: "Inter Milan" },
  { id: 367, playerName: "Nicolo Barella", teamName: "Inter Milan" },
  { id: 368, playerName: "Hakan Çalhanoğlu", teamName: "Inter Milan" },
  { id: 369, playerName: "Simone Inzaghi", teamName: "Inter Milan" },
  { id: 370, playerName: "Henrikh Mkhitaryan", teamName: "Inter Milan" },
  { id: 371, playerName: "Denzel Dumfries", teamName: "Inter Milan" },
  { id: 372, playerName: "Stefan de Vrij", teamName: "Inter Milan" },
  { id: 373, playerName: "Francesco Acerbi", teamName: "Inter Milan" },
  { id: 374, playerName: "Davide Frattesi", teamName: "Inter Milan" },
  { id: 375, playerName: "Piotr Zieliński", teamName: "Napoli" },
  { id: 376, playerName: "Victor Osimhen", teamName: "Napoli" },
  { id: 377, playerName: "Khvicha Kvaratskhelia", teamName: "Napoli" },
  { id: 378, playerName: "Giovanni Di Lorenzo", teamName: "Napoli" },
  { id: 379, playerName: "Kim Min-jae", teamName: "Napoli" },
  { id: 380, playerName: "André-Frank Zambo Anguissa", teamName: "Napoli" },
  { id: 381, playerName: "Alex Meret", teamName: "Napoli" },
  { id: 382, playerName: "Stanislav Lobotka", teamName: "Napoli" },
  { id: 383, playerName: "Matteo Politano", teamName: "Napoli" },
  { id: 384, playerName: "Giacomo Raspadori", teamName: "Napoli" },
  { id: 385, playerName: "Mathías Olivera", teamName: "Napoli" },
  { id: 386, playerName: "Amir Rrahmani", teamName: "Napoli" },
  { id: 387, playerName: "Giovanni Simeone", teamName: "Napoli" },
  { id: 388, playerName: "Eljif Elmas", teamName: "Napoli" },
  { id: 389, playerName: "Tanguy Ndombele", teamName: "Napoli" },
  { id: 390, playerName: "Mario Rui", teamName: "Napoli" },
  { id: 391, playerName: "Juan Jesus", teamName: "Napoli" },
  { id: 392, playerName: "Leo Østigård", teamName: "Napoli" },
  { id: 393, playerName: "Salvatore Sirigu", teamName: "Napoli" },
  { id: 394, playerName: "Hirving Lozano", teamName: "Napoli" },
  { id: 395, playerName: "Natan", teamName: "Napoli" },
  { id: 396, playerName: "Jesper Lindstrøm", teamName: "Napoli" },
  { id: 397, playerName: "Scott McTominay", teamName: "Napoli" },
  { id: 398, playerName: "Romelu Lukaku", teamName: "Napoli" },
  { id: 399, playerName: "Antonio Conte", teamName: "Napoli" },
  { id: 400, playerName: "David Neres", teamName: "Napoli" },
  { id: 401, playerName: "Lucas Chevalier", teamName: "LOSC Lille" },
  { id: 402, playerName: "Jonathan David", teamName: "LOSC Lille" },
  { id: 403, playerName: "Edon Zhegrova", teamName: "LOSC Lille" },
  { id: 404, playerName: "Rémy Cabella", teamName: "LOSC Lille" },
  { id: 405, playerName: "Leny Yoro", teamName: "LOSC Lille" },
  { id: 406, playerName: "Gabriel Gudmundsson", teamName: "LOSC Lille" },
  { id: 407, playerName: "Tiago Santos", teamName: "LOSC Lille" },
  { id: 408, playerName: "Benjamin André", teamName: "LOSC Lille" },
  { id: 409, playerName: "Angel Gomes", teamName: "LOSC Lille" },
  { id: 410, playerName: "Hakim Ziyech", teamName: "LOSC Lille" },
  { id: 411, playerName: "Bafodé Diakité", teamName: "LOSC Lille" },
  { id: 412, playerName: "Alexsandro Ribeiro", teamName: "LOSC Lille" },
  { id: 413, playerName: "Osame Sahraoui", teamName: "LOSC Lille" },
  { id: 414, playerName: "Mohamed Bayo", teamName: "LOSC Lille" },
  { id: 415, playerName: "Ismaily", teamName: "LOSC Lille" },
  { id: 416, playerName: "Thomas Meunier", teamName: "LOSC Lille" },
  { id: 417, playerName: "Nabil Bentaleb", teamName: "LOSC Lille" },
  { id: 418, playerName: "Ayyoub Bouaddi", teamName: "LOSC Lille" },
  { id: 419, playerName: "Matias Fernandez-Pardo", teamName: "LOSC Lille" },
  { id: 420, playerName: "Ngal'ayel Mukau", teamName: "LOSC Lille" },
  { id: 421, playerName: "Aissa Mandi", teamName: "LOSC Lille" },
  { id: 422, playerName: "Mitchell Bakker", teamName: "LOSC Lille" },
  { id: 423, playerName: "Vito Mannone", teamName: "LOSC Lille" },
  { id: 424, playerName: "Samuel Umtiti", teamName: "LOSC Lille" },
  { id: 425, playerName: "Aaron Malouda", teamName: "LOSC Lille" },
  { id: 426, playerName: "Antoine Griezmann", teamName: "Atlético Madrid" },
  { id: 427, playerName: "Koke", teamName: "Atlético Madrid" },
  { id: 428, playerName: "Jan Oblak", teamName: "Atlético Madrid" },
  { id: 429, playerName: "José María Giménez", teamName: "Atlético Madrid" },
  { id: 430, playerName: "Marcos Llorente", teamName: "Atlético Madrid" },
  { id: 431, playerName: "Álvaro Morata", teamName: "Atlético Madrid" },
  { id: 432, playerName: "Rodrigo De Paul", teamName: "Atlético Madrid" },
  { id: 433, playerName: "Stefan Savić", teamName: "Atlético Madrid" },
  { id: 434, playerName: "Ángel Correa", teamName: "Atlético Madrid" },
  { id: 435, playerName: "Nahuel Molina", teamName: "Atlético Madrid" },
  { id: 436, playerName: "Mario Hermoso", teamName: "Atlético Madrid" },
  { id: 437, playerName: "Yannick Carrasco", teamName: "Atlético Madrid" },
  { id: 438, playerName: "Rodrigo Riquelme", teamName: "Atlético Madrid" },
  { id: 439, playerName: "César Azpilicueta", teamName: "Atlético Madrid" },
  { id: 440, playerName: "Memphis Depay", teamName: "Atlético Madrid" },
  { id: 441, playerName: "Pablo Barrios", teamName: "Atlético Madrid" },
  { id: 442, playerName: "Samuel Lino", teamName: "Atlético Madrid" },
  { id: 443, playerName: "Julián Alvarez", teamName: "Atlético Madrid" },
  { id: 444, playerName: "Alexander Sørloth", teamName: "Atlético Madrid" },
  { id: 445, playerName: "Robin Le Normand", teamName: "Atlético Madrid" },
  { id: 446, playerName: "Conor Gallagher", teamName: "Atlético Madrid" },
  { id: 447, playerName: "Clément Lenglet", teamName: "Atlético Madrid" },
  { id: 448, playerName: "Reinildo Mandava", teamName: "Atlético Madrid" },
  { id: 449, playerName: "Juan Musso", teamName: "Atlético Madrid" },
  { id: 450, playerName: "Javi Galán", teamName: "Atlético Madrid" },
  { id: 451, playerName: "Robert Lewandowski", teamName: "FC Barcelona" },
  { id: 452, playerName: "Pedri", teamName: "FC Barcelona" },
  { id: 453, playerName: "Gavi", teamName: "FC Barcelona" },
  { id: 454, playerName: "Frenkie de Jong", teamName: "FC Barcelona" },
  { id: 455, playerName: "Ronald Araújo", teamName: "FC Barcelona" },
  { id: 456, playerName: "Jules Koundé", teamName: "FC Barcelona" },
  { id: 457, playerName: "Ter Stegen", teamName: "FC Barcelona" },
  { id: 458, playerName: "Raphinha", teamName: "FC Barcelona" },
  { id: 459, playerName: "Fermín López", teamName: "FC Barcelona" },
  { id: 460, playerName: "Pau Cubarsí", teamName: "FC Barcelona" },
  { id: 461, playerName: "Lamine Yamal", teamName: "FC Barcelona" },
  { id: 462, playerName: "Dani Olmo", teamName: "FC Barcelona" },
  { id: 463, playerName: "Pau Víctor", teamName: "FC Barcelona" },
  { id: 464, playerName: "Hansi Flick", teamName: "FC Barcelona" },
  { id: 465, playerName: "Iñigo Martínez", teamName: "FC Barcelona" },
  { id: 466, playerName: "Alejandro Balde", teamName: "FC Barcelona" },
  { id: 467, playerName: "Eric García", teamName: "FC Barcelona" },
  { id: 468, playerName: "Hector Fort", teamName: "FC Barcelona" },
  { id: 469, playerName: "Andreas Christensen", teamName: "FC Barcelona" },
  { id: 470, playerName: "Wojciech Szczęsny", teamName: "FC Barcelona" },
  { id: 471, playerName: "Iñaki Peña", teamName: "FC Barcelona" },
  { id: 472, playerName: "Pablo Torre", teamName: "FC Barcelona" },
  { id: 473, playerName: "Ansu Fati", teamName: "FC Barcelona" },
  { id: 474, playerName: "Gerard Martín", teamName: "FC Barcelona" },
  { id: 475, playerName: "Sergi Domínguez", teamName: "FC Barcelona" },
  { id: 476, playerName: "Vinícius Júnior", teamName: "Real Madrid" },
  { id: 477, playerName: "Jude Bellingham", teamName: "Real Madrid" },
  { id: 478, playerName: "Kylian Mbappé", teamName: "Real Madrid" },
  { id: 479, playerName: "Luka Modrić", teamName: "Real Madrid" },
  { id: 480, playerName: "Thibaut Courtois", teamName: "Real Madrid" },
  { id: 481, playerName: "Eduardo Camavinga", teamName: "Real Madrid" },
  { id: 482, playerName: "Federico Valverde", teamName: "Real Madrid" },
  { id: 483, playerName: "Aurélien Tchouaméni", teamName: "Real Madrid" },
  { id: 484, playerName: "Éder Militão", teamName: "Real Madrid" },
  { id: 485, playerName: "Antonio Rüdiger", teamName: "Real Madrid" },
  { id: 486, playerName: "Dani Carvajal", teamName: "Real Madrid" },
  { id: 487, playerName: "Ferland Mendy", teamName: "Real Madrid" },
  { id: 488, playerName: "Rodrygo", teamName: "Real Madrid" },
  { id: 489, playerName: "Brahim Díaz", teamName: "Real Madrid" },
  { id: 490, playerName: "Endrick", teamName: "Real Madrid" },
  { id: 491, playerName: "Arda Güler", teamName: "Real Madrid" },
  { id: 492, playerName: "Lucas Vázquez", teamName: "Real Madrid" },
  { id: 493, playerName: "Andriy Lunin", teamName: "Real Madrid" },
  { id: 494, playerName: "Fran García", teamName: "Real Madrid" },
  { id: 495, playerName: "Dani Ceballos", teamName: "Real Madrid" },
  { id: 496, playerName: "Jesús Vallejo", teamName: "Real Madrid" },
  { id: 497, playerName: "Jacobo Ramón", teamName: "Real Madrid" },
  { id: 498, playerName: "Joan Martínez", teamName: "Real Madrid" },
  { id: 499, playerName: "Raúl Asencio", teamName: "Real Madrid" },
  { id: 500, playerName: "Lorenzo Aguado", teamName: "Real Madrid" },
  { id: 501, playerName: "Hugo Lloris", teamName: "LOSC Lille" },
  { id: 502, playerName: "Steve Mandanda", teamName: "Stade Rennais FC" },
  { id: 503, playerName: "Pau López", teamName: "Olympique de Marseille" },
  { id: 504, playerName: "Anthony Lopes", teamName: "Olympique Lyonnais" },
  { id: 505, playerName: "Gianluigi Donnarumma", teamName: "Paris Saint-Germain" },
  { id: 506, playerName: "Alphonse Areola", teamName: "West Ham United" },
  { id: 507, playerName: "Brice Samba", teamName: "RC Lens" },
  { id: 508, playerName: "Alban Lafont", teamName: "FC Nantes" },
  { id: 509, playerName: "Matz Sels", teamName: "RC Strasbourg" },
  { id: 510, playerName: "Benjamin Lecomte", teamName: "AS Monaco" },
  { id: 511, playerName: "Romain Salin", teamName: "Stade Brestois 29" },
  { id: 512, playerName: "Baptiste Reynet", teamName: "FC Metz" },
  { id: 513, playerName: "Gauthier Gallon", teamName: "ES Troyes AC" },
  { id: 514, playerName: "Paul Bernardoni", teamName: "Angers SCO" },
  { id: 515, playerName: "Alexandre Oukidja", teamName: "FC Metz" },
  { id: 516, playerName: "Dimitry Bertaud", teamName: "Montpellier HSC" },
  { id: 517, playerName: "Jonas Omlin", teamName: "Montpellier HSC" },
  { id: 518, playerName: "Yahia Fofana", teamName: "Angers SCO" },
  { id: 519, playerName: "Anthony Mandrea", teamName: "Clermont Foot 63" },
  { id: 520, playerName: "Arthur Desmas", teamName: "Le Havre AC" },
  { id: 521, playerName: "Julien De Sart", teamName: "Standard Liège" },
  { id: 522, playerName: "Maxime Duperron", teamName: "FC Girondins de Bordeaux" },
  { id: 523, playerName: "Gaëtan Poussin", teamName: "FC Girondins de Bordeaux" },
  { id: 524, playerName: "Kostantinos Kotsolis", teamName: "AEK Athens" },
  { id: 525, playerName: "Panagiotis Retsos", teamName: "Hellas Verona" },
  { id: 526, playerName: "Dimitrios Pelkas", teamName: "Hull City" },
  { id: 527, playerName: "Anastasios Douvikas", teamName: "FC Utrecht" },
  { id: 528, playerName: "Giorgos Masouras", teamName: "Olympiacos" },
  { id: 529, playerName: "Lazaros Rota", teamName: "Olympiacos" },
  { id: 530, playerName: "Andreas Bouchalakis", teamName: "Fortuna Düsseldorf" },
  { id: 531, playerName: "Manolis Siopis", teamName: "FC Volos" },
  { id: 532, playerName: "Fotis Ioannidis", teamName: "Panathinaikos" },
  { id: 533, playerName: "Christos Tzolis", teamName: "Fortuna Düsseldorf" },
  { id: 534, playerName: "Vangelis Pavlidis", teamName: "AZ Alkmaar" },
  { id: 535, playerName: "Dimitris Kourbelis", teamName: "Aris Thessaloniki" },
  { id: 536, playerName: "Pantelis Hatzidiakos", teamName: "AZ Alkmaar" },
  { id: 537, playerName: "George Baldock", teamName: "Sheffield United" },
  { id: 538, playerName: "Konstantinos Mavropanos", teamName: "West Ham United" },
  { id: 539, playerName: "Odysseas Vlachodimos", teamName: "Benfica" },
  { id: 540, playerName: "Alexandros Paschalakis", teamName: "PAOK" },
  { id: 541, playerName: "Stefanos Kapino", teamName: "Olympiacos" },
  { id: 542, playerName: "Dimitrios Stamatakis", teamName: "Asteras Tripolis" },
  { id: 543, playerName: "Panagiotis Vlachodimos", teamName: "Panathinaikos" },
  { id: 544, playerName: "Alexandros Paschalakis", teamName: "PAOK Thessaloniki" },
  { id: 545, playerName: "Stefanos Kapino", teamName: "Olympiacos Piraeus" },
  { id: 546, playerName: "Dimitrios Stamatakis", teamName: "Asteras Tripolis FC" },
  { id: 547, playerName: "Panagiotis Vlachodimos", teamName: "Panathinaikos FC" },
  { id: 548, playerName: "Alexandros Paschalakis", teamName: "PAOK FC" },
  { id: 549, playerName: "Stefanos Kapino", teamName: "Olympiacos FC" },
  { id: 550, playerName: "Dimitrios Stamatakis", teamName: "Asteras Tripolis Club" },
  { id: 551, playerName: "João Félix", teamName: "Chelsea FC" },
  { id: 552, playerName: "Bruno Fernandes", teamName: "Manchester United" },
  { id: 553, playerName: "Diogo Jota", teamName: "Liverpool FC" },
  { id: 554, playerName: "Bernardo Silva", teamName: "Manchester City" },
  { id: 555, playerName: "Rúben Dias", teamName: "Manchester City" },
  { id: 556, playerName: "Rafael Leão", teamName: "AC Milan" },
  { id: 557, playerName: "Pepe", teamName: "FC Porto" },
  { id: 558, playerName: "William Carvalho", teamName: "Real Betis" },
  { id: 559, playerName: "Danilo Pereira", teamName: "Paris Saint-Germain" },
  { id: 560, playerName: "Nuno Mendes", teamName: "Paris Saint-Germain" },
  { id: 561, playerName: "Rui Patrício", teamName: "AS Roma" },
  { id: 562, playerName: "José Sá", teamName: "Wolverhampton Wanderers" },
  { id: 563, playerName: "Diogo Costa", teamName: "FC Porto" },
  { id: 564, playerName: "Rui Silva", teamName: "Real Betis" },
  { id: 565, playerName: "Anthony Lopes", teamName: "Olympique Lyonnais" },
  { id: 566, playerName: "Matheus Nunes", teamName: "Manchester City" },
  { id: 567, playerName: "Vitinha", teamName: "Paris Saint-Germain" },
  { id: 568, playerName: "João Palhinha", teamName: "Bayern Munich" },
  { id: 569, playerName: "Otávio", teamName: "Al-Nassr" },
  { id: 570, playerName: "Raphaël Guerreiro", teamName: "Borussia Dortmund" },
  { id: 571, playerName: "Nélson Semedo", teamName: "Wolverhampton Wanderers" },
  { id: 572, playerName: "António Silva", teamName: "Benfica" },
  { id: 573, playerName: "Gonçalo Inácio", teamName: "Sporting CP" },
  { id: 574, playerName: "Pedro Neto", teamName: "Chelsea FC" },
  { id: 575, playerName: "Francisco Conceição", teamName: "Juventus FC" },
  { id: 576, playerName: "Diogo Dalot", teamName: "Manchester United" },
  { id: 577, playerName: "Gonçalo Ramos", teamName: "Paris Saint-Germain" },
  { id: 578, playerName: "Matheus Reis", teamName: "Sporting CP" },
  { id: 579, playerName: "João Neves", teamName: "Paris Saint-Germain" },
  { id: 580, playerName: "Renato Sanches", teamName: "AC Milan" },
  { id: 581, playerName: "Ricardo Horta", teamName: "SC Braga" },
  { id: 582, playerName: "Paulinho", teamName: "Sporting CP" },
  { id: 583, playerName: "Pedro Gonçalves", teamName: "Sporting CP" },
  { id: 584, playerName: "Rafa Silva", teamName: "Benfica" },
  { id: 585, playerName: "Héctor Herrera", teamName: "Houston Dynamo" },
  { id: 586, playerName: "Jesús Corona", teamName: "Sevilla FC" },
  { id: 587, playerName: "Hirving Lozano", teamName: "SSC Napoli" },
  { id: 588, playerName: "Raúl Jiménez", teamName: "Fulham FC" },
  { id: 589, playerName: "Carlos Vela", teamName: "LAFC" },
  { id: 590, playerName: "Diego Lainez", teamName: "Real Betis" },
  { id: 591, playerName: "César Montes", teamName: "Espanyol" },
  { id: 592, playerName: "Johan Vásquez", teamName: "Genoa CFC" },
  { id: 593, playerName: "Edson Álvarez", teamName: "West Ham United" },
  { id: 594, playerName: "Luis Chávez", teamName: "Dynamo Moscow" },
  { id: 595, playerName: "Uriel Antuna", teamName: "Cruz Azul" },
  { id: 596, playerName: "Julián Araujo", teamName: "Las Palmas" },
  { id: 597, playerName: "Santiago Giménez", teamName: "Feyenoord" },
  { id: 598, playerName: "Alexis Vega", teamName: "Toluca" },
  { id: 599, playerName: "Roberto Alvarado", teamName: "Guadalajara" },
  { id: 600, playerName: "Henry Martín", teamName: "Club América" }
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

const autographCards: AutoCard[] = [
  { id: 1, playerName: "Dragan Stojković", teamName: "Olympique de Marseille", numberings: ["/199", "/10", "/1"] },
  { id: 2, playerName: "Fabrizio Ravanelli", teamName: "Olympique de Marseille", numberings: ["/199", "/10", "/1"] },
  { id: 3, playerName: "Leonardo", teamName: "Paris Saint-Germain", numberings: ["/199", "/1"] },
  { id: 4, playerName: "Nabil Fekir", teamName: "Olympique Lyonnais", numberings: ["/199", "/10", "/1"] },
  { id: 5, playerName: "Pierre-Emerick Aubameyang", teamName: "Olympique de Marseille", numberings: ["/49", "/10", "/1"] },
  { id: 6, playerName: "Joe Cole", teamName: "LOSC Lille", numberings: ["/25", "/1"] },
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
        isOwned: false,
        imageUrl: null
      });
    }

    // 4. Create Autograph cards
    console.log("✍️ Creating Autograph cards...");
    for (const autoCard of autographCards) {
      for (const numbering of autoCard.numberings) {
        cardsToInsert.push({
          id: cardId++,
          collectionId: 1,
          reference: `AUTO-${autoCard.id.toString().padStart(2, '0')}`,
          playerName: autoCard.playerName,
          teamName: autoCard.teamName,
          cardType: "Autograph",
          cardSubType: null,
          rarity: numbering === "/1" ? "1 of 1" : "Autograph",
          numbering: numbering,
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