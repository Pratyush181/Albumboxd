require('dotenv').config();
const express = require('express');
const app=express();
const cors = require("cors");
const bcrypt = require('bcrypt');
const corsOptions = {
    origin: ["http://localhost:5173"],
};
const User = require("./models/User");
const mongoose = require("mongoose");
const mongoURI = process.env.MONGO_URI || "mongodb+srv://Pratyush:pratmongopassword@users.axtqgnr.mongodb.net/?retryWrites=true&w=majority&appName=Users";
const spotifyRoutes = require("./routes/spotify");
const Album = require('./models/Album');
const ratingRoutes = require('./routes/ratings');
const Review = require('./models/Review.js')
const reviewRoutes = require('./routes/reviews');
const profileRoutes = require('./routes/profile');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// connect to MongoDB
mongoose.connect(mongoURI, {
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // This parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // This parses URL-encoded bodies





//Test User
app.post('/test-user', async (req, res) => {
    try {
        const testUser = new User({
            username: "testuser",
            email: "prat@example.com",
            password: "pratletsgo1818"
        });

        const savedUser = await testUser.save();
        res.json(savedUser);
    } catch (error) {
        res.status(400).json({error: "Error creating test user", details: error.message});
    }    
});



// Google Auth Client ID Config Route
app.get('/api/auth/google/client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

// Google Auth Verification Route
app.post('/api/auth/google/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Missing Google ID Token' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists in our DB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        registered: true,
        user: {
          _id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          avatarUrl: existingUser.avatarUrl || picture
        }
      });
    }

    // New user signup flow - return payload for step-2 selection of unique username
    res.json({
      registered: false,
      email,
      name,
      picture,
      message: 'Choose a unique username to complete registration.'
    });

  } catch (error) {
    console.error('Google verify failed:', error.message);
    res.status(401).json({ error: 'Invalid Google ID Token' });
  }
});

// Google Auth Complete Registration Route
app.post('/api/auth/google/register', async (req, res) => {
  const { token, username } = req.body;
  if (!token || !username) {
    return res.status(400).json({ error: 'Missing token or username' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, picture } = payload;

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return res.status(400).json({ error: 'Username cannot be empty' });
    }

    // Enforce unique username
    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Generate random secure fallback password
    const securePlaceholderPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);

    const newUser = new User({
      username: cleanUsername,
      email,
      password: securePlaceholderPassword,
      avatarUrl: picture || '',
      bio: ''
    });

    await newUser.save();
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl
      }
    });

  } catch (error) {
    console.error('Google register failed:', error.message);
    res.status(401).json({ error: 'Failed to complete Google registration' });
  }
});

// Signup
app.post('/api/signup', async (req, res) => {

  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({email});
    if (existingUser) {
      return res.status(400).json({message:"User already exists"})
    }

    const newUser = new User({
      username,
      email,
      password
    });

    await newUser.save();
    res.status(201).json({ 
      message: 'User created successfully', 
      user: { _id: newUser._id, username, email }
    });
  } catch (error){
    res.status(500).json({ message:'Server error', error: error.message });
  }
});


//Login
app.post('/api/login', async (req, res) => {
  try {
    console.log("Received login request:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        received: { email: !!email, password: !!password }
      });
    }

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("User logged in successfully: ", { username: user.username, email: user.email });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//Spotify Routes
app.use("/api", spotifyRoutes);


//test album data daving
app.post('/test-album', async (req, res) => {
  try {
    const testAlbum = new Album({
      spotifyId: '4aawyAB9mqN3uQ7FjRGTy',
      title: 'Global Warming',
      artist: 'Pitbull',
      imageUrl: 'https://example.com/image.jpg'
    });
    
    const savedAlbum = await testAlbum.save();
    res.json(savedAlbum);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ratings Routes
app.use('/api/ratings', ratingRoutes);

// Reviews Routes
app.use('/api/reviews', reviewRoutes);

// Profile Routes
app.use('/api/profile', profileRoutes);

//Get users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () =>{
    console.log("Server is running on port 3000");
});

