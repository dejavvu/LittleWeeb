//define global shit that every other shitty piece of shit javascript can access
var jsonWithBots;
var jsonPacksInBot;
var jsonAnimeSearch;
var jsonLatestPacks;

//run this shit diretly on loading
getBotList();

//define shit that gets shit from nibl
function getBotList(callback){
	$.get( "https://api.nibl.co.uk:8080/nibl/bots", function( data ) {
	  jsonWithBots = data['content'];

	});
}

function getPackList(id, name, callback){
	$.get( "https://api.nibl.co.uk:8080/nibl/packs/" + id, function( data ) {
		jsonPacksInBot = data['content'];
	  	callback(name, jsonPacksInBot);
	});
}

function searchForAnime(searchQuery, episodeNumber, callback){
	var episodeNr = -1;
	if(episodeNumber !== undefined){
		episodeNr = episodeNumber;
	}
	$.get( 'https://api.nibl.co.uk:8080/nibl/search?query=' + searchQuery + '&episodeNumber=' + episodeNr, function( data ) {
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
	$.get( 'https://api.nibl.co.uk:8080/nibl/search/' + id + '?query=' + searchQuery + '&episodeNumber=' + episodeNr, function( data ) {
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
	$.get( 'https://api.nibl.co.uk:8080/nibl/latest?size=100', function( data ) {
		jsonLatestPacks = data['content'];
	  	callback(id, jsonLatestPacks);
	});
}

function getCurrentlyAiring(callback){
	var winter;
	var spring;
	var summer;
	var fall;
	var currentlyAiring = [];
	var currentTime = new Date();

	$.get( 'https://api.nibl.co.uk:8080/anilist/series/season?year=' + currentTime.getFullYear() + '&season=winter', function( data ) {
		winter = data['content'];		

		$.get( 'https://api.nibl.co.uk:8080/anilist/series/season?year=' + currentTime.getFullYear() + '&season=spring', function( data ) {
			spring = data['content'];

			$.get( 'https://api.nibl.co.uk:8080/anilist/series/season?year=' + currentTime.getFullYear() + '&season=summer', function( data ) {
				summer = data['content'];

				$.get( 'https://api.nibl.co.uk:8080/anilist/series/season?year=' + currentTime.getFullYear() + '&season=fall', function( data ) {
					fall = data['content'];



					$.each(winter, function(key, val){
						var synonyms = val.synonyms;
						if(val.airing_status == "currently airing"){
							synonyms.push(val.title_romaji);
							synonyms.push(val.title_english);
							//synonyms.push(val.title_japanese);
							var curAirObj = {id : val.id, image_url_med : val.image_url_med, title_romaji : val.title_romaji, title_english : val.title_english, title_japanese : val.title_japanese, synonyms : synonyms};
							currentlyAiring.push(curAirObj);
						}
					});

					$.each(spring, function(key, val){
						var synonyms = val.synonyms;
						if(val.airing_status == "currently airing"){

							synonyms.push(val.title_romaji);
							synonyms.push(val.title_english);
							//synonyms.push(val.title_japanese);
							var curAirObj = {id : val.id, image_url_med : val.image_url_med, title_romaji : val.title_romaji, title_english : val.title_english, title_japanese : val.title_japanese, synonyms : synonyms};
							currentlyAiring.push(curAirObj);
						}
					});

					$.each(summer, function(key, val){
						var synonyms = val.synonyms;
						if(val.airing_status == "currently airing"){

							synonyms.push(val.title_romaji);
							synonyms.push(val.title_english);
							//synonyms.push(val.title_japanese);
							var curAirObj = {id : val.id, image_url_med : val.image_url_med, title_romaji : val.title_romaji, title_english : val.title_english, title_japanese : val.title_japanese, synonyms : synonyms};
							currentlyAiring.push(curAirObj);
						}
					});

					$.each(fall, function(key, val){
						var synonyms = val.synonyms;
						if(val.airing_status == "currently airing"){

							synonyms.push(val.title_romaji);
							synonyms.push(val.title_english);
							//synonyms.push(val.title_japanese);
							var curAirObj = {id : val.id, image_url_med : val.image_url_med, title_romaji : val.title_romaji, title_english : val.title_english, title_japanese : val.title_japanese, synonyms : synonyms};
							currentlyAiring.push(curAirObj);
						}
					});
					console.log(currentlyAiring);
					callback(currentlyAiring);

				});
			});
		});
	});
}