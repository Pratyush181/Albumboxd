require("dotenv").config();

const express = require("express");
const axios = require("axios");
const Album = require("../models/Album");

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
        type: "album",
        limit: 20,
      },
    });

    const albums = [];
    const seen = new Set(); // key = strippedName + artist

    data.albums.items.forEach((album) => {
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

    
    // Save basic album info to database (fast)
    for (const album of albums) {
      try {
        await Album.findOneAndUpdate(
          { spotifyId: album.id },
          {
            spotifyId: album.id,
            title: album.name,
            artist: album.artist,
            releaseDate: new Date(album.release_date),
            imageUrl: album.cover,
            spotifyUrl: `https://open.spotify.com/album/${album.id}`,
            genre: [],
            albumType: "album",
            total_tracks: 0,
            tracks: []
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error("Error saving album to database:", error);
      }
    }

        res.json({ albums });
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

//get album by id
router.get("/albums/:id", async (req, res) => {
  try {
    const album = await Album.findOne({ spotifyId: req.params.id });

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

// Get all albums from database
router.get("/albums", async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
