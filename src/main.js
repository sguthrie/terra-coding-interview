// Add fetch to simplify API calls and improve readability
//import fetch from 'node=fetch';
const fetch = require('node-fetch');
// TODO: Make more secure
const apiKey = '32906aa2ad08461bb7c0ec2ac8fea36e';
const url = 'https://api-v3.mbta.com/';

// Basic GET routes query with specified endpoint
const getRoutes = async (endpoint, lineFunction) => {
  try{
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        "Content-type":"application/vnd.api+json",
        "apikey": apiKey
      }
    });
    if (response.ok){
      const responseJson = await response.json();
      responseJson.data.forEach(lineFunction);
      return responseJson;
    }
    throw new Error(response.statusText);
  } catch(error){
    console.log(error);
  }
}
/*

let allRoutes = `${url}routes`;
getRoutes(allRoutes);
*/
const filteredRoutes = `${url}routes?filter[type]=0,1`;
//getRoutes(filteredRoutes, line => {console.log(line.attributes.long_name);})

const routesWithStops = `${filteredRoutes}&include=line,route_patterns,stop`;
getRoutes(routesWithStops,line => {
  console.log(line);
});
/*
.then(responseJson => {
  let mostStops = {
    name: null,
    numStops: 0
  }
  let leastStops = {
    name: null,
    numStops: 0
  }
  for (let line of responseJson.data){
    console.log(line);
    console.log(line.relationships);
  }
}, message => {
  console.log(message);
});
*/
