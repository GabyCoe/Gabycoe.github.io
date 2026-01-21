(function () {
  const TAG_DICT = {
    dedicated_gf: "Dédié GF",
    brunch: "Brunch",
    takeout: "Takeout",
    pizza: "Pizza",
    vegan: "Vegan",
    wifi: "Wi-Fi",
    happy_hour: "Happy hour",
  };

  const GF_LABEL = {
    dedicated: "Dédié sans gluten",
    option: "Option sans gluten",
    risk: "Risque contamination",
  };

  const GF_COLOR = {
    dedicated: "#10b981",
    option: "#f59e0b",
    risk: "#ef4444",
  };

  // ---------- URL ----------
  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  // ---------- Tags / GF ----------
  function tagLabel(t) {
    return TAG_DICT[t] || t;
  }

  function gfLabel(level) {
    return GF_LABEL[level] || "Sans info";
  }

  function gfColor(level) {
    return GF_COLOR[level] || "#94a3b8";
  }

  // ---------- Favoris ----------
  const FAV_KEY = "ao_favorites_v1";

  function getFavorites() {
    try {
      const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return new Set(Array.isArray(v) ? v : []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites(set) {
    localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
  }

  function isFavorite(id) {
    return getFavorites().has(id);
  }

  function toggleFavorite(id) {
    const s = getFavorites();
    if (s.has(id)) s.delete(id);
    else s.add(id);
    saveFavorites(s);
    return s.has(id);
  }

  // ---------- Géoloc (cache) ----------
  const LOC_KEY = "ao_last_location_v1"; // {lat, lon, ts}

  function saveLastLocation(lat, lon) {
    localStorage.setItem(LOC_KEY, JSON.stringify({ lat, lon, ts: Date.now() }));
  }

  function getLastLocation() {
    try {
      const v = JSON.parse(localStorage.getItem(LOC_KEY) || "null");
      if (!v || typeof v.lat !== "number" || typeof v.lon !== "number") return null;
      return v;
    } catch {
      return null;
    }
  }

  // ---------- Distance ----------
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function formatDistance(km) {
    if (km == null || !isFinite(km)) return "";
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(km < 10 ? 1 : 0)} km`;
  }

  // ---------- Navigation home (robuste GitHub Pages) ----------
  function goHome() {
    // ./index.html marche en racine et en sous-chemin GitHub Pages
    window.location.assign("./index.html");
  }

  // ---------- Expose ----------
  window.AO = {
    getParam,
    tagLabel,
    gfLabel,
    gfColor,
    getFavorites,
    saveFavorites,
    isFavorite,
    toggleFavorite,
    saveLastLocation,
    getLastLocation,
    haversineKm,
    formatDistance,
    goHome,
  };
})();

