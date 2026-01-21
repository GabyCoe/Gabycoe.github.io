(function () {
  // =========================
  // Labels / dicts
  // =========================
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

  // =========================
  // URL
  // =========================
  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  // =========================
  // Tags / GF
  // =========================
  function tagLabel(t) {
    return TAG_DICT[t] || t;
  }

  function gfLabel(level) {
    return GF_LABEL[level] || "Sans info";
  }

  function gfColor(level) {
    return GF_COLOR[level] || "#94a3b8";
  }

  // =========================
  // Favoris
  // =========================
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

  // =========================
  // Géoloc (cache)
  // =========================
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

  // =========================
  // Distance
  // =========================
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

  // =========================
  // Navigation home (robuste GitHub Pages)
  // =========================
  function goHome() {
    // ./index.html marche en racine et en sous-chemin GitHub Pages
    window.location.assign("./index.html");
  }

  // =========================
  // Search utils (recherche "intelligente")
  // =========================
  function normalize(str = "") {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const SYNONYMS = {
    gf: ["sans gluten", "gluten free"],
    gluten: ["sans gluten", "gluten free"],
    pate: ["pates", "pasta"],
    pates: ["pasta"],
    italien: ["pizza", "pates"],
    pizza: ["italien"],
    dej: ["brunch", "dejeuner"],
    brunch: ["dejeuner"],
    centre: ["centre-ville", "centre ville"],
    takeout: ["a emporter", "emporter"],
  };

  function expandQuery(query = "") {
    const words = normalize(query).split(" ").filter(Boolean);
    const expanded = new Set(words);

    words.forEach((word) => {
      const syns = SYNONYMS[word];
      if (syns && Array.isArray(syns)) {
        syns.forEach((s) => expanded.add(normalize(s)));
      }
    });

    return [...expanded];
  }

  // =========================
  // Expose
  // =========================
  window.AO = {
    // url / tags
    getParam,
    tagLabel,
    gfLabel,
    gfColor,

    // favorites
    getFavorites,
    saveFavorites,
    isFavorite,
    toggleFavorite,

    // geoloc / distance
    saveLastLocation,
    getLastLocation,
    haversineKm,
    formatDistance,

    // nav
    goHome,

    // search
    normalize,
    expandQuery,
  };
})();
