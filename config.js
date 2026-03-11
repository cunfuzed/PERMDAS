
var API = "https://ben-mothers-inspection-broke.trycloudflare.com";//URGENT MAKE SURE TO REMOVE SLASH AT END


//of course the programmer forgot
if (API.endsWith('/')) {
  // slice(0, -1) creates a new string from the start up to the second-to-last character
  API = API.slice(0, -1);
}