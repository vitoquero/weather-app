# Weather
# 🌦️ Weather Forecast Web Application

## 📘 Overview

This project is a **responsive and user-friendly Weather Forecast Web Application** built using **HTML, CSS, and JavaScript**.
It retrieves live weather data through the **Open-Meteo API** and provides current, hourly, and 7-day forecasts.

The application automatically detects the user's **geolocation**, displaying real-time weather information, and allows searching for any city worldwide.
It also features a **dark/light mode toggle**, an **hourly temperature line chart**, and a **clean, modern interface** designed to work seamlessly across all devices.

---

## 🚀 Features

### 🌍 Geolocation & City Search

* On first load, the app asks for permission to access your location.
* Automatically displays weather data for your current city.
* Includes a search bar to check weather conditions for other cities.

### ☀️ Current Weather Display

* Shows:

  * City name (based on geolocation or search)
  * Weather condition (e.g., “Clear sky”, “Rain showers”)
  * Current temperature (°C)
  * Wind speed (m/s)
* Displays a **static weather icon** representing the current condition.
* The icon is enlarged and positioned **to the right** of the weather description inside a centered layout card.

### 📅 7-Day Forecast

* Displays the forecast for the next seven days.
* Each day includes:

  * Date
  * Expected weather condition
  * Max and Min temperatures
  * Weather icon

### 📈 Hourly Temperature Chart

* Accessible via a **“See Chart”** link on the main page.
* Displays a **line chart** for hourly temperature variation.
* Includes:

  * A baseline at 0°C.
  * Weather icons above each hour.
  * Responsive resizing with horizontal scroll for small devices.
* The chart automatically adopts the current **dark/light theme** from the main page.

### 🌓 Dark / Light Mode

* A toggle button switches between **dark** and **light** modes.
* The chosen theme is saved in `localStorage` and applied across all pages.
* Dark mode includes adjusted colors for text, backgrounds, and chart lines.

### 📱 Responsive Design

* Fully responsive layout using pure CSS (no frameworks).
* Works smoothly on **mobile**, **tablet**, and **desktop**.
* Weather cards, icons, and charts automatically resize.

---

## 🧩 Project Structure

```
📁 weather-app/
│
├── index.html           # Main page showing current and 7-day weather
├── chart.html           # Page showing the hourly temperature chart
├── css/
    └── style.css        # Global styles (responsive + dark mode)
└── css/
    ├── app.js           # Main logic: API calls, geolocation, DOM updates
    └── chart.js         # Chart logic: rendering line chart from hourly data
```

---

## ⚙️ Technologies Used

* **HTML5** – structure and semantic layout
* **CSS3** – responsive and dark mode design (no third-party libraries)
* **JavaScript (Vanilla)** – logic, DOM manipulation, API handling
* **Open-Meteo API** – free, no-auth weather data source
* **Geolocation API** – for automatic location detection

---

## 🌐 API Reference

**Open-Meteo API**

* URL: `https://api.open-meteo.com/v1/forecast`
* Example parameters:

  ```
  latitude=40.7128
  longitude=-74.0060
  hourly=temperature_2m,weathercode
  daily=temperature_2m_max,temperature_2m_min,weathercode
  timezone=auto
  forecast_days=7
  ```
* Weather condition codes are mapped to icons and descriptions.

---

## 🧠 Key Functional Logic

### 1. **Automatic Geolocation**

```js
navigator.geolocation.getCurrentPosition(success => {
  const { latitude, longitude } = success.coords;
  getWeatherData(latitude, longitude);
});
```

### 2. **Search Bar for City Change**

* Uses a city name input field.
* Converts city name → coordinates → fetches weather data.

### 3. **Dark Mode Persistence**

```js
const theme = localStorage.getItem("theme");
document.body.classList.toggle("dark", theme === "dark");
```

### 4. **Chart Rendering**

* Implemented using the native **Canvas API** (no chart libraries).
* Displays hourly temperature data and icons for each hour.

---

## 🖼️ UI Preview (Layout Overview)

https://github.com/user-attachments/assets/f8a0009e-e163-405f-bc8e-a15afab3678a

---

## 🧪 How to Run Locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/vitoquero/weather-app.git
   cd weather-app
   ```

2. **Open the app**

   * Simply open `index.html` in your browser.
   * No build step or dependencies are required.

3. **Grant location access**

   * The browser will prompt to access your location.
   * If denied, you can manually search for a city.

---
## <img height="40" width="40" src="https://github.com/gui-bus/TechIcons/blob/main/Dark/Github.svg" /> Run remotely

* Access the completed website at this link [here](https://vitoquero.github.io/weather-app/)!

---
## 💡 Extra Notes

* No external CSS or JS frameworks were used — only **native HTML, CSS, and JS**.
* The project is fully functional **offline** after initial API fetch (cached data may persist).

---

## 👨‍💻 Author

**Developed by:** *Vito Carvalhais*

**Course Assignment:** *Weather App Project (Assignment 2)*

**Language:** English

**Year:** 2025

---

## 📜 License

This project is open-source and available under the **MIT License**.

---
