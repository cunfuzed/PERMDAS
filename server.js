const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// File where data is stored
const DATA_FILE = "users.json";

// Load users from file if it exists
let users = {};
if (fs.existsSync(DATA_FILE)) {
  const data = fs.readFileSync(DATA_FILE, "utf8");
  users = JSON.parse(data);
}

// Save users to file
function saveUsers() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// --- Register a new username ---
app.post("/register", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Invalid username" });
  }

  if (!users[name]) {
    users[name] = {
      scores: [],
      totalGames: 0,
      totalEquations: 0
    };
    saveUsers();
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
  saveUsers();

  console.log(`Score submitted: ${name} - ${score}`);
  res.json({ success: true, user: users[name] });
});

// --- Get top 10 scores (leaderboard) ---
app.get("/leaderboard", (req, res) => {
  let allScores = [];
  for (let name in users) {
    users[name].scores.forEach(s => {
      allScores.push({ name, score: s });
    });
  }

  allScores.sort((a, b) => b.score - a.score);
  const topScores = allScores.slice(0, 10);

  res.json(topScores);
});

// --- Get all usernames ---
app.get("/users", (req, res) => {
  res.json(Object.keys(users));
});


app.get("/dump", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    return res.json({ message: "No file yet" });
  }
  const data = fs.readFileSync(DATA_FILE, "utf8");
  res.type("json").send(data);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
