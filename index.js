var auth = {
	//
	// Update with your auth tokens.
	//
	consumerKey : "VcorIbaSpj8GD7V24e8xjw",
	consumerSecret : "dhVxHvYaPWMqSt_VbgAXCghnW_4",
	accessToken : "oiipBJSGOt4MSJr1nR10pWTrVIDGfCT5",
	// This example is a proof of concept, for how to use the Yelp v2 API with javascript.
	// You wouldn't actually want to expose your access token secret like this in a real application.
	accessTokenSecret : "6xyDVOa-e-TJq6ULHPbepIF7QLU",
	serviceProvider : {
		signatureMethod : "HMAC-SHA1"
	}
};

var accessor = {
	consumerSecret : auth.consumerSecret,
	tokenSecret : auth.accessTokenSecret
};

parameters = [];
parameters.push(['callback', 'cb']);
parameters.push(['oauth_consumer_key', auth.consumerKey]);
parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
parameters.push(['oauth_token', auth.accessToken]);
parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
var us_states = [{name:"Alabama",abbreviation:"AL"},{name:"Alaska",abbreviation:"AK"},{name:"American Samoa",abbreviation:"AS"},{name:"Arizona",abbreviation:"AZ"},{name:"Arkansas",abbreviation:"AR"},{name:"California",abbreviation:"CA"},{name:"Colorado",abbreviation:"CO"},{name:"Connecticut",abbreviation:"CT"},{name:"Delaware",abbreviation:"DE"},{name:"District Of Columbia",abbreviation:"DC"},{name:"Florida",abbreviation:"FL"},{name:"Georgia",abbreviation:"GA"},{name:"Guam",abbreviation:"GU"},{name:"Hawaii",abbreviation:"HI"},{name:"Idaho",abbreviation:"ID"},{name:"Illinois",abbreviation:"IL"},{name:"Indiana",abbreviation:"IN"},{name:"Iowa",abbreviation:"IA"},{name:"Kansas",abbreviation:"KS"},{name:"Kentucky",abbreviation:"KY"},{name:"Louisiana",abbreviation:"LA"},{name:"Maine",abbreviation:"ME"},{name:"Maryland",abbreviation:"MD"},{name:"Massachusetts",abbreviation:"MA"},{name:"Michigan",abbreviation:"MI"},{name:"Minnesota",abbreviation:"MN"},{name:"Mississippi",abbreviation:"MS"},{name:"Missouri",abbreviation:"MO"},{name:"Montana",abbreviation:"MT"},{name:"Nebraska",abbreviation:"NE"},{name:"Nevada",abbreviation:"NV"},{name:"New Hampshire",abbreviation:"NH"},{name:"New Jersey",abbreviation:"NJ"},{name:"New Mexico",abbreviation:"NM"},{name:"New York",abbreviation:"NY"},{name:"North Carolina",abbreviation:"NC"},{name:"North Dakota",abbreviation:"ND"},{name:"Northern Mariana Islands",abbreviation:"MP"},{name:"Ohio",abbreviation:"OH"},{name:"Oklahoma",abbreviation:"OK"},{name:"Oregon",abbreviation:"OR"},{name:"Pennsylvania",abbreviation:"PA"},{name:"Puerto Rico",abbreviation:"PR"},{name:"Rhode Island",abbreviation:"RI"},{name:"South Carolina",abbreviation:"SC"},{name:"South Dakota",abbreviation:"SD"},{name:"Tennessee",abbreviation:"TN"},{name:"Texas",abbreviation:"TX"},{name:"Utah",abbreviation:"UT"},{name:"Vermont",abbreviation:"VT"},{name:"Virginia",abbreviation:"VA"},{name:"Washington",abbreviation:"WA"},{name:"West Virginia",abbreviation:"WV"},{name:"Wisconsin",abbreviation:"WI"},{name:"Wyoming",abbreviation:"WY"}];
var pending_promises = [];

//Using promise object because ajax behaves asynchronously. We only execute the data in Promise.all when all of the ajax calls have returned.
for(var i = 0; i < us_states.length; i++){
	var p = new Promise(function(resolve, reject){
		//Only returning the top 20 business for each state.
		var message = {
			'action' : 'http://api.yelp.com/v2/search?term=food&location='+us_states[i].name+'&sort=2', 
			'method' : 'GET',
			'parameters' : parameters
		};

		OAuth.setTimestampAndNonce(message);
		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)
		$.ajax({
			'url' : message.action,
			'data' : parameterMap,
			'cache' : true,
			'dataType' : 'jsonp',
			
			'success' : function(data, textStats, XMLHttpRequest) {
				resolve(data.businesses);
			}
		});
	});
	pending_promises.push(p);
}

var hm = [];
Promise.all(pending_promises).then(function(result){
	console.log(result);
	/*execute the data filtering here. result consists of the top rated food businesses in each state. 
	We gather the count of categories and store them into an associative array.*/
	for(var i = 0; i < result.length; i++){
		for(var x = 0; x < result[i].length; x++){
			var business = result[i][x];
			var categories = business.categories[0]; //categories consists of arrays of categories
			for(var j = 0; j < categories.length; j++){
				if(hm[categories[0]] == undefined){
					hm[categories[0]] = 1;
				}
				else{
					hm[categories[0]]+=1;
				}
			}
		}
	}
	var sorted_hm = getSortedKeys(hm); //Sorted array of objects with food category and the number of businesses belonging to that category.
	console.log(sorted_hm);
	var message = {
			'action' : 'http://api.yelp.com/v2/search?term=food&location='+"Champaign"+'&sort=2', 
			'method' : 'GET',
			'parameters' : parameters
		};

	//var sortdat = {}
	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);
	var parameterMap = OAuth.getParameterMap(message.parameters);
	parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)
	$.ajax({
		'url' : message.action,
		'data' : parameterMap,
		'cache' : true,
		'dataType' : 'jsonp',
		
		'success' : function(data, textStats, XMLHttpRequest) {
			console.log(data.businesses);
			var sortdat = {};
			for(var i = 0; i < data.businesses.length; i++){
				var business = data.businesses[i];
				for(var j = 0; j < business.categories.length; j++){
					var category = business.categories[j][0];
					if(sortdat[category] == undefined){
						sortdat[category] = [business.name];
					}
					else{
						sortdat[category].push(business.name);
					}
				}
			}
			console.log(JSON.stringify(sortdat));
		}
	});
});

function getSortedKeys(obj) {
    var keys = []; for(var key in obj) keys.push({key:key, value:obj[key]});
    return keys.sort(function(a,b){return b.value-a.value});
}