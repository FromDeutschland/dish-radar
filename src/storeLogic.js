const STORE_PROFILES = {
  traderJoes: {
    id: "traderJoes",
    name: "Trader Joe's",
    pricing: {
      bakery: 0.93,
      dairy: 0.92,
      frozen: 0.9,
      pantry: 0.9,
      produce: 0.94,
      protein: 0.97,
      seafood: 0.99,
      specialty: 0.96,
    },
    coverage: {
      bakery: 0.96,
      dairy: 0.95,
      frozen: 0.96,
      pantry: 0.95,
      produce: 0.92,
      protein: 0.9,
      seafood: 0.86,
      specialty: 0.84,
    },
  },
  wholeFoods: {
    id: "wholeFoods",
    name: "Whole Foods",
    pricing: {
      bakery: 1.08,
      dairy: 1.1,
      frozen: 1.06,
      pantry: 1.08,
      produce: 1.03,
      protein: 1.06,
      seafood: 1.02,
      specialty: 1.0,
    },
    coverage: {
      bakery: 0.95,
      dairy: 0.96,
      frozen: 0.92,
      pantry: 0.96,
      produce: 0.97,
      protein: 0.95,
      seafood: 0.97,
      specialty: 0.99,
    },
  },
  costco: {
    id: "costco",
    name: "Costco",
    pricing: {
      bakery: 0.88,
      dairy: 0.83,
      frozen: 0.84,
      pantry: 0.8,
      produce: 0.9,
      protein: 0.82,
      seafood: 0.84,
      specialty: 1.15,
    },
    coverage: {
      bakery: 0.76,
      dairy: 0.9,
      frozen: 0.88,
      pantry: 0.89,
      produce: 0.74,
      protein: 0.9,
      seafood: 0.86,
      specialty: 0.6,
    },
  },
};

const EXACT_INGREDIENT_CALORIES = {
  butter: 810,
  garlic: 40,
  parmesan: 430,
  mozzarella: 640,
  pasta: 840,
  spaghetti: 840,
  eggs: 70,
  rice: 1600,
  potatoes: 520,
  onions: 50,
  tomatoes: 80,
  mushrooms: 40,
  spinach: 20,
  carrots: 90,
  lemon: 20,
  lime: 20,
  chicken: 520,
  beef: 960,
  pork: 820,
  salmon: 620,
  shrimp: 460,
  chickpeas: 240,
  yogurt: 520,
  cream: 450,
  cheese: 640,
};

const INGREDIENT_CALORIE_RULES = [
  { match: /(olive oil|avocado oil|sesame oil|vegetable oil|canola oil|oil\b)/, unitCalories: { tsp: 40, tbsp: 119, cup: 1900, ml: 8.1, bottle: 1900 } },
  { match: /butter/, unitCalories: { tsp: 34, tbsp: 102, cup: 1628, g: 7.2, oz: 203, piece: 102 } },
  { match: /(lentil|lentils)/, unitCalories: { cup: 230, g: 1.16, oz: 33, lb: 526, can: 350 } },
  { match: /(black bean|kidney bean|pinto bean|white bean|bean\b)/, unitCalories: { cup: 227, g: 1.3, oz: 37, lb: 590, can: 330 } },
  { match: /(chickpea|garbanzo)/, unitCalories: { cup: 269, g: 1.64, oz: 46, lb: 744, can: 390 } },
  { match: /(sweet potato|yam)/, unitCalories: { piece: 112, cup: 180, g: 0.86, oz: 24, lb: 390 } },
  { match: /(potato|russet|yukon)/, unitCalories: { piece: 160, cup: 116, g: 0.77, oz: 22, lb: 350 } },
  { match: /(rice|jasmine rice|basmati|brown rice)/, unitCalories: { cup: 205, g: 1.3, oz: 37, lb: 590, bag: 1600 } },
  { match: /(pasta|spaghetti|noodle|rigatoni|penne|pappardelle|linguine)/, unitCalories: { cup: 220, g: 3.7, oz: 105, lb: 1680, box: 1680 } },
  { match: /(quinoa|farro|barley|couscous|bulgur)/, unitCalories: { cup: 220, g: 1.2, oz: 34, lb: 544, bag: 1200 } },
  { match: /(flour|breadcrumb|panko)/, unitCalories: { cup: 455, tbsp: 28, g: 3.6, oz: 102, lb: 1630 } },
  { match: /(sugar|honey|maple syrup|agave)/, unitCalories: { tsp: 21, tbsp: 64, cup: 1030, g: 3.0, oz: 85, jar: 960 } },
  { match: /(peanut butter|almond butter|tahini)/, unitCalories: { tbsp: 95, cup: 1520, g: 5.9, oz: 167, jar: 2600 } },
  { match: /(almond|walnut|cashew|pecan|peanut|nut\b|seed\b|sunflower seed|pumpkin seed)/, unitCalories: { tbsp: 52, cup: 760, g: 5.8, oz: 164, bag: 1200 } },
  { match: /(chicken breast|chicken thigh|chicken)/, unitCalories: { piece: 250, cup: 335, g: 1.65, oz: 47, lb: 748 } },
  { match: /(flank steak|skirt steak|steak|beef)/, unitCalories: { piece: 430, cup: 340, g: 2.2, oz: 62, lb: 998 } },
  { match: /(ground turkey|turkey)/, unitCalories: { piece: 260, cup: 296, g: 1.75, oz: 50, lb: 794 } },
  { match: /(pork|bacon|sausage)/, unitCalories: { piece: 320, cup: 360, g: 2.5, oz: 71, lb: 1134 } },
  { match: /(salmon|tuna|cod|fish|sea bass|halibut)/, unitCalories: { fillet: 360, piece: 280, cup: 260, g: 2.0, oz: 57, lb: 907 } },
  { match: /(shrimp|prawn)/, unitCalories: { cup: 240, g: 1.0, oz: 28, lb: 454 } },
  { match: /(tofu|tempeh)/, unitCalories: { piece: 220, cup: 320, g: 1.6, oz: 45, lb: 726, pack: 640 } },
  { match: /(egg|eggs)/, unitCalories: { piece: 72, large: 72 } },
  { match: /(milk|yogurt|greek yogurt|cream|coconut milk)/, unitCalories: { cup: 150, tbsp: 20, g: 0.9, oz: 26, ml: 0.62, tub: 520, can: 445 } },
  { match: /(cheddar|parmesan|mozzarella|feta|goat cheese|cheese)/, unitCalories: { cup: 440, tbsp: 28, g: 3.6, oz: 102, lb: 1630, block: 720 } },
  { match: /(avocado)/, unitCalories: { piece: 240, cup: 234, g: 1.6, oz: 45 } },
  { match: /(tomato|cucumber|lettuce|spinach|kale|greens|broccoli|cauliflower|zucchini|mushroom|pepper|carrot|onion|garlic|lemon|lime|herb|parsley|cilantro)/, unitCalories: { piece: 35, cup: 35, bunch: 20, clove: 4, handful: 12, g: 0.35, oz: 10, lb: 160 } },
];

const CATEGORY_UNIT_CALORIES = {
  bakery: { loaf: 1200, pack: 900, roll: 220, slice: 120 },
  dairy: { cup: 180, tub: 520, block: 620, pack: 520, piece: 140 },
  frozen: { bag: 760, pack: 420, box: 820 },
  pantry: { cup: 200, box: 840, bag: 1600, jar: 320, can: 240, piece: 120 },
  produce: { piece: 75, cup: 40, bunch: 20, clove: 5 },
  protein: { piece: 260, lb: 700, cup: 240 },
  seafood: { piece: 210, lb: 560, cup: 220 },
  specialty: { tbsp: 60, tsp: 20, bottle: 420, jar: 250, can: 100, piece: 40 },
};

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Tk4ny0z2fEUUquuvBwBpLQMhTt9BsGpep69l0RmvxmE/edit?gid=0#gid=0";
export const INGREDIENT_LIBRARY_UPDATED_AT = "2026-04-19";

const THEMEALDB_API_KEY = import.meta.env.VITE_THEMEALDB_API_KEY || "1";
const THEMEALDB_BASE = `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}`;
const THEMEALDB_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const ALL_APP_CATEGORIES = [
  "salads-veggie-bowls",
  "balanced-plate",
  "pasta-noodles",
  "one-pot",
  "handhelds-casual",
  "soups-stews-chilis",
];

const CATEGORY_KEYWORDS = {
  "salads-veggie-bowls": ["salad", "slaw", "bowl", "vegetarian", "vegan", "side"],
  "balanced-plate": ["beef", "chicken", "seafood", "pork", "lamb", "goat", "main"],
  "pasta-noodles": ["pasta", "spaghetti", "linguine", "lasagne", "macaroni", "noodle"],
  "one-pot": ["curry", "tagine", "jambalaya", "risotto", "casserole", "skillet", "pilaf"],
  "handhelds-casual": ["burger", "sandwich", "taco", "wrap", "pizza", "pie", "roll"],
  "soups-stews-chilis": ["soup", "stew", "chili", "chowder", "broth"],
};

const DEFAULT_BASE_PRICES = {
  bakery: 4.2,
  dairy: 4.9,
  frozen: 4.7,
  pantry: 3.4,
  produce: 2.2,
  protein: 6.9,
  seafood: 10.5,
  specialty: 5.2,
};

const STORE_AISLE_ORDER = [
  "produce",
  "seafood",
  "protein",
  "dairy",
  "bakery",
  "pantry",
  "specialty",
  "frozen",
];

const STORE_AISLE_LABELS = {
  produce: "Produce",
  seafood: "Seafood",
  protein: "Meat & Protein",
  dairy: "Dairy & Eggs",
  bakery: "Bakery",
  pantry: "Pantry",
  specialty: "Sauces & Specialty",
  frozen: "Frozen",
};

const UNICODE_FRACTIONS = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅐": 1 / 7,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const DESCRIPTOR_UNITS = new Set([
  "chopped",
  "diced",
  "sliced",
  "minced",
  "grated",
  "large",
  "small",
  "medium",
  "beaten",
  "juiced",
  "juice",
  "to serve",
  "to garnish",
  "for garnish",
  "fresh",
  "ripe",
  "peeled",
  "halved",
  "crushed",
]);

const DISPLAY_OMIT_UNITS = new Set(["piece"]);

const RECOGNIZED_UNITS = new Set([
  "g",
  "kg",
  "ml",
  "l",
  "oz",
  "lb",
  "cup",
  "tbsp",
  "tsp",
  "slice",
  "clove",
  "handful",
  "bunch",
  "piece",
  "jar",
  "can",
  "bottle",
  "bag",
  "box",
  "pack",
  "tub",
  "block",
  "tin",
  "fillet",
  "loaf",
]);

const PACKAGE_EQUIVALENTS = {
  g: {
    produce: 150,
    pantry: 400,
    dairy: 200,
    protein: 454,
    seafood: 454,
    specialty: 120,
    bakery: 250,
    frozen: 400,
  },
  kg: {
    produce: 1,
    pantry: 1,
    dairy: 1,
    protein: 1,
    seafood: 1,
    specialty: 1,
    bakery: 1,
    frozen: 1,
  },
  ml: {
    pantry: 500,
    dairy: 240,
    specialty: 240,
    produce: 240,
    protein: 240,
    seafood: 240,
    bakery: 240,
    frozen: 240,
  },
  l: {
    pantry: 1,
    dairy: 1,
    specialty: 1,
    produce: 1,
    protein: 1,
    seafood: 1,
    bakery: 1,
    frozen: 1,
  },
  oz: {
    pantry: 16,
    dairy: 8,
    protein: 16,
    seafood: 16,
    specialty: 8,
    produce: 8,
    bakery: 8,
    frozen: 16,
  },
  lb: {
    pantry: 1,
    dairy: 1,
    protein: 1,
    seafood: 1,
    specialty: 1,
    produce: 1,
    bakery: 1,
    frozen: 1,
  },
  tbsp: {
    pantry: 16,
    dairy: 16,
    specialty: 12,
    produce: 8,
    protein: 8,
    seafood: 8,
    bakery: 8,
    frozen: 8,
  },
  tsp: {
    pantry: 48,
    dairy: 48,
    specialty: 36,
    produce: 24,
    protein: 24,
    seafood: 24,
    bakery: 24,
    frozen: 24,
  },
  clove: {
    produce: 6,
  },
  handful: {
    produce: 2,
    pantry: 4,
  },
  bunch: {
    produce: 1,
  },
  piece: {
    produce: 1,
    protein: 1,
    seafood: 1,
    dairy: 1,
    pantry: 1,
    specialty: 1,
    bakery: 1,
    frozen: 1,
  },
  jar: {
    pantry: 1,
    specialty: 1,
    dairy: 1,
  },
  can: {
    pantry: 1,
    specialty: 1,
  },
  bottle: {
    pantry: 1,
    specialty: 1,
  },
  bag: {
    pantry: 1,
    frozen: 1,
    produce: 1,
  },
  box: {
    pantry: 1,
    frozen: 1,
    bakery: 1,
  },
  pack: {
    pantry: 1,
    frozen: 1,
    dairy: 1,
    bakery: 1,
  },
  tub: {
    dairy: 1,
    specialty: 1,
  },
  block: {
    dairy: 1,
  },
  fillet: {
    seafood: 1,
    protein: 1,
  },
};

let mealLibraryPromise;
let mealLibraryCache = [];
let recipeDatabaseMetaPromise;

function normalizeText(value) {
  return `${value || ""}`.toLowerCase().trim();
}

function normalizeName(value) {
  return `${value || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function cleanTag(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatQtyValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatQty(amount, unit) {
  return `${formatQtyValue(amount)} ${unit}`;
}

export function formatIngredientDisplay(ingredient) {
  if (!ingredient?.name) {
    return "";
  }

  const amount = Number.isFinite(ingredient.amount) && ingredient.amount > 0 ? formatQtyValue(ingredient.amount) : "";
  const unit = cleanMeasure(ingredient.unit || "");

  if (!amount) {
    return ingredient.name;
  }

  if (!unit || DISPLAY_OMIT_UNITS.has(unit)) {
    return `${amount} ${ingredient.name}`.trim();
  }

  return `${amount} ${unit} ${ingredient.name}`.trim();
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCalories(value) {
  const safeValue = Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 1;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function getBasePrice(category) {
  return DEFAULT_BASE_PRICES[category] ?? 3.5;
}

function parseFractionToken(token) {
  const value = token.trim();
  if (!value) {
    return null;
  }
  if (UNICODE_FRACTIONS[value]) {
    return UNICODE_FRACTIONS[value];
  }
  if (/^\d+\/\d+$/.test(value)) {
    const [numerator, denominator] = value.split("/").map(Number);
    return denominator ? numerator / denominator : null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanMeasure(value) {
  const normalized = normalizeText(value);
  if (!normalized || normalized === "to taste" || /^\d+(\.\d+)?$/.test(normalized)) {
    return "piece";
  }
  if (/^(lb|lbs)$/.test(normalized)) return "lb";
  if (/^(oz|ounce|ounces)$/.test(normalized)) return "oz";
  if (/^g(ram)?s?$/.test(normalized)) return "g";
  if (/^kg|kilogram/.test(normalized)) return "kg";
  if (/^ml$|millilit/.test(normalized)) return "ml";
  if (/^l$|litre|liter/.test(normalized)) return "l";
  if (normalized.includes("ounce")) return "oz";
  if (normalized.includes("pound")) return "lb";
  if (normalized.includes("cup")) return "cup";
  if (normalized.includes("tablespoon") || normalized === "tbsp" || normalized === "tblsp" || normalized === "tbs") return "tbsp";
  if (normalized.includes("teaspoon") || normalized === "tsp") return "tsp";
  if (normalized.includes("slice")) return "slice";
  if (normalized.includes("clove")) return "clove";
  if (normalized.includes("handful")) return "handful";
  if (normalized.includes("bunch")) return "bunch";
  if (normalized.includes("jar")) return "jar";
  if (normalized.includes("can") || normalized.includes("tin")) return "can";
  if (normalized.includes("bottle")) return "bottle";
  if (normalized.includes("bag")) return "bag";
  if (normalized.includes("box")) return "box";
  if (normalized.includes("pack")) return "pack";
  if (normalized.includes("tub")) return "tub";
  if (normalized.includes("block")) return "block";
  if (normalized.includes("fillet")) return "fillet";
  if (normalized.includes("loaf")) return "loaf";
  if (normalized.includes("head")) return "piece";
  if (normalized.includes("stick")) return "piece";
  if (normalized.includes("leaves") || normalized.includes("sprig")) return "bunch";
  if (normalized.includes("juice")) return "piece";
  if (DESCRIPTOR_UNITS.has(normalized)) return "piece";
  return normalized.replace(/[^a-z0-9]+/g, " ").trim() || "piece";
}

function normalizeUnitAgainstAmount(amount, unit) {
  const normalizedUnit = cleanMeasure(unit);

  if (!normalizedUnit || normalizedUnit === "piece") {
    return "piece";
  }

  if (/^\d+(\.\d+)?$/.test(normalizedUnit)) {
    return "piece";
  }

  if (Number.isFinite(amount) && normalizedUnit === formatQtyValue(amount)) {
    return "piece";
  }

  return normalizedUnit;
}

function parseMeasureValue(measure) {
  const normalized = `${measure || ""}`.trim();
  if (!normalized) {
    return { amount: 1, unit: "piece" };
  }

  const compactMatch = normalized.match(/^(\d+(?:\.\d+)?)([a-zA-Z].*)$/);
  const prepared = compactMatch ? `${compactMatch[1]} ${compactMatch[2]}` : normalized;
  const tokens = prepared.split(/\s+/);
  let amount = 0;
  let consumed = 0;

  while (consumed < tokens.length) {
    const parsed = parseFractionToken(tokens[consumed]);
    if (parsed === null) {
      break;
    }
    amount += parsed;
    consumed += 1;
  }

  const remainder = tokens.slice(consumed).join(" ").trim();
  const roundedAmount = amount > 0 ? Math.round(amount * 10) / 10 : 1;
  return {
    amount: roundedAmount,
    unit: normalizeUnitAgainstAmount(roundedAmount, remainder || prepared),
  };
}

function normalizeShoppingAmount(amount, unit, category) {
  const categoryMap = PACKAGE_EQUIVALENTS[unit];
  if (!categoryMap) {
    return amount;
  }

  const divisor = categoryMap[category] || categoryMap.pantry || categoryMap.produce || 1;
  const normalized = amount / divisor;
  return Math.max(normalized, 0.1);
}

function formatShoppingQty(amount, unit) {
  if (unit === "piece") {
    return formatQtyValue(amount);
  }
  if (unit === "g" || unit === "ml") {
    return `${Math.round(amount)} ${unit}`;
  }
  if (unit === "kg" || unit === "l") {
    return `${amount % 1 === 0 ? amount : amount.toFixed(1)} ${unit}`;
  }
  return formatQty(amount, unit);
}

function inferIngredientCategoryFromName(name) {
  const food = normalizeText(name);

  if (/(chicken|beef|pork|turkey|lamb|goat|duck|sausage|meatball|tofu)/.test(food)) {
    return "protein";
  }
  if (/(shrimp|salmon|tuna|prawn|fish|cod|mackerel|seafood)/.test(food)) {
    return "seafood";
  }
  if (/(lettuce|spinach|tomato|cucumber|onion|pepper|lemon|lime|garlic|ginger|potato|broccoli|cabbage|carrot|herb|parsley|cilantro|avocado|mushroom|chili)/.test(food)) {
    return "produce";
  }
  if (/(cheese|milk|yogurt|cream|butter|feta|mozzarella|parmesan)/.test(food)) {
    return "dairy";
  }
  if (/(bread|bun|tortilla|roll|pita|naan|loaf|pastry)/.test(food)) {
    return "bakery";
  }
  if (/(stock|broth|sauce|paste|dressing|seasoning|spice|curry|miso|gochujang|pesto)/.test(food)) {
    return "specialty";
  }
  return "pantry";
}

function isRecognizedIngredientUnit(token) {
  const normalized = cleanMeasure(token);
  return RECOGNIZED_UNITS.has(normalized) || DESCRIPTOR_UNITS.has(normalizeText(token));
}

function parseIngredientText(line) {
  const raw = `${line || ""}`.trim();
  if (!raw) {
    return null;
  }

  const compactLeading = raw.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)\s+(.*)$/);
  const expanded = compactLeading ? `${compactLeading[1]} ${compactLeading[2]} ${compactLeading[3]}` : raw;
  const tokens = expanded.split(/\s+/).filter(Boolean);
  let amount = 0;
  let consumed = 0;

  while (consumed < tokens.length) {
    const parsed = parseFractionToken(tokens[consumed]);
    if (parsed === null) {
      break;
    }
    amount += parsed;
    consumed += 1;
  }

  if (!amount) {
    return {
      name: raw,
      amount: 1,
      unit: "piece",
    };
  }

  const rest = tokens.slice(consumed);
  if (!rest.length) {
    return {
      name: raw,
      amount,
      unit: "piece",
    };
  }

  const firstRest = rest[0];
  const useFirstAsUnit = isRecognizedIngredientUnit(firstRest);
  const unit = useFirstAsUnit ? cleanMeasure(firstRest) : "piece";
  const name = (useFirstAsUnit ? rest.slice(1) : rest).join(" ").trim() || raw;

  return {
    name,
    amount,
    unit: normalizeUnitAgainstAmount(amount, unit),
  };
}

function normalizeAppCategory(value) {
  const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, "-");
  const directMatch = ALL_APP_CATEGORIES.find((category) => category === normalized);
  if (directMatch) {
    return directMatch;
  }

  if (/(salad|veggie|vegetable|bowl|slaw)/.test(normalized)) return "salads-veggie-bowls";
  if (/(protein|balanced|plate|main)/.test(normalized)) return "balanced-plate";
  if (/(pasta|noodle)/.test(normalized)) return "pasta-noodles";
  if (/(one-pot|onepot|curry|skillet|risotto|casserole)/.test(normalized)) return "one-pot";
  if (/(handheld|casual|sandwich|taco|burger|wrap|pizza)/.test(normalized)) return "handhelds-casual";
  if (/(soup|stew|chili|chilli|broth)/.test(normalized)) return "soups-stews-chilis";
  return "";
}

function normalizeIngredientRecord(rawIngredient) {
  if (!rawIngredient) {
    return null;
  }

  if (typeof rawIngredient === "string") {
    const parsed = parseIngredientText(rawIngredient);
    if (!parsed?.name) {
      return null;
    }

    const category = inferIngredientCategoryFromName(parsed.name);
    return {
      id: normalizeName(parsed.name),
      name: parsed.name,
      amount: Math.max(Math.round((parsed.amount || 1) * 100) / 100, 0.1),
      unit: normalizeUnitAgainstAmount(parsed.amount || 1, parsed.unit),
      category,
      basePrice: getBasePrice(category),
    };
  }

  const name = `${rawIngredient.name || rawIngredient.ingredient || ""}`.trim();
  if (!name) {
    return null;
  }

  const parsedFromQty = rawIngredient.qty ? parseIngredientText(`${rawIngredient.qty} ${name}`) : null;
  const parsedAmount = Number.isFinite(Number(rawIngredient.amount)) ? Number(rawIngredient.amount) : parsedFromQty?.amount || 1;
  const parsedUnit = rawIngredient.unit || parsedFromQty?.unit || "piece";
  const category = rawIngredient.category || inferIngredientCategoryFromName(name);

  return {
    id: rawIngredient.id || rawIngredient.ingredientId || normalizeName(name),
    name,
    amount: Math.max(Math.round(parsedAmount * 100) / 100, 0.1),
    unit: normalizeUnitAgainstAmount(parsedAmount, parsedUnit),
    category,
    basePrice: Number.isFinite(Number(rawIngredient.basePrice)) ? Number(rawIngredient.basePrice) : getBasePrice(category),
  };
}

function normalizeDishRecord(dish) {
  if (!dish || !dish.name) {
    return null;
  }

  const instructions = Array.isArray(dish.instructions)
    ? dish.instructions.map((step) => `${step || ""}`.trim()).filter(Boolean)
    : parseInstructions(dish.instructions);
  const ingredients = (dish.ingredients || []).map(normalizeIngredientRecord).filter(Boolean);
  const category = normalizeAppCategory(dish.category)
    || inferAppCategoryFromMeal({
      strMeal: dish.name,
      strCategory: dish.category || "",
      strInstructions: instructions.join(" "),
    });
  const time = Number.isFinite(Number(dish.time))
    ? Number(dish.time)
    : estimatePrepTime(
      { strMeal: dish.name, strInstructions: instructions.join(" "), strCategory: category },
      ingredients.length,
      instructions.length,
    );
  const meta = dish.meta && typeof dish.meta === "object" ? dish.meta : {};

  return {
    id: dish.id || normalizeName(dish.name),
    name: dish.name,
    category,
    time,
    calories: Number.isFinite(Number(dish.calories)) && Number(dish.calories) > 0 ? Number(dish.calories) : null,
    trendNote: dish.trendNote || (meta.isAI ? "Bespoke AI recipe created by Gemini Chef." : "Recipe ready for this week’s plan."),
    sources: Array.isArray(dish.sources) && dish.sources.length ? dish.sources : [meta.isAI ? "Gemini Chef" : "Dish Radar"],
    cuisines: Array.isArray(dish.cuisines) ? dish.cuisines.filter(Boolean) : [],
    tags: Array.isArray(dish.tags) ? dish.tags.filter(Boolean) : [],
    instructions,
    image: dish.image || "",
    ingredients,
    meta,
  };
}

export function sanitizeStoredDishes(dishes) {
  return (Array.isArray(dishes) ? dishes : []).map(normalizeDishRecord).filter(Boolean);
}

function estimateIngredientCalories(ingredient) {
  if (typeof ingredient.calories === "number" && ingredient.calories > 0) {
    return ingredient.calories;
  }

  const exactKey = normalizeText(ingredient.name);
  const exact = EXACT_INGREDIENT_CALORIES[exactKey];
  if (typeof exact === "number") {
    return ingredient.amount * exact;
  }

  const rule = INGREDIENT_CALORIE_RULES.find((candidate) => candidate.match.test(exactKey));
  const ruleCalories = rule?.unitCalories?.[ingredient.unit];
  if (typeof ruleCalories === "number") {
    return ingredient.amount * ruleCalories;
  }

  const fallback = CATEGORY_UNIT_CALORIES[ingredient.category]?.[ingredient.unit];
  if (typeof fallback === "number") {
    return ingredient.amount * fallback;
  }

  return Math.max(ingredient.amount * 200, 25);
}

export function estimateDishCalories(dish) {
  if (typeof dish.calories === "number" && Number.isFinite(dish.calories) && dish.calories > 0) {
    return Math.round(dish.calories / 10) * 10;
  }

  const ingredientEstimate = Math.round(
    ((dish.ingredients || []).reduce((total, ingredient) => total + estimateIngredientCalories(ingredient), 0)) / 10,
  ) * 10;
  return Math.max(ingredientEstimate, 10);
}

function aggregateIngredients(dishes) {
  const rowsByKey = new Map();

  dishes.forEach((dish) => {
    (dish.ingredients || []).forEach((ingredient) => {
      const key = `${ingredient.id || normalizeName(ingredient.name)}::${ingredient.unit}`;
      const existing = rowsByKey.get(key) ?? {
        ingredientId: ingredient.id || "",
        ingredient: ingredient.name,
        amount: 0,
        shoppingAmount: 0,
        unit: ingredient.unit,
        category: ingredient.category,
        basePrice: ingredient.basePrice,
        dishes: [],
      };

      existing.amount += ingredient.amount;
      existing.shoppingAmount += normalizeShoppingAmount(ingredient.amount, ingredient.unit, ingredient.category);
      existing.basePrice = ingredient.basePrice;
      if (!existing.dishes.includes(dish.name)) {
        existing.dishes.push(dish.name);
      }
      rowsByKey.set(key, existing);
    });
  });

  return Array.from(rowsByKey.values()).sort((left, right) => {
    const leftIndex = STORE_AISLE_ORDER.indexOf(left.category);
    const rightIndex = STORE_AISLE_ORDER.indexOf(right.category);
    const safeLeftIndex = leftIndex === -1 ? STORE_AISLE_ORDER.length : leftIndex;
    const safeRightIndex = rightIndex === -1 ? STORE_AISLE_ORDER.length : rightIndex;

    if (safeLeftIndex !== safeRightIndex) {
      return safeLeftIndex - safeRightIndex;
    }

    return left.ingredient.localeCompare(right.ingredient);
  });
}

function buildReason(storeId, categoryCounts, wishlistSize) {
  const specialtyHeavy = (categoryCounts.specialty ?? 0) >= 4;
  const seafoodHeavy = (categoryCounts.seafood ?? 0) >= 2;
  const stapleHeavy = (categoryCounts.pantry ?? 0) + (categoryCounts.protein ?? 0) + (categoryCounts.dairy ?? 0) >= 10;

  if (storeId === "wholeFoods") {
    if (specialtyHeavy || seafoodHeavy) {
      return "Whole Foods gets the nod because this basket leans on specialty ingredients and seafood, so the one-store coverage is strongest there.";
    }
    return "Whole Foods wins because it covers this basket cleanly with the fewest substitutions, even if the total is a little higher.";
  }

  if (storeId === "costco") {
    if (wishlistSize >= 5 && stapleHeavy) {
      return "Costco wins because you picked a larger, staple-heavy basket where bulk proteins, dairy, and pantry items pay off.";
    }
    return "Costco comes out ahead on price, but only because this basket is large enough to justify warehouse-size packs.";
  }

  if (specialtyHeavy) {
    return "Trader Joe's still edges out the other stores, but expect a couple specialty swaps if a sauce is missing.";
  }

  return "Trader Joe's is the sweet spot here: the basket is fun, weeknight-friendly, and mostly built from produce, pantry staples, dairy, and ready sauces.";
}

function estimateStore(store, rows, wishlistSize) {
  const categoryCounts = {};
  let estimatedTotal = 0;
  let substitutionRisk = 0;

  rows.forEach((row) => {
    categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;

    const priceMultiplier = store.pricing[row.category] ?? 1;
    const coverage = store.coverage[row.category] ?? 0.8;
    const rowCost = row.shoppingAmount * row.basePrice * priceMultiplier;
    const coveragePenalty = (1 - coverage) * rowCost * 2.2;

    estimatedTotal += rowCost + coveragePenalty;
    substitutionRisk += 1 - coverage;
  });

  if (store.id === "costco" && wishlistSize < 4) {
    estimatedTotal += 14;
  }
  if (store.id === "costco" && (categoryCounts.specialty ?? 0) >= 2) {
    estimatedTotal += 10;
  }
  if (store.id === "wholeFoods" && (categoryCounts.specialty ?? 0) >= 3) {
    estimatedTotal -= 4;
  }
  if (store.id === "traderJoes" && (categoryCounts.specialty ?? 0) >= 4) {
    estimatedTotal += 6;
  }

  return {
    ...store,
    estimatedTotal,
    riskScore: substitutionRisk,
    reason: buildReason(store.id, categoryCounts, wishlistSize),
  };
}

export function createShoppingPlan(dishes) {
  const aggregatedRows = aggregateIngredients(dishes);
  const storeRanking = Object.values(STORE_PROFILES)
    .map((store) => estimateStore(store, aggregatedRows, dishes.length))
    .sort((left, right) => left.estimatedTotal - right.estimatedTotal);

  const recommendedStore = storeRanking[0];
  const rows = aggregatedRows.map((row) => ({
    ingredientId: row.ingredientId,
    ingredient: row.ingredient,
    qty: formatShoppingQty(row.amount, row.unit),
    expectedPrice: row.shoppingAmount * row.basePrice * (recommendedStore.pricing[row.category] ?? 1),
    dishUsedIn: row.dishes.join(", "),
    category: row.category,
    aisleLabel: STORE_AISLE_LABELS[row.category] || "Other",
  }));

  return {
    inventoryRows: aggregatedRows.map((row) => ({
      ingredientId: row.ingredientId,
      ingredient: row.ingredient,
      amount: row.amount,
      shoppingAmount: row.shoppingAmount,
      unit: row.unit,
      category: row.category,
      basePrice: row.basePrice,
      dishes: [...row.dishes],
    })),
    recommendedStore,
    rows,
    storeRanking,
    selectedDishes: dishes.map((dish) => dish.name),
  };
}

export function cleanShoppingPlan(plan) {
  const rowsByKey = new Map();

  (plan?.rows || []).forEach((row) => {
    const ingredient = `${row.ingredient || ""}`.trim();
    const qty = `${row.qty || ""}`.replace(/\s+/g, " ").trim();
    if (!ingredient || !qty) {
      return;
    }

    const category = row.category || "pantry";
    const aisleLabel = row.aisleLabel || STORE_AISLE_LABELS[category] || "Other";
    const key = `${normalizeName(ingredient)}::${normalizeName(qty)}::${category}`;
    const existing = rowsByKey.get(key);
    const dishes = `${row.dishUsedIn || ""}`
      .split(",")
      .map((dishName) => dishName.trim())
      .filter(Boolean);

    if (existing) {
      existing.expectedPrice += Number(row.expectedPrice || 0);
      dishes.forEach((dishName) => {
        if (!existing.dishes.includes(dishName)) {
          existing.dishes.push(dishName);
        }
      });
      return;
    }

    rowsByKey.set(key, {
      ingredientId: row.ingredientId || normalizeName(ingredient),
      ingredient,
      qty,
      expectedPrice: Number(row.expectedPrice || 0),
      dishUsedIn: "",
      dishes,
      category,
      aisleLabel,
    });
  });

  const rows = Array.from(rowsByKey.values())
    .map((row) => {
      const { dishes, ...cleanRow } = row;
      return {
        ...cleanRow,
        expectedPrice: Number(row.expectedPrice.toFixed(2)),
        dishUsedIn: dishes.join(", "),
      };
    })
    .sort((left, right) => {
      const leftIndex = STORE_AISLE_ORDER.indexOf(left.category);
      const rightIndex = STORE_AISLE_ORDER.indexOf(right.category);
      const safeLeftIndex = leftIndex === -1 ? STORE_AISLE_ORDER.length : leftIndex;
      const safeRightIndex = rightIndex === -1 ? STORE_AISLE_ORDER.length : rightIndex;

      if (safeLeftIndex !== safeRightIndex) {
        return safeLeftIndex - safeRightIndex;
      }

      return left.ingredient.localeCompare(right.ingredient);
    });
  const estimatedTotal = Number(rows.reduce((total, row) => total + Number(row.expectedPrice || 0), 0).toFixed(2));

  return {
    ...plan,
    rows,
    recommendedStore: {
      ...plan.recommendedStore,
      estimatedTotal,
    },
    storeRanking: (plan.storeRanking || []).map((store, index) => (
      index === 0 ? { ...store, estimatedTotal } : store
    )),
  };
}

export function buildGoogleSheetPayload(plan, metadata = {}) {
  return {
    linkedSheetUrl: metadata.linkedSheetUrl ?? GOOGLE_SHEET_URL,
    sheetName: metadata.sheetName ?? "Dish Radar",
    weekLabel: metadata.weekLabel ?? "",
    generatedAt: metadata.generatedAt ?? new Date().toISOString(),
    recommendedStore: plan.recommendedStore.name,
    why: plan.recommendedStore.reason,
    expectedCost: Number(plan.recommendedStore.estimatedTotal.toFixed(2)),
    selectedDishes: metadata.selectedDishes ?? plan.selectedDishes,
    rows: plan.rows.map((row) => ({
      ingredientId: row.ingredientId ?? "",
      ingredient: row.ingredient,
      qty: row.qty,
      expectedPrice: Number(row.expectedPrice.toFixed(2)),
      dishUsedIn: row.dishUsedIn,
    })),
  };
}

function parseInstructions(text) {
  const raw = `${text || ""}`.trim();
  if (!raw) {
    return [];
  }

  const paragraphs = raw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  return raw
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((step) => step.trim())
    .filter(Boolean);
}

function estimatePrepTime(meal, ingredientCount, instructionCount) {
  const text = normalizeText(`${meal.strMeal} ${meal.strInstructions} ${meal.strCategory}`);
  let estimate = 12 + ingredientCount * 2 + instructionCount * 4;

  if (/(slow cook|simmer|bake|roast|marinate)/.test(text)) {
    estimate += 14;
  }
  if (/(salad|sandwich|wrap)/.test(text)) {
    estimate -= 8;
  }
  if (/(pasta|curry|stew|tagine|pie)/.test(text)) {
    estimate += 8;
  }

  return Math.max(10, Math.min(60, Math.round(estimate / 5) * 5));
}

function inferAppCategoryFromMeal(meal) {
  const text = normalizeText(`${meal.strMeal} ${meal.strCategory} ${meal.strInstructions}`);

  if (/(salad|slaw|bowl)/.test(text)) return "salads-veggie-bowls";
  if (/(burger|sandwich|wrap|taco|quesadilla|pizza|pie|roll)/.test(text)) return "handhelds-casual";
  if (/(soup|stew|chili|chowder|broth)/.test(text)) return "soups-stews-chilis";
  if (normalizeText(meal.strCategory) === "pasta" || /(pasta|spaghetti|linguine|lasagne|macaroni|noodle|ramen)/.test(text)) {
    return "pasta-noodles";
  }
  if (/(curry|tagine|risotto|jambalaya|paella|casserole|skillet|pilaf)/.test(text)) return "one-pot";
  if (["vegetarian", "vegan", "side", "starter"].includes(normalizeText(meal.strCategory))) return "salads-veggie-bowls";
  return "balanced-plate";
}

function buildMealTags(meal, category, time) {
  const tags = [
    cleanTag(meal.strCategory),
    cleanTag(meal.strArea),
    ...(CATEGORY_KEYWORDS[category] || []).slice(0, 2).map(cleanTag),
  ].filter(Boolean);

  if (time <= 20) {
    tags.push("quick");
  }

  return [...new Set(tags)].slice(0, 6);
}

function normalizeMealDbMeal(meal) {
  const instructions = parseInstructions(meal.strInstructions);
  const ingredients = Array.from({ length: 20 }, (_, index) => index + 1)
    .map((index) => {
      const name = `${meal[`strIngredient${index}`] || ""}`.trim();
      if (!name) {
        return null;
      }

      const { amount, unit } = parseMeasureValue(meal[`strMeasure${index}`] || "");
      const category = inferIngredientCategoryFromName(name);
      return {
        id: normalizeName(name),
        name,
        amount,
        unit,
        category,
        basePrice: getBasePrice(category),
      };
    })
    .filter(Boolean);

  const category = inferAppCategoryFromMeal(meal);
  const time = estimatePrepTime(meal, ingredients.length, instructions.length);

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category,
    time,
    calories: null,
    trendNote: meal.strArea && meal.strCategory
      ? `${meal.strArea} ${meal.strCategory.toLowerCase()} recipe from TheMealDB.`
      : "Recipe loaded from TheMealDB.",
    sources: ["TheMealDB", ...(meal.strSource ? [meal.strSource] : []), ...(meal.strYoutube ? [meal.strYoutube] : [])],
    cuisines: meal.strArea ? [meal.strArea] : [],
    tags: buildMealTags(meal, category, time),
    instructions,
    image: meal.strMealThumb || "",
    ingredients,
    meta: { isAI: false },
  };
}

async function fetchMealDbJson(path) {
  const response = await fetch(`${THEMEALDB_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`TheMealDB request failed (${response.status}).`);
  }
  return response.json();
}

async function loadMealLibrary() {
  if (!mealLibraryPromise) {
    mealLibraryPromise = Promise.all(
      THEMEALDB_LETTERS.map((letter) => fetchMealDbJson(`/search.php?f=${letter}`)),
    ).then((results) => {
      const unique = new Map();
      results
        .flatMap((result) => result.meals || [])
        .map(normalizeMealDbMeal)
        .forEach((meal) => {
          unique.set(meal.id, meal);
        });
      mealLibraryCache = Array.from(unique.values());
      return mealLibraryCache;
    });
  }

  return mealLibraryPromise;
}

export function getDishLibrarySnapshot() {
  return mealLibraryCache;
}

export async function fetchRecipeDatabaseMeta() {
  if (!recipeDatabaseMetaPromise) {
    recipeDatabaseMetaPromise = Promise.all([
      loadMealLibrary(),
      fetchMealDbJson("/list.php?i=list").catch(() => ({ meals: [] })),
    ]).then(([meals, ingredientResult]) => ({
      totalDishCount: meals.length,
      uniqueIngredientCount: ingredientResult.meals?.length || new Set(
        meals.flatMap((meal) => (meal.ingredients || []).map((ingredient) => normalizeText(ingredient.name))),
      ).size,
      generatedAt: new Date().toISOString().slice(0, 10),
    }));
  }

  return recipeDatabaseMetaPromise;
}

export function extractPreferenceKeywords(triedDishes) {
  const weights = new Map();

  triedDishes.forEach((record) => {
    if (!record.rating || record.rating < 4) {
      return;
    }

    const dish = record.dishSnapshot || {};
    const strength = record.rating - 3;
    const values = [
      ...(dish.tags || []),
      ...(dish.cuisines || []),
      dish.name || "",
    ];

    values.forEach((value) => {
      normalizeText(value)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4)
        .forEach((token) => {
          const normalized = token === "tacos" ? "mexican" : token;
          weights.set(normalized, (weights.get(normalized) || 0) + strength);
        });
    });
  });

  return [...weights.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([token]) => token)
    .filter((token) => token !== "dish" && token !== "weeknight")
    .slice(0, 8);
}

function scoreDishAgainstPreferences(dish, biasKeywords) {
  if (!biasKeywords.length) {
    return 0;
  }

  const haystack = [
    dish.name,
    dish.trendNote,
    ...(dish.tags || []),
    ...(dish.cuisines || []),
    ...(dish.instructions || []),
    ...(dish.sources || []),
  ]
    .map(normalizeText)
    .join(" ");

  return biasKeywords.reduce((total, keyword, index) => {
    if (!keyword || !haystack.includes(keyword)) {
      return total;
    }
    return total + (biasKeywords.length - index);
  }, 0);
}

function scoreCategoryMatch(dish, category) {
  const haystack = [
    dish.name,
    ...(dish.tags || []),
    ...(dish.cuisines || []),
    dish.trendNote,
  ]
    .map(normalizeText)
    .join(" ");

  return (CATEGORY_KEYWORDS[category] || []).reduce(
    (total, keyword) => total + (haystack.includes(keyword) ? 1 : 0),
    0,
  );
}

function shuffleCollection(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export async function fetchDishOptions({ categories, triedDishes, limit = 30, customRecipes = [] }) {
  const activeCategories = categories?.length ? categories : ALL_APP_CATEGORIES;
  const biasKeywords = extractPreferenceKeywords(triedDishes);
  const library = await loadMealLibrary();
  const mergedLibrary = Array.from(
    new Map(
      [...library, ...sanitizeStoredDishes(customRecipes)].map((dish) => [dish.id, dish]),
    ).values(),
  );

  const dishes = shuffleCollection(
    mergedLibrary
      .filter((dish) => activeCategories.includes(dish.category))
      .map((dish) => ({
        dish,
        score:
          scoreDishAgainstPreferences(dish, biasKeywords)
          + activeCategories.reduce((total, category) => total + scoreCategoryMatch(dish, category), 0)
          + (activeCategories.length === 1 && dish.category === activeCategories[0] ? 8 : 0),
      })),
  )
    .sort((left, right) => right.score - left.score || left.dish.name.localeCompare(right.dish.name))
    .map(({ dish }) => dish)
    .slice(0, limit);

  return {
    dishes,
    biasKeywords,
  };
}

function buildGeminiRecipePrompt(prompt, category) {
  const categoryLabel = normalizeAppCategory(category) || "balanced-plate";
  return [
    "You are Gemini Chef, an expert dinner recipe creator for a luxury weekly planner.",
    `Create one original dinner recipe for this request: "${prompt}".`,
    `Target meal category: "${categoryLabel}".`,
    "Return only JSON that matches the supplied schema.",
    "Use realistic quantities for 2 to 4 servings.",
    "Set calories to a realistic positive estimate for the entire recipe based on the raw ingredients. Never return 0 calories.",
    "Write instructions as one compact string with 3 to 4 numbered steps.",
    "Make the dish feel polished, practical, and appealing for home cooking.",
  ].join("\n");
}

async function callGeminiChefApi(body) {
  const delays = [0];
  let lastError = null;

  for (const delay of delays) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9500);

    try {
      const response = await fetch("/api/gemini-chef", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data?.error || `Gemini Chef request failed (${response.status}).`);
        error.status = response.status;
        error.code = data?.code || "";

        if (![408, 429, 500, 502, 503, 504].includes(response.status)) {
          throw error;
        }

        lastError = error;
        continue;
      }

      return data;
    } catch (error) {
      lastError = error;
      if (error?.status && ![408, 429, 500, 502, 503, 504].includes(error.status)) {
        throw error;
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  const friendlyError = new Error(
    lastError?.name === "AbortError"
      ? "Gemini Chef took too long to answer. Please retry in a moment."
      : "Gemini Chef could not connect cleanly. Please retry in a moment.",
  );
  friendlyError.status = lastError?.status || 0;
  friendlyError.code = lastError?.code || "NETWORK_RETRY_FAILED";
  throw friendlyError;
}

function normalizeSyntheticRecipe(payload, fallbackCategory, prompt) {
  const instructions = parseInstructions(payload.instructions || "");
  const ingredients = (payload.ingredients || []).map(normalizeIngredientRecord).filter(Boolean);
  const category = normalizeAppCategory(payload.category) || normalizeAppCategory(fallbackCategory) || "balanced-plate";
  const prepTimeMinutes = Number.isFinite(Number(payload.meta?.prepTimeMinutes))
    ? Number(payload.meta.prepTimeMinutes)
    : estimatePrepTime(
      { strMeal: payload.name, strInstructions: instructions.join(" "), strCategory: category },
      ingredients.length,
      instructions.length,
    );

  return normalizeDishRecord({
    id: payload.id || `gemini-${normalizeName(payload.name || prompt)}-${Date.now()}`,
    name: payload.name || prompt,
    category,
    time: prepTimeMinutes,
    calories: Number.isFinite(Number(payload.calories)) && Number(payload.calories) > 0 ? Number(payload.calories) : null,
    trendNote: "Bespoke AI recipe created by Gemini Chef for your personal library.",
    sources: ["Gemini Chef"],
    cuisines: payload.meta?.cuisine ? [payload.meta.cuisine] : [],
    tags: Array.isArray(payload.meta?.tags) ? payload.meta.tags : [],
    instructions,
    ingredients,
    meta: {
      ...(payload.meta || {}),
      isAI: true,
      prompt,
      generatedAt: new Date().toISOString(),
    },
  });
}

export async function generateSyntheticRecipe(prompt, category = "balanced-plate") {
  const payload = await callGeminiChefApi({
    mode: "single",
    prompt,
    category,
    promptText: buildGeminiRecipePrompt(prompt, category),
  });
  return normalizeSyntheticRecipe(payload, category, prompt);
}

export async function generateSyntheticRecipeCollection(prompt, category = "balanced-plate", count = 20) {
  const payload = await callGeminiChefApi({
    mode: "collection",
    prompt,
    category,
    count,
    promptText: [
      buildGeminiRecipePrompt(prompt, category),
      `Create ${count} distinct recipe options for this prompt instead of one.`,
      "Keep each recipe compact: 6 to 9 ingredients and 3 to 4 concise numbered instruction steps.",
      "Vary the proteins, sauces, aromatics, or produce so the dish options feel genuinely different from each other.",
    ].join("\n"),
  });
  const recipes = Array.isArray(payload.recipes) ? payload.recipes : [];
  return recipes
    .map((recipe, index) => normalizeSyntheticRecipe(
      {
        ...recipe,
        id: recipe.id || `gemini-${normalizeName(recipe.name || `${prompt}-${index + 1}`)}-${Date.now()}-${index + 1}`,
      },
      category,
      prompt,
    ))
    .filter(Boolean);
}

function normalizeReviewedGroceryRow(rawRow, fallbackRow) {
  const ingredient = `${rawRow?.ingredient || fallbackRow?.ingredient || ""}`.trim();
  const qty = `${rawRow?.qty || fallbackRow?.qty || ""}`.trim();
  const dishUsedIn = `${rawRow?.dishUsedIn || fallbackRow?.dishUsedIn || ""}`.trim();
  const category = cleanTag(rawRow?.category || fallbackRow?.category || "") || fallbackRow?.category || "pantry";
  const aisleLabel = `${rawRow?.aisleLabel || fallbackRow?.aisleLabel || "Other"}`.trim();
  const expectedPrice = Number.isFinite(Number(rawRow?.expectedPrice))
    ? Number(rawRow.expectedPrice)
    : Number(fallbackRow?.expectedPrice || 0);

  if (!ingredient || !qty) {
    return null;
  }

  return {
    ingredientId: rawRow?.ingredientId || fallbackRow?.ingredientId || "",
    ingredient,
    qty,
    expectedPrice,
    dishUsedIn,
    category,
    aisleLabel,
  };
}

export async function screenShoppingPlan(plan) {
  const payload = await callGeminiChefApi({
    mode: "shopping_review",
    promptText: [
      "You are reviewing a grocery list before it is shown to the user.",
      "Clean up duplicates, merge obvious repeat ingredients, remove anomalies, and normalize wording.",
      "Do not invent new ingredients.",
      "Do not materially change pricing except when duplicate rows are merged.",
      "Preserve realistic aisle grouping and keep the list concise and clean.",
      `Input rows: ${JSON.stringify(plan.rows)}`,
    ].join("\n"),
  });

  const fallbackRows = plan.rows || [];
  const reviewedRows = (Array.isArray(payload.rows) ? payload.rows : [])
    .map((row) => {
      const fallback = fallbackRows.find((candidate) => normalizeName(candidate.ingredient) === normalizeName(row.ingredient));
      return normalizeReviewedGroceryRow(row, fallback);
    })
    .filter(Boolean);

  const nextRows = reviewedRows.length ? reviewedRows : fallbackRows;
  const nextEstimatedTotal = nextRows.reduce((total, row) => total + Number(row.expectedPrice || 0), 0);

  return {
    plan: {
      ...plan,
      rows: nextRows,
      recommendedStore: {
        ...plan.recommendedStore,
        estimatedTotal: nextEstimatedTotal || plan.recommendedStore.estimatedTotal,
      },
    },
    note: `${payload.note || ""}`.trim(),
  };
}

function getPantryCarryoverRatio(row) {
  if (row.category === "specialty") {
    if (row.unit === "bottle" || row.unit === "jar") return 0.7;
    return 0.45;
  }
  if (row.category === "pantry") {
    if (row.unit === "bag" || row.unit === "box" || row.unit === "pack") return 0.45;
    if (row.unit === "bottle" || row.unit === "jar") return 0.7;
    if (row.unit === "can") return 0.15;
    return 0.35;
  }
  return 0;
}

export function buildFallbackPantryCarryover(rows) {
  return rows
    .filter((row) => ["pantry", "specialty"].includes(row.category))
    .map((row) => ({
      ingredientId: row.ingredientId || "",
      ingredient: row.ingredient,
      amount: Number((row.amount * getPantryCarryoverRatio(row)).toFixed(2)),
      unit: row.unit,
      category: row.category,
      reason: "Durable pantry staple or seasoning likely to remain after normal weekly cooking.",
    }))
    .filter((row) => row.amount > 0.05);
}

export async function screenPantryCarryover(rows) {
  const fallbackCarryover = buildFallbackPantryCarryover(rows);

  const payload = await callGeminiChefApi({
    mode: "pantry_review",
    promptText: [
      "Review which leftover grocery items should be kept in pantry memory after this week's cooking.",
      "Keep only realistically durable items like dry goods, oils, sauces, seasonings, canned goods, jarred goods, and similar long-life staples.",
      "Exclude fresh produce, fresh herbs, raw proteins, most dairy, and other quickly perishable groceries.",
      "Estimate a plausible leftover amount for only the durable items that would realistically remain after a normal week of cooking.",
      `Input inventory rows: ${JSON.stringify(rows)}`,
      `Fallback durable candidates: ${JSON.stringify(fallbackCarryover)}`,
    ].join("\n"),
  });

  const reviewedCarryover = (Array.isArray(payload.carryover) ? payload.carryover : [])
    .map((row) => {
      const ingredient = `${row?.ingredient || ""}`.trim();
      const unit = cleanMeasure(row?.unit || "piece");
      const amount = Number(row?.amount);
      const category = cleanTag(row?.category || "") || "pantry";
      if (!ingredient || !Number.isFinite(amount) || amount <= 0) {
        return null;
      }
      return {
        ingredientId: row?.ingredientId || normalizeName(ingredient),
        ingredient,
        amount: Number(amount.toFixed(2)),
        unit,
        category,
        reason: `${row?.reason || "Durable pantry item likely to remain after this week's cooking."}`.trim(),
      };
    })
    .filter(Boolean);

  return reviewedCarryover.length ? reviewedCarryover : fallbackCarryover;
}

export async function pushShoppingPlanToGoogleSheet(payload) {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return { ok: false, skipped: true, reason: "Missing Google Apps Script URL." };
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Google Sheet export failed (${response.status}).`);
  }

  return response.json();
}
