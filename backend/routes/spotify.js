require("dotenv").config();

const express = require("express");
const axios = require("axios");

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
    /* ----------------------------------------------- */

    res.json({ albums });
  } catch (err) {
    console.error("Spotify search failed:", err.response?.data || err.message);
    res.status(502).json({ error: "Spotify search failed" });
  }
});


module.exports = router;
