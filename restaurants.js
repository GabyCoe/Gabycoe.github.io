// restaurants.js
// Charge les restos depuis Google Apps Script (JSON) + fallback si erreur.

(function () {
  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxxARTHtrZB7r5cAxPM3pMOR4EJ0CYn9x0KdO-qYNJVYxnuWa4iQ2SLZ6sLrObculU_/exec";

  // Optionnel : fallback local (au cas où l’API est down)
  const FALLBACK = [
    // tu peux laisser vide si tu veux
  ];

  function gfToSafety(gfText) {
    const s = String(gfText || "").toLowerCase();
    if (s.includes("dédi") || s.includes("dedicated") || s.includes("100%")) return "dedicated";
    if (s.includes("risque") || s.includes("contamination")) return "risk";
    return "option";
  }

  function normalizeOne(r) {
    // r vient de ton Apps Script doGet
    const id = String(r.id || "").trim();
    const lat = Number(r.lat || 0);
    const lon = Number(r.lon || 0);

    return {
      id,
      name: String(r.name || "").trim(),
      city: String(r.city || "").trim(),
      neighborhood: String(r.neighborhood || "").trim(),
      address: String(r.address || "").trim(),
      lat,
      lon,
      score: Number(r.score || 0) || 0,
      scoreLabel: String(r.scoreLabel || r.score || "").trim(),
      image: String(r.image || "").trim(), // photo_url
      note: String(r.note || "").trim(),
      tags: Array.isArray(r.tags) ? r.tags : [],
      price: String(r.price || "").trim(),
      website: String(r.website || "").trim(),
      gmaps: String(r.gmaps || "").trim(),
      gfSafety: r.gfSafety ? String(r.gfSafety) : gfToSafety(r.gf),
    };
  }

  async function fetchRestaurants(status = "approved") {
    const url = `${ENDPOINT}?status=${encodeURIComponent(status)}&_=${Date.now()}`; // cache-buster
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeOne)
      // IMPORTANT: on enlève ceux qui n’ont pas de coords (sinon Leaflet peut bug)
      .filter((r) => isFinite(r.lat) && isFinite(r.lon) && r.lat !== 0 && r.lon !== 0);
  }

  // Expose au global
  window.AO_API = {
    ENDPOINT,
    fetchRestaurants,
  };

  // Pour compat: si quelqu’un utilise encore window.RESTAURANTS
  window.RESTAURANTS = FALLBACK;
})();
