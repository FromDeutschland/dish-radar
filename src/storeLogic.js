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

function formatQtyValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function normalizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
  return Math.round(
    dish.ingredients.reduce((total, ingredient) => total + estimateIngredientCalories(ingredient), 0) / 10,
  ) * 10;
}

function aggregateIngredients(dishes) {
  const rowsByKey = new Map();

  dishes.forEach((dish) => {
    dish.ingredients.forEach((ingredient) => {
      const key = `${normalizeName(ingredient.name)}::${ingredient.unit}`;
      const existing = rowsByKey.get(key) ?? {
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
    ingredient: row.ingredient,
    qty: formatQty(row.amount, row.unit),
    expectedPrice: row.amount * row.basePrice * (recommendedStore.pricing[row.category] ?? 1),
    dishUsedIn: row.dishes.join(", "),
    category: row.category,
  }));

  return {
    inventoryRows: aggregatedRows.map((row) => ({
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
    linkedSheetUrl: metadata.linkedSheetUrl ?? "",
    sheetName: metadata.sheetName ?? "Dish Radar",
    weekLabel: metadata.weekLabel ?? "",
    generatedAt: metadata.generatedAt ?? new Date().toISOString(),
    recommendedStore: plan.recommendedStore.name,
    why: plan.recommendedStore.reason,
    expectedCost: Number(plan.recommendedStore.estimatedTotal.toFixed(2)),
    selectedDishes: metadata.selectedDishes ?? plan.selectedDishes,
    rows: plan.rows.map((row) => ({
      ingredient: row.ingredient,
      qty: row.qty,
      expectedPrice: Number(row.expectedPrice.toFixed(2)),
      dishUsedIn: row.dishUsedIn,
    })),
  };
}
