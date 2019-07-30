// Add fetch to simplify API calls and improve readability
//import fetch from 'node=fetch';
const fetch = require('node-fetch');
// TODO: Make more secure
const url = 'https://api-v3.mbta.com';
const request = {
  method: 'GET',
  headers: {
    "Content-type":"application/vnd.api+json",
    "apikey": '32906aa2ad08461bb7c0ec2ac8fea36e'
  }
}
// Basic query to MBTA endpoint with specified endpoint
// returns Promise for MBTA API Query
const mbtaQuery = async (endpoint, request) => {
  try{
    const response = await fetch(endpoint, request);
    if (response.ok){
      const responseJson = await response.json();
      return responseJson;
    }
    throw new Error(response.statusText);
  } catch(error){
    console.log(error);
  }
}

//Return intersection of 2 arrays (a and b)
function intersect(a,b) {
  return new Set(a.filter(Set.prototype.has, new Set(b)));
}

// Create array to contain objects with the routes - filled with information
// from requests
const routes = []
// Query for all "Subway" routes
mbtaQuery(`${url}/routes?filter[type]=0,1`, request)
.then(routesResponse => {
  // Build array for each route to query for its stops
  const mbtaStopQueries = [];
  for (let line of routesResponse.data) {
    mbtaStopQueries.push(
      mbtaQuery(`${url}/stops?filter[route]=${line.id}`, request);
    );
    // Add the name of the line to the routes array - guarenteed to be in the
    // same order as the query return values in the returned promise
    routes.push({name: line.attributes.long_name});
  }
  // Use advantage of concurrency - the queries for each stop don't need to be
  // performed in any particular order
  return Promise.all(mbtaStopQueries);
}).catch( errorMessage => {
  console.log(`Route query ERROR: ${errorMessage}`);
}).then( queryArray => {
  // Once the stop queries are returned, add number of Stops and human readable
  // names to routes object
  for (let i=0; i<queryArray.length; i++){
    routes[i].numStops = queryArray[i].data.length;
    routes[i].stops = queryArray[i].data.map(stop => stop.attributes.name);
  }
  return routes;
}).catch( errorMessage => {
  console.log(`Stop query ERROR: ${errorMessage}`)
}).then(routesWithStops => {
  // Question 1: log Route name to console
  console.log(routesWithStops.map(route => route.name));
  let maxStopsIndex = 0;
  let minStopsIndex = 0;
  let hubStops = {};
  for (let i=0; i<routesWithStops.length; i++){
    // Question 2: track line with the maximal number of stops and update index accordingly
    if (routesWithStops[i].numStops > routesWithStops[maxStopsIndex].numStops){
      maxStopsIndex = i;
    }
    // Question 2: track line with the minimal number of stops and update index accordingly
    if (routesWithStops[i].numStops < routesWithStops[minStopsIndex].numStops){
      minStopsIndex = i;
    }
    // Question 2: find stops where more than one route stops
    // Don't bother redoing work - only look at the routes we haven't looked over
    // yet.
    for (let j=i+1; j<routesWithStops.length; j++){
      let sharedStops = intersect(routesWithStops[i].stops, routesWithStops[j].stops);
      // go through each stop which occurs on route[i] and route[j]
      // Add to object hubStops, which maps the stop name to a Set of routes
      // that pass through it. Use Set to take advantage of under-the-hood time
      for (let stop of sharedStops){
        if (stop in hubStops){
          hubStops[stop].add(routesWithStops[i].name);
          hubStops[stop].add(routesWithStops[j].name);
        } else {
          hubStops[stop] =  new Set([routesWithStops[i].name, routesWithStops[j].name])
        }
      }
    }
  }
  let lineMaxStops = routesWithStops[maxStopsIndex];
  let lineMinStops = routesWithStops[minStopsIndex];
  console.log(`Line with most stops: ${lineMaxStops.name} (${lineMaxStops.numStops} stops)`);
  console.log(`Line with fewest stops: ${lineMinStops.name} (${lineMinStops.numStops} stops)`);
  console.log(hubStops);
})
