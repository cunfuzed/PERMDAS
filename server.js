
const express = require("express");
const cors = require("cors");
const fs = require("fs");

//YAY
async function generate(prompt, version = 1) {
  const models = {
    1: "qwen2.5:3b",
    2: "qwen2.5-coder:7b",
    3: "qwen2.5-coder:14b",
    4: "qwen2.5-coder:32b"
  };

  const model = models[version] || models[1];

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  });

  const data = await response.json();
  return data.response;
}



const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// File where data is stored
const DATA_FILE = "users.json";

let rooms = {}; // key is rooms id
let peopleInMatchmaking = [];
function Player(theirWS, name){
  this.theirWS = theirWS;
  this.name = name;
}
function Room(id, type) {
  this.id = id;
  this.type = type;
  this.players = []; //insidu gowes Player
}

function genID() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var id = "";
  for (var i = 0; i < 3; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;

}

function createDuel() {
  var room = new Room(genID(), "duel")
  return room;
}

let users = {};

if (fs.existsSync(DATA_FILE)) {
  console.log("DATA_FILE exists. Loading users...");
  const data = fs.readFileSync(DATA_FILE, "utf8");
  users = JSON.parse(data);
  console.log("Loaded users:", users);
} else {
  console.log("No DATA_FILE found. Starting with empty users.");
}

// Save users to file
function saveUsers() {
  console.log("Saving users to file...");
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  console.log("Save complete.");
}

// create duel (private) -- FIX: MAKE ROOMS APPEND BY KEY NOT PUSH
// app.post("/create-duel", (req, res) => {
// 	console.log("Creating Duel POST thing");
// 	const {
// 		host,
// 		passwordHash
// 	} = req.body;

// 	if (!users[host].passwordHash && users[host].passwordHash != passwordHash)
// 		return res.status(401).json({
// 			error: "Not authorized"
// 		});

// 	var room = createDuel();
// 	rooms.push(room)

// 	res.json({
// 		success: true,
// 		id: room.id
// 	});
// });

app.post("/enter-matchmaking", (req, res) => {
  console.log("Person entered matchmaking");
  const {
    name,
    passwordHash
  } = req.body;
  if(!users[name]){
    return res.status(401).json({
      error: "not authorized -- you dont even exist"
    });
  }
  if (!users[name].passwordHash && users[name].passwordHash != passwordHash)
    return res.status(401).json({
      error: "not authorized (password wrong)"
    });
  peopleInMatchmaking = peopleInMatchmaking.filter((e) => (e.name != name));
  // if(peopleInMatchmaking.some((e)=>(e.name == name))){
  // 	return res.status(409).json({
  // 		error: "i hope your not a clone, bc you can only sign up ONCE --when kids code"
  // 	});
  // }
  if(peopleInMatchmaking.length > 0){
    //create a room for both
    var room = createDuel();
    rooms[room.id] = room;
    var other = peopleInMatchmaking.shift()

    res.json({
      success: true,
      id: room.id,
      other: other.name
    });
    other.res.json({
      success: true,
      id: room.id,
      other: name
    });
  }else{
    peopleInMatchmaking.push({
      name: name,
      res: res
    })
  }


});


// --- Register a new username ---
app.post("/register", (req, res) => {
  console.log("POST /register called");

  const {
    name
  } = req.body;

  if (!name || typeof name !== "string") {
    console.log("Invalid username:", name);
    return res.status(400).json({
      error: "Invalid username"
    });
  }

  if (!users[name]) {
    console.log("New user. Creating:", name);
    users[name] = {
      scores: [],
      totalGames: 0,
      totalEquations: 0
    };
    saveUsers();

    console.log("Registration success:", name);
    res.json({
      success: true,
      user: users[name]
    });
  } else {

    console.log("User Already Exists", name);
    res.json({
      success: false,
      user: null,
      msg: "Please use login page"
    });
    return;
  }

});

// --- Submit a score for Blitz mode ---
app.post("/score-blitz", (req, res) => {
  console.log("POST /score-blitz called (Blitz mode)");
  const {
    name,
    score,
    passwordHash
  } = req.body;
  if (!name || typeof score !== "number" || !users[name]) {
    console.log("Invalid request:", {
      name,
      score
    });
    return res.status(400).json({
      error: "Invalid request"
    });
  }

  if (!users[name].blitzScores) {
    users[name].blitzScores = [];
  }

  if (!users[name].passwordHash && users[name].passwordHash != passwordHash)
    return res.status(401).json({
      error: "Not authorized"
    });
  users[name].blitzScores.push(score);
  users[name].totalGames += 1;
  saveUsers();
  console.log("Blitz score submitted:", {
    name,
    score
  });
  res.json({
    success: true,
    user: users[name]
  });
});


app.post("/score", (req, res) => {
  console.log("POST /score called");

  const {
    name,
    score,
    passwordHash
  } = req.body;

  if (!name || typeof score !== "number" || !users[name]) {
    console.log("Invalid request:", {
      name,
      score
    });
    return res.status(400).json({
      error: "Invalid request"
    });
  }
  if (!users[name].passwordHash && users[name].passwordHash != passwordHash)
    return res.status(401).json({
      error: "Not authorized"
    });
  users[name].scores.push(score);
  users[name].totalGames += 1;
  saveUsers();

  console.log("Score submitted:", {
    name,
    score
  });
  res.json({
    success: true,
    user: users[name]
  });
});


// --- Submit a score for Freefall mode ---
app.post("/score-freefall", (req, res) => {
  console.log("POST /score-freefall called (Frefall mode)");
  const {
    name,
    score,
    passwordHash
  } = req.body;
  if (!name || typeof score !== "number" || !users[name]) {
    console.log("Invalid request:", {
      name,
      score
    });
    return res.status(400).json({
      error: "Invalid request"
    });
  }

  if (!users[name].freeFallScores) {
    users[name].freeFallScores = [];
  }

  if (!users[name].passwordHash && users[name].passwordHash != passwordHash)
    return res.status(401).json({
      error: "Not authorized"
    });
  users[name].freeFallScores.push(score);
  users[name].totalGames += 1;
  saveUsers();
  console.log("Freefall score submitted:", {
    name,
    score
  });
  res.json({
    success: true,
    user: users[name]
  });
});


// --- Get top 10 Blitz scores (leaderboard) ---
app.get("/leaderboard-blitz", (req, res) => {
  console.log("GET /leaderboard-blitz called (Blitz mode)");
  let bestScores = [];
  for (let name in users) {
    // Ensure blitzScores exists
    if (!users[name].blitzScores) {
      users[name].blitzScores = [];
    }

    let userScores = users[name].blitzScores;
    if (userScores.length === 0) continue;
    let bestScore = Math.max(...userScores); // best score = highest score
    bestScores.push({
      name,
      score: bestScore
    });
  }
  bestScores.sort((a, b) => b.score - a.score); // Sort descending (highest first)
  const topScores = bestScores.slice(0, 10);
  console.log("Returning Blitz leaderboard:", topScores);
  res.json(topScores);
});

// --- Get top 10 scores (leaderboard) ---
app.get("/leaderboard", (req, res) => {
  console.log("GET /leaderboard called");

  let bestScores = [];

  for (let name in users) {
    let userScores = users[name].scores;
    if (userScores.length === 0) continue;

    let bestScore = Math.min(...userScores); // best time = lowest score
    bestScores.push({
      name,
      score: bestScore
    });
  }

  bestScores.sort((a, b) => a.score - b.score);

  const topScores = bestScores.slice(0, 10);
  res.json(topScores);
});

// --- Get top 10 Freefall scores (leaderboard) ---
app.get("/leaderboard-freefall", (req, res) => {
  console.log("DEBUG: GET /leaderboard-freefall called (freefall mode)");
  let bestScores = [];
  for (let name in users) {
    // Ensure blitzScores exists
    if (!users[name].freeFallScores) {
      users[name].freeFallScores = [];
    }

    let userScores = users[name].freeFallScores;
    if (userScores.length === 0) continue;
    let bestScore = Math.max(...userScores); // best score = highest score
    bestScores.push({
      name,
      score: bestScore
    });
  }
  bestScores.sort((a, b) => b.score - a.score); // Sort descending (highest first)
  const topScores = bestScores.slice(0, 10);
  console.log("DEBUG: Returning free fall leaderboard:", topScores);
  res.json(topScores);
});

app.post("/login", (req, res) => {
  console.log("Login attempt received");

  const {
    username,
    passwordHash
  } = req.body;

  if (!users[username]) {
    console.log("Usr Not found")
    return res.status(401).json({
      success: false,
      message: "User not found"
    });
  }
  //If the user has no password and the hash was sent corresponds to no password
  if (!users[username].passwordHash && passwordHash == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
    res.json({
      success: true
    });
  } else {
    console.log("Correct Hash: " + users[username].passwordHash);
    console.log("They Sent: " + passwordHash);

    if (users[username].passwordHash === passwordHash) {
      res.json({
        success: true
      });
    } else {
      res.json({
        success: false
      });
    }
  }
});
app.post("/setPassword", (req, res) => {
  console.log("Password Change attemt");
  console.log(req.body)
  const {
    username,
    oldPasswordHash,
    newPasswordHash
  } = req.body;

  if (!users[username]) {
    console.log("User Not Found to change password")
    return res.status(401).json({
      success: false,
      message: "User not found"
    });
  }
  //If the user has no password and the hash was sent corresponds to no password
  if (!users[username].passwordHash && oldPasswordHash == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
    console.log("User has no password and adden one")
    users[username].passwordHash = newPasswordHash
    saveUsers();
  } else {
    console.log("already has password h.: " + users[username].passwordHash)
    console.log(oldPasswordHash)
    if (users[username].passwordHash === oldPasswordHash) {
      users[username].passwordHash = newPasswordHash
      saveUsers();
    } else {
      res.json({
        success: false
      });
    }
  }
  saveUsers();
});

app.post("/setStats", (req, res) => {
  console.log("Stats Update Attempt");
  console.log(req.body);

  const {
    username,
    bestScore,
    bestTime,
    totalGames,
    totalEquations,
    soundEnabled,
    musicEnabled,
    correctSound,
    wrongSound,
    answer_question,
    reset_game,
    unlockedAchievements
  } = req.body;

  if (!users[username]) {
    console.log("User Not Found to update the stats!!");
    return res.status(401).json({
      success: false,
      message: "User not found"
    });
  }

  // well oc i used ai for these long strings of text, but i typud all the ifs and non repetetive stuff
  const user = users[username];
  if (Math.min(...user.scores) == bestTime) {
    user.bestTime = bestTime;
    res.json({
      success: true,
      trueBestScore: bestScore,
      currentStats: user
    });
  } if (Math.min(...user.scores) < bestScore) {
    res.json({
      success: true,
      trueBestScore: bestScore,
      currentStats: user
      
    });
  } else if (Math.min(...user.scores) > bestScore) {
    //they have a better best score, so add that time and then send back theri bestScore
    user.scores.push(bestScore);
  }
  user.totalGames = totalGames;
  user.totalEquations = totalEquations;
  user.soundEnabled = soundEnabled;
  user.musicEnabled = musicEnabled;
  user.correctSound = correctSound;
  user.wrongSound = wrongSound;
  user.answer_question = answer_question;
  user.reset_game = reset_game;
  // Merge achievements
  const serverAchievements = user.unlockedAchievements || [];
  const clientAchievements = unlockedAchievements || [];
  
  user.unlockedAchievements = [...new Set([...serverAchievements, ...clientAchievements])];
  saveUsers();
  console.log("Stats updated for", username);
});

app.get("/users", (req, res) => {
  console.log("GET /users called");
  console.log("User list:", Object.keys(users));
  res.json(Object.keys(users));
});

app.get("/dump", (req, res) => {
  console.log("GET /dump called");
  if (!fs.existsSync(DATA_FILE)) {
    console.log("No file yet");
    return res.json({
      message: "No file yet"
    });
  }
  const data = fs.readFileSync(DATA_FILE, "utf8");
  console.log("Dump data:", data);
  res.type("json").send(data);
});
/** Multiplayer duels code **/
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("server started");
});

const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ server: server });

function startCountdown(roomId) {
  let count = 3;

  const countdownInterval = setInterval(() => {
    rooms[roomId].players.forEach(player => {
      if (player.theirWS.readyState === 1) {
        player.theirWS.send(JSON.stringify({ type: 'countdown', value: count }));
      }
    });

    if (count === 0) {
      clearInterval(countdownInterval);

      setTimeout(() => {
        rooms[roomId].players.forEach(player => {
          if (player.theirWS.readyState === 1) {
            player.theirWS.send(JSON.stringify({ type: 'countdown', value: "start" }));
          }
        });
      }, 1000);
    }

    count--;
  }, 1000);
}

wss.on("connection", (ws, req) => {

  console.log("ws connection");
  ws.on("message", msg => {
    msg = JSON.parse(msg) // monosodium glutemate?
    console.log("through ws: ", JSON.stringify(msg), "/n rooms:", rooms);
    if(msg.connectMsg){
      if(rooms[msg.id]){
        rooms[msg.id].players.push(new Player(ws, msg.name))
        setTimeout(() => {startCountdown(msg.id);}, 5000);	
      }else{
        ws.send("This is a old and deleted room");
      }
    }else if(msg.victory){
      var room = rooms[msg.id];
      //send to other player(s)
      var otherPlayers = room.players.filter((p)=>p.name!=msg.name);		

      for(otherPlayer of otherPlayers)
        otherPlayer.theirWS.send(JSON.stringify({end: true}))
      startCountdown(msg.id);
      

        
    }else{
      var room = rooms[msg.id];

      if (!room) {
          console.log("Room already deleted or doesn't exist.");
          return; 
      }
      
      var otherPlayers = room.players.filter((p)=>p.name!=msg.name);
      if(otherPlayers.length == 0){
        return;
        //why does this ever happen
      }
      var randPlayer = otherPlayers[0];

      randPlayer.theirWS.send(JSON.stringify(msg.damagePacket))
    }
  });

  ws.on("close", () => {
    console.log("ws dis-connection");
  });
});

