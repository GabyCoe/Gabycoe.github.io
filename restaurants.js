// restaurants.js
// Source principale : Google Apps Script (Sheet -> JSON)
// Fallback : liste locale (si l'API est down)

(function () {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbxxARTHtrZB7r5cAxPM3pMOR4EJ0CYn9x0KdO-qYNJVYxnuWa4iQ2SLZ6sLrObculU_/exec";

  // --- Fallback (tes restos actuels) ---
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

  // --- Helpers ---
  function sanitizeRestaurant(r) {
    // On normalise un minimum pour éviter que le site casse si une colonne est vide
    const obj = { ...r };

    obj.id = String(obj.id || "").trim() || slugify(obj.name || "restaurant");
    obj.name = String(obj.name || "Restaurant").trim();
    obj.city = String(obj.city || "").trim();
    obj.neighborhood = String(obj.neighborhood || "").trim();
    obj.address = String(obj.address || "").trim();

    // lat/lon doivent être number
    obj.lat = typeof obj.lat === "number" ? obj.lat : parseFloat(obj.lat);
    obj.lon = typeof obj.lon === "number" ? obj.lon : parseFloat(obj.lon);

    // score / labels
    const sc = typeof obj.score === "number" ? obj.score : parseFloat(obj.score);
    obj.score = isFinite(sc) ? sc : 0;
    obj.scoreLabel = obj.scoreLabel != null ? String(obj.scoreLabel) : String(obj.score);

    // images
    obj.image = String(obj.image || obj.photo_url || "").trim(); // support photo_url du sheet
    obj.website = String(obj.website || "").trim();
    obj.note = String(obj.note || "").trim();
    obj.price = String(obj.price || "").trim();

    // tags peut venir en array ou en string "a,b,c"
    if (Array.isArray(obj.tags)) obj.tags = obj.tags.filter(Boolean);
    else if (typeof obj.tags === "string") {
      obj.tags = obj.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else obj.tags = [];

    // gfSafety si absent
    obj.gfSafety = String(obj.gfSafety || "").trim() || "option";

    return obj;
  }

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "restaurant";
  }

  async function fetchFromApi(status) {
    const url = `${API_URL}?status=${encodeURIComponent(status || "approved")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(sanitizeRestaurant).filter((r) => isFinite(r.lat) && isFinite(r.lon));
  }

  // --- Exposed loader ---
  // Par défaut : approved uniquement
  async function loadRestaurants({ status = "approved", fallback = true } = {}) {
    try {
      const list = await fetchFromApi(status);
      // si l'API renvoie vide, on laisse quand même vide (c'est normal),
      // sauf si tu veux fallback quand c'est vide. Ici on fallback uniquement en cas d'erreur.
      window.RESTAURANTS = list;
      return list;
    } catch (err) {
      console.warn("[restaurants.js] API unreachable, using fallback.", err);
      const list = fallback ? FALLBACK.map(sanitizeRestaurant) : [];
      window.RESTAURANTS = list;
      return list;
    }
  }

  // --- Startup behavior ---
  // On met d'abord le fallback (pour que le site ne casse jamais),
  // puis on tente de remplacer par l'API en arrière-plan.
  window.RESTAURANTS = FALLBACK.map(sanitizeRestaurant);

  // Auto-refresh (ne bloque pas le rendu initial)
  loadRestaurants({ status: "approved", fallback: true }).catch(() => {});

  // Expose
  window.loadRestaurants = loadRestaurants;
})();
