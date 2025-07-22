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

  const drawControl = new