import { ARCHIVE_DISH_POOL } from "./archiveDishPool";
import { DISH_POOL } from "./mockDishPool";
import { buildRecipeMatrixDishes } from "./recipeMatrix";

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
    quickRead: "Best for fun weeknight baskets with good sauces and decent produce prices.",
    tradeoff: "A few specialty items may require substitutions, especially if the basket leans heavily into niche sauces.",
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
    quickRead: "Best coverage when the basket uses specialty sauces, seafood, or dinner-party ingredients.",
    tradeoff: "Usually the easiest one-stop shop, but the total runs higher when the basket is mostly staples.",
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
    quickRead: "Best when you are buying a larger, staple-heavy basket and can handle bulk sizes.",
    tradeoff: "Bulk sizes and weaker specialty coverage make it risky for a smaller wishlist or sauce-heavy plan.",
  },
};

const EXACT_INGREDIENT_CALORIES = {
  "gemelli pasta": 1600,
  "vodka sauce": 520,
  "calabrian chili paste": 160,
  shallots: 30,
  parmesan: 430,
  "salmon fillets": 620,
  "jasmine rice": 1650,
  cucumbers: 45,
  avocados: 240,
  "spicy mayo": 720,
  "shelf-stable gnocchi": 520,
  "chili crisp": 210,
  spinach: 20,
  garlic: 40,
  pecorino: 500,
  "chicken thighs": 520,
  naan: 380,
  "greek yogurt": 520,
  "shawarma seasoning": 80,
  "large tortillas": 700,
  "romaine hearts": 70,
  "green goddess dressing": 480,
  "white beans": 240,
  halloumi: 620,
  "small tortillas": 520,
  "hot honey": 360,
  "red cabbage": 220,
  limes: 20,
  "frozen udon": 420,
  mushrooms: 40,
  "white miso": 260,
  scallions: 25,
  butter: 810,
  "ground beef": 960,
  cheddar: 640,
  pickles: 30,
  "burger sauce": 560,
  orzo: 760,
  "chicken breast": 500,
  lemons: 20,
  feta: 400,
  "sourdough loaf": 1200,
  "shredded chuck roast": 800,
  "oaxaca cheese": 640,
  "birria simmer sauce": 240,
  "yellow onions": 50,
  ciabatta: 940,
  "basil pesto": 700,
  "cherry tomatoes": 80,
  burrata: 460,
  "short grain rice": 1600,
  "frozen corn": 300,
  mozzarella: 640,
  gochujang: 260,
  kimchi: 60,
  "frozen dumplings": 760,
  "coconut milk": 420,
  "red curry paste": 170,
  "baby bok choy": 40,
  farro: 1220,
  "rainbow carrots": 180,
  "feta block": 600,
  mint: 10,
  pistachios: 960,
  shrimp: 460,
  "cilantro lime rice": 780,
  mango: 135,
  "coleslaw mix": 70,
  "chipotle crema": 480,
  spaghetti: 840,
  thyme: 10,
  "ground chicken": 700,
  "broccoli florets": 120,
  "sesame ginger sauce": 300,
  fusilli: 840,
  corn: 80,
  cotija: 400,
  tajin: 15,
  "extra firm tofu": 350,
  "pickled carrots": 40,
  cucumber: 45,
  "sriracha mayo": 720,
  "sub rolls": 880,
  "turkey meatballs": 680,
  basil: 10,
  flatbreads: 700,
  chickpeas: 240,
  "buffalo sauce": 120,
  "ranch dressing": 520,
  celery: 30,
  "pizza dough": 740,
  arugula: 10,
  "tomato soup": 180,
  harissa: 200,
  couscous: 650,
  jalapenos: 10,
  "tandoori simmer sauce": 240,
  "ground turkey": 680,
  "green chiles": 30,
  "black beans": 240,
  "chicken broth": 40,
  "baby potatoes": 520,
  "caesar dressing": 600,
  breadcrumbs: 420,
  peaches: 60,
  "pre-cooked lentils": 340,
  "roasted red peppers": 110,
  "ramen noodles": 380,
  "butter lettuce": 25,
  "honey soy sauce": 240,
  carrots: 90,
  pineapple: 450,
  "brown rice": 1650,
  "chipotle peppers": 70,
  cilantro: 10,
  "puff pastry": 800,
  "sharp cheddar": 680,
  "vegetable broth": 40,
  "tostada shells": 180,
  "cabbage slaw": 80,
  "lo mein noodles": 420,
  "sesame seeds": 160,
  "russet potatoes": 170,
  "sour cream": 450,
  chives: 10,
  "red bell pepper": 40,
  "yellow bell pepper": 40,
  eggs: 70,
};

const CATEGORY_UNIT_CALORIES = {
  bakery: {
    loaf: 1200,
    pack: 900,
    ball: 700,
  },
  dairy: {
    tub: 520,
    bag: 640,
    block: 620,
    box: 810,
    pack: 520,
  },
  frozen: {
    bag: 760,
    pack: 420,
    box: 820,
  },
  pantry: {
    box: 840,
    bag: 1600,
    jar: 320,
    can: 240,
    carton: 180,
    pack: 380,
  },
  produce: {
    piece: 75,
    bag: 150,
    bunch: 20,
    head: 90,
    box: 90,
  },
  protein: {
    lb: 700,
    bag: 700,
    block: 350,
  },
  seafood: {
    lb: 560,
  },
  specialty: {
    bottle: 420,
    jar: 250,
    tub: 260,
    can: 100,
  },
};

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Tk4ny0z2fEUUquuvBwBpLQMhTt9BsGpep69l0RmvxmE/edit?gid=0#gid=0";

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

const CATEGORY_QUERY_CONFIG = {
  "salads-veggie-bowls": {
    queries: ["salad bowl", "veggie bowl", "grain bowl", "chopped salad"],
    dishType: "salad",
  },
  "balanced-plate": {
    queries: ["chicken dinner", "salmon dinner", "protein bowl", "sheet pan dinner"],
    dishType: "main course",
  },
  "pasta-noodles": {
    queries: ["pasta", "noodles", "ramen", "orzo"],
    dishType: "pasta",
  },
  "one-pot": {
    queries: ["one pot dinner", "skillet dinner", "rice skillet", "casserole"],
    dishType: "main course",
  },
  "handhelds-casual": {
    queries: ["tacos", "wraps", "sandwiches", "burgers"],
    dishType: "sandwiches",
  },
  "soups-stews-chilis": {
    queries: ["soup", "stew", "chili", "chowder"],
    dishType: "soup",
  },
};

const CUISINE_KEYWORDS = [
  "american",
  "asian",
  "caribbean",
  "chinese",
  "french",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "mediterranean",
  "mexican",
  "middle eastern",
  "south american",
  "south east asian",
];

const LOCAL_DISH_LIBRARY_KEYS = Object.keys(CATEGORY_QUERY_CONFIG);

function formatQtyValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function normalizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeText(value) {
  return `${value || ""}`.toLowerCase().trim();
}

function buildLocalIngredientId(ingredient) {
  return normalizeName(`${ingredient.name}-${ingredient.unit}`);
}

function inferCategoryFromLocalDish(dish) {
  if (dish.category) {
    return dish.category;
  }

  const text = [
    dish.name,
    ...(dish.tags || []),
    ...(dish.sources || []),
  ]
    .map(normalizeText)
    .join(" ");

  if (/(soup|stew|chili|chowder)/.test(text)) {
    return "soups-stews-chilis";
  }

  if (/(pasta|noodle|udon|ramen|rigatoni|gemelli|orzo|gnocchi|tortellini|risoni)/.test(text)) {
    return "pasta-noodles";
  }

  if (/(taco|wrap|burger|sandwich|sub|slider|pita|quesadilla|crunchwrap|pizza|flatbread|toast)/.test(text)) {
    return "handhelds-casual";
  }

  if (/(skillet|bake|pot pie|rice pot|one pot|casserole)/.test(text)) {
    return "one-pot";
  }

  if (/salad/.test(text)) {
    return "salads-veggie-bowls";
  }

  if (/bowl/.test(text)) {
    return (dish.tags || []).includes("veg") || (dish.tags || []).includes("fresh")
      ? "salads-veggie-bowls"
      : "balanced-plate";
  }

  return "balanced-plate";
}

function normalizeLocalDish(dish) {
  return {
    ...dish,
    category: inferCategoryFromLocalDish(dish),
    cuisines: dish.cuisines || [],
    dishTypes: dish.dishTypes || [],
    mealTypes: dish.mealTypes || [],
    ingredients: (dish.ingredients || []).map((ingredient) => ({
      id: ingredient.id || buildLocalIngredientId(ingredient),
      ...ingredient,
    })),
  };
}

function buildLocalDishLibrary(triedDishes) {
  const basePool = [...DISH_POOL, ...ARCHIVE_DISH_POOL].map(normalizeLocalDish);
  const matrixPool = buildRecipeMatrixDishes(basePool, triedDishes, (dish) => dish.category).map(normalizeLocalDish);
  const merged = new Map();

  [...basePool, ...matrixPool].forEach((dish) => {
    merged.set(dish.id, dish);
  });

  return Array.from(merged.values());
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

function shuffleCollection(items) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
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

function estimateIngredientCalories(ingredient) {
  if (typeof ingredient.calories === "number") {
    return ingredient.calories;
  }

  const exact = EXACT_INGREDIENT_CALORIES[ingredient.name];
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
    dish.ingredients.reduce((total, ingredient) => total + estimateIngredientCalories(ingredient), 0) / 10,
  ) * 10;
}

function aggregateIngredients(dishes) {
  const rowsByKey = new Map();

  dishes.forEach((dish) => {
    dish.ingredients.forEach((ingredient) => {
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

function cleanMeasure(value) {
  const normalized = normalizeText(value);

  if (!normalized || normalized === "<unit>" || normalized === "whole") {
    return "piece";
  }

  if (normalized.includes("ounce")) {
    return "oz";
  }

  if (normalized.includes("pound")) {
    return "lb";
  }

  if (normalized.includes("cup")) {
    return "cup";
  }

  if (normalized.includes("tablespoon")) {
    return "tbsp";
  }

  if (normalized.includes("teaspoon")) {
    return "tsp";
  }

  if (normalized.includes("slice")) {
    return "slice";
  }

  if (normalized.includes("leaf")) {
    return "leaf";
  }

  return normalized.replace(/[^a-z0-9]+/g, " ").trim() || "piece";
}

function getBasePrice(category) {
  return DEFAULT_BASE_PRICES[category] ?? 3.5;
}

function buildIngredientId(ingredient) {
  return ingredient.foodId || normalizeName(ingredient.food || ingredient.text || "ingredient");
}

function inferIngredientCategory(ingredient) {
  const category = normalizeText(ingredient.foodCategory);
  const food = normalizeText(ingredient.food || ingredient.text);
  const measure = normalizeText(ingredient.measure);

  if (category.includes("meat") || category.includes("poultry")) {
    return "protein";
  }

  if (category.includes("fish") || category.includes("seafood")) {
    return "seafood";
  }

  if (category.includes("vegetable") || category.includes("fruit")) {
    return "produce";
  }

  if (category.includes("milk") || category.includes("cheese") || category.includes("yogurt") || category.includes("dairy")) {
    return "dairy";
  }

  if (category.includes("bread") || category.includes("baked")) {
    return "bakery";
  }

  if (category.includes("frozen")) {
    return "frozen";
  }

  if (category.includes("condiment") || category.includes("sauce") || category.includes("spice") || category.includes("herb")) {
    return "specialty";
  }

  if (
    food.includes("chicken")
    || food.includes("beef")
    || food.includes("pork")
    || food.includes("turkey")
    || food.includes("sausage")
    || food.includes("tofu")
    || food.includes("meatball")
  ) {
    return "protein";
  }

  if (food.includes("shrimp") || food.includes("salmon") || food.includes("tuna") || food.includes("cod") || food.includes("fish")) {
    return "seafood";
  }

  if (
    food.includes("lettuce")
    || food.includes("spinach")
    || food.includes("tomato")
    || food.includes("cucumber")
    || food.includes("onion")
    || food.includes("pepper")
    || food.includes("lemon")
    || food.includes("lime")
    || food.includes("garlic")
    || food.includes("herb")
    || food.includes("potato")
    || food.includes("broccoli")
    || food.includes("cabbage")
  ) {
    return "produce";
  }

  if (food.includes("cheese") || food.includes("milk") || food.includes("yogurt") || food.includes("cream") || food.includes("butter")) {
    return "dairy";
  }

  if (food.includes("bread") || food.includes("bun") || food.includes("tortilla") || food.includes("roll") || food.includes("pita")) {
    return "bakery";
  }

  if (
    food.includes("sauce")
    || food.includes("paste")
    || food.includes("dressing")
    || food.includes("seasoning")
    || food.includes("spice")
    || measure.includes("tablespoon")
    || measure.includes("teaspoon")
  ) {
    return "specialty";
  }

  return "pantry";
}

function normalizeIngredientAmount(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  if (value >= 10) {
    return Math.round(value);
  }

  return Math.round(value * 10) / 10;
}

function cleanTag(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function inferCategoryFromRecipe(recipe, fallbackCategory = "") {
  if (fallbackCategory) {
    return fallbackCategory;
  }

  const dishTypes = (recipe.dishType || []).map(normalizeText);
  const label = normalizeText(recipe.label);

  if (dishTypes.includes("salad")) {
    return "salads-veggie-bowls";
  }
  if (dishTypes.includes("sandwiches") || dishTypes.includes("pizza")) {
    return "handhelds-casual";
  }
  if (dishTypes.includes("soup")) {
    return "soups-stews-chilis";
  }
  if (dishTypes.includes("pasta")) {
    return "pasta-noodles";
  }
  if (dishTypes.includes("main course") && (label.includes("skillet") || label.includes("one-pot") || label.includes("casserole"))) {
    return "one-pot";
  }
  if (dishTypes.includes("main course") || dishTypes.includes("seafood")) {
    return "balanced-plate";
  }
  if (label.includes("soup") || label.includes("stew") || label.includes("chili")) {
    return "soups-stews-chilis";
  }
  if (label.includes("pasta") || label.includes("noodle") || label.includes("ramen") || label.includes("orzo")) {
    return "pasta-noodles";
  }
  if (label.includes("taco") || label.includes("wrap") || label.includes("burger") || label.includes("sandwich") || label.includes("pizza")) {
    return "handhelds-casual";
  }
  if (label.includes("salad") || label.includes("bowl")) {
    return "salads-veggie-bowls";
  }
  if (label.includes("skillet") || label.includes("casserole") || label.includes("rice")) {
    return "one-pot";
  }

  return "balanced-plate";
}

function buildRecipeTags(recipe, category) {
  const tags = [
    ...(recipe.cuisineType || []),
    ...(recipe.dishType || []),
    ...(recipe.mealType || []),
  ]
    .map(cleanTag)
    .filter(Boolean);

  if (category === "handhelds-casual" && !tags.includes("casual")) {
    tags.push("casual");
  }
  if (category === "salads-veggie-bowls" && !tags.includes("fresh")) {
    tags.push("fresh");
  }
  if (recipe.totalTime > 0 && recipe.totalTime <= 20) {
    tags.push("quick");
  }

  return [...new Set(tags)].slice(0, 6);
}

function pickQueryIndex(seed, size) {
  return size ? seed % size : 0;
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

function buildSearchPhrase(category, queryIndex, biasKeywords) {
  const config = CATEGORY_QUERY_CONFIG[category] || CATEGORY_QUERY_CONFIG["balanced-plate"];
  const baseQuery = config.queries[pickQueryIndex(queryIndex, config.queries.length)];
  const cuisineBias = biasKeywords.find((keyword) => CUISINE_KEYWORDS.includes(keyword));
  const flavorBias = biasKeywords.find((keyword) => !CUISINE_KEYWORDS.includes(keyword));

  return [cuisineBias, flavorBias, baseQuery].filter(Boolean).join(" ").trim();
}

export async function fetchDishOptions({ categories, triedDishes, limit = 30 }) {
  const activeCategories = categories?.length ? categories : LOCAL_DISH_LIBRARY_KEYS;
  const biasKeywords = extractPreferenceKeywords(triedDishes);
  const library = buildLocalDishLibrary(triedDishes);
  const scored = library
    .filter((dish) => activeCategories.includes(dish.category))
    .map((dish) => {
      const categoryBoost = activeCategories.length === 1 && dish.category === activeCategories[0] ? 10 : 0;
      const queryBoost = activeCategories.reduce((total, category, index) => {
        const searchPhrase = buildSearchPhrase(category, index, biasKeywords);
        const searchTokens = normalizeText(searchPhrase).split(/[^a-z0-9]+/).filter(Boolean);
        const haystack = [
          dish.name,
          dish.trendNote,
          ...(dish.tags || []),
          ...(dish.sources || []),
        ]
          .map(normalizeText)
          .join(" ");

        return total + searchTokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
      }, 0);

      return {
        dish,
        score: scoreDishAgainstPreferences(dish, biasKeywords) + categoryBoost + queryBoost,
      };
    });

  const shuffled = shuffleCollection(scored);
  const dishes = shuffled
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
    throw new Error(`Google Sheets export failed (${response.status}).`);
  }

  return response.json();
}
