const apiKey = "600a891f795d3b16099e3f82ffc08fe1"; // Get API key from OpenWeatherMap

// 🌙 Toggle Dark Mode
document.getElementById("theme-toggle").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    this.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// 🌎 Auto-Detect Location & Fetch Weather
document.getElementById("location-btn").addEventListener("click", function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoords(lat, lon);
        }, error => {
            alert("Location access denied. Please enter a city manually.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

async function getWeatherByCoords(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        displayCurrentWeather(weatherData);
        displayHourlyForecast(forecastData);
        displayFiveDayForecast(forecastData);
        checkWeatherAlerts(weatherData);

    } catch (error) {
        console.log("Error fetching location-based weather:", error);
    }
}

// 🌤 Fetch Weather by City Name
async function getWeather() {
    const city = document.getElementById("city").value;
    if (city === "") {
        alert("Please enter a city name");
        return;
    }
    getWeatherByCity(city);
}

async function getWeatherByCity(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        if (weatherData.cod === "404") {
            document.getElementById("weather-result").innerHTML = "City not found!";
            return;
        }

        displayCurrentWeather(weatherData);
        displayHourlyForecast(forecastData);
        displayFiveDayForecast(forecastData);
        checkWeatherAlerts(weatherData);
        saveToLocalStorage(city);

    } catch (error) {
        console.log("Error fetching weather data:", error);
    }
}

// 📌 Save Favorite Cities to Local Storage
function saveToLocalStorage(city) {
    let cities = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    if (!cities.includes(city)) {
        cities.push(city);
        localStorage.setItem("favoriteCities", JSON.stringify(cities));
        loadFavoriteCities();
    }
}

function loadFavoriteCities() {
    let cities = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    let citiesHTML = cities.map(city => `<button onclick="getWeatherByCity('${city}')">${city}</button>`).join(" ");
    document.getElementById("favorite-cities").innerHTML = citiesHTML;
}

// 🔔 Check for Weather Alerts
function checkWeatherAlerts(data) {
    const extremeWeather = ["Thunderstorm", "Tornado", "Snow", "Extreme", "Drizzle"];
    if (extremeWeather.includes(data.weather[0].main)) {
        alert(`⚠️ Warning: Extreme weather detected in ${data.name}! Stay safe.`);
    }
}

// ☀️ Display Current Weather
function displayCurrentWeather(data) {
    const weatherIcons = {
        "Clear": "https://assets10.lottiefiles.com/packages/lf20_jm1z2lwe.json",
        "Clouds": "https://assets10.lottiefiles.com/packages/lf20_t83dhhuy.json",
        "Rain": "https://assets10.lottiefiles.com/packages/lf20_vlfgcyh5.json",
        "Snow": "https://assets10.lottiefiles.com/packages/lf20_Stt1R4.json"
    };

    const weatherCondition = data.weather[0].main;
    const animationUrl = weatherIcons[weatherCondition] || weatherIcons["Clear"];

    document.getElementById("weather-result").innerHTML = `
        <h3>${data.name}, ${data.sys.country}</h3>
        <lottie-player src="${animationUrl}" background="transparent" speed="1" style="width: 100px; height: 100px;" loop autoplay></lottie-player>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
    `;
}

// 🕒 Display Hourly Forecast
function displayHourlyForecast(data) {
    let forecastHTML = "<h3>24-Hour Forecast</h3><div class='forecast-container'>";
    data.list.slice(0, 8).forEach(item => {
        let time = new Date(item.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let temp = item.main.temp;
        let icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

        forecastHTML += `
            <div class="forecast-item">
                <p>${time}</p>
                <img src="${icon}" alt="Weather">
                <p>${temp}°C</p>
            </div>
        `;
    });

    forecastHTML += "</div>";
    document.getElementById("forecast-result").innerHTML = forecastHTML;
}

// 📅 Display 5-Day Forecast
function displayFiveDayForecast(data) {
    let dailyForecasts = {};
    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
                temp: item.main.temp,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        }
    });

    let forecastHTML = "<h3>5-Day Forecast</h3><div class='forecast-container'>";
    for (const date in dailyForecasts) {
        const forecast = dailyForecasts[date];
        forecastHTML += `
            <div class="forecast-item">
                <p><strong>${new Date(date).toDateString()}</strong></p>
                <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.description}">
                <p>${forecast.temp}°C</p>
                <p>${forecast.description}</p>
            </div>
        `;
    }
    forecastHTML += "</div>";
    document.getElementById("forecast-result").innerHTML += forecastHTML;
}

// Load Favorite Cities on Startup
loadFavoriteCities();
