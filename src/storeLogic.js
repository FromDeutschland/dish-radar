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

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCalories(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
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
  if (!normalized || normalized === "to taste") {
    return "piece";
  }
  if (normalized.includes("ounce")) return "oz";
  if (normalized.includes("pound")) return "lb";
  if (normalized.includes("cup")) return "cup";
  if (normalized.includes("tablespoon")) return "tbsp";
  if (normalized.includes("teaspoon")) return "tsp";
  if (normalized.includes("slice")) return "slice";
  if (normalized.includes("clove")) return "clove";
  return normalized.replace(/[^a-z0-9]+/g, " ").trim() || "piece";
}

function parseMeasureValue(measure) {
  const normalized = `${measure || ""}`.trim();
  if (!normalized) {
    return { amount: 1, unit: "piece" };
  }

  const tokens = normalized.split(/\s+/);
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
  return {
    amount: amount > 0 ? Math.round(amount * 10) / 10 : 1,
    unit: cleanMeasure(remainder || normalized),
  };
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

function estimateIngredientCalories(ingredient) {
  if (typeof ingredient.calories === "number") {
    return ingredient.calories;
  }

  const exactKey = normalizeText(ingredient.name);
  const exact = EXACT_INGREDIENT_CALORIES[exactKey];
  if (typeof exact === "number") {
    return ingredient.amount * exact;
  }

  const fallback = CATEGORY_UNIT_CALORIES[ingredient.category]?.[ingredient.unit];
  if (typeof fallback === "number") {
    return ingredient.amount * fallback;
  }

  return ingredient.amount * 200;
}

export function estimateDishCalories(dish) {
  if (typeof dish.calories === "number" && Number.isFinite(dish.calories)) {
    return Math.round(dish.calories / 10) * 10;
  }

  return Math.round(
    ((dish.ingredients || []).reduce((total, ingredient) => total + estimateIngredientCalories(ingredient), 0)) / 10,
  ) * 10;
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
        unit: ingredient.unit,
        category: ingredient.category,
        basePrice: ingredient.basePrice,
        dishes: [],
      };

      existing.amount += ingredient.amount;
      existing.basePrice = ingredient.basePrice;
      if (!existing.dishes.includes(dish.name)) {
        existing.dishes.push(dish.name);
      }
      rowsByKey.set(key, existing);
    });
  });

  return Array.from(rowsByKey.values()).sort((left, right) => left.ingredient.localeCompare(right.ingredient));
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
    const rowCost = row.amount * row.basePrice * priceMultiplier;
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
    qty: formatQty(row.amount, row.unit),
    expectedPrice: row.amount * row.basePrice * (recommendedStore.pricing[row.category] ?? 1),
    dishUsedIn: row.dishes.join(", "),
    category: row.category,
  }));

  return {
    inventoryRows: aggregatedRows.map((row) => ({
      ingredientId: row.ingredientId,
      ingredient: row.ingredient,
      amount: row.amount,
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

export async function fetchDishOptions({ categories, triedDishes, limit = 30 }) {
  const activeCategories = categories?.length ? categories : ALL_APP_CATEGORIES;
  const biasKeywords = extractPreferenceKeywords(triedDishes);
  const library = await loadMealLibrary();

  const dishes = shuffleCollection(
    library
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
