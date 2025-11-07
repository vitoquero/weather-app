async function getHourlyWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    const data = await res.json();
    return data.hourly;
}

function drawLineChart(ctx, labels, temps, codes, theme) {
    const width = ctx.canvas.clientWidth;
    const height = ctx.canvas.clientHeight;
    ctx.canvas.width = width * window.devicePixelRatio;
    ctx.canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const chartWidth = width - 80;
    const chartHeight = height - 100;
    const originX = 50;
    const originY = height - 50;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;

    const axisColor = theme === "dark" ? "#cbd5e1" : "#444";
    const lineColor = theme === "dark" ? "#38bdf8" : "#2563eb";
    const pointColor = theme === "dark" ? "#0ea5e9" : "#3b82f6";
    const textColor = theme === "dark" ? "#f1f5f9" : "#333";

    const max = Math.max(...temps);
    const min = Math.min(0, Math.min(...temps));
    const stepX = chartWidth / (temps.length - 1);
    const stepY = chartHeight / (max - min);

    ctx.strokeStyle = axisColor;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX, originY - (0 - min) * stepY);
    ctx.lineTo(originX + chartWidth + 10, originY - (0 - min) * stepY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(originX, originY - (temps[0] - min) * stepY);
    for (let i = 1; i < temps.length; i++) {
        const x = originX + i * stepX;
        const y = originY - (temps[i] - min) * stepY;
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = lineColor;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = `${Math.max(10, width / 90)}px sans-serif`;

    for (let i = 0; i < temps.length; i++) {
        const x = originX + i * stepX;
        const y = originY - (temps[i] - min) * stepY;

        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.fillText(`${temps[i].toFixed(1)}°`, x, y - 8);
    }

    const iconMap = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
        45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️",
        61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "❄️",
        80: "🌦️", 95: "⛈️"
    };

    ctx.font = `${Math.max(10, width / 110)}px sans-serif`;

    for (let i = 0; i < labels.length; i++) {
        const x = originX + i * stepX;
        const icon = iconMap[codes[i]] || "❓";

        ctx.textBaseline = "alphabetic";
        ctx.fillText(icon, x, originY - (0 - min) * stepY - 15);

        ctx.textBaseline = "top";
        ctx.fillStyle = textColor;
        ctx.fillText(labels[i], x, originY + 10);
    }

    ctx.textBaseline = "bottom";
    ctx.fillStyle = textColor;
    ctx.fillText(`Max: ${max.toFixed(1)}°C`, width - 100, 40);
    ctx.fillText(`0°C baseline`, width - 100, 60);
}

function renderChart(ctx, data, theme) {
    const hours = data.time.map((t) => {
        const d = new Date(t);
        return `${String(d.getHours()).padStart(2, "0")}:00`;
    });

    drawLineChart(ctx, hours, data.temperature_2m, data.weathercode, theme);
}

async function initChart() {
    const body = document.body;
    const loadingMessage = document.getElementById("loading-message");
    const canvas = document.getElementById("tempChart");
    const ctx = canvas.getContext("2d");
    const params = new URLSearchParams(window.location.search);
    localStorage.setItem("lastLat", params.get("lat"));
    localStorage.setItem("lastLon", params.get("lon"));
    localStorage.setItem("city", params.get("city"));
    localStorage.setItem("theme", params.get("theme"));

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        body.classList.add("dark");
    }

    loadingMessage.style.display = "block";
    canvas.style.display = "none";

    let lat = localStorage.getItem("lastLat");
    let lon = localStorage.getItem("lastLon");
    let city = localStorage.getItem("city");
    if (city) {
        document.getElementById("current-city").innerText = city;
    }

    async function loadAndRender(lat, lon) {
        const data = await getHourlyWeather(lat, lon);
        loadingMessage.style.display = "none";
        canvas.style.display = "block";

        const currentTheme =
            document.body.classList.contains("dark") ||
                localStorage.getItem("theme") === "dark"
                ? "dark"
                : "light";

        renderChart(ctx, data, currentTheme);
    }

    if (!lat || !lon || !city || !savedTheme) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const params = new URLSearchParams(window.location.search);
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                localStorage.setItem("lastLat", lat);
                localStorage.setItem("lastLon", lon);
                localStorage.setItem("city", params.get("city"));
                localStorage.setItem("theme", params.get("theme"));
                await loadAndRender(lat, lon);
            });
        } else {
            alert("Location not available.");
        }
    } else {
        await loadAndRender(lat, lon);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(initChart);
});
