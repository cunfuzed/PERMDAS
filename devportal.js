// const PASSWORD = ""; // password is here

// async function secureHash(message) {
// 	const msgUint8 = new TextEncoder().encode(message);
// 	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
// 	const hashArray = Array.from(new Uint8Array(hashBuffer));
// 	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
// 	return hashHex;
// }
// to change password, go to any js compiler (JITer) and hash your password, put the thing down there. 
const PASSWORD_HASH = "88b1fe38cf4efddeccb0a6b068134a319c9bcd5bd5fefb53b1addebd8481bf8b"


const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { exec, spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 4000;
// Enable CORS
app.use(cors());
app.use(express.json());
let lastRestart = 0;

function restartPermdas() {
	const now = Date.now();
	if (now - lastRestart < 10000) {
		console.log("Restart blocked");
		return;
	}
	lastRestart = now;
	exec("pkill -f permdas.js", () => {

		// open new terminal running server
		spawn("gnome-terminal", [
			"--",
			"bash",
			"-c",
			"node permdas.js"
		], {
			detached: true
		});
	});
}
app.post("/devportal-restart", (req, res) => {
	var {hash} = req.body;
	if(hash == PASSWORD_HASH){
		restartPermdas();
		res.send("retarded. ... i meant restarted")	
	}else{
		res.status(403).send("wrong password")	
	}
});


const https = require("https");

const GH_URL = "https://cunfuzed.github.io/PERMDAS/server.js";
const LOCAL_FILE = "permdas.js"; //yes theyr diff


app.post("/dev-update-from-github", (req, res) => {
	var {hash} = req.body;
	if(hash == PASSWORD_HASH){
		console.log("Update from GH");
		
		https.get(GH_URL, r => {
			if (r.statusCode !== 200) {
				return res.status(500).send("download failed: " + r.statusCode);
			}
	
			let data = "";
	
			r.on("data", chunk => data += chunk);
	
			r.on("end", () => {
				try {
					fs.writeFileSync(LOCAL_FILE, data);
					console.log("permdas.js overwritten from GitHub");
	
					res.send("updated from github");
	
				} catch (e) {
					console.log("write failed:", e);
					res.status(500).send("write failed");
				}
			});
	
		}).on("error", e => {
			console.log("download error:", e);
			res.status(500).send("download error");
		});
	}else{
		
		res.status(403).send("password is incorrect! ):");
	}
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
