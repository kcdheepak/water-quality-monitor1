const CHANNEL_ID = "2916390";
const API_KEY = "296041B1B0F708F6";

const WATER_TEMPERATURE_THRESHOLD = 25; // Ideal water temperature in °C
const TDS_THRESHOLD = 500; // TDS value in ppm for fresh water
const TURBIDITY_THRESHOLD = 10; // Turbidity threshold for clean water
const PH_LOW_THRESHOLD = 6.5; // Lower acceptable pH value for healthy water
const PH_HIGH_THRESHOLD = 8.5; // Upper acceptable pH value for healthy water

let chart; // global chart instance

// EmailJS Setup (Replace with your own EmailJS credentials)
const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';
const EMAILJS_USER_ID = 'YOUR_EMAILJS_USER_ID';

// This function sends an email when the water quality is poor
async function sendEmailNotification(waterQuality) {
    const templateParams = {
        from_name: 'Water Quality Monitoring System',
        to_email: 'YOUR_EMAIL_ADDRESS', // Replace with your email
        subject: `Water Quality Alert - ${waterQuality}`,
        message: `Warning: The water quality has been detected as ${waterQuality}. Please take necessary actions.`,
    };

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_USER_ID);
        console.log("Email notification sent!");
    } catch (error) {
        console.error("Error sending email:", error);
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
            const tds = latestFeed.field1 || 'N/A';
            const turbidity = latestFeed.field2 || 'N/A';
            const ph = latestFeed.field3 || 'N/A';
            const waterTemp = latestFeed.field4 || 'N/A';

            document.getElementById("tds").textContent = tds + " ppm";
            document.getElementById("turbidity").textContent = turbidity + " NTU";
            document.getElementById("ph").textContent = ph;
            document.getElementById("waterTemp").textContent = waterTemp + " °C";

            // Determine water quality
            const waterQuality = getWaterQuality(tds, turbidity, ph, waterTemp);
            document.getElementById("waterQuality").textContent = waterQuality;

            // Update the color based on the water quality
            const statusElement = document.getElementById("waterQuality");
            if (waterQuality === 'Fresh Water') {
                statusElement.classList.add('fresh');
                statusElement.classList.remove('soapy', 'dirty');
            } else if (waterQuality === 'Soapy Water') {
                statusElement.classList.add('soapy');
                statusElement.classList.remove('fresh', 'dirty');
            } else {
                statusElement.classList.add('dirty');
                statusElement.classList.remove('soapy', 'fresh');
            }

            // Extract chart data
            const labels = feeds.map(feed => new Date(feed.created_at).toLocaleTimeString());
            const tdsData = feeds.map(feed => parseFloat(feed.field1));
            const turbidityData = feeds.map(feed => parseFloat(feed.field2));
            const phData = feeds.map(feed => parseFloat(feed.field3));
            const waterTempData = feeds.map(feed => parseFloat(feed.field4));

            updateChart(labels, tdsData, turbidityData, phData, waterTempData);
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data from ThingSpeak.");
    }
}

function getWaterQuality(tds, turbidity, ph, waterTemp) {
    // Determine if the water is Soapy, Dirty, or Fresh based on the thresholds
    if (parseFloat(tds) > TDS_THRESHOLD && parseFloat(ph) > 8) {
        return "Soapy Water";
    } else if (parseFloat(turbidity) > TURBIDITY_THRESHOLD || parseFloat(ph) < PH_LOW_THRESHOLD || parseFloat(ph) > PH_HIGH_THRESHOLD) {
        return "Dirty Water";
    } else if (parseFloat(waterTemp) > WATER_TEMPERATURE_THRESHOLD) {
        return "Fresh Water";
    } else {
        return "Fresh Water";
    }
}

function updateChart(labels, tdsData, turbidityData, phData, waterTempData) {
    const ctx = document.getElementById('dataChart').getContext('2d');

    if (chart) chart.destroy(); // reset existing chart

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'TDS (ppm)',
                    data: tdsData,
                    borderColor: '#2980B9',
                    backgroundColor: 'rgba(41, 128, 185, 0.3)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Turbidity (NTU)',
                    data: turbidityData,
                    borderColor: '#E67E22',
                    backgroundColor: 'rgba(230, 126, 34, 0.3)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'pH Level',
                    data: phData,
                    borderColor: '#27AE60',
                    backgroundColor: 'rgba(39, 174, 96, 0.3)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Water Temperature (°C)',
                    data: waterTempData,
                    borderColor: '#8E44AD',
                    backgroundColor: 'rgba(142, 68, 173, 0.3)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Fetch data continuously every 30 seconds (adjust as needed)
setInterval(fetchData, 30000); // 30 seconds interval

// Load data on page load
window.onload = fetchData;
