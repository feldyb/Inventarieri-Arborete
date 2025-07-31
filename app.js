const API_KEY = "9cb09ff271e34d97a9aad23bd94066e8"; // <--- pune cheia ta

// Inițializare hartă
const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({ source: new ol.source.OSM() })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([24.9668, 45.9432]),
    zoom: 6
  })
});

const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({ source: vectorSource });
map.addLayer(vectorLayer);

// Încarcă marker-ele din localStorage
const savedPlots = JSON.parse(localStorage.getItem("plots") || "[]");
savedPlots.forEach(plot => addMarker(plot.lon, plot.lat, plot.temp));

function addPlot() {
  if (!navigator.geolocation) {
    alert("Geolocația nu este suportată de acest browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const lon = pos.coords.longitude;
    const lat = pos.coords.latitude;

    // Obține vremea
    const temp = await getWeather(lat, lon);

    addMarker(lon, lat, temp);
    savePlot(lon, lat, temp);

    // Arată info
    document.getElementById("info").style.display = "block";
    document.getElementById("info").innerText = `Plot adăugat la [${lat.toFixed(4)}, ${lon.toFixed(4)}] — ${temp}°C`;

  }, err => {
    alert("Nu s-a putut obține locația: " + err.message);
  });
}

function addMarker(lon, lat, temp) {
  const point = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
  });

  point.setStyle(new ol.style.Style({
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({ color: '#388e3c' }),
      stroke: new ol.style.Stroke({ color: '#1b5e20', width: 2 })
    }),
    text: new ol.style.Text({
      text: `${temp}°C`,
      offsetY: -15,
      fill: new ol.style.Fill({ color: '#1b5e20' }),
      stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
    })
  }));

  vectorSource.addFeature(point);
  map.getView().animate({ center: ol.proj.fromLonLat([lon, lat]), zoom: 15 });
}

function savePlot(lon, lat, temp) {
  const plots = JSON.parse(localStorage.getItem("plots") || "[]");
  plots.push({ lon, lat, temp });
  localStorage.setItem("plots", JSON.stringify(plots));
}

async function getWeather(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ro&appid=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return Math.round(data.main.temp);
  } catch (e) {
    console.error("Eroare la vreme:", e);
    return "?";
  }
}
