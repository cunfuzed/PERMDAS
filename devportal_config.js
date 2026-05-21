var devportal_API = "https://pda-donor-reggae-labour.trycloudflare.com" //urgent: remove slash at the end!!!!

//of course the programmer forgot
if (devportal_API.endsWith('/')) {
  devportal_API = devportal_API.slice(0, -1);
}
