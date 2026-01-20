const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// In-memory storage for users
let users = {}; // key = username, value = object with stats

app.post("/register", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Invalid username" });
  }

  if (!users[name]) {
    // Create new user record
    users[name] = {
      scores: [],
      totalGames: 0,
      totalEquations: 0
      // add more fields later if you like
    };
  }

  res.json({ success: true, user: users[name] });
});

app.get("/users", (req, res) => {
  // Object.keys(users) gives an array of all usernames
  res.json(Object.keys(users));
  console.log("Register request received:", users);
});
