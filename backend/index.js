const express = require('express');
const app=express();
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));



app.get("/exampleApi", (req, res) => {
    res.json({message: ["Hello World", "This is the Albumboxd init"]})
});

app.listen(3000, () =>{
    console.log("Server is running on port 3000");
});