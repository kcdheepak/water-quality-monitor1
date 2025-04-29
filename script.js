const CHANNEL_ID = "2916390";
const API_KEY = "296041B1B0F708F6";

const WATER_TEMPERATURE_THRESHOLD = 25;
const TDS_THRESHOLD = 500;
const TURBIDITY_THRESHOLD = 10;
const PH_LOW_THRESHOLD = 6.5;
const PH_HIGH_THRESHOLD = 8.5;

let chart;

function getWaterQuality(tds, turbidity, ph, waterTemp) {
    tds = parseFloat(tds);
    turbidity = parseFloat(turbidity);
    ph = parseFloat(ph);
    waterTemp = parseFloat(waterTemp);

    if (isNaN(tds) || isNaN(turbidity) || isNaN(ph) || isNaN(waterTemp)) {
        console.warn("Invalid sensor values:", { tds, turbidity, ph, waterTemp });
        return "Insufficient Data";
    }

    if (tds > TDS_THRESHOLD && ph > 8.5) {
        return "Soapy Water";
    } else if (turbidity > TURBIDITY_THRESHOLD || ph < PH_LOW_THRESHOLD || ph > PH_HIGH_THRESHOLD) {
        return "Dirty Water";
    } else {
        return "Fresh Water";
    }
}

async function fetchData() {
    try {
        const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${API_KEY}&results=1`;
        const response = await fetch(url);
        const data = await response.json();
        const feeds = data.feeds;

        if (feeds.length > 0) {
            const latestFeed = feeds[0];
            const tds = latestFeed.field1;
            const turbidity = latestFeed.field2;
            const ph = latestFeed.field3;
            const waterTemp = latestFeed.field4;

            console.log("Sensor values:", { tds, turbidity, ph, waterTemp });

            document.getElementById("tds").textContent = tds ? `${tds} ppm` : "N/A";
            document.getElementById("turbidity").textContent = turbidity ? `${turbidity} NTU` : "N/A";
            document.getElementById("ph").textContent = ph || "N/A";
            document.getElementById("waterTemp").textContent = waterTemp ? `${waterTemp} °C` : "N/A";

            const waterQuality = getWaterQuality(tds, turbidity, ph, waterTemp);
            const statusElement = document.getElementById("waterQuality");
            statusElement.textContent = waterQuality;
            statusElement.classList.remove("fresh", "soapy", "dirty");

            if (waterQuality === "Fresh Water") {
                statusElement.classList.add("fresh");
            } else if (waterQuality === "Soapy Water") {
                statusElement.classList.add("soapy");
            } else if (waterQuality === "Dirty Water") {
                statusElement.classList.add("dirty");
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

window.onload = fetchData;
setInterval(fetchData, 3000);
