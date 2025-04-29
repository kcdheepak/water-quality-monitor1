const CHANNEL_ID = "2916390";
const API_KEY = "296041B1B0F708F6";

const WATER_LEVEL_THRESHOLD = 100; // Set your desired threshold value here (in cm)
let chart; // global chart instance

// EmailJS Setup (Replace with your own EmailJS credentials)
const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';
const EMAILJS_USER_ID = 'YOUR_EMAILJS_USER_ID';

// This function sends an email when the water level exceeds the threshold
async function sendEmailNotification(waterLevel) {
    const templateParams = {
        from_name: 'Water Monitoring System',
        to_email: 'YOUR_EMAIL_ADDRESS', // Replace with your email
        subject: 'Water Level Exceeded Threshold!',
        message: `Warning: The water level has exceeded the threshold. Current water level is ${waterLevel} cm.`,
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
            const waterLevel = latestFeed.field1 || 'N/A';
            const waterTemp = latestFeed.field2 || 'N/A';

            document.getElementById("waterLevel").textContent = waterLevel + " cm";
            document.getElementById("waterTemp").textContent = waterTemp + " °C";

            // Check if water level exceeds threshold and send email notification
            if (parseFloat(waterLevel) > WATER_LEVEL_THRESHOLD) {
                alert("Warning: Water level exceeds threshold! Current level: " + waterLevel + " cm");
                sendEmailNotification(waterLevel);
            }

            // Extract chart data
            const labels = feeds.map(feed => new Date(feed.created_at).toLocaleTimeString());
            const waterLevelData = feeds.map(feed => parseFloat(feed.field1));
            const waterTempData = feeds.map(feed => parseFloat(feed.field2));

            updateChart(labels, waterLevelData, waterTempData);
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data from ThingSpeak.");
    }
}

function updateChart(labels, waterLevelData, waterTempData) {
    const ctx = document.getElementById('dataChart').getContext('2d');

    if (chart) chart.destroy(); // reset existing chart

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Water Level (cm)',
                    data: waterLevelData,
                    borderColor: '#0077b6',
                    backgroundColor: 'rgba(0, 119, 182, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Water Temp (°C)',
                    data: waterTempData,
                    borderColor: '#f77f00',
                    backgroundColor: 'rgba(247, 127, 0, 0.2)',
                    fill: true,
                    tension: 0.3
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
