const express = require('express');
const app=express();
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};
const mongoose = require("mongoose");
const mongoURI = "mongodb+srv://Pratyush:pratmongopassword@users.axtqgnr.mongodb.net/?retryWrites=true&w=majority&appName=Users"

mongoose.connect(mongoURI, {
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const albums = require("./albums");


app.use(cors(corsOptions));

app.get("/albums", (req, res) => {
    res.json(albums)
})


app.get("/exampleApi", (req, res) => {
    res.json({message: ["Hello World", "This is the Albumboxd init"]})
});

app.listen(3000, () =>{
    console.log("Server is running on port 3000");
});