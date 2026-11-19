require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Autorise localhost en développement et ton futur site Vercel en production
app.use(cors());
app.use(express.json());

// Configuration de Cloudinary avec les variables du fichier .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Stockage direct des images sur Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ballet-essentiel-tn',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({ storage });

// Connexion MongoDB Atlas (avec repli local si .env absent)
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ballet_essentiel')
  .then(() => console.log('✅ Connecté à MongoDB (ballet_essentiel)'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// Modèle Produit
const ProduitSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  nom: { type: String, required: true },
  description: { type: String },
  prix: { type: Number, required: true },
  etat: { type: String },
  categorieAge: { type: String },
  type: { type: String },
  image: { type: String, required: true },
  images: [{ type: String }],
  coupDeCoeur: { type: Boolean, default: false },
  vendu: { type: Boolean, default: false },
  taillesDisponibles: [{ type: String }],
  taillesEpuisees: [{ type: String }],
  pointuresDisponibles: [{ type: Number }],
  pointuresEpuisees: [{ type: Number }],
  stockParOption: { type: Map, of: Number, default: {} },
  compositionTenue: [{ type: String }]
}, { timestamps: true });

const Produit = mongoose.model('Produit', ProduitSchema);

// Route de test pour vérifier que Render est bien en ligne
app.get('/', (req, res) => {
  res.send('🩰 API Ballet Essentiel TN en ligne !');
});

// Récupérer tous les produits
app.get('/api/produits', async (req, res) => {
  try {
    const produits = await Produit.find().sort({ createdAt: -1 });
    res.json(produits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload d'une image vers Cloudinary (renvoie l'URL https://res.cloudinary.com/...)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image envoyée' });
  }
  res.json({ imageUrl: req.file.path });
});

// Ajouter un produit avec CODE AUTOMATIQUE (BE-001, BE-002...)
app.post('/api/produits', async (req, res) => {
  try {
    const dernierProduit = await Produit.findOne().sort({ createdAt: -1 });
    let prochainNumero = 1;

    if (dernierProduit && dernierProduit.code) {
      const match = dernierProduit.code.match(/BE-(\d+)/);
      if (match) {
        prochainNumero = parseInt(match[1], 10) + 1;
      }
    }

    const codeAuto = `BE-${String(prochainNumero).padStart(3, '0')}`;

    const nouveauProduit = new Produit({
      ...req.body,
      code: codeAuto
    });

    const saved = await nouveauProduit.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Modifier un article existant
app.put('/api/produits/:id', async (req, res) => {
  try {
    const misAJour = await Produit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(misAJour);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer un article
app.delete('/api/produits/:id', async (req, res) => {
  try {
    await Produit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Backend prêt sur le port ${PORT}`);
});