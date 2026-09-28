/* =====================================================
   LIFE GUARD 360
   COMPLETE JAVASCRIPT
===================================================== */


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let map;

let currentLat = null;
let currentLng = null;

let currentLocationMarker = null;
let accuracyCircle = null;

let serviceMarkers = [];

let allServices = [];

let currentFilter = "all";

let currentLanguage = "en";

let isLoadingServices = false;

let toastTimer;


/* =====================================================
   DEFAULT FALLBACK
   Only used if GPS is unavailable.
===================================================== */

const DEFAULT_LOCATION = {
    lat: 28.6139,
    lng: 77.2090
};


/* =====================================================
   DOM ELEMENTS
===================================================== */

const locateBtn =
    document.getElementById("locateBtn");

const mapLocationBtn =
    document.getElementById("mapLocationBtn");

const shareBtn =
    document.getElementById("shareBtn");

const refreshServicesBtn =
    document.getElementById("refreshServicesBtn");

const weatherRefreshBtn =
    document.getElementById("weatherRefreshBtn");

const serviceSearch =
    document.getElementById("serviceSearch");

const clearSearchBtn =
    document.getElementById("clearSearchBtn");

const servicesList =
    document.getElementById("servicesList");

const serviceCount =
    document.getElementById("serviceCount");

const serviceLoading =
    document.getElementById("serviceLoading");

const locationStatus =
    document.getElementById("locationStatus");

const gpsText =
    document.getElementById("gpsText");

const readyText =
    document.getElementById("readyText");

const themeBtn =
    document.getElementById("themeBtn");

const languageBtn =
    document.getElementById("languageBtn");

const reportForm =
    document.getElementById("reportForm");

const reportsList =
    document.getElementById("reportsList");

const clearReportsBtn =
    document.getElementById("clearReportsBtn");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const toastIcon =
    document.getElementById("toastIcon");


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeMap();

    loadSavedTheme();

    loadSavedLanguage();

    setupEventListeners();

    renderReports();

    detectLiveLocation();

});


/* =====================================================
   MAP INITIALIZATION
===================================================== */

function initializeMap() {

    map = L.map("map", {
        zoomControl: true
    }).setView(
        [
            DEFAULT_LOCATION.lat,
            DEFAULT_LOCATION.lng
        ],
        12
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        }
    ).addTo(map);


    setTimeout(() => {
        map.invalidateSize();
    }, 500);

}


/* =====================================================
   EVENT LISTENERS
===================================================== */

function setupEventListeners() {


    /* Live location */

    locateBtn.addEventListener(
        "click",
        detectLiveLocation
    );


    mapLocationBtn.addEventListener(
        "click",
        detectLiveLocation
    );


    /* Share */

    shareBtn.addEventListener(
        "click",
        shareCurrentLocation
    );


    /* Services */

    refreshServicesBtn.addEventListener(
        "click",
        () => {

            if (!currentLat || !currentLng) {

                detectLiveLocation();

                return;
            }

            loadNearbyServices(
                currentLat,
                currentLng
            );

        }
    );


    /* Weather */

    weatherRefreshBtn.addEventListener(
        "click",
        () => {

            if (
                currentLat === null ||
                currentLng === null
            ) {

                detectLiveLocation();

                return;
            }

            loadWeather(
                currentLat,
                currentLng
            );

        }
    );


    /* Search */

    serviceSearch.addEventListener(
        "input",
        () => {

            renderServices();
        }
    );


    clearSearchBtn.addEventListener(
        "click",
        () => {

            serviceSearch.value = "";

            renderServices();

            serviceSearch.focus();

        }
    );


    /* Filter buttons */

    document
        .querySelectorAll(".filter-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".filter-btn")
                        .forEach(btn => {

                            btn.classList.remove("active");

                        });

                    button.classList.add("active");

                    currentFilter =
                        button.dataset.filter;

                    renderServices();

                }
            );

        });


    /* Theme */

    themeBtn.addEventListener(
        "click",
        toggleTheme
    );


    /* Language */

    languageBtn.addEventListener(
        "click",
        toggleLanguage
    );


    /* Emergency buttons */

    document
        .querySelectorAll(".emergency-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const number =
                        button.dataset.number;

                    callEmergency(number);

                }
            );

        });


    /* Reports */

    reportForm.addEventListener(
        "submit",
        handleReportSubmit
    );


    clearReportsBtn.addEventListener(
        "click",
        clearAllReports
    );

}


/* =====================================================
   LIVE LOCATION
===================================================== */

function detectLiveLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Geolocation is not supported by this browser.",
            "⚠️"
        );

        useFallbackLocation();

        return;
    }


    locationStatus.textContent =
        "Detecting live location...";

    gpsText.textContent =
        "Getting GPS coordinates...";

    readyText.textContent =
        "Detecting Location";


    locateBtn.disabled = true;

    locateBtn.textContent =
        "📍 Detecting...";


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            currentLat = latitude;
            currentLng = longitude;


            updateCurrentLocationMarker(
                latitude,
                longitude,
                accuracy
            );


            map.setView(
                [
                    latitude,
                    longitude
                ],
                15,
                {
                    animate: true
                }
            );


            locationStatus.textContent =
                "Live location active";

            gpsText.textContent =
                `GPS accuracy: ${Math.round(accuracy)}m`;

            readyText.textContent =
                "Safety System Ready";


            locateBtn.disabled = false;

            locateBtn.textContent =
                "📍 Use My Live Location";


            showToast(
                "Live location detected successfully.",
                "📍"
            );


            loadNearbyServices(
                latitude,
                longitude
            );


            loadWeather(
                latitude,
                longitude
            );


            reverseGeocode(
                latitude,
                longitude
            );

        },

        error => {

            console.error(
                "Geolocation Error:",
                error
            );


            locateBtn.disabled = false;

            locateBtn.textContent =
                "📍 Use My Live Location";


            locationStatus.textContent =
                "Location unavailable";


            gpsText.textContent =
                "GPS permission required";


            readyText.textContent =
                "Location Permission Needed";


            let message =
                "Could not detect your location.";


            if (error.code === 1) {

                message =
                    "Location permission was denied.";

            }

            else if (error.code === 2) {

                message =
                    "Location is currently unavailable.";

            }

            else if (error.code === 3) {

                message =
                    "Location request timed out.";

            }


            showToast(
                message,
                "⚠️"
            );


            useFallbackLocation();

        },

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0
        }

    );

}


/* =====================================================
   FALLBACK LOCATION
===================================================== */

function useFallbackLocation() {

    currentLat =
        DEFAULT_LOCATION.lat;

    currentLng =
        DEFAULT_LOCATION.lng;


    updateCurrentLocationMarker(
        currentLat,
        currentLng,
        null
    );


    map.setView(
        [
            currentLat,
            currentLng
        ],
        12
    );


    locationStatus.textContent =
        "Demo location active";


    gpsText.textContent =
        "GPS unavailable";


    loadNearbyServices(
        currentLat,
        currentLng
    );


    loadWeather(
        currentLat,
        currentLng
    );


    reverseGeocode(
        currentLat,
        currentLng
    );

}


/* =====================================================
   CURRENT LOCATION MARKER
===================================================== */

function updateCurrentLocationMarker(
    latitude,
    longitude,
    accuracy
) {


    if (currentLocationMarker) {

        map.removeLayer(
            currentLocationMarker
        );

    }


    if (accuracyCircle) {

        map.removeLayer(
            accuracyCircle
        );

    }


    const locationIcon =
        L.divIcon({

            className:
                "custom-location-marker",

            html:
                `
                <div style="
                    width:20px;
                    height:20px;
                    background:#2563eb;
                    border:4px solid white;
                    border-radius:50%;
                    box-shadow:0 0 0 8px rgba(37,99,235,0.20);
                "></div>
                `,

            iconSize: [20, 20],

            iconAnchor: [10, 10]

        });


    currentLocationMarker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon: locationIcon,
                zIndexOffset: 1000
            }
        )
        .addTo(map)
        .bindPopup(
            `
            <div class="popup-title">
                📍 Your Current Location
            </div>
            <div>
                Latitude: ${latitude.toFixed(6)}
            </div>
            <div>
                Longitude: ${longitude.toFixed(6)}
            </div>
            `
        );


    if (accuracy) {

        accuracyCircle =
            L.circle(
                [
                    latitude,
                    longitude
                ],
                {
                    radius: accuracy,

                    color: "#2563eb",

                    fillColor: "#2563eb",

                    fillOpacity: 0.08,

                    weight: 1
                }
            )
            .addTo(map);

    }

}


/* =====================================================
   NEARBY SERVICES
===================================================== */

async function loadNearbyServices(
    latitude,
    longitude
) {

    if (isLoadingServices) {
        return;
    }


    isLoadingServices = true;


    serviceLoading.textContent =
        "Loading...";


    servicesList.innerHTML =
        `
        <div class="empty-state">
            <span>⏳</span>
            <p>Finding nearby emergency services...</p>
        </div>
        `;


    clearServiceMarkers();


    const query = `
        [out:json][timeout:25];

        (
            nwr[
                amenity=hospital
            ](
                around:10000,
                ${latitude},
                ${longitude}
            );

            nwr[
                amenity=police
            ](
                around:10000,
                ${latitude},
                ${longitude}
            );

            nwr[
                amenity=fire_station
            ](
                around:10000,
                ${latitude},
                ${longitude}
            );
        );

        out center tags;
    `;


    const encodedQuery =
        encodeURIComponent(query);


    const endpoints = [

        `https://overpass-api.de/api/interpreter?data=${encodedQuery}`,

        `https://overpass.kumi.systems/api/interpreter?data=${encodedQuery}`

    ];


    let data = null;


    for (const endpoint of endpoints) {

        try {

            const response =
                await fetch(
                    endpoint
                );


            if (!response.ok) {
                continue;
            }


            data =
                await response.json();

            break;

        }

        catch (error) {

            console.warn(
                "Overpass endpoint failed:",
                error
            );

        }

    }


    isLoadingServices = false;


    if (!data) {

        serviceLoading.textContent =
            "API unavailable";


        servicesList.innerHTML =
            `
            <div class="empty-state">
                <span>⚠️</span>
                <p>
                    Emergency service data is temporarily unavailable.
                    Please try Refresh.
                </p>
            </div>
            `;


        serviceCount.textContent =
            "0 services";


        showToast(
            "Nearby service API is temporarily unavailable.",
            "⚠️"
        );

        return;

    }


    allServices =
        parseOverpassServices(
            data.elements || [],
            latitude,
            longitude
        );


    serviceLoading.textContent =
        "Updated";


    renderServices();


    addServiceMarkers(
        allServices
    );


    if (allServices.length === 0) {

        servicesList.innerHTML =
            `
            <div class="empty-state">
                <span>🔎</span>
                <p>
                    No mapped emergency services found
                    within 10 km.
                </p>
            </div>
            `;

    }

}


/* =====================================================
   PARSE OVERPASS DATA
===================================================== */

function parseOverpassServices(
    elements,
    userLat,
    userLng
) {

    const results = [];


    elements.forEach(element => {

        const tags =
            element.tags || {};


        let latitude =
            element.lat;

        let longitude =
            element.lon;


        if (
            element.center &&
            latitude === undefined
        ) {

            latitude =
                element.center.lat;

            longitude =
                element.center.lon;

        }


        if (
            latitude === undefined ||
            longitude === undefined
        ) {
            return;
        }


        let type = "other";

        let icon = "📍";

        let typeLabel = "Emergency Service";


        if (
            tags.amenity ===
            "hospital"
        ) {

            type = "hospital";

            icon = "🏥";

            typeLabel = "Hospital";

        }

        else if (
            tags.amenity ===
            "police"
        ) {

            type = "police";

            icon = "👮";

            typeLabel = "Police Station";

        }

        else if (
            tags.amenity ===
            "fire_station"
        ) {

            type = "fire";

            icon = "🚒";

            typeLabel = "Fire Station";

        }


        const name =
            tags.name ||
            tags["name:en"] ||
            `${typeLabel}`;


        const address =
            buildAddress(tags);


        const distance =
            calculateDistance(
                userLat,
                userLng,
                latitude,
                longitude
            );


        results.push({

            id:
                element.id,

            name,

            type,

            typeLabel,

            icon,

            latitude,

            longitude,

            address,

            distance

        });

    });


    results.sort(
        (a, b) =>
            a.distance -
            b.distance
    );


    return results;

}


/* =====================================================
   BUILD ADDRESS
===================================================== */

function buildAddress(tags) {

    const parts = [

        tags["addr:housenumber"],

        tags["addr:street"],

        tags["addr:suburb"],

        tags["addr:city"],

        tags["addr:state"]

    ].filter(Boolean);


    if (parts.length > 0) {

        return parts.join(", ");

    }


    if (tags["addr:full"]) {

        return tags["addr:full"];

    }


    return "Address not available in OpenStreetMap";

}


/* =====================================================
   DISTANCE CALCULATION
===================================================== */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;


    const dLat =
        degreesToRadians(
            lat2 - lat1
        );


    const dLon =
        degreesToRadians(
            lon2 - lon1
        );


    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(
            degreesToRadians(lat1)
        )

        *

        Math.cos(
            degreesToRadians(lat2)
        )

        *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


function degreesToRadians(degrees) {

    return degrees *
        Math.PI /
        180;

}


/* =====================================================
   ADD SERVICE MARKERS
===================================================== */

function addServiceMarkers(
    services
) {

    clearServiceMarkers();


    services.forEach(service => {

        const markerIcon =
            L.divIcon({

                className:
                    "service-marker",

                html:
                    `
                    <div style="
                        width:34px;
                        height:34px;
                        border-radius:50%;
                        background:white;
                        border:2px solid #2563eb;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:19px;
                        box-shadow:0 4px 12px rgba(0,0,0,.25);
                    ">
                        ${service.icon}
                    </div>
                    `,

                iconSize: [34, 34],

                iconAnchor: [17, 17]

            });


        const marker =
            L.marker(
                [
                    service.latitude,
                    service.longitude
                ],
                {
                    icon: markerIcon
                }
            );


        const routeUrl =
            `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;


        marker.bindPopup(
            `
            <div class="popup-title">
                ${service.icon} ${escapeHtml(service.name)}
            </div>

            <div class="popup-type">
                ${service.typeLabel}
            </div>

            <div style="font-size:11px;margin-bottom:8px;">
                ${escapeHtml(service.address)}
            </div>

            <div style="font-size:11px;margin-bottom:9px;">
                📏 ${formatDistance(service.distance)}
            </div>

            <a
                class="popup-route"
                href="${routeUrl}"
                target="_blank"
                rel="noopener"
            >
                🧭 Get Directions
            </a>
            `
        );


        marker.addTo(map);


        marker.on(
            "click",
            () => {

                map.setView(
                    [
                        service.latitude,
                        service.longitude
                    ],
                    17,
                    {
                        animate: true
                    }
                );

            }
        );


        serviceMarkers.push(
            marker
        );

    });

}


/* =====================================================
   CLEAR MARKERS
===================================================== */

function clearServiceMarkers() {

    serviceMarkers.forEach(
        marker => {

            map.removeLayer(
                marker
            );

        }
    );


    serviceMarkers = [];

}


/* =====================================================
   RENDER SERVICES
===================================================== */

function renderServices() {

    const search =
        serviceSearch.value
            .trim()
            .toLowerCase();


    let filtered =
        allServices.filter(
            service => {

                const matchesFilter =
                    currentFilter === "all" ||
                    service.type === currentFilter;


                const matchesSearch =
                    !search ||

                    service.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    service.typeLabel
                        .toLowerCase()
                        .includes(search)

                    ||

                    service.address
                        .toLowerCase()
                        .includes(search);


                return (
                    matchesFilter &&
                    matchesSearch
                );

            }
        );


    serviceCount.textContent =
        `${filtered.length} services`;


    if (filtered.length === 0) {

        servicesList.innerHTML =
            `
            <div class="empty-state">
                <span>🔎</span>
                <p>
                    No matching emergency services found.
                </p>
            </div>
            `;

        return;

    }


    servicesList.innerHTML =
        filtered
            .map(
                service =>
                    createServiceHTML(
                        service
                    )
            )
            .join("");


    document
        .querySelectorAll(
            ".service-focus-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    focusService(id);

                }
            );

        });


    document
        .querySelectorAll(
            ".service-route-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    openDirections(id);

                }
            );

        });

}


/* =====================================================
   SERVICE HTML
===================================================== */

function createServiceHTML(
    service
) {

    return `

        <div class="service-item">

            <div class="service-top">

                <div class="service-icon">
                    ${service.icon}
                </div>

                <div class="service-info">

                    <h4>
                        ${escapeHtml(service.name)}
                    </h4>

                    <p>
                        ${escapeHtml(service.address)}
                    </p>

                    <div class="service-distance">
                        📏 ${formatDistance(service.distance)}
                    </div>

                </div>

            </div>


            <div class="service-actions">

                <button
                    class="service-action service-focus-btn"
                    data-id="${service.id}"
                >
                    📍 Show on Map
                </button>

                <button
                    class="service-action service-route-btn"
                    data-id="${service.id}"
                >
                    🧭 Directions
                </button>

            </div>

        </div>

    `;

}


/* =====================================================
   FOCUS SERVICE
===================================================== */

function focusService(id) {

    const service =
        allServices.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!service) {
        return;
    }


    map.setView(
        [
            service.latitude,
            service.longitude
        ],
        17,
        {
            animate: true
        }
    );


    const index =
        allServices.indexOf(
            service
        );


    if (
        serviceMarkers[index]
    ) {

        serviceMarkers[index]
            .openPopup();

    }

}


/* =====================================================
   DIRECTIONS
===================================================== */

function openDirections(id) {

    const service =
        allServices.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!service) {
        return;
    }


    const url =
        `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;


    window.open(
        url,
        "_blank"
    );

}


/* =====================================================
   WEATHER
===================================================== */

async function loadWeather(
    latitude,
    longitude
) {

    document.getElementById(
        "weatherDescription"
    ).textContent =
        "Loading current weather...";


    try {

        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Weather API failed"
            );

        }


        const data =
            await response.json();


        const current =
            data.current;


        const units =
            data.current_units;


        document.getElementById(
            "temperature"
        ).textContent =
            `${Math.round(current.temperature_2m)}${units.temperature_2m}`;


        document.getElementById(
            "feelsLike"
        ).textContent =
            `${Math.round(current.apparent_temperature)}${units.apparent_temperature}`;


        document.getElementById(
            "humidity"
        ).textContent =
            `${current.relative_humidity_2m}${units.relative_humidity_2m}`;


        document.getElementById(
            "wind"
        ).textContent =
            `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;


        document.getElementById(
            "rain"
        ).textContent =
            `${current.precipitation} ${units.precipitation}`;


        const weatherInfo =
            getWeatherInfo(
                current.weather_code
            );


        document.getElementById(
            "weatherEmoji"
        ).textContent =
            weatherInfo.emoji;


        document.getElementById(
            "weatherDescription"
        ).textContent =
            weatherInfo.description;


        document.getElementById(
            "weatherUpdated"
        ).textContent =
            `Updated: ${formatTime(data.current.time)}`;


        generateWeatherAlerts(
            current
        );


    }

    catch (error) {

        console.error(
            "Weather Error:",
            error
        );


        document.getElementById(
            "weatherDescription"
        ).textContent =
            "Weather data unavailable";


        document.getElementById(
            "weatherUpdated"
        ).textContent =
            "Please try Update again";


        document.getElementById(
            "alertsContainer"
        ).innerHTML =
            `
            <div class="alert-card alert-warning">

                <span>⚠️</span>

                <div>
                    <strong>
                        Weather service unavailable
                    </strong>

                    <p>
                        Live weather could not be loaded.
                        Please try again.
                    </p>
                </div>

            </div>
            `;

    }

}


/* =====================================================
   WEATHER INFO
===================================================== */

function getWeatherInfo(code) {

    const weatherMap = {

        0: {
            emoji: "☀️",
            description: "Clear sky"
        },

        1: {
            emoji: "🌤️",
            description: "Mainly clear"
        },

        2: {
            emoji: "⛅",
            description: "Partly cloudy"
        },

        3: {
            emoji: "☁️",
            description: "Overcast"
        },

        45: {
            emoji: "🌫️",
            description: "Fog"
        },

        48: {
            emoji: "🌫️",
            description: "Depositing rime fog"
        },

        51: {
            emoji: "🌦️",
            description: "Light drizzle"
        },

        53: {
            emoji: "🌦️",
            description: "Moderate drizzle"
        },

        55: {
            emoji: "🌧️",
            description: "Dense drizzle"
        },

        61: {
            emoji: "🌧️",
            description: "Slight rain"
        },

        63: {
            emoji: "🌧️",
            description: "Moderate rain"
        },

        65: {
            emoji: "🌧️",
            description: "Heavy rain"
        },

        71: {
            emoji: "🌨️",
            description: "Slight snowfall"
        },

        73: {
            emoji: "🌨️",
            description: "Moderate snowfall"
        },

        75: {
            emoji: "❄️",
            description: "Heavy snowfall"
        },

        80: {
            emoji: "🌦️",
            description: "Rain showers"
        },

        81: {
            emoji: "🌧️",
            description: "Moderate rain showers"
        },

        82: {
            emoji: "⛈️",
            description: "Violent rain showers"
        },

        95: {
            emoji: "⛈️",
            description: "Thunderstorm"
        },

        96: {
            emoji: "⛈️",
            description: "Thunderstorm with hail"
        },

        99: {
            emoji: "⛈️",
            description: "Severe thunderstorm"
        }

    };


    return (
        weatherMap[code] || {
            emoji: "🌤️",
            description: "Unknown weather"
        }
    );

}


/* =====================================================
   WEATHER ALERTS
===================================================== */

function generateWeatherAlerts(
    current
) {

    const alerts = [];


    const temperature =
        current.temperature_2m;


    const wind =
        current.wind_speed_10m;


    const rain =
        current.precipitation;


    const code =
        current.weather_code;


    /* Extreme heat */

    if (temperature >= 40) {

        alerts.push({

            type: "danger",

            icon: "🌡️",

            title:
                "Extreme heat condition",

            text:
                "Temperature is very high. Stay hydrated and avoid unnecessary outdoor exposure."

        });

    }

    else if (temperature >= 35) {

        alerts.push({

            type: "warning",

            icon: "🌡️",

            title:
                "High temperature",

            text:
                "Temperature is high. Stay hydrated and take regular breaks outdoors."

        });

    }


    /* Heavy rain */

    if (rain >= 10) {

        alerts.push({

            type: "danger",

            icon: "🌧️",

            title:
                "Heavy precipitation",

            text:
                "Significant precipitation is currently reported. Travel carefully and watch local conditions."

        });

    }

    else if (rain >= 2) {

        alerts.push({

            type: "warning",

            icon: "🌧️",

            title:
                "Rain detected",

            text:
                "Rain is currently being reported. Roads may be slippery."

        });

    }


    /* Strong wind */

    if (wind >= 50) {

        alerts.push({

            type: "danger",

            icon: "💨",

            title:
                "Strong wind",

            text:
                "Strong winds are being reported. Take care near trees, signs and exposed areas."

        });

    }

    else if (wind >= 30) {

        alerts.push({

            type: "warning",

            icon: "💨",

            title:
                "Moderate to strong wind",

            text:
                "Wind speeds are elevated. Travel carefully."

        });

    }


    /* Thunderstorm */

    if (
        code >= 95 &&
        code <= 99
    ) {

        alerts.push({

            type: "danger",

            icon: "⛈️",

            title:
                "Thunderstorm conditions",

            text:
                "Thunderstorm conditions are currently reported. Avoid exposed outdoor areas."

        });

    }


    /* Safe */

    if (alerts.length === 0) {

        alerts.push({

            type: "safe",

            icon: "✅",

            title:
                "No major weather alert",

            text:
                "Current weather data does not indicate a major weather-related warning."

        });

    }


    document.getElementById(
        "alertsContainer"
    ).innerHTML =

        alerts
            .map(
                alert => `

                    <div class="
                        alert-card
                        alert-${alert.type}
                    ">

                        <span>
                            ${alert.icon}
                        </span>

                        <div>

                            <strong>
                                ${alert.title}
                            </strong>

                            <p>
                                ${alert.text}
                            </p>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   REVERSE GEOCODING
===================================================== */

async function reverseGeocode(
    latitude,
    longitude
) {

    try {

        const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        const address =
            data.address || {};


        const place =
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            address.county ||
            "Current Location";


        const state =
            address.state ||
            "";


        document.getElementById(
            "weatherLocation"
        ).textContent =
            state
                ? `${place}, ${state}`
                : place;

    }

    catch (error) {

        console.warn(
            "Reverse geocoding failed:",
            error
        );

    }

}


/* =====================================================
   SHARE LOCATION
===================================================== */

async function shareCurrentLocation() {

    if (
        currentLat === null ||
        currentLng === null
    ) {

        showToast(
            "Please detect your live location first.",
            "📍"
        );

        detectLiveLocation();

        return;

    }


    const mapsUrl =
        `https://www.google.com/maps?q=${currentLat},${currentLng}`;


    const shareText =
        `My current location: ${mapsUrl}`;


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "My Emergency Location",

                text:
                    shareText,

                url:
                    mapsUrl

            });


            showToast(
                "Location shared.",
                "📤"
            );

        }

        catch (error) {

            console.log(
                "Share cancelled."
            );

        }

        return;

    }


    try {

        await navigator.clipboard.writeText(
            mapsUrl
        );


        showToast(
            "Location link copied.",
            "📋"
        );

    }

    catch (error) {

        window.prompt(
            "Copy your location link:",
            mapsUrl
        );

    }

}


/* =====================================================
   EMERGENCY CALL
===================================================== */

function callEmergency(
    number
) {

    showToast(
        `Opening dialer for ${number}...`,
        "📞"
    );


    window.location.href =
        `tel:${number}`;

}


/* =====================================================
   REPORT CREATE
===================================================== */

function handleReportSubmit(
    event
) {

    event.preventDefault();


    const type =
        document.getElementById(
            "reportType"
        ).value;


    const location =
        document.getElementById(
            "reportLocation"
        ).value.trim();


    const description =
        document.getElementById(
            "reportDescription"
        ).value.trim();


    if (
        !type ||
        !location ||
        !description
    ) {

        showToast(
            "Please fill all report fields.",
            "⚠️"
        );

        return;

    }


    const reports =
        getReports();


    const newReport = {

        id:
            Date.now(),

        type,

        location,

        description,

        status:
            "Pending",

        createdAt:
            new Date().toLocaleString(),

        updatedAt:
            null

    };


    reports.unshift(
        newReport
    );


    saveReports(
        reports
    );


    reportForm.reset();


    renderReports();


    showToast(
        "Emergency report created.",
        "✅"
    );

}


/* =====================================================
   GET REPORTS
===================================================== */

function getReports() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "lifeguard_reports"
            )
        ) || [];

    }

    catch (error) {

        return [];

    }

}


/* =====================================================
   SAVE REPORTS
===================================================== */

function saveReports(
    reports
) {

    localStorage.setItem(
        "lifeguard_reports",
        JSON.stringify(
            reports
        )
    );

}


/* =====================================================
   RENDER REPORTS
===================================================== */

function renderReports() {

    const reports =
        getReports();


    if (reports.length === 0) {

        reportsList.innerHTML =
            `
            <div class="empty-state">
                <span>📝</span>
                <p>No reports yet.</p>
            </div>
            `;

        return;

    }


    reportsList.innerHTML =
        reports
            .map(
                report =>
                    createReportHTML(
                        report
                    )
            )
            .join("");


    document
        .querySelectorAll(
            ".resolve-report-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleReportStatus(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".delete-report-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteReport(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });

}


/* =====================================================
   REPORT HTML
===================================================== */

function createReportHTML(
    report
) {

    const resolved =
        report.status ===
        "Resolved";


    return `

        <div class="report-item">

            <div class="report-item-top">

                <h4>
                    ${escapeHtml(report.type)}
                </h4>

                <span class="
                    report-status
                    ${resolved ? "resolved" : ""}
                ">
                    ${report.status}
                </span>

            </div>

            <p>
                📍 ${escapeHtml(report.location)}
            </p>

            <p>
                ${escapeHtml(report.description)}
            </p>

            <p>
                🕒 ${escapeHtml(report.createdAt)}
            </p>

            <div class="report-actions">

                <button
                    class="report-action resolve-report-btn"
                    data-id="${report.id}"
                >
                    ${resolved
                        ? "↩ Reopen"
                        : "✓ Resolve"}
                </button>

                <button
                    class="report-action delete-report-btn"
                    data-id="${report.id}"
                >
                    🗑 Delete
                </button>

            </div>

        </div>

    `;

}


/* =====================================================
   TOGGLE REPORT STATUS
===================================================== */

function toggleReportStatus(
    id
) {

    const reports =
        getReports();


    const report =
        reports.find(
            item =>
                item.id === id
        );


    if (!report) {
        return;
    }


    report.status =
        report.status === "Resolved"
            ? "Pending"
            : "Resolved";


    report.updatedAt =
        new Date().toLocaleString();


    saveReports(
        reports
    );


    renderReports();


    showToast(
        `Report ${report.status.toLowerCase()}.`,
        "✓"
    );

}


/* =====================================================
   DELETE REPORT
===================================================== */

function deleteReport(
    id
) {

    const confirmed =
        confirm(
            "Delete this emergency report?"
        );


    if (!confirmed) {
        return;
    }


    const reports =
        getReports()
            .filter(
                report =>
                    report.id !== id
            );


    saveReports(
        reports
    );


    renderReports();


    showToast(
        "Report deleted.",
        "🗑"
    );

}


/* =====================================================
   CLEAR ALL REPORTS
===================================================== */

function clearAllReports() {

    const reports =
        getReports();


    if (reports.length === 0) {

        showToast(
            "There are no reports to clear.",
            "ℹ️"
        );

        return;

    }


    const confirmed =
        confirm(
            "Delete all emergency reports?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "lifeguard_reports"
    );


    renderReports();


    showToast(
        "All reports deleted.",
        "🗑"
    );

}


/* =====================================================
   THEME
===================================================== */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "lifeguard_theme",
        dark
            ? "dark"
            : "light"
    );


    themeBtn.textContent =
        dark
            ? "☀️"
            : "🌙";

}


/* =====================================================
   LOAD THEME
===================================================== */

function loadSavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "lifeguard_theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeBtn.textContent =
            "☀️";

    }

    else {

        themeBtn.textContent =
            "🌙";

    }

}


/* =====================================================
   LANGUAGE
===================================================== */

function toggleLanguage() {

    currentLanguage =
        currentLanguage === "en"
            ? "hi"
            : "en";


    if (currentLanguage === "hi") {

        applyHindi();

    }

    else {

        applyEnglish();

    }


    localStorage.setItem(
        "lifeguard_language",
        currentLanguage
    );

}


/* =====================================================
   LOAD LANGUAGE
===================================================== */

function loadSavedLanguage() {

    const saved =
        localStorage.getItem(
            "lifeguard_language"
        );


    if (saved === "hi") {

        currentLanguage = "hi";

        applyHindi();

    }

}


/* =====================================================
   HINDI
===================================================== */

function applyHindi() {

    languageBtn.textContent =
        "English";


    document.getElementById(
        "brandSubtitle"
    ).textContent =
        "आपातकालीन और सुरक्षा डैशबोर्ड";


    document.getElementById(
        "heroTitle"
    ).textContent =
        "सुरक्षित रहें। मदद पाएं। जुड़े रहें।";


    document.getElementById(
        "heroText"
    ).textContent =
        "अपने लाइव स्थान से नजदीकी आपातकालीन सेवाएं खोजें और मौसम की जानकारी देखें।";


    locateBtn.textContent =
        "📍 मेरा लाइव स्थान";


    shareBtn.textContent =
        "📤 स्थान शेयर करें";


    document.getElementById(
        "emergencyTitle"
    ).textContent =
        "आपातकालीन नंबर";


    document.getElementById(
        "emergencyLabel"
    ).textContent =
        "आपातकाल";


    document.getElementById(
        "policeLabel"
    ).textContent =
        "पुलिस";


    document.getElementById(
        "fireLabel"
    ).textContent =
        "फायर";


    document.getElementById(
        "ambulanceLabel"
    ).textContent =
        "एम्बुलेंस";


    document.getElementById(
        "mapTitle"
    ).textContent =
        "नजदीकी आपातकालीन सेवाएं";


    document.getElementById(
        "servicesTitle"
    ).textContent =
        "नजदीकी सेवाएं";


    document.getElementById(
        "weatherTitle"
    ).textContent =
        "वर्तमान मौसम";


    document.getElementById(
        "alertsTitle"
    ).textContent =
        "मौसम और सुरक्षा अलर्ट";


    document.getElementById(
        "reportTitle"
    ).textContent =
        "आपातकालीन रिपोर्ट";

}


/* =====================================================
   ENGLISH
===================================================== */

function applyEnglish() {

    languageBtn.textContent =
        "हिन्दी";


    document.getElementById(
        "brandSubtitle"
    ).textContent =
        "Emergency & Safety Dashboard";


    document.getElementById(
        "heroTitle"
    ).textContent =
        "Stay Safe. Get Help. Stay Connected.";


    document.getElementById(
        "heroText"
    ).textContent =
        "Find nearby emergency services using your live location, check weather conditions and access emergency numbers quickly.";


    locateBtn.textContent =
        "📍 Use My Live Location";


    shareBtn.textContent =
        "📤 Share Location";


    document.getElementById(
        "emergencyTitle"
    ).textContent =
        "Emergency Numbers";


    document.getElementById(
        "emergencyLabel"
    ).textContent =
        "Emergency";


    document.getElementById(
        "policeLabel"
    ).textContent =
        "Police";


    document.getElementById(
        "fireLabel"
    ).textContent =
        "Fire";


    document.getElementById(
        "ambulanceLabel"
    ).textContent =
        "Ambulance";


    document.getElementById(
        "mapTitle"
    ).textContent =
        "Nearby Emergency Services";


    document.getElementById(
        "servicesTitle"
    ).textContent =
        "Nearby Services";


    document.getElementById(
        "weatherTitle"
    ).textContent =
        "Current Weather";


    document.getElementById(
        "alertsTitle"
    ).textContent =
        "Weather & Safety Alerts";


    document.getElementById(
        "reportTitle"
    ).textContent =
        "Emergency Report";

}


/* =====================================================
   TOAST
===================================================== */

function showToast(
    message,
    icon = "✓"
) {

    toastMessage.textContent =
        message;


    toastIcon.textContent =
        icon;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =====================================================
   FORMAT DISTANCE
===================================================== */

function formatDistance(
    distance
) {

    if (distance < 1) {

        return `${Math.round(distance * 1000)} m`;

    }


    return `${distance.toFixed(1)} km`;

}


/* =====================================================
   FORMAT TIME
===================================================== */

function formatTime(
    time
) {

    if (!time) {
        return "";
    }


    const date =
        new Date(time);


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}