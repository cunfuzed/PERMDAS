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
	console.log("DEBUG: DATA_FILE exists. Loading users...");
	const data = fs.readFileSync(DATA_FILE, "utf8");
	users = JSON.parse(data);
	console.log("DEBUG: Loaded users:", users);
} else {
	console.log("DEBUG: No DATA_FILE found. Starting with empty users.");
}

// Save users to file
function saveUsers() {
	console.log("DEBUG: Saving users to file...");
	fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
	console.log("DEBUG: Save complete.");
}

// --- Register a new username ---
app.post("/register", (req, res) => {
	console.log("DEBUG: POST /register called");
	const { name } = req.body;
	if (!name || typeof name !== "string") {
		console.log("DEBUG: Invalid username:", name);
		return res.status(400).json({ error: "Invalid username" });
	}
	if (!users[name]) {
		console.log("DEBUG: New user. Creating:", name);
		users[name] = {
			scores: [],
			blitzScores: [],
			totalGames: 0,
			totalEquations: 0
		};
		saveUsers();
	} else {
		console.log("DEBUG: User already exists:", name);
		// Ensure blitzScores exists for existing users
		if (!users[name].blitzScores) {
			users[name].blitzScores = [];
			saveUsers();
		}
	}
	console.log("DEBUG: Registration success:", name);
	res.json({ success: true, user: users[name] });
});

// --- Submit a score for Sprint mode ---
app.post("/score", (req, res) => {
	console.log("DEBUG: POST /score called (Sprint mode)");
	const { name, score } = req.body;
	if (!name || typeof score !== "number" || !users[name]) {
		console.log("DEBUG: Invalid request:", { name, score });
		return res.status(400).json({ error: "Invalid request" });
	}
	users[name].scores.push(score);
	users[name].totalGames += 1;
	saveUsers();
	console.log("DEBUG: Sprint score submitted:", { name, score });
	res.json({ success: true, user: users[name] });
});

// --- Submit a score for Blitz mode ---
app.post("/score-blitz", (req, res) => {
	console.log("DEBUG: POST /score-blitz called (Blitz mode)");
	const { name, score } = req.body;
	if (!name || typeof score !== "number" || !users[name]) {
		console.log("DEBUG: Invalid request:", { name, score });
		return res.status(400).json({ error: "Invalid request" });
	}
	
	// Ensure blitzScores array exists
	if (!users[name].blitzScores) {
		users[name].blitzScores = [];
	}
	
	users[name].blitzScores.push(score);
	users[name].totalGames += 1;
	saveUsers();
	console.log("DEBUG: Blitz score submitted:", { name, score });
	res.json({ success: true, user: users[name] });
});

// --- Get top 10 Sprint scores (leaderboard) ---
app.get("/leaderboard", (req, res) => {
	console.log("DEBUG: GET /leaderboard called (Sprint mode)");
	let bestScores = [];
	for (let name in users) {
		let userScores = users[name].scores;
		if (userScores.length === 0) continue;
		let bestScore = Math.min(...userScores); // best time = lowest score
		bestScores.push({ name, score: bestScore });
	}
	bestScores.sort((a, b) => a.score - b.score);
	const topScores = bestScores.slice(0, 10);
	console.log("DEBUG: Returning Sprint leaderboard:", topScores);
	res.json(topScores);
});

// --- Get top 10 Blitz scores (leaderboard) ---
app.get("/leaderboard-blitz", (req, res) => {
	console.log("DEBUG: GET /leaderboard-blitz called (Blitz mode)");
	let bestScores = [];
	for (let name in users) {
		// Ensure blitzScores exists
		if (!users[name].blitzScores) {
			users[name].blitzScores = [];
		}
		
		let userScores = users[name].blitzScores;
		if (userScores.length === 0) continue;
		let bestScore = Math.max(...userScores); // best score = highest score
		bestScores.push({ name, score: bestScore });
	}
	bestScores.sort((a, b) => b.score - a.score); // Sort descending (highest first)
	const topScores = bestScores.slice(0, 10);
	console.log("DEBUG: Returning Blitz leaderboard:", topScores);
	res.json(topScores);
});

// --- Get all usernames ---
app.get("/users", (req, res) => {
	console.log("DEBUG: GET /users called");
	console.log("DEBUG: User list:", Object.keys(users));
	res.json(Object.keys(users));
});

app.get("/dump", (req, res) => {
	console.log("DEBUG: GET /dump called");
	if (!fs.existsSync(DATA_FILE)) {
		console.log("DEBUG: No file yet");
		return res.json({ message: "No file yet" });
	}
	const data = fs.readFileSync(DATA_FILE, "utf8");
	console.log("DEBUG: Dump data:", data);
	res.type("json").send(data);
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
