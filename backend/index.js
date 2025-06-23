const express = require('express');
const app=express();
const cors = require("cors");
const bcrypt = require('bcrypt');
const corsOptions = {
    origin: ["http://localhost:5173"],
};
const User = require("./models/User");
const mongoose = require("mongoose");
const mongoURI = "mongodb+srv://Pratyush:pratmongopassword@users.axtqgnr.mongodb.net/?retryWrites=true&w=majority&appName=Users"
const spotifyRoutes = require("./routes/spotify");
const Album = require('./models/Album');
const ratingRoutes = require('./routes/ratings');
const Review = require('./models/Review.js')
const reviewRoutes = require('./routes/reviews');


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

