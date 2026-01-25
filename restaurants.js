// restaurants.js
// Source unique: merge FALLBACK (tes restos) + Google Apps Script (Form/Sheet)
// Expose window.RESTAURANTS et déclenche un event "ao:restaurants:ready"

(function () {
  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxxARTHtrZB7r5cAxPM3pMOR4EJ0CYn9x0KdO-qYNJVYxnuWa4iQ2SLZ6sLrObculU_/exec";

  // ✅ Mets ici tes restos "historiques" (fallback)
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
      gfSafety: "dedicated",
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
      gfSafety: "risk",
    },
  ];

  function gfToSafety(gfText) {
    const s = String(gfText || "").toLowerCase();
    if (s.includes("dédi") || s.includes("dedicated") || s.includes("100%")) return "dedicated";
    if (s.includes("risque") || s.includes("contamination")) return "risk";
    return "option";
  }

  // ✅ Convertit un lien Drive "view" en lien image direct
  function driveToDirect(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    return u;
  }

  function normalizeOne(r) {
    const id = String(r.id || "").trim();
    const lat = Number(r.lat || 0);
    const lon = Number(r.lon || 0);

    // tags: array ou string
    let tags = [];
    if (Array.isArray(r.tags)) tags = r.tags.map(t => String(t).trim()).filter(Boolean);
    else if (typeof r.tags === "string") tags = r.tags.split(",").map(t => t.trim()).filter(Boolean);

    // image: supporte image OU photo_url
    const rawImg = String(r.image || r.photo_url || r.photo || "").trim();
    const image = driveToDirect(rawImg);

    return {
      id,
      name: String(r.name || "").trim(),
      city: String(r.city || "").trim(),
      neighborhood: String(r.neighborhood || "").trim(),
      address: String(r.address || "").trim(),
      lat,
      lon,
      score: r.score ? Number(r.score) : null,
      scoreLabel: String(r.scoreLabel || r.score || "").trim(),
      image,
      note: String(r.note || "").trim(),
      tags,
      price: String(r.price || "").trim(),
      website: String(r.website || "").trim(),
      gmaps: String(r.gmaps || "").trim(),
      gfSafety: r.gfSafety ? String(r.gfSafety) : gfToSafety(r.gf),
    };
  }

  async function fetchRestaurants(status = "approved") {
    const url = `${ENDPOINT}?status=${encodeURIComponent(status)}&_=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeOne)
      .filter(r => r.id && r.name); // on garde même si lat/lon manquent
  }

  function mergeById(fallback, remote) {
    const map = new Map();
    (fallback || []).forEach(r => { if (r && r.id) map.set(r.id, r); });
    (remote || []).forEach(r => {
      if (!r || !r.id) return;
      const prev = map.get(r.id) || {};
      map.set(r.id, { ...prev, ...r });
    });
    return [...map.values()];
  }

  // Expose API
  window.AO_API = { ENDPOINT, fetchRestaurants };

  // 1) rendu immédiat (fallback)
  window.RESTAURANTS = FALLBACK.slice();

  // 2) fetch + merge + event
  (async () => {
    try {
      const remote = await fetchRestaurants("approved");
      window.RESTAURANTS = mergeById(FALLBACK, remote);

      window.dispatchEvent(new CustomEvent("ao:restaurants:ready", {
        detail: window.RESTAURANTS
      }));
    } catch (e) {
      console.warn("AO fetch failed, keep FALLBACK only", e);
      window.dispatchEvent(new CustomEvent("ao:restaurants:ready", {
        detail: window.RESTAURANTS
      }));
    }
  })();
})();
