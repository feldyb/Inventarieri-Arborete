let map = L.map("map").setView([45.66, 25.60], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const plots = [];
let activePlotIndex = null;

map.on("click", e => {
  const { lat, lng } = e.latlng;

  const plot = {
    center: { lat, lon: lng },
    trees: [],
    circle: null
  };

  const circle = L.circle([lat, lng], {
    radius: 12.6,
    color: "gray",
    fillOpacity: 0.3
  }).addTo(map);

  plot.circle = circle;
  plots.push(plot);
  activePlotIndex = plots.length - 1;

  renderStats();
  renderTreeList();
  document.getElementById("tree-form").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("tree-form").addEventListener("submit", e => {
  e.preventDefault();
  if (activePlotIndex === null) {
    alert("⚠️ Selectează un plot pe hartă.");
    return;
  }

  const specie = document.getElementById("specie").value;
  const diametru = parseFloat(document.getElementById("diametru").value);
  const inaltime = parseFloat(document.getElementById("inaltime").value);

  plots[activePlotIndex].trees.push({ specie, diametru, inaltime });
  alert(`✅ Arbore salvat în plotul #${activePlotIndex + 1}`);
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
    const color = density > 0.06 ? "red" : density > 0.03 ? "orange" : "green";
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
