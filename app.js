let map;
const plots = [];
let activePlotIndex = null;

// ✅ Inițializează harta după ce pagina se încarcă complet
window.addEventListener("load", () => {
  map = L.map("map").setView([45.66, 25.60], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // 📏 Fix pentru afișare pe mobil
  setTimeout(() => map.invalidateSize(), 100);

  // 🟢 Detectează reconectare la internet
  window.addEventListener("online", syncOfflineTrees);
});

map?.on("click", e => {
  const { lat, lng } = e.latlng;

  const circle = L.circle([lat, lng], {
    radius: 12.6,
    color: "gray",
    fillOpacity: 0.3
  }).addTo(map);

  plots.push({
    center: { lat, lon: lng },
    trees: [],
    circle
  });

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

  const tree = { specie, diametru, inaltime, lat: 0, lng: 0 };

  if (activePlotIndex === null) {
    alert("⚠️ Selectează un plot pe hartă.");
    return;
  }

  if (!navigator.onLine) {
    const offlineTrees = JSON.parse(localStorage.getItem("offlineTrees") || "[]");
    offlineTrees.push(tree);
    localStorage.setItem("offlineTrees", JSON.stringify(offlineTrees));
    alert("🌐 Fără conexiune. Arbore salvat local.");
  } else {
    sendToSheets([tree]);
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
      density > 0.06 ? "red" :
      density > 0.03 ? "orange" : "green";
    plot.circle.setStyle({ color });

    const div = document.createElement("div");
    div.textContent = `Plot #${index + 1} — ${count} arbori → Densitate: ${density} arbori/m²`;
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
          if (confirm("Ștergi acest arbore?")) {
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

function exportPlotsCSV() {
  exportCSVOffline(); // folosim aceeași funcție
}

function exportTrees() {
  const allTreesCSVOffline() {
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

function exportPlotsCSV() {
  exportCSVOffline(); // folosim aceeași funcție
}

function exportTrees() {
  const allTrees = plots.flatMap(plot => plot.trees);
  sendToSheets(allTrees);
}

function sendToSheets(trees) {
  fetch("YOUR_GOOGLE_APPS_SCRIPT_URL", {
    method: "POST",
    body: JSON.stringify(trees),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => res.text())
  .then(msg => {
    alert("✅ Arbori trimiși: " + msg);
    renderStats();
    renderTreeList();
  })
  .catch(err => {
    console.error("⛔ Eroare sincronizare:", err);
    alert("❌ Eroare la trimitere.");
  });
}

function syncOfflineTrees() {
  const offlineTrees = JSON.parse(localStorage.getItem("offlineTrees") || "[]");
  if (offlineTrees.length > 0) {
    sendToSheets(offlineTrees);
    localStorage.removeItem("offlineTrees");
  }
}