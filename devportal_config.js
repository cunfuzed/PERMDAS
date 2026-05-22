var devportal_API = "https://adam-hockey-analog-pine.trycloudflare.com" //urgent: remove slash at the end!!!!

//of course the programmer forgot
if (devportal_API.endsWith('/')) {
  devportal_API = devportal_API.slice(0, -1);
}
