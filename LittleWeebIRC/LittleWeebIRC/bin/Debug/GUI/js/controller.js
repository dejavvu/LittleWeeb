//settings
var totalPacksPerPage = 300;

//datacontainers
var selectedPacks = [];
var currentLatest = "";
var currentLatestBot = -1;

//checks url if a view is defined with a #
$(document).ready(function() {

 var url = window.location.href;
 console.log(url);
 if (url.indexOf('#') >= 0) {
  var view = url.split('#')[1];

  if (view.indexOf('socketip') >= 0) {
   var ip = view.split("=")[1];
   startConnectionToServer(ip);
  } else {

   console.log("view defined:" + view);
   showView(view);
  }
 } else {
  console.log("no view defined, going to home");
 }
});

function fullyLoaded() {
 toastr.success("Fully Loaded, Ready to go!");
 $('#initialLoading').fadeOut();
 $('#views').fadeIn();
}

//shows a view
function showView(view) {
 console.log("view to show: " + view);

 $(".View").each(function() {
  $(this).fadeOut();
 });

 setTimeout(function() {
  $(".View").each(function() {
   if ($(this).hasClass(view)) {
    $(this).fadeIn();
   }
  });
 }, 500);

 $("input[type=checkbox]").each(function() {
  $(this).prop("checked", false);
 });
 console.log("clearing selected list");
 selectedPacks = [];
 $('.multipleselected').fadeOut();
 window.location.hash = view;
}

//currently airing view

$(document).ready(function() {
  getCurrentlyAiring(showCurrentlyAiring);
});
var currentlyAiring;
var currentlyAiringBackup;
function showCurrentlyAiring(data){
  var html = "";
  currentlyAiring = data;
  $.each(data, function(key, val){
    console.log(val.title_english);
    html = html + '<div class="item" onclick="showAnime(\'' + val.id + '\')"><div class="ui tiny image"> <img src="' + val.image_url_med + '" /> </div><div class="middle aligned content"><a class="header">' + val.title_english + '</a></div></div> <div class="ui divider"></div>';
  });

  $('#currentlyAiringAnimes').html(html);
}



var animeThatPossiblyIsTheSameAsCurrentlyAiring = [];
var botSelected = -1;
var resolution = "none";
var currentAnimeID = "0";

function showAnime(animeID){
  animeThatPossiblyIsTheSameAsCurrentlyAiring = [];
  currentAnimeID = animeID;
  resolution = $('input[name$=resolutionAnime]').val();
  botSelected = $('input[name$=botanime]').val();


  var animeData;
  var indexOfAnime = 0;
  var indexC = 0;
  $.each(currentlyAiring, function(key, val){
    if(val.id == animeID){
      indexOfAnime = indexC;
    }
    indexC++;
  });
  console.log(currentlyAiring[indexOfAnime]);
  var synonymsarray = currentlyAiring[indexOfAnime].synonyms;
  if(synonymsarray[0] == ""){
    synonymsarray.splice(0, 1);
  }
  $.each(synonymsarray, function(key, val){
      console.log("searching for: " + stripName(val));
      if(val != ""){
        searchForAnime(stripName(val), -1, function(data){
          if(data.length > 0){
            $.each(data, function(key1, value){
              if(compareNames(val, value.name) > 50){
                var exists = false;
                $.each(animeThatPossiblyIsTheSameAsCurrentlyAiring, function(key2, value1){                   
                    if(value1.id == value.id && value1.botId == value.botId && value1.name == value.name && value.episodeNumber > -1){
                      exists = true;
                    }
                });
                if(!exists){
                  if((parseInt(botSelected) == -1 || botSelected === undefined || botSelected == "") && (resolution == "none" || resolution === undefined || resolution == "")){
                    animeThatPossiblyIsTheSameAsCurrentlyAiring.push(value);
                  } else if(parseInt(botSelected) > -1 && (resolution == "none" || resolution === undefined || resolution == "")){
                    if(value.botId == botSelected){
                      animeThatPossiblyIsTheSameAsCurrentlyAiring.push(value);
                    }
                  } else if((parseInt(botSelected) == -1 || botSelected === undefined || botSelected == "")  && resolution != "none"){
                    if(value.name.indexOf(resolution) > -1){
                      animeThatPossiblyIsTheSameAsCurrentlyAiring.push(value);
                    }
                  } else {
                    if(value.name.indexOf(resolution) > -1 && value.botId == botSelected){
                      animeThatPossiblyIsTheSameAsCurrentlyAiring.push(value);
                    }
                  }
                }
              }
            });
           }
        });        
      }
  });

  var newLengthOfArray = -1;
  var currentLengthOfArray = animeThatPossiblyIsTheSameAsCurrentlyAiring.length;
  var waitInt = setInterval(function(){
    console.log(animeThatPossiblyIsTheSameAsCurrentlyAiring.length);
    if(animeThatPossiblyIsTheSameAsCurrentlyAiring.Length == newLengthOfArray && animeThatPossiblyIsTheSameAsCurrentlyAiring.Length != 0){
      console.log(animeThatPossiblyIsTheSameAsCurrentlyAiring.sort((a, b) => b.episodeNumber - a.episodeNumber));
      
      var html = "";
      $.each(animeThatPossiblyIsTheSameAsCurrentlyAiring,function(key, value){
          var botName = getBotNamePerID(value.botId);
          html = html + generateHtmlForPackList(key, value.number, botName, value.name);
      });
      $('#animeEpisodes').html(html);
      $('#animeTitle').html(currentlyAiring[indexOfAnime].title_english);
      showView('anime');
      clearInterval(waitInt);
    }
    newLengthOfArray = animeThatPossiblyIsTheSameAsCurrentlyAiring.Length;
  }, 500);
}

function resolutionAnimeClicked(){  
  console.log(currentAnimeID);

  resolution = $('input[name$=resolutionAnime]').val();
  botSelected = $('input[name$=botanime]').val();
  console.log(resolution);
  var localarray = [];

  $.each(animeThatPossiblyIsTheSameAsCurrentlyAiring, function(key, value){
      if((parseInt(botSelected) == -1 || botSelected === undefined || botSelected == "") && (resolution == "none" || resolution === undefined || resolution == "")){
        localarray.push(value);
      } else if(parseInt(botSelected) > -1 && (resolution == "none" || resolution === undefined || resolution == "")){
        if(value.botId == botSelected){
          localarray.push(value);
        }
      } else if((parseInt(botSelected) == -1 || botSelected === undefined || botSelected == "")  && resolution != "none"){
        if(value.name.indexOf(resolution) > -1){
          localarray.push(value);
        }
      } else {
        if(value.name.indexOf(resolution) > -1 && value.botId == botSelected){
          localarray.push(value);
        }
      }
  });

  var html = "";
  $.each(localarray, function(key, value){
      var botName = getBotNamePerID(value.botId);
      html = html + generateHtmlForPackList(key, value.number, botName, value.name);
  });
  $('#animeEpisodes').html(html);


  
}

function botForAnimeClicked(){
   
  resolution = $('input[name$=resolutionAnime]').val();
  botSelected = $('input[name$=botanime]').val();
  console.log(botSelected);
  var localarray = [];

  $.each(animeThatPossiblyIsTheSameAsCurrentlyAiring, function(key, value){
      if((parseInt(botSelected) == -1 || botSelected === undefined || botSelected == "") && (resolution == "none" || resolution === undefined || resolution == "")){
        localarray.push(value);
      } else if(parseInt(botSelected) > -1 && (resolution == "none" || resolution === undefined || resolution == "")){
        if(value.botId == botSelected){
          localarray.push(value);
        }
      } else if((parseInt(botSelected) == -1 || botSelected === undefined || botSelected == "")  && resolution != "none"){
        if(value.name.indexOf(resolution) > -1){
          localarray.push(value);
        }
      } else {
        if(value.name.indexOf(resolution) > -1 && value.botId == botSelected){
          localarray.push(value);
        }
      }
  });

  var html = "";
  $.each(localarray, function(key, value){
      var botName = getBotNamePerID(value.botId);
      html = html + generateHtmlForPackList(key, value.number, botName, value.name);
  });
  $('#animeEpisodes').html(html);
}



//latest pack view 
getLatestPacks($('input[name$=botlatest]').val(), showLatest);
var latestInterval = setInterval(function() {
 getLatestPacks($('input[name$=botlatest]').val(), showLatest);
}, 1000);

function showLatest(botId, data) {
 var html = "";
 $.each(data, function(key, value) {
  if (botId == -1 || botId === undefined || botId == "") {
   var botName = getBotNamePerID(value.botId);
   html = html + generateHtmlForPackList(key, value.number, botName, value.name);
  } else if (value.botId == botId) {
   var botName = getBotNamePerID(value.botId);
   html = html + generateHtmlForPackList(key, value.number, botName, value.name);
  }
 });
 if (JSON.stringify(currentLatest[0]) != JSON.stringify(data[0])) {
  $('#latestpacks').html(html);
  $('#latestLoading').fadeOut(function() {
   $('#packs').fadeIn();
  });
  currentLatest = data;

  toastr.success("A new pack has been added: " + data[0].name);
 }

 if (currentLatestBot != botId) {
  $('#latestpacks').html(html);
  $('#latestLoading').fadeOut(function() {
   $('#packs').fadeIn();
  });
  currentLatestBot = botId;
 }
}

//code for search view

$(document).ready(function() {
 $('#searchInput').on('keyup', function(e) {
  if (e.keyCode == 13) {
   console.log("starting search: " + $('#searchInput').val());
   $('#searchResults').fadeOut(function() {
    $('#searchLoading').fadeIn(function() {
     if ($('input[name$=bot]').val() == -1) {
      searchForAnime($('#searchInput').val(), -1, animeFound);
     } else {
      searchForAnimePerBot($('input[name$=botsearch]').val(), $('#searchInput').val(), -1, animeFound);
     }

     $('#results').fadeOut();
     $('#notabletofind').fadeOut();
    });
   });
  }
 });
});

function animeFound(animesFound) {
 var html = "";
 if (animesFound.length > 0) {
  $('#results').fadeIn();
  $.each(animesFound, function(key, value) {
   var botName = getBotNamePerID(value.botId);
   html = html + generateHtmlForPackList(key, value.number, botName, value.name);
  });


  $('#searchResults').html(html);
  $('#searchLoading').fadeOut(function() {
   $('#searchResults').fadeIn();
  });
 } else {
  $('#searchLoading').fadeOut(function() {
   $('#notabletofind').fadeIn();
  });
 }
}
//code for bots and bot view 

var thisinterval = setInterval(function() {
 if (jsonWithBots.length > 0) {
  var html = "";
  var dropbox = '<div class="item" data-value="-1">All Bots</div>';
  $.each(jsonWithBots, function(key, value) {
   html = html + ' <div class="title" onclick="getbot(\'' + value.id + '\', \'' + value.name + '\')">\
							    <i class="dropdown icon"></i>\
						    	' + value.name + '\
							</div>\
							<div class="content">\
							</div>';
   dropbox = dropbox + '<div class="item" data-value="' + value.id + '">' + value.name + '</div>';
  })

  $('#bots').html(html);
  $('.botlist').html(dropbox);
  clearInterval(thisinterval);
 }
}, 500);

function getbot(id, name) {
 showView('bot');
 getPackList(id, name, showpacklist);
}

function showpacklist(name, packJson) {
 var html = "";
 $('#packs').fadeOut();

 var totalAmountOfPacks = packJson.length;
 var amountOfPages = totalAmountOfPacks / totalPacksPerPage + 1;

 for (var x = 1; x <= amountOfPages; x++) {
  html = html + '<a class="item" onclick="showPage(\'' + x + '\')">' + x + '</a>';
 }
 $('#pages').html(html);


 html = "";
 $.each(packJson, function(key, value) {
  if (parseInt(key) < totalPacksPerPage) {
   var botName = getBotNamePerID(value.botId);
   html = html + generateHtmlForPackList(key, value.number, botName, value.name);
  }
 });
 $('#packs').html(html);
 $('#botName').html(name);
 $('#botLoading').fadeOut();
 $('#packs').fadeIn();
 $('.ui.accordion').accordion();
}

function showPage(page) {
 html = "";
 $('#packs').fadeOut(function() {
  $.each(jsonPacksInBot, function(key, value) {

   if (parseInt(key) > (totalPacksPerPage * parseInt(page) - totalPacksPerPage) && parseInt(key) < (totalPacksPerPage * parseInt(page))) {
    var botName = getBotNamePerID(value.botId);
    html = html + generateHtmlForPackList(key, value.number, botName, value.name);

   }
  });
  $('#packs').html(html);

 });
 $('#packs').fadeIn();
}

function generateHtmlForPackList(key, packnumber, botName, filename) {

 return '<div class="title"><i class="dropdown icon"></i><div class="ui checkbox"><input type="checkbox" class="' + key + '"  onclick="aCheckBoxChecked(\'' + packnumber + '\', \'' + botName + '\', \'' + filename + '\', \'' + key + '\')"><label>' + botName + ' | ' + filename + '</label></div></div><div class="content"><p class="transition hidden"><button class="ui primary button" style="width: 100%" onclick="sendDownloadRequest(\'' + packnumber + '\',\'' + botName + '\', \'' + filename + '\', true)">Download</button></p></div>';
}

// Download Page logic stuff

function appendToDownloadList() {
  console.log(selectedPacks);
 var i = 0;
 var length = selectedPacks.length;
 var sendRequestString = ""
 var thisInterval = setInterval(function() {
    if (i < length) {
     var val = selectedPacks[i];
     var id = generateId(val.packid, val.botname);
     appendToDownloads(id, val.file);
     sendRequestString = sendRequestString + "," + id + ":" + val.packid + ":" + val.botname;
    } else {

     sendRequestString = "AddToDownloads:" + sendRequestString;
     notifyMe("Added " + selectedPacks.length + " files to Download!");
     console.log("clearing selected packs");
     selectedPacks = [];
     sendMessage(sendRequestString);
     clearInterval(thisInterval);

    }
    i++;
  
 }, 100);

 /*
 $.each(selectedPacks, function(key,val){
 	sendDownloadRequest(val.packid, val.botname, val.file, false);
 	//add some logic to send commands to the server
 });*/
}

function sendDownloadRequest(pack, bot, filename, notify) {
 //add some logic to send commands to the server

 var id = generateId(pack, bot);
 appendToDownloads(id, filename);

 if (notify !== undefined) {
  if (notify) {
   notifyMe("Succesfully added file to your Downloads!", "succes");
  }
 }

 sendMessage("AddToDownloads:" + id + ":" + pack + ":" + bot);

}

function appendToDownloads(id, filename) {
 var html = '\
		 <tr id="' + id + '">\
	      <td id="filename_' + id + '">' + filename + '</td>\
	      <td id="status_' + id + '">Downloading</td>\
	      <td>\
	      	<div class="ui progress" id="progress_' + id + '" data-value="0" data-total="100">\
			  <div class="bar">\
			    <div class="progress"></div>\
			  </div>\
			  <div class="label" id="speed_' + id + '">Waiting for your weeb shit to start downloading.</div>\
			</div>\
		  </td>\
	      <td id="buttons_' + id + '">\
		      <button onclick="sendPlayRequest(\'' + id + '\', \'' + filename + '\')" class="ui primary button">Play</button>\
		      <button onclick="sendOpenLocationRequest(\'' + id + '\')"  class="ui primary button">Open Location</button>\
		      <button onclick="sendAbortRequest(\'' + id + '\')"  class="ui primary button">Abort</button>\
		      <button onclick="sendDeleteRequest(\'' + id + '\', \'' + filename + '\')"  class="ui primary button">Delete</button>\
	      </td>\
	    </tr>';

 $('#listWithDownloads').append(html);
}

function updateDownloadStatus(dldata) {
 if (dldata.filename.indexOf("UNKNOWN") == -1 && dldata.filename.indexOf("NO DOWNLOAD") == -1) {
  if ($('#' + dldata.id).length == 0) {
   appendToDownloads(dldata.id, dldata.filename);
  } else {


   $('#status_' + dldata.id).html(dldata.status);
   $('#progress_' + dldata.id).progress({
    percent: dldata.progress
   });
   $('#speed_' + dldata.id).html(dldata.speed + " kb/s");

   if ($('#filename_' + dldata.id).text() != dldata.filename) {
    $('#filename_' + dldata.id).html(dldata.filename);
    $('#buttons_' + dldata.id).html(' 	<button onclick="sendPlayRequest(\'' + dldata.id + '\', \'' + dldata.filename + '\')" class="ui primary button">Play</button>\
					      							<button onclick="sendOpenLocationRequest(\'' + dldata.id + '\')"  class="ui primary button">Open Location</button>\
					      							<button onclick="sendAbortRequest(\'' + dldata.id + '\')"  class="ui primary button">Abort</button>\
					      							<button onclick="sendDeleteRequest(\'' + dldata.id + '\', \'' + dldata.filename + '\')"  class="ui primary button">Delete</button>');
    console.log("filename is not exactly the same as initiated :(");
   }
  }

 } else {
  $('#status_' + dldata.id).html(dldata.status);
  $('#progress_' + dldata.id).progress({
   percent: dldata.progress
  });
  $('#speed_' + dldata.id).html(dldata.speed + " kb/s");
 }
}

function sendPlayRequest(id, file) {
 console.log("play request send for file: " + file);
 sendMessage("PlayFile:" + id + ":" + file);
}

function sendOpenLocationRequest(id) {
 sendMessage("OpenDirectory");
}

function sendAbortRequest(id) {
 sendMessage("AbortDownload");
}

function sendDeleteRequest(id, file) {
 $('#' + id).remove();
 sendMessage("DeleteDownload:" + id + ":" + file);
}

//settings view

function openFileDialog() {
 sendMessage("OpenFileDialog");
}

function updateDownloadLocation(dir) {
 $('#downloadLocation').val(dir);
}

//some general related stuff not necesesarely for just one view

function generateId(pack, bot) {
 var seed = pack + bot;
 var str = pack;
 var asString = bot;
 var i, l,
  hval = (seed === undefined) ? 0x811c9dc5 : seed;

 for (i = 0, l = str.length; i < l; i++) {
  hval ^= str.charCodeAt(i);
  hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
 }
 if (asString) {
  // Convert to 8 digit hex string
  return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
 }
 return hval >>> 0;
}

function notifyMe(message, type) {
 switch (type) {
  case "succes":
   toastr.success(message);
   break;
  case "error":
   toastr.error(message);
   break;
  case "warning":
   toastr.warning(message);
   break;
  default:
   toastr.success(message);
   break;
 }
}

function aCheckBoxChecked(pack, bot, filename, id) {
 var amountChecked = 0;
 console.log("checkbox being checked: " + pack + " - " + bot + " - " + filename + " - " + id);
 $("input[type=checkbox]").each(function() {
  if ($(this).is(':checked')) {
   amountChecked++;
  }
 });

 if (amountChecked > 0) {
  $('.multipleselected').fadeIn();
 } else {
  $('.multipleselected').fadeOut();
 }

 var addThisPack = {
  listid: id,
  packid: pack,
  botname: bot,
  file: filename
 };

 if ($('.' + id).is(':checked')) {
  console.log("Adding tha pack");
  selectedPacks.push(addThisPack);
 } else {
  var index = selectedPacks.findIndex(x => x.listid == id);
  if (index > -1) {
   selectedPacks.splice(index, 1);
  }
 }

 console.log(selectedPacks);
}

//returns a value in percentage that describes how closely two strings match.
function compareNames(str1, str2){
  str1 = stripName(str1);
  str2 = stripName(str2);
  var str1L = str1.length;
  var str2L = str2.length;
  var equal = 0;
  if(str1L > str2L){
    for(var x = 0; x < str2L; x++){
      var charstr1 = str1.charAt(x);
      var charstr2 = str2.charAt(x);
      if(charstr1 == charstr2){
        equal++;
      } 
    }

    var oneprocent = str1L / 100;
    var percentageEqual = equal / oneprocent;
    return percentageEqual;
  } else {
    for(var x = 0; x < str1L; x++){
      var charstr1 = str1.charAt(x);
      var charstr2 = str2.charAt(x);
      if(charstr1 == charstr2){
        equal++;
      } 
    }

    var oneprocent = str2L / 100;
    var percentageEqual = equal / oneprocent;
    return percentageEqual;
  }



}

function stripName(input){

  try{
    if(input.indexOf('.') > -1){
        input = input.split('.')[0];
    }
  } catch(e){

  }
  
  try{
    while(input.indexOf('[') > -1){ 
      if (input.indexOf('[') > -1)
      {
          if (input.indexOf(']') > -1)
          {
              input = input.split('[')[0] + input.split(']')[1];
          } else {
              input = input.split('[')[0] + input.split('[')[1]; 
          }
      }
    }
  } catch(e){

  }
  try{
    while(input.indexOf('(') > -1){
      if (input.indexOf('(') > -1)
      {
          if (input.indexOf(')') > -1)
          {
              input = input.split('(')[0] + input.split(')')[1];
          } else {
              input = input.split('(')[0] + input.split('(')[1];
          }
      }
    }
  } catch (e){}
  try{
    if (input.indexOf("S0") > -1)
    {
        try
        {
            input = input.split("S0")[0] + input.split("S0")[1].substring(2);

        } catch(e)
        {
            try
            {
                input = input.split("S0")[0] + input.split("S0")[1].substring(1);

            }
            catch(e)
            {
                input = input.split("S0")[0] + input.split("S0")[1];
            }
        } 
    }
  } catch (e){}
  try{
    if (input.indexOf("E0") > -1)
    {
        try
        {

            input = input.split("E0")[0] + input.split("E0")[1].substring(2);
        } catch(e)
        {
            try
            {

                input = input.split("E0")[0] + input.split("E0")[1].substring(1);
            }
            catch(e)
            {
                input = input.split("E0")[0] + input.split("E0")[1];
            }
        }
    }
  } catch (e){}
  try{
    if (input.indexOf("0") > -1)
    {
        try
        {
            input = input.split("0")[0] + input.split("0")[1].substring(2);

        } catch(e)
        {
            try
            {
                input = input.split("0")[0] + input.split("0")[1].substring(1);

            }
            catch(e)
            {
                input = input.split("0")[0] + input.split("0")[1];
            }
        } 
    }
  } catch (e){}
  try{
    if (input.indexOf("1080") > -1)
    {
        input = input.split("1080")[0] + input.split("1080")[1].substring(1);
    }
  } catch (e){}
  try{
    if (input.indexOf("720") > -1)
    {
        input = input.split("720")[0] + input.split("720")[1].substring(1);
    }
  } catch (e){}
  try{
    if (input.indexOf("480") > -1)
    {
        input = input.split("480")[0] + input.split("480")[1].substring(1);
    }
  } catch (e){}
  try{
    if (input.indexOf("3D") > -1)
    {
        input = input.split("3D")[0] + input.split("3D")[1];
    }
  } catch (e){}
  try{
    if (input.indexOf("BD") > -1)
    {
        input = input.split("BD")[0] + input.split("BD")[1];
    }
  } catch (e){}
  try{

  var numberInString = parseInt(input.replace( /^\D+/g, ''));
  while(numberInString > 9){
    numberInString = parseInt(input.replace( /^\D+/g, ''));
    if(numberInString > 9){
      if (input.indexOf(numberInString) > -1)
      {
          input = input.split(numberInString)[0] + input.split(numberInString)[1];
      }
    }
  }
  } catch (e){}
  try{
  

    input = input.replace(/[^\w\s]/gi, ' ').toLowerCase();
    input = input.split('_').join(' ').trim();
    input = input.replace(/ +(?= )/g,'');
  } catch (e){}
  return input;

}

$('.dropdown')
 .dropdown({
  action: function(text, value) {
   console.log(text);
   console.log(value);
  }
 });