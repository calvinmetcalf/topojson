var minHeap = require("./min-heap"),
    systems = require("./coordinate-systems");

module.exports = function(topology, options) {
  var minimumArea = 0;
  var retainProportion;
  var verbose = false;
  var heap = minHeap();
  var maxArea = 0;
  var system = null;
  var triangle;
  var N = 0;
  var M = 0;

  if (options) {
    if("minimum-area" in options){
      minimumArea = +options["minimum-area"];
    }
    if("coordinate-system" in options){
      system = systems[options["coordinate-system"]];
    }
    if("retain-proportion" in options){
      retainProportion = +options["retain-proportion"];
    }
    if("verbose" in options){
      verbose = !!options.verbose;
    }
  }
  topology.arcs.forEach(function(arc) {
    var triangles = [];

    arc.forEach(transformAbsolute(topology.transform));
    var i = 1;
    var n = arc.length - 1;
    for (; i < n; ++i) {
      triangle = arc.slice(i - 1, i + 2);
      triangle[1].area = system.triangleArea(triangle);
      triangles.push(triangle);
      heap.push(triangle);
    }

    // Always keep the arc endpoints!
    arc[0].area = arc[n].area = Infinity;

    N += n + 1;
    i = 0;
    n = triangles.length;
    for (; i < n; ++i) {
      triangle = triangles[i];
      triangle.previous = triangles[i - 1];
      triangle.next = triangles[i + 1];
    }
  });
  triangle = heap.pop();
  while (triangle) {
    var previous = triangle.previous;
    var next = triangle.next;

    // If the area of the current point is less than that of the previous point
    // to be eliminated, use the latter's area instead. This ensures that the
    // current point cannot be eliminated without eliminating previously-
    // eliminated points.
    if (triangle[1].area < maxArea) {
      triangle[1].area = maxArea;
    } else {
      maxArea = triangle[1].area;
    }

    if (previous) {
      previous.next = next;
      previous[2] = triangle[2];
      update(previous);
    }

    if (next) {
      next.previous = previous;
      next[0] = triangle[0];
      update(next);
    }
    triangle = heap.pop();
  }

  if (retainProportion) {
    var areas = [];
    topology.arcs.forEach(function(arc) {
      arc.forEach(function(point) {
        areas.push(point.area);
      });
    });
    minimumArea = areas.sort(function(a, b) { return b - a; })[Math.ceil((N - 1) * retainProportion)];
    if (verbose) {
      console.warn("simplification: effective minimum area " + minimumArea.toPrecision(3));
    }
  }

  topology.arcs = topology.arcs.map(function(arc) {
    return arc.filter(function(point) {
      return point.area >= minimumArea;
    });
  });

  topology.arcs.forEach(function(arc) {
    arc.forEach(transformRelative(topology.transform));
    M += arc.length;
  });

  function update(triangle) {
    heap.remove(triangle);
    triangle[1].area = system.triangleArea(triangle);
    heap.push(triangle);
  }

  if (verbose) {
    console.warn("simplification: retained " + M + " / " + N + " points (" + Math.round((M / N) * 100) + "%)");
  }

  return topology;
};

function transformAbsolute(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point) {
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
  };
}

function transformRelative(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point) {
    var x1 = (point[0] - dx) / kx | 0,
        y1 = (point[1] - dy) / ky | 0;
    point[0] = x1 - x0;
    point[1] = y1 - y0;
    x0 = x1;
    y0 = y1;
  };
}
