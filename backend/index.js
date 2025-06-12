const express = require('express');
const app=express();
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};
const User = require("./models/User");
const mongoose = require("mongoose");
const mongoURI = "mongodb+srv://Pratyush:pratmongopassword@users.axtqgnr.mongodb.net/?retryWrites=true&w=majority&appName=Users"

// connect to MongoDB
mongoose.connect(mongoURI, {
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors(corsOptions));


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