MBTA Subway Route Finder
==========================

Retrieving subway routes
-------------------------

I will be filtering routes using `routes?filter[type]=0,1`. This query is quicker and only responds with the information we want.

Use `node src/entrypoint.js <apiKey> <startStop> <endStop>` to run the program.

Testing
--------

Use `npm test` to run tests.
