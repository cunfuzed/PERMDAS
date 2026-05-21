
var API = "https://arms-added-message-regions.trycloudflare.com";//URGENT MAKE SURE TO REMOVE SLASH AT END


//of course the programmer forgot
if (API.endsWith('/')) {
  // slice(0, -1) creates a new string from the start up to the second-to-last character
  API = API.slice(0, -1);
}


//This is where I put the favicon. Since every HTML page runs this, I dont have to edit every page
var link = document.createElement("link");
link.rel = "icon";
link.type = "image/x-icon";
link.href = "./favicon.ico";
document.head.appendChild(link);
