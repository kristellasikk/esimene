const cities = {
  tallinn: { name: "Tallinn", lat: 59.437, lon: 24.7536 },
  tartu: { name: "Tartu", lat: 58.3776, lon: 26.729 },
  parnu: { name: "Pärnu", lat: 58.3859, lon: 24.4971 },
  narva: { name: "Narva", lat: 59.3772, lon: 28.1903 },
  viljandi: { name: "Viljandi", lat: 58.3639, lon: 25.59 },
  kuressaare: { name: "Kuressaare", lat: 58.2481, lon: 22.5039 }
};
const weatherCodes = {
  0:["Selge","☀"],1:["Peamiselt selge","🌤"],2:["Vahelduv pilvisus","⛅"],3:["Pilves","☁"],
  45:["Udu","〰"],48:["Härmas udu","〰"],51:["Kerge uduvihm","🌦"],53:["Uduvihm","🌦"],55:["Tugev uduvihm","🌧"],
  56:["Jäätuv uduvihm","🌧"],57:["Tugev jäätuv vihm","🌧"],61:["Kerge vihm","🌦"],63:["Vihm","🌧"],65:["Tugev vihm","🌧"],
  66:["Jäätuv vihm","🌧"],67:["Tugev jäätuv vihm","🌧"],71:["Kerge lumesadu","🌨"],73:["Lumesadu","🌨"],75:["Tugev lumesadu","❄"],
  77:["Lumeterad","❄"],80:["Kerge vihmahoog","🌦"],81:["Vihmahood","🌧"],82:["Tugevad vihmahood","🌧"],85:["Kerge lumehoog","🌨"],
  86:["Tugev lumehoog","🌨"],95:["Äike","⛈"],96:["Äike ja rahe","⛈"],99:["Tugev äike ja rahe","⛈"]
};
const elements = {
  city:document.querySelector("#city-select"),locate:document.querySelector("#location-button"),status:document.querySelector("#status"),
  place:document.querySelector("#place"),date:document.querySelector("#date"),updated:document.querySelector("#updated"),
  temperature:document.querySelector("#temperature"),condition:document.querySelector("#condition"),icon:document.querySelector("#weather-icon"),
  feels:document.querySelector("#feels-like"),wind:document.querySelector("#wind"),humidity:document.querySelector("#humidity"),
  precipitation:document.querySelector("#precipitation"),sunset:document.querySelector("#sunset"),forecast:document.querySelector("#forecast-list")
};
const weatherInfo = code => weatherCodes[code] || ["Muutlik ilm","◌"];
const formatLocalDate = iso => new Intl.DateTimeFormat("et-EE",{weekday:"long",day:"numeric",month:"long"}).format(new Date(iso));
const formatTime = value => new Intl.DateTimeFormat("et-EE",{hour:"2-digit",minute:"2-digit"}).format(new Date(value));

async function loadWeather(location) {
  elements.status.textContent = "";
  elements.updated.textContent = "Andmete laadimine…";
  const params = new URLSearchParams({
    latitude:location.lat,longitude:location.lon,
    current:"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    hourly:"temperature_2m,weather_code,precipitation_probability",daily:"sunset",timezone:"auto",forecast_days:"2"
  });
  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?" + params);
    if (!response.ok) throw new Error("Ilmateenusega ei õnnestunud ühendust saada.");
    renderWeather(await response.json(), location.name);
  } catch (error) {
    elements.status.textContent = error.message + " Palun proovi hetke pärast uuesti.";
    elements.updated.textContent = "Uuendamine ebaõnnestus";
  }
}

function renderWeather(data, placeName) {
  const current = data.current;
  const [condition, icon] = weatherInfo(current.weather_code);
  const now = new Date(current.time);
  elements.place.textContent = placeName;
  elements.date.textContent = formatLocalDate(current.time);
  elements.temperature.textContent = Math.round(current.temperature_2m);
  elements.condition.textContent = condition;
  elements.icon.textContent = icon;
  elements.feels.textContent = Math.round(current.apparent_temperature) + "°";
  elements.wind.textContent = Math.round(current.wind_speed_10m) + " km/h";
  elements.humidity.textContent = current.relative_humidity_2m + "%";
  elements.precipitation.textContent = current.precipitation.toFixed(1) + " mm";
  elements.sunset.textContent = formatTime(data.daily.sunset[0]);
  elements.updated.textContent = "Uuendatud " + formatTime(new Date());

  const nextHours = data.hourly.time.map((time,index)=>({time:new Date(time),index})).filter(item=>item.time>now).slice(0,6);
  elements.forecast.replaceChildren(...nextHours.map(({time,index})=>{
    const article = document.createElement("article");
    article.className = "forecast-item";
    const [,hourIcon] = weatherInfo(data.hourly.weather_code[index]);
    article.innerHTML = '<p class="forecast-item__time">'+formatTime(time)+'</p><div class="forecast-item__icon" aria-hidden="true">'+hourIcon+'</div><p class="forecast-item__temp">'+Math.round(data.hourly.temperature_2m[index])+'°</p><span class="sr-only">Sademete tõenäosus '+data.hourly.precipitation_probability[index]+'%</span>';
    return article;
  }));
}

elements.city.addEventListener("change", event => loadWeather(cities[event.target.value]));
elements.locate.addEventListener("click", () => {
  if (!navigator.geolocation) { elements.status.textContent = "Sinu veebilehitseja ei toeta asukoha määramist."; return; }
  const label = elements.locate.querySelector("span");
  elements.locate.disabled = true;
  label.textContent = "Asukoha otsimine…";
  navigator.geolocation.getCurrentPosition(position => {
    elements.city.selectedIndex = -1;
    loadWeather({name:"Minu asukoht",lat:position.coords.latitude,lon:position.coords.longitude});
    elements.locate.disabled = false; label.textContent = "Minu asukoht";
  }, () => {
    elements.status.textContent = "Asukohta ei õnnestunud määrata. Vali linn nimekirjast.";
    elements.locate.disabled = false; label.textContent = "Minu asukoht";
  }, {enableHighAccuracy:false,timeout:10000,maximumAge:300000});
});
loadWeather(cities.tallinn);
