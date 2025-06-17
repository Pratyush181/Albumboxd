require("dotenv").config();

const express = require("express");
const axios = require("axios");

const router = express.Router();

let accessToken = null;
let tokenExpiry = 0;

// Get Spotify access token
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const response = await axios.post(
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

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 5000;
  return accessToken;
}

// /api/search?query=damn kendrick
router.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "No query provided" });

  try {
    const token = await getAccessToken();
    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: "album",
        limit: 10,
      },
    });

    const albums = response.data.albums.items.map((album) => ({
      id: album.id,
      name: album.name,
      artist: album.artists.map((a) => a.name).join(", "),
      cover: album.images?.[0]?.url || null,
      release_date: album.release_date,
    }));

    res.json({ albums });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Spotify search failed" });
  }
});

module.exports = router;
