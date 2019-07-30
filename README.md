MBTA Subway Route Finder
==========================

Finds a route involving the fewest possible number of transfers between 2 stops in the MBTA Subway system.

Installing
-----------
To install, run `npm install`

Retrieving subway routes
-------------------------

Use `node src/entrypoint.js <startStop> <endStop> [<apiKey>]` to run the program.
The API Token (issued by the MBTA) may be provided to prevent your queries from
unexpectedly failing.

I will be filtering routes using `routes?filter[type]=0,1`. This query is quicker and only responds with the information we want.

Testing
--------

Use `npm test` to run tests.
