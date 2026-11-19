const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  etat: { type: String, enum: ['Neuf', 'Occasion', 'Sur commande'], required: true },
  categorieAge: { type: String, enum: ['Enfant', 'Adulte', 'Enfant & Adulte'], required: true },
  type: { type: String, enum: ['Tenue complète', 'Demi-pointes', 'Vêtement', 'Accessoire'], required: true },
  taillesDisponibles: [{ type: String }],
  pointuresDisponibles: [{ type: Number }],
  compositionTenue: [{ type: String }],
  image: { type: String, required: true },
  coupDeCoeur: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Produit', produitSchema);
