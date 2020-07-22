 var newResponse = response.content.asJSON; 
 
 response.content= '';
 
 newResponse.query.results = response.content.asJSON;
 
 //response.headers['Content-Type']='application/json'; 
 
 //print(rankingResponse.results);
 //var mashUpResponse = response.content.asJSON;
 //mashUpResponse.results = rankingResponse.results;