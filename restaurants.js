// restaurants.js
// Charge les restos depuis Google Apps Script (JSON) + fallback local.
// + Fusion: Sheet (approved) écrase fallback si même id.

(function () {
  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxxARTHtrZB7r5cAxPM3pMOR4EJ0CYn9x0KdO-qYNJVYxnuWa4iQ2SLZ6sLrObculU_/exec";

  // ----------------------------
  // ✅ TES RESTOS HISTORIQUES ICI
  // ----------------------------
  const FALLBACK = [
    {
      id: "arepera-du-plateau",
      name: "Arepera du Plateau",
      city: "Montréal",
      neighborhood: "Plateau-Mont-Royal",
      address: "73 Rue Prince-Arthur E, Montréal, QC H2X 1B4",
      lat: 45.514775,
      lon: -73.571903,
      score: 9.0,
      scoreLabel: "9.0",
      image: "images/arepera83.jpg",
      note: "Je recommande à 100% pour la nourriture, juste un tout petit peu cher.",
      tags: ["dedicated_gf", "vegan", "wifi", "happy_hour"],
      price: "$$$",
      website: "https://www.arepera.ca/",
      gmaps: "",
      gfSafety: "dedicated", // dedicated | option | risk
    },
    {
      id: "le-marquis-signature-sante",
      name: "Le Marquis Signature santé",
      city: "Montréal",
      neighborhood: "Vieux-Montréal",
      address: "194 Saint-Paul St W, Montreal, Quebec H2Y 1Z9",
      lat: 45.5017,
      lon: -73.5673,
      score: 4.6,
      scoreLabel: "4.6",
      image: "images/575_Le-marquis-sans-gluten-vieux-montreal-7.jpg",
      note: "Parfait pour congeler et se faire de merveilleux petits déjeuner, je recommande à 100% !",
      tags: [],
      price: "$$",
      website: "",
      gmaps: "",
      gfSafety: "option",
    },
    {
      id: "bellucci-italia-complexe-desjardins",
      name: "Bellucci Italia",
      city: "Montréal",
      neighborhood: "Centre-ville",
      address: "200 Rue Sainte-Catherine O, Montréal, QC H5B 1B2 (Complexe Desjardins)",
      lat: 45.5049,
      lon: -73.5696,
      score: 7.8,
      scoreLabel: "7.8",
      image: "images/caption.jpg",
      note: "Pâtes fines et bien cuites. On a pris la “fromage” (moins garnie que prévu). Option sans gluten dispo.",
      tags: ["takeout"],
      price: "$$",
      website: "https://bellucciitalia.com/",
      gmaps: "",
      gfSafety: "option",
    },
    {
      id: "dominos-pizza-gf",
      name: "Domino’s Pizza",
      city: "Montréal",
      neighborhood: "",
      address: "Montréal (voir succursale)",
      lat: 45.505,
      lon: -73.57,
      score: 8.2,
      scoreLabel: "8.2",
      image: "images/dominos-gluten-free-pizza-2021-featured.jpg",
      note: "Option pâte sans gluten. Très bonne ! (Attention : risque de contamination croisée selon les succursales.)",
      tags: ["pizza", "takeout"],
      price: "$",
      website: "https://www.dominos.ca/",
      gmaps: "",
      gfSafety: "risk",
    },
  ];

  // ----------------------------
  // Helpers
  // ----------------------------
  function gfToSafety(gfText) {
    const s = String(gfText || "").toLowerCase();
    if (s.includes("dédi") || s.includes("dedicated") || s.includes("100%")) return "dedicated";
    if (s.includes("risque") || s.includes("contamination")) return "risk";
    return "option";
  }

  function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
    if (!tags) return [];
    // si c'est une string "pizza, takeout"
    return String(tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function normalizeOne(r) {
    // r vient de ton Apps Script doGet
    const id = String(r.id || "").trim();
    const lat = Number(r.lat || 0);
    const lon = Number(r.lon || 0);

    // ⚠️ ton Apps Script renvoie image = photo_url (tu l'as mis comme "image")
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
      image: String(r.image || r.photo_url || "").trim(),
      note: String(r.note || "").trim(),
      tags: normalizeTags(r.tags),
      price: String(r.price || "").trim(),
      website: String(r.website || "").trim(),
      gmaps: String(r.gmaps || "").trim(),
      gfSafety: r.gfSafety ? String(r.gfSafety).toLowerCase() : gfToSafety(r.gf),
    };
  }

  function mergeById(baseList, overrideList) {
    const map = new Map();
    baseList.forEach((r) => map.set(r.id, r));
    overrideList.forEach((r) => {
      if (!r || !r.id) return;
      map.set(r.id, r); // override si même id
    });
    return Array.from(map.values());
  }

  async function fetchRestaurants(status = "approved") {
    const url = `${ENDPOINT}?status=${encodeURIComponent(status)}&_=${Date.now()}`; // cache-buster
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map(normalizeOne)
      // IMPORTANT: enlever ceux qui n’ont pas de coords (sinon Leaflet peut bug)
      .filter((r) => isFinite(r.lat) && isFinite(r.lon) && r.lat !== 0 && r.lon !== 0);
  }

  // ----------------------------
  // Expose au global
  // ----------------------------
  window.AO_API = {
    ENDPOINT,
    fetchRestaurants,
  };

  // ✅ Par défaut: on met le fallback
  window.RESTAURANTS = FALLBACK;

  // ✅ Bonus: on essaye de charger la Sheet, puis on fusionne
  // (ça permet de garder tes anciens restos + ceux du form)
  fetchRestaurants("approved")
    .then((sheetList) => {
      const merged = mergeById(FALLBACK, sheetList);
      window.RESTAURANTS = merged;
      // petit flag utile pour debug
      window.AO_RESTOS_SOURCE = "merged";
    })
    .catch(() => {
      window.AO_RESTOS_SOURCE = "fallback";
    });
})();
