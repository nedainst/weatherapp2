// Weather App Configuration
// Using Open-Meteo API - No API key needed! Completely free and unlimited!
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Popular Indonesian Cities
const popularCities = [
    { name: 'Jakarta', country: 'ID', lat: -6.2088, lon: 106.8456 },
    { name: 'Surabaya', country: 'ID', lat: -7.2504, lon: 112.7488 },
    { name: 'Bandung', country: 'ID', lat: -6.9175, lon: 107.6062 },
    { name: 'Medan', country: 'ID', lat: 2.1945, lon: 99.1235 },
    { name: 'Bali', country: 'ID', lat: -8.6705, lon: 115.2126 },
    { name: 'Yogyakarta', country: 'ID', lat: -7.7956, lon: 110.3695 },
    { name: 'Semarang', country: 'ID', lat: -7.0051, lon: 110.4144 },
    { name: 'Makassar', country: 'ID', lat: -5.1477, lon: 119.4327 },
    { name: 'Palembang', country: 'ID', lat: -3.0073, lon: 104.7618 },
    { name: 'Batam', country: 'ID', lat: 1.1290, lon: 104.0758 },
];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const suggestionsBox = document.getElementById('suggestionsBox');
const weatherContent = document.getElementById('weatherContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchInput.addEventListener('input', handleSearchInput);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Initialize app with default city
window.addEventListener('load', () => {
    getWeatherByCoordinates(-6.2088, 106.8456, 'Jakarta', 'Indonesia'); // Jakarta default
});

// Handle search input and show suggestions
async function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    if (query.length === 0) {
        suggestionsBox.classList.remove('active');
        return;
    }

    // Filter popular cities
    const filtered = popularCities.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length > 0) {
        showSuggestions(filtered);
    } else {
        // Try to search via API
        searchCitiesAPI(query);
    }
}

// Show suggestions
function showSuggestions(cities) {
    suggestionsBox.innerHTML = '';
    suggestionsBox.classList.add('active');

    cities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${city.name}, ${city.country}`;
        div.addEventListener('click', () => {
            searchInput.value = `${city.name}, ${city.country}`;
            suggestionsBox.classList.remove('active');
            getWeatherByCoordinates(city.lat, city.lon, city.name, city.country);
        });
        suggestionsBox.appendChild(div);
    });
}

// Search cities via Open-Meteo Geocoding API
async function searchCitiesAPI(query) {
    try {
        const response = await fetch(
            `${GEO_URL}?name=${query}&count=5&language=id&format=json`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const cities = data.results.map(city => ({
                name: city.name,
                country: city.country,
                lat: city.latitude,
                lon: city.longitude,
                admin1: city.admin1
            }));
            showSuggestions(cities);
        } else {
            suggestionsBox.classList.remove('active');
        }
    } catch (error) {
        console.log('API search error:', error);
    }
}

// Handle search button click
function handleSearch() {
    const query = searchInput.value.trim();
    if (query.length === 0) {
        showError('Silakan masukkan nama kota');
        return;
    }

    // Try to find in popular cities first
    const city = popularCities.find(c =>
        c.name.toLowerCase() === query.toLowerCase() ||
        query.toLowerCase().includes(c.name.toLowerCase())
    );

    if (city) {
        getWeatherByCoordinates(city.lat, city.lon, city.name, city.country);
    } else {
        // Search via API
        searchAndGetWeather(query);
    }
}

// Search and get weather via API
async function searchAndGetWeather(query) {
    showLoading(true);
    try {
        const response = await fetch(
            `${GEO_URL}?name=${query}&count=1&language=id&format=json`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showError('Kota tidak ditemukan. Silakan coba nama kota lain.');
            return;
        }

        const city = data.results[0];
        getWeatherByCoordinates(city.latitude, city.longitude, city.name, city.country);
    } catch (error) {
        showError('Gagal mencari kota. Silakan coba lagi.');
        console.error('Search error:', error);
    }
}

// Get weather by coordinates
async function getWeatherByCoordinates(lat, lon, cityName = null, country = null) {
    showLoading(true);
    try {
        const response = await fetch(
            `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,pressure_msl,visibility&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
        );

        if (!response.ok) {
            throw new Error('Gagal mengambil data cuaca');
        }

        const data = await response.json();
        displayWeather(data, cityName, country);
        suggestionsBox.classList.remove('active');
    } catch (error) {
        showError(error.message || 'Gagal mengambil data cuaca');
        console.error('Weather fetch error:', error);
    } finally {
        showLoading(false);
    }
}

// Display weather information
function displayWeather(data, cityName, country) {
    const current = data.current;
    const daily = data.daily;

    // Get weather description from weather code
    const weatherDesc = getWeatherDescription(current.weather_code);
    const weatherIcon = getWeatherIcon(current.weather_code);

    // Update current weather
    const displayCity = cityName ? `${cityName}, ${country || ''}` : 'Unknown Location';
    document.getElementById('cityName').textContent = displayCity;
    document.getElementById('currentDate').textContent = formatDate(new Date());
    document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('weatherDescription').textContent = weatherDesc;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${current.wind_speed_10m.toFixed(1)} m/s`;
    document.getElementById('visibility').textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    document.getElementById('pressure').textContent = `${current.pressure_msl} mb`;
    
    // For Open-Meteo, we estimate feels like based on temp and wind
    const feelsLike = Math.round(current.temperature_2m - (current.wind_speed_10m * 0.15));
    document.getElementById('feelsLike').textContent = `${feelsLike}°C`;
    
    // Daily temperatures
    document.getElementById('maxTemp').textContent = `${Math.round(Math.max(...daily.temperature_2m_max))}°C`;
    document.getElementById('minTemp').textContent = `${Math.round(Math.min(...daily.temperature_2m_min))}°C`;

    // Weather icon - convert weather code to icon
    document.getElementById('weatherIcon').src = weatherIcon;

    // Display forecast
    displayForecast(daily);

    // Show weather content
    weatherContent.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Display 5-day forecast
function displayForecast(dailyData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    // Display next 5 days
    for (let i = 0; i < Math.min(5, dailyData.time.length); i++) {
        const date = new Date(dailyData.time[i]);
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        
        const weatherCode = dailyData.weather_code[i];
        const weatherDesc = getWeatherDescription(weatherCode);
        const weatherIcon = getWeatherIcon(weatherCode);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date" style="color: #999; font-size: 0.85em; margin-bottom: 8px;">${dayDate}</div>
            <img src="${weatherIcon}" alt="Weather" class="forecast-icon">
            <div class="forecast-temp">${Math.round(dailyData.temperature_2m_max[i])}°C</div>
            <div class="forecast-desc">${weatherDesc}</div>
            <div class="forecast-temp-range">
                <i class="fas fa-arrow-up"></i> ${Math.round(dailyData.temperature_2m_max[i])}° 
                <i class="fas fa-arrow-down"></i> ${Math.round(dailyData.temperature_2m_min[i])}°
            </div>
        `;
        forecastContainer.appendChild(card);
    }
}

// Convert WMO weather code to description
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Cerah',
        1: 'Sebagian Berawan',
        2: 'Berawan',
        3: 'Mendung',
        45: 'Kabut',
        48: 'Kabut Es',
        51: 'Drizzle Ringan',
        53: 'Drizzle Sedang',
        55: 'Drizzle Lebat',
        61: 'Hujan Ringan',
        63: 'Hujan Sedang',
        65: 'Hujan Lebat',
        71: 'Salju Ringan',
        73: 'Salju Sedang',
        75: 'Salju Lebat',
        77: 'Butiran Salju',
        80: 'Hujan Rintik Ringan',
        81: 'Hujan Rintik Sedang',
        82: 'Hujan Rintik Lebat',
        85: 'Hujan Salju Ringan',
        86: 'Hujan Salju Lebat',
        95: 'Badai Petir',
        96: 'Badai Petir dengan Salju Ringan',
        99: 'Badai Petir dengan Salju Lebat'
    };
    return weatherCodes[code] || 'Tidak Diketahui';
}

// Convert weather code to appropriate weather icon
function getWeatherIcon(code) {
    // Using open-meteo weather icons
    if (code === 0) return 'https://openweathermap.org/img/wn/01d@4x.png'; // Clear
    if (code === 1 || code === 2) return 'https://openweathermap.org/img/wn/02d@4x.png'; // Partly Cloudy
    if (code === 3) return 'https://openweathermap.org/img/wn/04d@4x.png'; // Overcast
    if (code === 45 || code === 48) return 'https://openweathermap.org/img/wn/50d@4x.png'; // Fog
    if (code >= 51 && code <= 67) return 'https://openweathermap.org/img/wn/09d@4x.png'; // Rain
    if (code >= 71 && code <= 86) return 'https://openweathermap.org/img/wn/13d@4x.png'; // Snow
    if (code >= 80 && code <= 82) return 'https://openweathermap.org/img/wn/10d@4x.png'; // Showers
    if (code >= 95 && code <= 99) return 'https://openweathermap.org/img/wn/11d@4x.png'; // Thunderstorm
    return 'https://openweathermap.org/img/wn/02d@4x.png'; // Default
}

// Format date to readable format
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

// Show loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Show error message
function showError(message) {
    errorMessage.style.display = 'block';
    document.getElementById('errorText').textContent = message;
    weatherContent.style.display = 'none';
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (e.target !== searchInput && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.remove('active');
    }
});
