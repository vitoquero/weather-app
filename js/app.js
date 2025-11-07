let geoCanceled = false;
let autocompleteTimeout;
const cityInput = document.getElementById("city-input");
const autocompleteResults = document.getElementById("autocomplete-results");

function getIcon(code) {
  const map = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️",
    61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "❄️",
    80: "🌦️", 95: "⛈️"
  };
  return map[code] || "❓";
}

function weatherCodeText(code) {
  const map = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Snow", 80: "Rain showers", 95: "Thunderstorm"
  };
  return map[code] || "Unknown";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatHour(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: false });
}

async function getCitySuggestions(query) {
  if (query.length < 2) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`);
  const data = await res.json();
  if (data.results) {
    return data.results.map(c => ({
      name: c.name + (c.country ? `, ${c.country}` : ""),
      lat: c.latitude,
      lon: c.longitude
    }));
  }
  return [];
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API error");
  return res.json();
}

async function getCityName(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.address?.city || data.address?.town || data.display_name || "Unknown location";
  } catch {
    return "Unknown location";
  }
}

async function getCoordsByCity(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    const c = data.results[0];
    return { lat: c.latitude, lon: c.longitude, name: c.name + (c.country ? `, ${c.country}` : "") };
  }
  throw new Error("City not found");
}

function renderCurrent(data, cityName) {
  const currentDiv = document.getElementById("current-data");
  const idx = data.hourly.time.findIndex(t => new Date(t) >= new Date());
  const temp = Math.round(data.hourly.temperature_2m[idx]);
  const wind = Math.round(data.hourly.wind_speed_10m[idx]);
  const code = data.hourly.weathercode[idx];
  localStorage.setItem("city", cityName);

  currentDiv.innerHTML = `
  <div class="current-weather">
    <div class="weather-text">
      <h2 id="cityName" class="city-name">${cityName}</h2>
      <p class="weather-desc">${weatherCodeText(code)}</p>
      <p class="temp">${temp.toFixed(1)}°C</p>
      <p class="wind">Wind: ${wind} m/s</p>
    </div>
    <div class="weather-icon">${getIcon(code)}</div>
  </div>`;

}

function renderForecast(data) {
  const list = document.getElementById("forecast-list");
  list.innerHTML = "";

  const today = new Date().toISOString().split("T")[0];

  data.daily.time.forEach((day, i) => {
    if (day <= today) return;

    const code = data.daily.weathercode[i];
    const el = document.createElement("div");
    el.className = "forecast-day";
    el.innerHTML = `
      <div>${formatDate(day)}</div>
      <div style="font-size:2rem;">${getIcon(code)}</div>
      <div><strong>${weatherCodeText(code)}</strong></div>
      <div>${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</div>
      <div class="small">Precip: ${data.daily.precipitation_sum[i]} mm</div>`;
    list.appendChild(el);
  });
}


function renderTimeline(data) {
  const timeline = document.getElementById("timeline-chart");
  timeline.innerHTML = "";
  const today = new Date().toLocaleDateString();
  const hours = data.hourly.time.map((t, i) => ({
    time: t, temp: data.hourly.temperature_2m[i],
    wind: data.hourly.wind_speed_10m[i], code: data.hourly.weathercode[i]
  })).filter(h => new Date(h.time).toLocaleDateString() === today);

  hours.forEach(h => {
    const block = document.createElement("div");
    block.className = "hour-block";
    const barHeight = Math.max(20, (h.temp + 20) * 2);
    block.innerHTML = `
      <div>${Math.round(h.temp)}°</div>
      <div class="bar" style="height:${barHeight}px"></div>
      <div style="font-size:1.5rem;">${getIcon(h.code)}</div>
      <div>${formatHour(h.time)}</div>`;
    timeline.appendChild(block);
  });
}

function displayMessage(message) {
  const messageBox = document.createElement('div');
  messageBox.textContent = message;
  messageBox.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: #3b82f6;
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    font-weight: bold;
    animation: fadeout 5s forwards;
  `;
  document.body.appendChild(messageBox);

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeout {
        0% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-20px); }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    messageBox.remove();
    style.remove();
  }, 5000);
}

async function loadWeather(lat, lon, label) {
  document.getElementById("current-data").textContent = "Loading...";
  document.getElementById("forecast-list").innerHTML = "";
  document.getElementById("timeline-chart").innerHTML = "";
  localStorage.setItem("lastLat", lat);
  localStorage.setItem("lastLon", lon);

  try {
    const weather = await getWeather(lat, lon);
    renderCurrent(weather, label);
    renderForecast(weather);
    renderTimeline(weather);
    setTimeout(checkScrollVisibility, 200);
  } catch (err) {
    console.error(err);
    document.getElementById("current-data").textContent = "Failed to load weather data.";
  }
}

function renderSuggestions(suggestions) {
  autocompleteResults.innerHTML = "";
  if (suggestions.length === 0) {
    autocompleteResults.style.display = 'none';
    return;
  }

  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.textContent = suggestion.name;
    item.dataset.lat = suggestion.lat;
    item.dataset.lon = suggestion.lon;

    item.addEventListener('click', () => {
      cityInput.value = suggestion.name;
      autocompleteResults.innerHTML = "";
      autocompleteResults.style.display = 'none';
    });

    autocompleteResults.appendChild(item);
  });

  autocompleteResults.style.display = 'block';
}

function handleCitySearch() {
  geoCanceled = true;
  const city = cityInput.value.trim();

  clearTimeout(autocompleteTimeout);

  if (city.length < 2) {
    autocompleteResults.innerHTML = "";
    autocompleteResults.style.display = 'none';
    return;
  }

  autocompleteTimeout = setTimeout(async () => {
    try {
      const suggestions = await getCitySuggestions(city);
      renderSuggestions(suggestions);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      autocompleteResults.innerHTML = "";
      autocompleteResults.style.display = 'none';
    }
  }, 300);
}

function setupDarkMode() {
  const btn = document.getElementById("mode-toggle");
  const body = document.body;
  let saved = localStorage.getItem("theme");

  if (!saved) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    saved = prefersDark ? "dark" : "light";
    localStorage.setItem("theme", saved);
  }

  if (saved === "dark") {
    body.classList.add("dark");
    btn.textContent = "☀️";
  } else {
    btn.textContent = "🌙";
  }

  btn.addEventListener("click", () => {
    body.classList.toggle("dark");
    const dark = body.classList.contains("dark");
    btn.textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("theme", dark ? "dark" : "light");
  });
}

function init() {
  setupDarkMode();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      if (geoCanceled) return;

      const { latitude, longitude } = pos.coords;
      const name = await getCityName(latitude, longitude);
      if (!geoCanceled) {
        loadWeather(latitude, longitude, name);
      }
    }, () => displayMessage("Unable to access location."));
  } else {
    displayMessage("Geolocation not supported by your browser.");
  }

  cityInput.addEventListener("input", handleCitySearch);

  document.addEventListener('click', (e) => {
    if (e.target !== cityInput && e.target.closest('.autocomplete-item') === null) {
      autocompleteResults.style.display = 'none';
    }
  });

  document.getElementById("search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    autocompleteResults.style.display = 'none';
    const input = document.getElementById("city-input");
    const city = input.value.trim();
    if (!city) {
      init();
      return;
    }
    geoCanceled = true;
    try {
      const place = await getCoordsByCity(city);
      loadWeather(place.lat, place.lon, place.name);
    } catch {
      displayMessage(`City "${city}" not found. Please try again.`);
    }
  });

  const chartLink = document.getElementById("chart-link");
  if (chartLink) {
    chartLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = `chart.html?theme=${localStorage.getItem("theme")}&lat=${localStorage.getItem("lastLat")}&lon=${localStorage.getItem("lastLon")}&city=${localStorage.getItem("city")}`;
    });
  }

}

window.addEventListener("load", () => {
  const downArrow = document.getElementById("scroll-down");
  const upArrow = document.getElementById("scroll-up");

  if (!downArrow || !upArrow) return;

  window.addEventListener("scroll", checkScrollVisibility);
  window.addEventListener("resize", checkScrollVisibility);

  downArrow.addEventListener("click", () => {
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: "smooth",
    });
  });

  upArrow.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  checkScrollVisibility();
});

function checkScrollVisibility() {
  const downArrow = document.getElementById("scroll-down");
  const upArrow = document.getElementById("scroll-up");

  if (!downArrow || !upArrow) return;

  const scrollable = document.body.scrollHeight > window.innerHeight + 50;
  if (!scrollable) {
    downArrow.style.display = "none";
    upArrow.style.display = "none";
    return;
  }

  const scrolled = window.scrollY;

  if (scrolled < 100) {
    downArrow.style.display = "block";
    upArrow.style.display = "none";
  } else if (scrolled + window.innerHeight >= document.body.scrollHeight - 50) {
    downArrow.style.display = "none";
    upArrow.style.display = "block";
  } else {
    downArrow.style.display = "none";
    upArrow.style.display = "block";
  }
}

window.addEventListener("load", init);
