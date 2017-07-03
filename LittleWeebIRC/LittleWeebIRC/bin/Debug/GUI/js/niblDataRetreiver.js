//define global shit that every other shitty piece of shit javascript can access
var jsonWithBots;
var jsonPacksInBot;
var jsonAnimeSearch;
var jsonLatestPacks;

//run this shit diretly on loading
getBotList();

//define shit that gets shit from nibl
function getBotList(callback){
	$.get( "http://api.nibl.co.uk:8080/nibl/bots", function( data ) {
	  jsonWithBots = data['content'];

	});
}

function getPackList(id, name, callback){
	$.get( "http://api.nibl.co.uk:8080/nibl/packs/" + id, function( data ) {
		jsonPacksInBot = data['content'];
	  	callback(name, jsonPacksInBot);
	});
}

function searchForAnime(searchQuery, episodeNumber, callback){
	var episodeNr = -1;
	if(episodeNumber !== undefined){
		episodeNr = episodeNumber;
	}
	$.get( 'http://api.nibl.co.uk:8080/nibl/search?query=' + searchQuery + '&episodeNumber=' + episodeNr, function( data ) {
		jsonAnimeSearch = data['content'];
	  	callback(jsonAnimeSearch);
	}).fail(function() {
	    callback("");
    });
}

function searchForAnimePerBot(id, searchQuery, episodeNumber, callback){
	var episodeNr = -1;
	if(episodeNumber !== undefined){
		episodeNr = episodeNumber;
	}
	$.get( 'http://api.nibl.co.uk:8080/nibl/search/' + id + '?query=' + searchQuery + '&episodeNumber=' + episodeNr, function( data ) {
		jsonAnimeSearch = data['content'];
	  	callback(jsonAnimeSearch);
	});
}

function getBotNamePerID(id){
	if(jsonWithBots.length > 0){
		var name = "unknown";
		$.each(jsonWithBots, function(i, v) {
			//console.log("comparing: " + v.id + " to " + id);
		    if (v.id == id) {
		    	name = v.name;
		        return;
		    }
		});
		return name;
	} else {
		return "unknown";
	}
}

function getLatestPacks(id, callback){
	$.get( 'http://api.nibl.co.uk:8080/nibl/latest?size=100', function( data ) {
		jsonLatestPacks = data['content'];
	  	callback(id, jsonLatestPacks);
	});
}