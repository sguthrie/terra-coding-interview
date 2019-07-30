// Add fetch to simplify API calls and improve readability
const fetch = require('node-fetch');
// Add yargs to simplify CLI development
const args = require('yargs')
  .command({
    command: 'basic <apiKey> <startStop> <endStop>',
    desc: 'Find route between 2 stops on the MBTA Subway'
  })
  .help()
  .argv;

const apiKey = args._[0];
const startStop = args._[1];
const endStop = args._[2];

const url = 'https://api-v3.mbta.com';
const request = {
  method: 'GET',
  headers: {
    "Content-type":"application/vnd.api+json",
    "apikey": apiKey
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

// Part 3 - Given Array of startRoutes, endRoutes, and adjacency matrix of
// route graph, find path
// Luckily we don't have to deal with shapes given the scope of the problem, no hubs exist on specific branches of routes
function findPath(startPoints, endPoints, adj){
  // ensure both start and end points exist (we found that stop on at
  // least one route)
  if (startPoints.length < 1){
    console.log(`Cannot find start point on the Subway routes`);
    throw new Error(`Cannot find start point on the Subway routes`);
  }
  if (endPoints.length < 1){
    console.log(`Cannot find end point on the Subway routes`);
    throw new Error(`Cannot find end point on the Subway routes`);
  }
  // Check if the start and end points are on the same route
  let sameRoute = intersect(startPoints, endPoints);
  for (routeName of sameRoute.values()){
    return [routeName];
  }
  // build an array for each start route and choose the shortest one to return
  let paths = [];
  for (let p of startPoints){
    paths.push([p])
    // Run BFS - as soon as we hit a route in endPoints, we know it has the
    // fewest transfers (or at least the fewest possible)
    let toExplore = [];
    let explored = [];
    for (let edge of adj[p]){
      toExplore.push(edge);
    }
    while (toExplore.length > 0){
      let edge = toExplore.shift();
      explored.push(edge);
      if (endPoints.includes(edge)){
        // found a route in endPoints!
        paths[paths.length-1].push(edge);
        break;
      }
      for (let nextEdge of adj[edge]){
        if (!explored.includes(nextEdge)){
          toExplore.push(nextEdge);
        }
      }
    }
  }
  // find path with the fewest transfers
  let minPathIndex = 0;
  for (let i=1; i<paths.length;i++){
    if (paths[i].length < paths[minPathIndex].length){
      minPathIndex = i
    }
  }
  return paths[minPathIndex];
}

function addToObjectMap(map, key, value){
  if (key in map){
    map[key].add(value);
  } else {
    map[key] = new Set([value]);
  }
}

if (startStop && endStop){
  console.log(`Starting Stop: ${startStop}, Ending Stop: ${endStop}`);
  mbtaQuery(`${url}/stops?filter[route_type]=0,1`, request)
  .then(stops => {
    // check stops exist
    let stopNames = stops.data.map(stop => stop.attributes.name);
    if (!stopNames.includes(startStop)){
      console.log(`${startStop} is not a valid stop on the Subway routes`);
      throw new Error(`${startStop} is not a valid stop on the Subway routes`);
    }
    if (!stopNames.includes(endStop)){
      console.log(`${endStop} is not a valid stop on the Subway routes`);
      throw new Error(`${endStop} is not a valid stop on the Subway routes`);
    }
  })

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
        mbtaQuery(`${url}/stops?filter[route]=${line.id}`, request)
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
    console.log(`Subway lines: ${routesWithStops.map(route => route.name)}`);
    let maxStopsIndex = 0;
    let minStopsIndex = 0;
    let hubStops = {};
    let lineAdjMatrix = {};
    let startRoute = [];
    let endRoute = [];
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
        let currRouteName = routesWithStops[i].name;
        let otherRouteName = routesWithStops[j].name
        // Add edge i,j to graph
        addToObjectMap(lineAdjMatrix, currRouteName, otherRouteName);
        // Add edge j,i to graph
        addToObjectMap(lineAdjMatrix, otherRouteName, currRouteName);
        // go through each stop which occurs on route[i] and route[j]
        // Add to object hubStops, which maps the stop name to a Set of routes
        // that pass through it. Use Set to take advantage of under-the-hood time
        for (let stop of sharedStops){
          addToObjectMap(hubStops, stop, currRouteName)
          addToObjectMap(hubStops, stop, otherRouteName)
        }
      }
      // Question 3: if these routes contain startStop or endStop, add to list
      if (routesWithStops[i].stops.includes(startStop)){
        startRoute.push(routesWithStops[i].name);
      }
      if (routesWithStops[i].stops.includes(endStop)){
        endRoute.push(routesWithStops[i].name);
      }
    }
    // print max and min stops to console
    let lineMaxStops = routesWithStops[maxStopsIndex];
    let lineMinStops = routesWithStops[minStopsIndex];
    console.log(`Line with most stops: ${lineMaxStops.name} (${lineMaxStops.numStops} stops)`);
    console.log(`Line with fewest stops: ${lineMinStops.name} (${lineMinStops.numStops} stops)`);
    console.log('Stops connecting more than 1 route:')
    for (let stop of Object.entries(hubStops)){
      console.log(`  ${stop[0]}: ${Array.from(stop[1])}`);
    }
    let path = findPath(startRoute, endRoute, lineAdjMatrix);
    let printStr = `${startStop} -> `;
    for (let route of path){
      printStr += `${route} -> `;
    }
    console.log(`${printStr}${endStop}`);
  }).catch(errorMessage => {
    console.log(`Error processing data: ${errorMessage}`)
  })
}

export {intersect,findPath,addToObjectMap};
