const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();

const customArtistNames = require('./ke_artistes.json');

// Middleware pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route pour la page d'accueil -> blind-test.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blind-test.html'));
});

// Route API avec choix de source
app.get('/api/random-track', async (req, res) => {
  const source = req.query.source || 'fr';
  let artist = null;

  try {
    if (source === 'custom') {
      // 🎯 Prendre un artiste de la liste custom
      const name = customArtistNames[Math.floor(Math.random() * customArtistNames.length)];
      const searchRes = await fetch(`https://api.deezer.com/search/artist?q=${name}`);
      const searchData = await searchRes.json();
      artist = searchData.data?.[0];
    } else {
      // 🎯 Prendre un artiste depuis le Top 100 Deezer France
      const chartRes = await fetch('https://api.deezer.com/chart/FR/artists?limit=100');
      const chartData = await chartRes.json();
      const artists = chartData.data;
      artist = artists[Math.floor(Math.random() * artists.length)];
    }

    if (!artist) return res.status(404).json({ error: 'Artiste non trouvé.' });

    // 🎶 Récupérer les morceaux populaires
    const trackRes = await fetch(`https://api.deezer.com/artist/${artist.id}/top?limit=25`);
    const trackData = await trackRes.json();
    const tracks = trackData.data;

    if (!tracks || tracks.length === 0) {
      return res.status(404).json({ error: 'Aucun titre trouvé pour cet artiste.' });
    }

    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    res.json({
      artist: randomTrack.artist.name,
      title: randomTrack.title,
      album: randomTrack.album.title,
      cover: randomTrack.album.cover_medium,
      preview: randomTrack.preview
    });

  } catch (err) {
    console.error('❌ Erreur serveur :', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des données Deezer.' });
  }
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
