let map;
let currentLocation = null;
const plots = [];
let activePlotIndex = null;
const drawnItems = new L.FeatureGroup();
let forestConfig = {};
let defaultPlotRadius = 12.6;
let defaultSpeciesList = [];

window.addEventListener("load", () => {
  map = L.map("map").setView([45.66, 25.60], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  map.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    draw: {
      circle: true,
      polygon: true,
      marker: false,
      polyline: false,
      circlemarker: false
    },
    edit: {
      featureGroup: drawnItems
    }
  });
  map.addControl(drawControl);

  map.on("draw:created", e => drawnItems.addLayer(e.layer));
  setTimeout(() => map.invalidateSize(), 100);
  window.addEventListener("online", syncOfflineTrees);
  renderSpeciesDropdown();
});

function locateMeAndDrawPlot() {
  if (!navigator.geolocation) return alert("Geolocația indisponibilă.");
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    map.setView([lat, lon], 16);

    const circle = L.circle([lat, lon], {
      radius: defaultPlotRadius,
      color: forestConfig.ploturi?.culoare_gps || "blue",
      fillOpacity: 0.3
    }).addTo(map);

    plots.push({ center: { lat, lon }, trees: [], circle });
    activePlotIndex = plots.length - 1;
    renderStats();
    renderTreeList();
  });
}

map?.on("click", e => {
  const { lat, lng } = e.latlng;
  const circle = L.circle([lat, lng], {
    radius: defaultPlotRadius,
    color: forestConfig.ploturi?.culoare_default || "gray",
    fillOpacity: 0.3
  }).addTo(map);

  plots.push({ center: { lat, lon: lng }, trees: [], circle });
  activePlotIndex = plots.length - 1;
  renderStats();
  renderTreeList();
  document.getElementById("tree-form").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("tree-form").addEventListener("submit", e => {
  e.preventDefault();
  const specie = document.getElementById("specie").value;
  const diametru = parseFloat(document.getElementById("diametru").value);
  const inaltime = parseFloat(document.getElementById("inaltime").value);
  const tree = { specie, diametru, inaltime };

  if (activePlotIndex === null) return alert("⚠️ Selectează un plot pe hartă.");

  if (!navigator.onLine) {
    const offlineTrees = JSON.parse(localStorage.getItem("offlineTrees") || "[]");
    offlineTrees.push(tree);
    localStorage.setItem("offlineTrees", JSON.stringify(offlineTrees));
    alert("🌐 Fără conexiune. Arbore salvat local.");
  } else {
    plots[activePlotIndex].trees.push(tree);
    alert(`✅ Arbore salvat în plotul #${activePlotIndex + 1}`);
  }

  e.target.reset();
  renderStats();
  renderTreeList();
});

document.getElementById("search-specie").addEventListener("input", renderTreeList);

function renderStats() {
  const container = document.getElementById("plot-stats");
  container.innerHTML = "<h3>📊 Statistici ploturi:</h3>";
  plots.forEach((plot, index) => {
    const count = plot.trees.length;
    const density = (count / 500).toFixed(3);
    const color =
      density > 0.06 ? (forestConfig.ploturi?.culoare_densitate?.ridicata || "red") :
      density > 0.03 ? (forestConfig.ploturi?.culoare_densitate?.medie || "orange") :
      (forestConfig.ploturi?.culoare_densitate?.scazuta || "green");

    plot.circle.setStyle({ color });
    const div = document.createElement("div");
    div.textContent = `Plot #${index + 1}: ${count} arbori → Densitate: ${density} arbori/m²`;
    container.appendChild(div);
  });
}

function renderTreeList() {
  const container = document.getElementById("tree-list");
  container.innerHTML = "<h3>🌲 Arbori salvați:</h3>";
  const searchValue = document.getElementById("search-specie").value.toLowerCase();

  plots.forEach((plot, pIndex) => {
    plot.trees.forEach((tree, tIndex) => {
      if (tree.specie.toLowerCase().includes(searchValue)) {
        const item = document.createElement("div");
        item.className = "tree-item";
        item.textContent = `Plot #${pIndex + 1}: ${tree.specie} — D:${tree.diametru}cm / H:${tree.inaltime}m`;
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.onclick = () => {
          if (confirm("Ștergi arborele?")) {
            plot.trees.splice(tIndex, 1);
            renderStats();
            renderTreeList();
          }
        };
        item.appendChild(delBtn);
        container.appendChild(item);
      }
    });
  });
}

function exportCSVOffline() {
  let csv = "Plot,Lat,Lon,Specie,Diametru,Înălțime\n";
  plots.forEach((plot, i) => {
    plot.trees.forEach(tree => {
      csv += `${i + 1},${plot.center.lat},${plot.center.lon},${tree.specie},${tree.diametru},${tree.inaltime}\n`;
    });
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "arbori_offline.csv";
  a.click();
}

function exportGeoJSONFull() {
  const features = [];
  plots.forEach((plot, i) => {
    const polygon = generateCircleGeoJSON(plot.center, defaultPlotRadius);
    features.push({
      type: "Feature",
      geometry: polygon,
      properties: {
        tip: "plot",
        index: i + 1,
        arbori: plot.trees.length
      }
    });
    plot.trees.forEach(tree => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [plot.center.lon, plot.center.lat]
        },
        properties: { ...tree, plot: i + 1 }
      });
    });
  });

  drawnItems.eachLayer(layer => {
    features.push({
      type: "Feature",
      geometry: layer.toGeoJSON().geometry,
      properties: { tip: "contur_desenat" }
    });
  });

  const geojson = {
    type: "FeatureCollection",
    features
  };
  const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "forestkit.geojson";
  a.click();
}

function generateCircleGeoJSON(center, radius = 12.6, steps = 32) {
  const coords = [];
  const earthRadius = 6378137;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = radius * Math.cos(angle);
    const dy = radius * Math.sin(angle);
    const lat = center.lat + (dy / earthRadius) * (180 / Math.PI);
    const lon = center.lon + (dx / earthRadius) * (180 / Math.PI) / Math.cos(center.lat * Math.PI / 180);
    coords.push([lon, lat]);
  }
  return { type: "Polygon", coordinates: [coords] };
}

function syncOfflineTrees() {
  const offlineTrees = JSON.parse(localStorage.getItem("offlineTrees") || "[]");
  if (offlineTrees.length > 0) {
    // sincr. cu cloud (ex. Google Sheets) — personalizabil
    localStorage.removeItem("offlineTrees");
  }
}

document.getElementById("geojson-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!