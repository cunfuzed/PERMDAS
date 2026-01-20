const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your GitHub Pages frontend can talk to this server
app.use(cors());
app.use(express.json());

// In-memory storage
let users = {}; // key = username, value = { scores: [], totalGames, totalEquations }

// --- Register a new username ---
app.post("/register", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Invalid username" });
  }

  // Create new user if doesn't exist
  if (!users[name]) {
    users[name] = {
      scores: [],
      totalGames: 0,
      totalEquations: 0
    };
  }

  console.log("New registration:", name);
  res.json({ success: true, user: users[name] });
});

// --- Submit a score for a user ---
app.post("/score", (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof score !== "number" || !users[name]) {
    return res.status(400).json({ error: "Invalid request" });
  }

  users[name].scores.push(score);
  users[name].totalGames += 1;

  console.log(`Score submitted: ${name} - ${score}`);
  res.json({ success: true, user: users[name] });
});

// --- Get top 10 scores (leaderboard) ---
app.get("/leaderboard", (req, res) => {
  // Flatten scores into {name, score} objects
  let allScores = [];
  for (let name in users) {
    users[name].scores.forEach(s => {
      allScores.push({ name, score: s });
    });
  }

  // Sort descending by score
  allScores.sort((a, b) => b.score - a.score);

  // Keep top 10
  const topScores = allScores.slice(0, 10);

  res.json(topScores);
});

// --- Get all usernames ---
app.get("/users", (req, res) => {
  res.json(Object.keys(users));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
