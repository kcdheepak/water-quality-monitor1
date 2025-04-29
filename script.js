const CHANNEL_ID = "2916390";
const API_KEY = "296041B1B0F708F6";

let tempChart;

function getWaterQuality(tds, turbidity, ph, temp) {
    tds = parseFloat(tds);
    turbidity = parseFloat(turbidity);
    ph = parseFloat(ph);
    temp = parseFloat(temp);

    if ([tds, turbidity, ph, temp].some(v => isNaN(v))) {
        return "Insufficient Data";
    }

    if (turbidity >= 60 && turbidity <= 71 && ph > 8.5) {
        return "Soapy Water";
    } else if (turbidity >= 71 && turbidity <= 81) {
        return "Dirty Water";
    } else if (turbidity >= 38 && turbidity <= 43 && tds < 500 && ph >= 6.5 && ph <= 8.5) {
        return "Fresh Water";
    } else {
        return "Unknown";
    }
}

async function fetchData() {
    try {
        const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${API_KEY}&results=10`;
        const response = await fetch(url);
        const data = await response.json();
        const feeds = data.feeds;

        if (feeds.length > 0) {
            const latestFeed = feeds[feeds.length - 1];
            const tds = latestFeed.field1;
            const turbidity = latestFeed.field2;
            const ph = latestFeed.field3;
            const waterTemp = latestFeed.field4;

            document.getElementById("tds").textContent = tds ? `${tds} ppm` : "N/A";
            document.getElementById("turbidity").textContent = turbidity ? `${turbidity} NTU` : "N/A";
            document.getElementById("ph").textContent = ph || "N/A";
            document.getElementById("waterTemp").textContent = waterTemp ? `${waterTemp} °C` : "N/A";

            const waterQuality = getWaterQuality(tds, turbidity, ph, waterTemp);
            const statusElement = document.getElementById("waterQuality");
            statusElement.textContent = waterQuality;
            statusElement.className = "";
            if (waterQuality === "Fresh Water") {
                statusElement.classList.add("fresh");
            } else if (waterQuality === "Soapy Water") {
                statusElement.classList.add("soapy");
            } else if (waterQuality === "Dirty Water") {
                statusElement.classList.add("dirty");
            } else {
                statusElement.classList.add("unknown");
            }

            // Update temperature chart
            const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString());
            const temps = feeds.map(f => parseFloat(f.field4));

            if (!tempChart) {
                const ctx = document.getElementById("tempChart").getContext("2d");
                tempChart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "Water Temperature (°C)",
                            data: temps,
                            fill: false,
                            borderColor: "rgba(75, 192, 192, 1)",
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: false
                            }
                        }
                    }
                });
            } else {
                tempChart.data.labels = labels;
                tempChart.data.datasets[0].data = temps;
                tempChart.update();
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

window.onload = fetchData;
setInterval(fetchData, 5000);
