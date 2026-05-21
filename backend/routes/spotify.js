require("dotenv").config();

const express = require("express");
const axios = require("axios");
const Album = require("../models/Album");
const User = require("../models/User");

const router = express.Router();

let accessToken = null;
let tokenExpiry = 0;

// Get Spotify access token
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const { data } = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 5000;
  return accessToken;
}

// /api/search?query=
router.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "No query provided" });

  try {
    const token = await getAccessToken();
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: "album,artist",
        limit: 20,
      },
    });

    const artists = (data.artists?.items || []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url ?? null,
      genres: artist.genres || [],
    }));

    const albums = [];
    const seen = new Set(); // key = strippedName + artist

    (data.albums?.items || []).forEach((album) => {
      const key =
        (album.name) + "-" + (album.artists[0]?.name || "").toLowerCase();
      if (seen.has(key)) return; // skip alternate versions
      seen.add(key);

      albums.push({
        id:           album.id,
        name:         album.name,
        artist:       album.artists.map((a) => a.name).join(", "),
        cover:        album.images?.[0]?.url ?? null,
        release_date: album.release_date,
      });
    });

    // Save basic album info to database (fast) and fetch aggregate rating info
    const finalizedAlbums = [];
    for (const album of albums) {
      try {
        const cachedAlbum = await Album.findOneAndUpdate(
          { spotifyId: album.id },
          {
            $setOnInsert: {
              spotifyId: album.id,
              title: album.name,
              artist: album.artist,
              releaseDate: album.release_date ? new Date(album.release_date) : null,
              imageUrl: album.cover,
              spotifyUrl: `https://open.spotify.com/album/${album.id}`,
              genre: [],
              albumType: "album",
              total_tracks: 0,
              tracks: []
            }
          },
          { upsert: true, new: true }
        );
        finalizedAlbums.push({
          ...album,
          averageRating: cachedAlbum.averageRating || 0,
          ratingsCount: cachedAlbum.ratingsCount || 0
        });
      } catch (error) {
        console.error("Error saving/fetching album from database:", error);
        finalizedAlbums.push({
          ...album,
          averageRating: 0,
          ratingsCount: 0
        });
      }
    }

    // Search matching user profiles in the database
    const users = await User.find({ username: { $regex: new RegExp(query, 'i') } }).select('-password').limit(15);
    const profiles = users.map(u => ({
      _id: u._id,
      username: u.username,
      bio: u.bio || '',
      avatarUrl: u.avatarUrl || ''
    }));

    res.json({ albums: finalizedAlbums, artists, profiles });
  } catch (err) {
    console.error("Spotify search failed:", err.response?.data || err.message);
    res.status(502).json({ error: "Spotify search failed" });
  }
});

//save album to databse
router.post("/albums", async (req, res) => {
  try{
    const { spotifyId, title, artist, releaseDate, imageUrl, spotifyUrl, genre, albumType, total_tracks, tracks } = req.body;

    let album = await Album.findOne({ spotifyId });

    if (album) {
      res.json(album);
    } else {
      const newAlbum = new Album({
        spotifyId,
        title,
        artist,
        releaseDate,
        imageUrl,
        spotifyUrl,
        genre,
        albumType,
        total_tracks,
        tracks
      });

      await newAlbum.save();
      res.status(201).json(newAlbum);
    }
  } catch (error) {
    console.error("Error saving album:", error);
    res.status(500).json({ error: error.message });
  }
})

// Get new releases from Spotify
router.get("/new-releases", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { data } = await axios.get("https://api.spotify.com/v1/browse/new-releases", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit: 50,
      },
    });

    // Filter only actual albums (album_type === 'album') and map them
    const filteredItems = (data.albums?.items || [])
      .filter((item) => item.album_type === "album")
      .slice(0, 12);

    const albums = filteredItems.map((album) => ({
      id:           album.id,
      name:         album.name,
      artist:       album.artists.map((a) => a.name).join(", "),
      cover:        album.images?.[0]?.url ?? null,
      release_date: album.release_date,
    }));

    // Cache basic album info to database (fast) and fetch aggregate rating info
    const finalizedAlbums = [];
    for (const album of albums) {
      try {
        const cachedAlbum = await Album.findOneAndUpdate(
          { spotifyId: album.id },
          {
            $setOnInsert: {
              spotifyId: album.id,
              title: album.name,
              artist: album.artist,
              releaseDate: album.release_date ? new Date(album.release_date) : null,
              imageUrl: album.cover,
              spotifyUrl: `https://open.spotify.com/album/${album.id}`,
              genre: [],
              albumType: "album",
              total_tracks: 0,
              tracks: []
            }
          },
          { upsert: true, new: true }
        );
        finalizedAlbums.push({
          ...album,
          averageRating: cachedAlbum.averageRating || 0,
          ratingsCount: cachedAlbum.ratingsCount || 0
        });
      } catch (error) {
        console.error("Error caching new release to database:", error);
        finalizedAlbums.push({
          ...album,
          averageRating: 0,
          ratingsCount: 0
        });
      }
    }

    res.json({ albums: finalizedAlbums });
  } catch (err) {
    console.error("Spotify new releases failed:", err.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch new releases" });
  }
});

// Get popular albums
router.get("/albums/popular", async (req, res) => {
  try {
    let albums = await Album.find({ ratingsCount: { $gt: 0 } })
      .sort({ ratingsCount: -1, averageRating: -1 })
      .limit(12);

    // Fallback: if not enough rated albums, grab the most recently cached albums
    if (albums.length < 6) {
      const recentAlbums = await Album.find().sort({ createdAt: -1 }).limit(12);
      const seenIds = new Set(albums.map(a => a.spotifyId));
      for (const ra of recentAlbums) {
        if (!seenIds.has(ra.spotifyId)) {
          albums.push(ra);
        }
      }
      albums = albums.slice(0, 12);
    }

    // Map DB fields to frontend expected fields
    const formattedAlbums = albums.map(album => ({
      id: album.spotifyId,
      name: album.title,
      artist: album.artist,
      cover: album.imageUrl,
      release_date: album.releaseDate ? album.releaseDate.toISOString().split('T')[0] : null,
      averageRating: album.averageRating,
      ratingsCount: album.ratingsCount
    }));

    res.json({ albums: formattedAlbums });
  } catch (error) {
    console.error("Error fetching popular albums:", error);
    res.status(500).json({ error: error.message });
  }
});

//get album by id
router.get("/albums/:id", async (req, res) => {
  try {
    let album = await Album.findOne({ spotifyId: req.params.id });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // If album doesn't have complete data, fetch it from Spotify
    if (album.total_tracks === 0) {
      try {
        const token = await getAccessToken();
        const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${req.params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const albumData = albumResponse.data;
        
        // Update album with complete data
        album = await Album.findOneAndUpdate(
          { spotifyId: req.params.id },
          {
            title: albumData.name,
            artist: albumData.artists.map(a => a.name).join(", "),
            releaseDate: new Date(albumData.release_date),
            imageUrl: albumData.images?.[0]?.url,
            spotifyUrl: albumData.external_urls?.spotify,
            genre: albumData.genres || [],
            albumType: albumData.album_type,
            total_tracks: albumData.total_tracks,
            tracks: albumData.tracks?.items?.map(track => ({
              trackId: track.id,
              trackName: track.name,
              trackArtists: track.artists.map(a => a.name)
            })) || []
          },
          { new: true }
        );
      } catch (error) {
        console.error("Error fetching complete album details:", error);
      }
    }

    res.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artists/search-by-name
router.get("/artists/search-by-name", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "No artist name provided" });

  try {
    const token = await getAccessToken();
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: name,
        type: "artist",
        limit: 1,
      },
    });

    const artist = data.artists?.items?.[0];
    if (artist) {
      res.json({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url ?? null,
      });
    } else {
      res.status(404).json({ error: "Artist not found" });
    }
  } catch (error) {
    console.error("Error looking up artist by name:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artists/:artistId
router.get("/artists/:artistId", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { data } = await axios.get(`https://api.spotify.com/v1/artists/${req.params.artistId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    res.json({
      id: data.id,
      name: data.name,
      images: data.images || [],
      genres: data.genres || [],
      popularity: data.popularity
    });
  } catch (error) {
    console.error("Error fetching artist details:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artists/:artistId/albums
router.get("/artists/:artistId/albums", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { data } = await axios.get(`https://api.spotify.com/v1/artists/${req.params.artistId}/albums`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        include_groups: "album,single,compilation",
        limit: 50
      }
    });

    const albums = data.items.map(album => ({
      id: album.id,
      name: album.name,
      cover: album.images?.[0]?.url ?? null,
      release_date: album.release_date,
      album_group: album.album_group, // "album", "single", or "compilation"
      album_type: album.album_type
    }));

    // Dedup albums by lowercase name (Spotify often returns multiple versions/markets)
    const dedupedAlbums = [];
    const seenNames = new Set();
    for (const alb of albums) {
      const normalized = alb.name.toLowerCase().trim();
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        dedupedAlbums.push(alb);
      }
    }

    // Query MongoDB for all matching album IDs to fetch their ratings
    const spotifyIds = dedupedAlbums.map(a => a.id);
    const dbAlbums = await Album.find({ spotifyId: { $in: spotifyIds } });
    
    // Create lookup map
    const ratingsMap = {};
    dbAlbums.forEach(dbA => {
      ratingsMap[dbA.spotifyId] = {
        averageRating: dbA.averageRating || 0,
        ratingsCount: dbA.ratingsCount || 0
      };
    });

    // Merge database rating info into our discography items
    const finalizedDiscography = dedupedAlbums.map(alb => ({
      ...alb,
      averageRating: ratingsMap[alb.id]?.averageRating || 0,
      ratingsCount: ratingsMap[alb.id]?.ratingsCount || 0
    }));

    res.json({ albums: finalizedDiscography });
  } catch (error) {
    console.error("Error fetching artist albums:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});




module.exports = router;

