var ws;
var localip = "";
var connectionChecker = false;

function startConnectionToServer(ip) {
 localip = ip;
 ws = new WebSocket("ws://" + ip + ":600");

 var sendResetterInterval;

 ws.onopen = function() {
  clearInterval(connectionChecker);
  toastr.success("Connected to backend!");
  setTimeout(ws.send("CurrentDir"), 100);
  setTimeout(ws.send("AreWeJoined"), 500);
  connectionChecker = true;
  sendResetterInterval = setInterval(function() {
   ws.send('RESET');
  }, 1000);
 }

 ws.onmessage = function(message) {
  console.log(message.data);
  if (message.data.indexOf("DOWNLOADUPDATE") > -1) {
   var data = message.data.split(':');
   var dataToUpdate = {
    id: data[1],
    progress: data[2],
    speed: data[3],
    status: data[4],
    filename: data[5]
   };
   updateDownloadStatus(dataToUpdate);
  }

  if (message.data.indexOf("CurrentDir") > -1) {
   updateDownloadLocation(message.data.split('^')[1]);
  }

  if (message.data.indexOf("IrcConnected") > -1) {
   fullyLoaded();
  }
  connectionChecker = true;
 }

 ws.onclose = function() {
  toastr.error("Lost connection to backend!");
  connectionChecker = false;

  try {

   checkConnection();
   clearInterval(sendResetterInterval);
  } catch (e) {

  }
 }

 ws.onerror = function() {
  ws.close();
  toastr.error("Lost connection to backend!");
  connectionChecker = false;
  try {

   checkConnection();
   clearInterval(sendResetterInterval);
  } catch (e) {

  }
 }
}


function sendMessage(message) {
 //ws = new WebSocket("ws://192.168.178.26:5015");
 console.log(message);
 try {
  ws.send('reset');
  ws.send(message);
  setTimeout(function() {
   ws.send("reset tha message" + message);
  }, 500); //<= i dont have the project for my own websocketserver on my desk here, its stupid... i know

 } catch (e) {

 }
}

function checkConnection() {
 var connectionInterval = setInterval(function() {
  ws.close();
  ws = new WebSocket("ws://" + localip + ":5015");
  if (connectionChecker) {
   clearInterval(connectionInterval);
  }
 }, 1000);
}

function closeBackend() {
 alert('Closing backend');
 ws.send("CLOSE");
}