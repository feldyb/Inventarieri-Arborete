let map = L.map("map").setView([45.66, 25.60], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let currentLocation = null;
const trees = [];

map.on("click", e => {
  const { lat, lng } = e.latlng;
  currentLocation = { lat, lng };

  L.circle([lat, lng], {
    radius: 12.6,
    color: "green",
    fillOpacity: 0.2,
  }).addTo(map);

  document.getElementById("tree-form").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("tree-form").addEventListener("submit", e => {
  e.preventDefault();
  if (!currentLocation) return alert("Click pe hartă pentru a selecta locația.");

  const specie = document.getElementById("specie").value;
  const diametru = parseFloat(document.getElementById("diametru").value);
  const inaltime = parseFloat(document.getElementById("inaltime").value);

  trees.push({ specie, diametru, inaltime, ...currentLocation });

  alert("✅ Arbore salvat!");
  e.target.reset();
});

function exportCSVOffline() {
  let csv = "Specie,Diametru,Inaltime,Lat,Lon\n";
  trees.forEach(t => {
    csv += `${t.specie},${t.diametru},${t.inaltime},${t.lat},${t.lng}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "arbori_teren.csv";
  a.click();
}

function exportTrees() {
  if (!navigator.onLine) return alert("📴 Fără conexiune. Folosește exportul offline.");

  fetch("https://script.google.com/macros/s/AKfycbyJtuRY8gDXWdiPX2pJESk2q49DqIdQVcA8PS2EEoB1agtwuuXpqJ3Obee_L7Lgo_DU5w/execRL", {
    method: "POST",
    body: JSON.stringify(trees),
    headers: { "Content-Type": "application/json" },
  }).then(res => {
    if (res.ok) alert("✅ Exportat în Google Sheets!");
    else alert("❌ Eroare la export.");
  }).catch(() => alert("❌ Exportul a eșuat. Verifică semnalul."));
}
