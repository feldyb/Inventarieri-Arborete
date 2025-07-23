let map;
let vectorLayer;
let plots = [];

window.addEventListener("load", () => {
  const vectorSource = new ol.source.Vector({ features: [] });

  vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "#2e7d32", width: 2 }),
      fill: new ol.style.Fill({ color: "rgba(46,125,50,0.3)" }),
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({ color: "#388e3c" }),
        stroke: new ol.style.Stroke({ color: "#1b5e20", width: 2 })
      })
    })
  });

  map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({ source: new ol.source.OSM() }),
      vectorLayer
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([25.6, 45.66]),
      zoom: 15
    })
  });
});

function addPlot() {
  const view = map.getView();
  const center = ol.proj.toLonLat(view.getCenter());
  const plot = new ol.Feature({
    geometry: new ol.geom.Circle(ol.proj.fromLonLat(center), 12.6)
  });

  vectorLayer.getSource().addFeature(plot);
  plots.push(center);
  alert(`✅ Plot plasat la: ${center[1].toFixed(5)}°, ${center[0].toFixed(5)}°`);
}