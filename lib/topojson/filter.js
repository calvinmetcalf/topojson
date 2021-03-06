var type = require("./type");
var prune = require("./prune");
var clockwise = require("./clockwise");
var systems = require("./coordinate-systems");
var topojson = require("../../");

module.exports = function(topology, options) {
  var system = null;
  var forceClockwise = true; // force exterior rings to be clockwise?

  if (options) {
    if("coordinate-system" in options) {
      system = systems[options["coordinate-system"]];
    }
    if("force-clockwise" in options) {
      forceClockwise = !!options["force-clockwise"];
    }
  }

  if (forceClockwise){
    clockwise(topology, options); // deprecated; for backwards-compatibility
  }

  var filter = type({
    LineString: noop, // TODO remove empty lines
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) {
      polygon.arcs = polygon.arcs.filter(ringArea);
      if (!polygon.arcs.length) {
        polygon.type = null;
        delete polygon.arcs;
      }
    },
    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.arcs.map(function(polygon) {
        return polygon.filter(ringArea);
      }).filter(function(polygon) {
        return polygon.length;
      });
      if (!multiPolygon.arcs.length) {
        multiPolygon.type = null;
        delete multiPolygon.arcs;
      }
    },
    GeometryCollection: function(collection) {
      this.defaults.GeometryCollection.call(this, collection);
      collection.geometries = collection.geometries.filter(function(geometry) { return geometry.type != null; });
      if (!collection.geometries.length) {
        collection.type = null;
        delete collection.geometries;
      }
    }
  });

  for (var key in topology.objects) {
    filter.object(topology.objects[key]);
  }

  prune(topology, options);

  function ringArea(ring) {
    return system.absoluteArea(system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]));
  }
};

/* TODO It might be slightly more compact to reverse the arc.
function reverse(ring) {
  var i = -1, n = ring.length;
  ring.reverse();
  while (++i < n) { 
    ring[i] = ~ring[i];
  }*/

function noop() {}
