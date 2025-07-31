<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Forest Plot Map</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v7.5.0/ol.css">
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script type="module">
    import Map from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/Map.js";
    import View from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/View.js";
    import TileLayer from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/layer/Tile.js";
    import VectorLayer from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/layer/Vector.js";
    import VectorSource from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/source/Vector.js";
    import OSM from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/source/OSM.js";
    import {Circle as CircleGeom, Point} from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/geom.js";
    import Feature from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/Feature.js";
    import {Style, Fill, Stroke, Circle as CircleStyle} from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/style.js";
    import {fromLonLat, toLonLat} from "https://cdn.jsdelivr.net/npm/ol@v7.5.0/proj.js";

    let map;
    let plots = [];
    let vectorSource;
    let vectorLayer;

    // Inițializare hartă
    window.addEventListener("load", () => {
      vectorSource = new VectorSource();

      vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({ color: "#2e7d32", width: 2 }),
          fill: new Fill({ color: "rgba(46,125,50,0.3)" }),
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: "#388e3c" }),
            stroke: new Stroke({ color: "#1b5e20", width: 2 })
          })
        })
      });

      map = new Map({
        target: "map",
        layers: [
          new TileLayer({ source: new OSM() }),
          vectorLayer
        ],
        view: new View({
          center: fromLonLat([25.60, 45.66]),
          zoom: 15
        })
      });

      // Click pentru adăugare plot
      map.on("click", function (evt) {
        const coord = toLonLat(evt.coordinate);
        addPlot(coord);
      });
    });

    // Adaugă un plot (cerc de 12.6m rază)
    function addPlot(lonLatCoord) {
      const centerProjected = fromLonLat(lonLatCoord);
      const radiusInMeters = 12.6;

      const circle = new CircleGeom(centerProjected, radiusInMeters);
      const feature = new Feature(circle);
      vectorSource.addFeature(feature);

      plots.push(lonLatCoord);

      alert(`✅ Plot plasat la: ${lonLatCoord[1].toFixed(5)}°, ${lonLatCoord[0].toFixed(5)}°`);
    }
  </script>
</body>
</html>
