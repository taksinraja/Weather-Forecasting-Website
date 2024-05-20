document.addEventListener("DOMContentLoaded", function() {
    var defaultCity = "Haringhata";
    getWeather(defaultCity);

    var searchButton = document.getElementById("searchButton");
    var cityInput = document.getElementById("cityInput");

    // Search when button clicked
    searchButton.addEventListener("click", function() {
        var city = cityInput.value;
        if (city.trim() !== "") {
            getWeather(city);
        }
    });

    // Search when Enter key pressed
    cityInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            var city = cityInput.value;
            if (city.trim() !== "") {
                getWeather(city);
            }
        }
    });

    // Fetch alerts on page load
    getAlerts();
});

    // Initialize the map
    var map = L.map('map').setView([40.7128, -74.0060], 10); // Default to New York coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    var marker = L.marker([40.7128, -74.0060]).addTo(map);


    function updateMap(lat, lon) {
        map.setView([lat, lon], 10);
        marker.setLatLng([lat, lon]);
    }

// city time 
function updateCityTime(offset) {
    var cityTimeElement = document.getElementById("dateTime");

    function updateTime() {
        var now = new Date();
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        var cityTime = new Date(utcTime + (3600000 * offset));
        var formattedTime = cityTime.toLocaleString("en-US", {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        cityTimeElement.textContent = formattedTime;
    }

    if (typeof cityTimeInterval !== 'undefined') {
        clearInterval(cityTimeInterval); // Clear the previous interval
    }

    cityTimeInterval = setInterval(updateTime, 1000);
    updateTime(); // Initial call to display time immediately
}



function getWeather(city) {
    var apiKey = "a2e9c4e128c0d0a65b3c008f12186ec7"; // Replace with your API key
    var url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error("City not found");
        }
        return response.json();
    })
    .then(data => {
        var cityNameElement = document.getElementById("cityName");
        var countryElement = document.getElementById("country");
        var temperatureElement = document.getElementById("temperature");
        var weatherIconElement = document.getElementById("weatherIcon");
        var weatherConditionElement = document.getElementById("weatherCondition");
        var monsoonIconElement = document.getElementById("monsoonIcon");

        cityNameElement.textContent = data.name;
        countryElement.textContent = data.sys.country;
        temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
        weatherIconElement.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        weatherConditionElement.textContent = data.weather[0].description;

        monsoonIconElement.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

        // Clear previous forecast data
        var forecastDiv = document.getElementById("forecast");
        forecastDiv.innerHTML = "";

        getForecast(data.coord.lat, data.coord.lon);
        getAdditionalInfo(data.coord.lat, data.coord.lon);

        // Update background image based on weather
        updateBackgroundImage(data);

        updateMap(data.coord.lat, data.coord.lon); // Update the map

        var offset = data.timezone / 3600; // Get timezone offset in hours
        updateCityTime(offset); // Update city time based on timezone offset

    })
    .catch(error => {
        showAlert("Dear User, <br> City not found");
        console.log("Error fetching weather data: ", error);
    });
}


function getForecast(lat, lon) {
    var apiKey = "a2e9c4e128c0d0a65b3c008f12186ec7"; // Replace with your API key
    var url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        var forecastDiv = document.getElementById("forecast");

        var days = {};
        data.list.forEach(item => {
            var date = new Date(item.dt * 1000);
            var day = date.toLocaleDateString("en-US", { weekday: "short" });
            if (!days[day]) {
                days[day] = { dayTemps: [], nightTemps: [], icon: item.weather[0].icon };
            }
            if (date.getHours() >= 6 && date.getHours() < 18) {
                days[day].dayTemps.push(item.main.temp);
            } else {
                days[day].nightTemps.push(item.main.temp);
            }
        });

        // Skip today's forecast
        var dayKeys = Object.keys(days);
        if (dayKeys.length > 0) {
            dayKeys.shift();
        }

        dayKeys.slice(0, 8).forEach(day => {
            var dayTemps = days[day].dayTemps.length > 0 ? Math.round(days[day].dayTemps.reduce((a, b) => a + b) / days[day].dayTemps.length) : "N/A";
            var nightTemps = days[day].nightTemps.length > 0 ? Math.round(days[day].nightTemps.reduce((a, b) => a + b) / days[day].nightTemps.length) : "N/A";
            var iconUrl = `http://openweathermap.org/img/wn/${days[day].icon}.png`;

            var forecastBox = document.createElement("div");
            forecastBox.classList.add("forecast-day");
            forecastBox.innerHTML = `
                <img src="${iconUrl}" alt="Weather Icon">
                <p>${day}</p>
                <p>Day: ${dayTemps}°C</p>
                <p>Night: ${nightTemps}°C</p>
            `;
            forecastDiv.appendChild(forecastBox);
        });
    })
    .catch(error => {
        console.log("Error fetching forecast data: ", error);
    });
}

function getAdditionalInfo(lat, lon) {
    var apiKey = "a2e9c4e128c0d0a65b3c008f12186ec7"; // Replace with your API key
    var url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        document.getElementById("monsoon").textContent = `Monsoon: ${data.weather[0].main}`;
        document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById("windSpeed").textContent = `Wind Speed: ${data.wind.speed} m/s`;
        document.getElementById("pressure").textContent = `Pressure: ${data.main.pressure} hPa`;

        // Get air quality data
        getAirQuality(lat, lon);
    })
    .catch(error => {
        console.log("Error fetching additional info: ", error);
    });
}

function getAirQuality(lat, lon) {
    var apiKey = "a2e9c4e128c0d0a65b3c008f12186ec7"; // Replace with your API key
    var url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        var airQualityIndex = data.list[0].main.aqi;
        var airQualityText = `Air Quality: ${translateAirQualityIndex(airQualityIndex)}`;
        document.getElementById("airQuality").textContent = airQualityText;
    })
    .catch(error => {
        console.log("Error fetching air quality data: ", error);
    });
}

function translateAirQualityIndex(aqi) {
    switch (aqi) {
        case 1:
            return "Good";
        case 2:
            return "Fair";
        case 3:
            return "Moderate";
        case 4:
            return "Poor";
        case 5:
            return "Very Poor";
        default:
            return "Unknown";
    }
}

function updateBackgroundImage(weatherData) {
    var container = document.getElementById("container");
    var backgroundImage = getBackgroundImage(weatherData);
    container.style.backgroundImage = backgroundImage;
}

function getBackgroundImage(weatherData) {
    var isDay = weatherData.weather[0].icon.includes('d');
    var weatherType = weatherData.weather[0].main.toLowerCase();

    var backgrounds = {
        "day_clear": "url('clear day.png')",
        "night_clear": "url('clear night.png')",
        "day_rain": "url('rain day.png')",
        "night_rain": "url('rainy_night.png')",
        "day_thunderstorm": "url('tunderstorm_day.png')",
        "night_thunderstorm": "url('tunderstorm_night.png')",
        "day_snow": "url('snow day.png')",
        "night_snow": "url('snow night.png')",
        "day_clouds": "url('overcast clouds.png')",
        "night_clouds": "url('clouds night.png')",
        "day_fog": "url('fog_day.png')",
        "night_fog": "url('fog_night.png')",
        "day_mist": "url('haze_day.png')",
        "night_mist": "url('haze_night.png')",
        "day_haze": "url('haze_day.png')",
        "night_haze": "url('haze_night.png')",
        "day_smoke": "url('smock_day.png')",
        "night_smoke": "url('smock_night.png')",
        
    };

    var key = (isDay ? "day_" : "night_") + weatherType;

    if (backgrounds.hasOwnProperty(key)) {
        return backgrounds[key];
    } else {
        return "url('noaa-99F4mC79j1I-unsplash.jpg')";
    }
}

function getWeatherAlerts() {
    var apiKey = "a2e9c4e128c0d0a65b3c008f12186ec7"; // Replace with your OpenWeatherMap API key
    var url = `https://api.openweathermap.org/data/2.5/onecall?lat=35&lon=139&appid=${apiKey}`; // Replace lat/lon with the desired location

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.alerts && data.alerts.length > 0) {
                data.alerts.forEach(alertData => {
                    var alert = {
                        event: alertData.event,
                        description: alertData.description
                    };
                    displayAlert(alert);
                });
            }
        })
        .catch(error => {
            console.log("Error fetching weather alerts: ", error);
        });
}

function displayAlert(alert) {
    var alertDiv = document.createElement("div");
    alertDiv.classList.add("alert");
    alertDiv.innerHTML = `
        <p>Alert: ${alert.event}</p>
        <p>${alert.description}</p>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 10000); // Remove alert after 10 seconds
}

function showAlert(message) {
    var alertDiv = document.createElement("div");
    alertDiv.classList.add("alert");
    alertDiv.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000); // Remove alert after 5 seconds
}
