(function () {
  const FAV_KEY = "ao_favs_v1";
  const MAP_STYLE_KEY = "ao_map_style_v1"; // "dark" | "light"

  function getRestaurants() {
    return (window.RESTAURANTS || []).slice();
  }

  function byId(id) {
    return getRestaurants().find(r => r.id === id);
  }

  function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function safeText(v) {
    return (v ?? "").toString();
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const A =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return 2 * R * Math.asin(Math.sqrt(A));
  }

  function tagLabel(t){
    const dict = {
      dedicated_gf: "Dédié GF",
      brunch: "Brunch",
      takeout: "Takeout",
      pizza: "Pizza",
      vegan: "Vegan",
      wifi: "Wi-Fi",
      happy_hour: "Happy hour"
    };
    return dict[t] || t;
  }

  function gfBadge(r) {
    const level = r.gf_level || "unknown";
    if (level === "dedicated") return { label: "🟢 Dédié sans gluten", tone: "good" };
    if (level === "option") return { label: "🟡 Option sans gluten", tone: "warn" };
    if (level === "chain") return { label: "🟠 Chaîne (prudence)", tone: "warn" };
    return { label: "⚪ Infos à confirmer", tone: "neutral" };
  }

  function disclaimer(r) {
    const level = r.gf_level || "unknown";
    if (level === "dedicated") return "";
    return "⚠️ Ce lieu propose une option sans gluten, mais il peut exister un risque de contamination croisée (selon cuisine/succursale). Si tu es cœliaque, confirme sur place.";
  }

  // Favorites
  function loadFavs() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }
  function saveFavs(set) {
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
  }
  function isFav(id) {
    return loadFavs().has(id);
  }
  function toggleFav(id) {
    const s = loadFavs();
    if (s.has(id)) s.delete(id);
    else s.add(id);
    saveFavs(s);
    return s.has(id);
  }

  // Map style
  function getMapStyle() {
    const v = localStorage.getItem(MAP_STYLE_KEY);
    return (v === "light" || v === "dark") ? v : "dark";
  }
  function setMapStyle(v) {
    localStorage.setItem(MAP_STYLE_KEY, v);
  }

  // Expose
  window.AO = {
    getRestaurants,
    byId,
    getParam,
    safeText,
    clamp,
    haversineKm,
    tagLabel,
    gfBadge,
    disclaimer,
    loadFavs,
    isFav,
    toggleFav,
    getMapStyle,
    setMapStyle
  };
})();
