(function () {
  const data = window.PREAKNESS;
  if (!data) return;

  const postTime = new Date(data.postTimeISO);

  // --- Shared: edition / post-time lines -----------------------------------
  const editionLine = document.getElementById("edition-line");
  if (editionLine) {
    editionLine.textContent = `${data.edition} · ${data.venue} · ${data.city}`;
  }

  const postLine = document.getElementById("post-time-line");
  if (postLine) {
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short"
    });
    postLine.textContent = `Post time: ${fmt.format(postTime)}`;
  }

  // --- Countdown -----------------------------------------------------------
  const cd = {
    root: document.getElementById("countdown"),
    d: document.getElementById("cd-days"),
    h: document.getElementById("cd-hours"),
    m: document.getElementById("cd-minutes"),
    s: document.getElementById("cd-seconds")
  };

  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    if (!cd.root) return;
    const now = Date.now();
    let diff = Math.max(0, postTime.getTime() - now);

    if (diff === 0) {
      cd.root.classList.add("is-live");
      cd.d.textContent = "00";
      cd.h.textContent = "00";
      cd.m.textContent = "00";
      cd.s.textContent = "00";
      const post = document.getElementById("post-time-line");
      if (post) post.textContent = "And they're off! Post time has arrived.";
      return;
    }

    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);

    cd.d.textContent = pad(days);
    cd.h.textContent = pad(hours);
    cd.m.textContent = pad(mins);
    cd.s.textContent = pad(secs);
  }
  if (cd.root) {
    tick();
    setInterval(tick, 1000);
  }

  // --- Google Calendar button ---------------------------------------------
  const calBtn = document.getElementById("calendar-btn");
  if (calBtn) {
    const start = toGCalDate(postTime);
    const end = toGCalDate(new Date(postTime.getTime() + 30 * 60 * 1000));
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${data.raceName} — ${data.edition}`,
      dates: `${start}/${end}`,
      details: `The ${data.edition} of the ${data.raceName} at ${data.venue}. Tickets: ${data.ticketLinks[0].url}`,
      location: `${data.venue}, ${data.city}`
    });
    calBtn.href = `https://www.google.com/calendar/render?${params.toString()}`;
  }

  function toGCalDate(d) {
    // YYYYMMDDTHHmmssZ in UTC
    const iso = d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    return iso;
  }

  // --- Odds table (index page) --------------------------------------------
  const tbody = document.querySelector("#odds-table tbody");
  if (tbody) {
    tbody.innerHTML = data.horses.map(h => `
      <tr>
        <td class="num-col"><span class="pp">${h.pp}</span></td>
        <td>
          <div class="horse-name">${escapeHtml(h.name)}</div>
          <div class="silks">${escapeHtml(h.silks)}</div>
        </td>
        <td>${escapeHtml(h.jockey)}</td>
        <td class="odds-col"><span class="odds-val">${escapeHtml(h.odds)}</span></td>
        <td class="action-col"><a class="details-link" href="horses.html#horse-${h.pp}">Details &rarr;</a></td>
      </tr>
    `).join("");
  }

  // --- Wager link list -----------------------------------------------------
  const wagerList = document.getElementById("wager-links");
  if (wagerList) {
    wagerList.innerHTML = data.ticketLinks.map(t =>
      `<li><a href="${t.url}" target="_blank" rel="noopener">${escapeHtml(t.label)}</a></li>`
    ).join("");
  }

  // --- Horse cards (field page) -------------------------------------------
  const cardGrid = document.getElementById("card-grid");
  if (cardGrid) {
    cardGrid.innerHTML = data.horses.map(h => `
      <article class="h-card" id="horse-${h.pp}">
        <div class="h-card-head">
          <span class="pp">${h.pp}</span>
          <h3 class="h-name">${escapeHtml(h.name)}</h3>
          <span class="odds-chip">${escapeHtml(h.odds)}</span>
        </div>
        <dl>
          <dt>Jockey</dt><dd>${escapeHtml(h.jockey)}</dd>
          <dt>Trainer</dt><dd>${escapeHtml(h.trainer)}</dd>
          <dt>Owner</dt><dd>${escapeHtml(h.owner)}</dd>
          <dt>Silks</dt><dd>${escapeHtml(h.silks)}</dd>
        </dl>
        <p class="notes">${escapeHtml(h.notes)}</p>
      </article>
    `).join("");

    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // --- Weather (Open-Meteo, no API key) -----------------------------------
  const wxEl = document.getElementById("weather");
  if (wxEl) loadWeather(wxEl);

  async function loadWeather(el) {
    const dateStr = data.postTimeISO.slice(0, 10); // YYYY-MM-DD
    const url = `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${data.lat}&longitude=${data.lon}`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max`
      + `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`
      + `&timezone=America%2FNew_York`
      + `&start_date=${dateStr}&end_date=${dateStr}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("weather request failed");
      const json = await res.json();
      const d = json.daily;
      if (!d || !d.time || !d.time.length) {
        // Forecast out of range (typically >16 days out)
        el.innerHTML = `<div class="weather-error">Race-day forecast for Baltimore will appear here closer to post time.</div>`;
        return;
      }
      const code = d.weather_code[0];
      const hi = Math.round(d.temperature_2m_max[0]);
      const lo = Math.round(d.temperature_2m_min[0]);
      const pop = d.precipitation_probability_max ? d.precipitation_probability_max[0] : null;
      const wind = Math.round(d.wind_speed_10m_max[0]);
      const w = wmoDescribe(code);

      el.innerHTML = `
        <span class="wx-icon" aria-hidden="true">${w.icon}</span>
        <div>
          <div><strong>Race day at Pimlico:</strong> ${w.label}, ${hi}&deg; / ${lo}&deg;F</div>
          <div class="wx-meta">${pop !== null ? `${pop}% chance of precip` : ""}${pop !== null ? " · " : ""}winds to ${wind} mph</div>
        </div>`;
    } catch (e) {
      el.innerHTML = `<div class="weather-error">Couldn't fetch the race-day forecast right now.</div>`;
    }
  }

  // Minimal WMO code -> description/icon mapping
  function wmoDescribe(code) {
    const map = {
      0: ["Clear", "☀️"],
      1: ["Mainly clear", "🌤️"],
      2: ["Partly cloudy", "⛅"],
      3: ["Overcast", "☁️"],
      45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
      51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
      61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
      66: ["Freezing rain", "🌧️"], 67: ["Heavy freezing rain", "🌧️"],
      71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
      77: ["Snow grains", "🌨️"],
      80: ["Rain showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Violent showers", "⛈️"],
      85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
      95: ["Thunderstorm", "⛈️"], 96: ["T-storm w/ hail", "⛈️"], 99: ["Severe t-storm", "⛈️"]
    };
    const [label, icon] = map[code] || ["Forecast", "🌤️"];
    return { label, icon };
  }
})();
