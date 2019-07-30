require("../src/entrypoint.js");
const Main = require("../src/main.js");
const assert = require('assert');

/*
Graph:
       A--B--C
       | /
       D
*/

const adj = {
  'A': new Set(['B','D']),
  'B': new Set(['A','C','D']),
  'C': new Set(['C']),
  'D': new Set(['A','B'])
};

describe('Terra Coding Interview', function() {
  describe('intersect', function(){
    it('returns a Set containing the intersection of 2 arrays', function() {
      assert(Main.intersect(['A', 'B', 'with spaces'], ['withspaces','with spaces','B','B']), new Set(['with spaces', 'B']));
    });
    it('returns an empty Set if the 2 arrays have nothing in common', function (){
      assert(Main.intersect(['A'],['B','C']), new Set());
    });
  });
  describe('addToObjectMap', function() {
    it('adds a new Set containing value to map (Object) if the key does not already exist', function () {
      let o = {'bar':new Set(['baz'])};
      Main.addToObjectMap(o, 'foo', 'bar');
      assert(o, {'foo':new Set(['bar']), 'bar': new Set(['baz'])});
    });
    it('adds the value to the Set associated with key in map if key already exists', function () {
      let o = {'foo':new Set(['bar'])};
      Main.addToObjectMap(o, 'foo', 'baz');
      assert(o,{'foo': new Set(['bar', 'baz'])});
    });
  });
  describe('findPath', function() {
    it('returns an array of one route if starting and ending on the same route', function () {
      assert(Main.findPath(['A'], ['B','A'], adj), ['A']);
    });
    it ('returns an array of one route if starting and ending on the same route (multiple starting points)', function () {
      assert(Main.findPath(['A', 'B'], ['B'], adj), ['A']);
    })
    it ('returns an array of the shortest route', function (){
      assert(Main.findPath(['D'], ['C'], adj), ['D','B','C']);
    });
    it ('returns an array of the shortest route if there are multiple starting routes', function (){
      assert(Main.findPath(['D','B'], ['C'], adj), ['B','C']);
    })
    it ('returns an array of the shortest routes if there are multiple ending routes', function () {
      assert(Main.findPath(['C'], ['D','B'], adj), ['C','B']);
    })
  });
});
