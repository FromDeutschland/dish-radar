import { useEffect, useMemo, useState } from "react";
import { DISH_POOL } from "./mockDishPool";
import {
  createShoppingPlan,
  estimateDishCalories,
  formatCalories,
  formatCurrency,
} from "./storeLogic";

const STORAGE_KEYS = {
  activeTab: "dish-radar.active-tab",
  archivedLists: "dish-radar.archived-lists",
  deckIds: "dish-radar.deck-ids",
  manualPantryItems: "dish-radar.manual-pantry-items",
  pantryInventory: "dish-radar.pantry-inventory",
  triedDishes: "dish-radar.tried-dishes",
  weekSelections: "dish-radar.week-selections",
  wishlistIds: "dish-radar.wishlist-ids",
};

const TABS = [
  { value: "planner", label: "Dish Planner" },
  { value: "groceries", label: "Grocery List" },
  { value: "pantry", label: "Pantry" },
  { value: "grocery-lists", label: "Grocery Lists" },
  { value: "tried", label: "Tried Dishes" },
];

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CATEGORY_OPTIONS = [
  { value: "salads-veggie-bowls", label: "Salads / Veggie Bowls" },
  { value: "balanced-plate", label: "Protein + Sides (The Balanced Plate)" },
  { value: "pasta-noodles", label: "Pasta & Noodles" },
  { value: "one-pot", label: "One-Pot" },
  { value: "handhelds-casual", label: "Handhelds & Casual" },
  { value: "soups-stews-chilis", label: "Soups, Stews & Chilis" },
];

const PANTRY_STATUSES = [
  { value: "extra", label: "Have extra" },
  { value: "low", label: "Running low" },
  { value: "empty", label: "Used up" },
];

const WORKFLOW_STEPS = [
  "1. Pick meal types for the week.",
  "2. Save dishes to the wishlist.",
  "3. Review the Grocery List tab.",
  "4. Click Go Shop and confirm the week.",
  "5. Pantry leftovers stay stored until consumed.",
];

const PREFERRED_RECIPE_SOURCES = ["Food.com", "Allrecipes.com", "BigOven", "Meal-Master"];

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const PANTRY_STATUS_LABELS = Object.fromEntries(PANTRY_STATUSES.map((option) => [option.value, option.label]));

const DISH_CATEGORY_MAP = {
  "spicy-vodka-gemelli": "pasta-noodles",
  "crispy-rice-salmon-bowls": "balanced-plate",
  "chili-crisp-gnocchi": "pasta-noodles",
  "sheet-pan-shawarma-chicken": "balanced-plate",
  "green-goddess-wraps": "salads-veggie-bowls",
  "hot-honey-halloumi-tacos": "handhelds-casual",
  "miso-butter-mushroom-udon": "pasta-noodles",
  "smash-burger-salad": "salads-veggie-bowls",
  "lemony-orzo-chicken": "one-pot",
  "birria-grilled-cheese": "handhelds-casual",
  "pesto-white-bean-toast": "handhelds-casual",
  "korean-corn-cheese-bowls": "balanced-plate",
  "coconut-curry-dumpling-soup": "soups-stews-chilis",
  "crispy-feta-farro": "salads-veggie-bowls",
  "shrimp-taco-bowls": "balanced-plate",
  "onion-miso-pasta": "pasta-noodles",
  "sesame-ginger-meatballs": "balanced-plate",
  "elote-pasta-salad": "salads-veggie-bowls",
  "tofu-banh-mi-bowls": "balanced-plate",
  "vodka-meatball-subs": "handhelds-casual",
  "buffalo-chickpea-flatbreads": "handhelds-casual",
  "pesto-burrata-pizza": "handhelds-casual",
  "kimchi-grilled-cheese-soup": "soups-stews-chilis",
  "harissa-salmon-couscous": "balanced-plate",
  "street-corn-gnocchi-skillet": "one-pot",
  "tandoori-chicken-naan": "handhelds-casual",
  "turkey-taco-soup": "soups-stews-chilis",
  "crispy-potato-caesar": "salads-veggie-bowls",
  "peach-burrata-toast": "handhelds-casual",
  "red-pepper-feta-lentils": "salads-veggie-bowls",
  "honey-soy-lettuce-cups": "handhelds-casual",
  "al-pastor-chicken-bowls": "balanced-plate",
  "broccoli-cheddar-pot-pies": "one-pot",
  "chili-lime-shrimp-tostadas": "handhelds-casual",
  "spicy-peanut-cucumber-noodles": "pasta-noodles",
  "loaded-potato-quesadillas": "handhelds-casual",
  "thai-peanut-chicken-slaw": "salads-veggie-bowls",
  "mediterranean-chickpea-cucumber-salad": "salads-veggie-bowls",
  "brussels-apple-farro-salad": "salads-veggie-bowls",
  "roasted-broccoli-caesar-lentils": "salads-veggie-bowls",
  "sticky-gochujang-meatball-bowls": "balanced-plate",
  "lemon-dill-salmon-potatoes": "balanced-plate",
  "street-cart-chicken-rice": "balanced-plate",
  "miso-sesame-sweet-potato-bowls": "balanced-plate",
  "creamy-corn-miso-rigatoni": "pasta-noodles",
  "roasted-red-pepper-tortellini": "pasta-noodles",
  "sesame-garlic-chicken-ramen": "pasta-noodles",
  "spinach-artichoke-orzo-bake": "pasta-noodles",
  "marry-me-chickpeas-orzo": "one-pot",
  "smoky-sausage-white-beans": "one-pot",
  "coconut-chicken-rice-pot": "one-pot",
  "tomato-basil-risoni-skillet": "one-pot",
  "smash-chicken-caesar-wraps": "handhelds-casual",
  "greek-turkey-pita-burgers": "handhelds-casual",
  "chipotle-black-bean-crunchwraps": "handhelds-casual",
  "bbq-salmon-slaw-sliders": "handhelds-casual",
  "white-chicken-enchilada-soup": "soups-stews-chilis",
  "lasagna-soup": "soups-stews-chilis",
  "smoky-lentil-sweet-potato-chili": "soups-stews-chilis",
  "ginger-coconut-rice-soup": "soups-stews-chilis",
};

const DISH_LOOKUP = Object.fromEntries(DISH_POOL.map((dish) => [dish.id, dish]));

function safeRead(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function normalizeIngredient(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");
}

function ingredientKey(name, unit) {
  return `${normalizeIngredient(name)}::${unit}`;
}

function roundAmount(value) {
  return Math.round(value * 100) / 100;
}

function formatAmount(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function getDefaultWeekSelections() {
  return Object.fromEntries(WEEKDAY_NAMES.map((day) => [day, ""]));
}

function getSavedWeekSelections() {
  const defaults = getDefaultWeekSelections();
  const saved = safeRead(STORAGE_KEYS.weekSelections, defaults);
  return { ...defaults, ...saved };
}

function getSelectedCategories(weekSelections) {
  return Object.values(weekSelections).filter(Boolean);
}

function getOrderedSelectedCategories(weekSelections) {
  const seen = new Set();

  return WEEKDAY_NAMES
    .map((day) => weekSelections[day])
    .filter((category) => {
      if (!category || seen.has(category)) {
        return false;
      }

      seen.add(category);
      return true;
    });
}

function getDifficultyLabel(time) {
  if (time <= 15) {
    return "easy";
  }

  if (time <= 30) {
    return "medium";
  }

  return "hard";
}

function getPrimaryRecipeSource(dish) {
  return PREFERRED_RECIPE_SOURCES.find((source) => dish.sources.includes(source)) || dish.sources[0] || "Other";
}

function sortByPreference(items, triedDishes) {
  return shuffle(items).sort((left, right) => {
    const preferenceDelta = getDishPreferenceScore(right, triedDishes) - getDishPreferenceScore(left, triedDishes);

    if (preferenceDelta !== 0) {
      return preferenceDelta;
    }

    const rightSourceBoost = right.sources.filter((source) => PREFERRED_RECIPE_SOURCES.includes(source)).length;
    const leftSourceBoost = left.sources.filter((source) => PREFERRED_RECIPE_SOURCES.includes(source)).length;

    return rightSourceBoost - leftSourceBoost;
  });
}

function interleaveBySource(items, triedDishes) {
  const buckets = new Map();

  sortByPreference(items, triedDishes).forEach((dish) => {
    const source = getPrimaryRecipeSource(dish);
    const bucket = buckets.get(source) || [];
    bucket.push(dish);
    buckets.set(source, bucket);
  });

  const orderedSources = [
    ...PREFERRED_RECIPE_SOURCES.filter((source) => buckets.has(source)),
    ...Array.from(buckets.keys()).filter((source) => !PREFERRED_RECIPE_SOURCES.includes(source)).sort(),
  ];

  const result = [];
  let added = true;

  while (added) {
    added = false;

    orderedSources.forEach((source) => {
      const bucket = buckets.get(source);

      if (bucket?.length) {
        result.push(bucket.shift());
        added = true;
      }
    });
  }

  return result;
}

function getDishPreferenceScore(candidateDish, triedDishes) {
  return triedDishes.reduce((score, record) => {
    if (!record.rating) {
      return score;
    }

    const triedDish = DISH_LOOKUP[record.dishId];
    if (!triedDish) {
      return score;
    }

    const sentiment = record.rating - 3;
    const sharedTags = candidateDish.tags.filter((tag) => triedDish.tags.includes(tag)).length;
    const sameCategory = DISH_CATEGORY_MAP[candidateDish.id] === DISH_CATEGORY_MAP[triedDish.id];

    return score + (sharedTags * sentiment * 1.35) + (sameCategory ? sentiment * 3.2 : 0);
  }, 0);
}

function buildDeck(weekSelections, triedDishes = []) {
  const selectedCategories = getSelectedCategories(weekSelections);
  const matching = selectedCategories.length
    ? DISH_POOL.filter((dish) => selectedCategories.includes(DISH_CATEGORY_MAP[dish.id]))
    : DISH_POOL;
  const fallback = DISH_POOL.filter((dish) => !matching.some((match) => match.id === dish.id));

  return [...interleaveBySource(matching, triedDishes), ...interleaveBySource(fallback, triedDishes)]
    .slice(0, 30)
    .map((dish) => dish.id);
}

function getCurrentWeekDates() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(today.getDate() - today.getDay());

  return WEEKDAY_NAMES.map((dayName, offset) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + offset);

    return {
      key: dayName,
      dayName,
      shortDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    };
  });
}

function getEstimatedUsageRatio(row) {
  if (row.category === "produce" || row.category === "protein" || row.category === "seafood" || row.category === "bakery" || row.category === "frozen") {
    return 1;
  }

  if (row.category === "dairy") {
    if (row.unit === "tub") {
      return 0.5;
    }

    return 0.7;
  }

  if (row.category === "specialty") {
    if (row.unit === "bottle" || row.unit === "jar") {
      return 0.25;
    }

    if (row.unit === "tub") {
      return 0.35;
    }

    return 0.6;
  }

  if (row.category === "pantry") {
    if (row.unit === "jar") {
      return 0.3;
    }

    if (row.unit === "bottle") {
      return 0.25;
    }

    if (row.unit === "bag" || row.unit === "box" || row.unit === "pack") {
      return 0.5;
    }

    if (row.unit === "can") {
      return 0.8;
    }

    return 0.6;
  }

  return 1;
}

function getEstimatedUsageAmount(row) {
  return roundAmount(row.amount * getEstimatedUsageRatio(row));
}

function mergePantryAfterShop(currentPantry, inventoryRows) {
  const pantryMap = new Map(
    currentPantry.map((item) => [ingredientKey(item.ingredient, item.unit), { ...item }]),
  );

  inventoryRows.forEach((row) => {
    const key = ingredientKey(row.ingredient, row.unit);
    const existing = pantryMap.get(key);
    const pantryBefore = existing?.amount ?? 0;
    const usageAmount = getEstimatedUsageAmount(row);
    let pantryAfter = 0;

    if (pantryBefore >= usageAmount) {
      pantryAfter = pantryBefore - usageAmount;
    } else {
      const missingUsage = usageAmount - pantryBefore;
      pantryAfter = row.amount - missingUsage;
    }

    const roundedAfter = roundAmount(pantryAfter);

    if (roundedAfter > 0.01) {
      pantryMap.set(key, {
        ingredient: row.ingredient,
        unit: row.unit,
        amount: roundedAfter,
        category: row.category,
      });
    } else {
      pantryMap.delete(key);
    }
  });

  return Array.from(pantryMap.values()).sort((left, right) => left.ingredient.localeCompare(right.ingredient));
}

function copyText(text) {
  return navigator.clipboard.writeText(text);
}

function Badge({ children, tone = "olive" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function DishListItem({ dish, saved, onToggle }) {
  return (
    <li className="dish-list-item">
      <div className="dish-copy">
        <div className="dish-list-head">
          <div>
            <h3>{dish.name}</h3>
            <p className="dish-note">{dish.trendNote}</p>
          </div>
          <button className={`pill-button compact ${saved ? "secondary" : ""}`} onClick={() => onToggle(dish.id)}>
            {saved ? "Saved" : "Add to wishlist"}
          </button>
        </div>
        <div className="dish-meta-line">
          <Badge tone="tomato">{dish.time} min</Badge>
          <Badge>{getDifficultyLabel(dish.time)}</Badge>
          <span className="chip chip-primary">{CATEGORY_LABELS[DISH_CATEGORY_MAP[dish.id]]}</span>
          <span className="chip">{formatCalories(estimateDishCalories(dish))} cal est.</span>
        </div>
        <p className="dish-sources">{dish.sources.join(" • ")}</p>
      </div>
    </li>
  );
}

function PantryStatusBadge({ status }) {
  const tone = status === "extra" ? "olive" : status === "low" ? "amber" : "tomato";
  return <span className={`chip chip-${tone}`}>{PANTRY_STATUS_LABELS[status]}</span>;
}

function RatingButton({ active, value, onClick }) {
  return (
    <button className={`rating-button ${active ? "active" : ""}`} onClick={onClick}>
      {value}
    </button>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(() => safeRead(STORAGE_KEYS.activeTab, "planner"));
  const [weekSelections, setWeekSelections] = useState(() => getSavedWeekSelections());
  const [triedDishes, setTriedDishes] = useState(() => safeRead(STORAGE_KEYS.triedDishes, []));
  const [deckIds, setDeckIds] = useState(() => safeRead(STORAGE_KEYS.deckIds, buildDeck(getSavedWeekSelections(), safeRead(STORAGE_KEYS.triedDishes, []))));
  const [wishlistIds, setWishlistIds] = useState(() => safeRead(STORAGE_KEYS.wishlistIds, []));
  const [manualPantryItems, setManualPantryItems] = useState(() => safeRead(STORAGE_KEYS.manualPantryItems, []));
  const [pantryInventory, setPantryInventory] = useState(() => safeRead(STORAGE_KEYS.pantryInventory, []));
  const [archivedLists, setArchivedLists] = useState(() => safeRead(STORAGE_KEYS.archivedLists, []));
  const [pantryDraft, setPantryDraft] = useState({ name: "", note: "", status: "extra" });

  const weekDays = getCurrentWeekDates();
  const selectedCategories = getSelectedCategories(weekSelections);
  const orderedSelectedCategories = getOrderedSelectedCategories(weekSelections);
  const deck = deckIds.map((id) => DISH_LOOKUP[id]).filter(Boolean);
  const wishlist = wishlistIds.map((id) => DISH_LOOKUP[id]).filter(Boolean);
  const groupedDeck = [
    ...orderedSelectedCategories,
    ...CATEGORY_OPTIONS.map((option) => option.value).filter((category) => !orderedSelectedCategories.includes(category)),
  ]
    .filter((category, index, list) => list.indexOf(category) === index)
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      dishes: deck.filter((dish) => DISH_CATEGORY_MAP[dish.id] === category),
    }))
    .filter((group) => group.dishes.length);
  const currentShoppingPlan = wishlist.length ? createShoppingPlan(wishlist) : null;
  const preferredSourceMix = useMemo(() => {
    const counts = new Map();

    deck.forEach((dish) => {
      const source = getPrimaryRecipeSource(dish);
      counts.set(source, (counts.get(source) || 0) + 1);
    });

    return PREFERRED_RECIPE_SOURCES
      .map((source) => ({ source, count: counts.get(source) || 0 }))
      .filter((item) => item.count > 0);
  }, [deck]);

  const pantryInventoryLookup = useMemo(
    () => new Map(pantryInventory.map((item) => [ingredientKey(item.ingredient, item.unit), item])),
    [pantryInventory],
  );
  const manualPantryLookup = useMemo(
    () => new Map(manualPantryItems.map((item) => [normalizeIngredient(item.name), item])),
    [manualPantryItems],
  );
  const pendingGroceryRows = useMemo(() => {
    if (!currentShoppingPlan) {
      return [];
    }

    return currentShoppingPlan.inventoryRows.map((inventoryRow, index) => {
      const displayRow = currentShoppingPlan.rows[index];
      const pantryMatch = pantryInventoryLookup.get(ingredientKey(inventoryRow.ingredient, inventoryRow.unit));
      const manualMatch = manualPantryLookup.get(normalizeIngredient(inventoryRow.ingredient));
      const usageAmount = getEstimatedUsageAmount(inventoryRow);
      const pantryAmount = pantryMatch?.amount ?? 0;
      let pantryFlag = "Buy";
      let pantryNote = "";

      if (pantryAmount >= usageAmount) {
        pantryFlag = "Use pantry first";
        pantryNote = `${formatAmount(pantryAmount)} ${inventoryRow.unit} estimated on hand`;
      } else if (pantryAmount > 0) {
        pantryFlag = "Top up";
        pantryNote = `${formatAmount(pantryAmount)} ${inventoryRow.unit} estimated on hand`;
      } else if (manualMatch?.status === "extra") {
        pantryFlag = "Check pantry";
        pantryNote = manualMatch.note || "Manual pantry note says there is extra on hand.";
      } else if (manualMatch?.status === "low") {
        pantryFlag = "Top up";
        pantryNote = manualMatch.note || "Manual pantry note says this is running low.";
      }

      return {
        ...displayRow,
        pantryFlag,
        pantryNote,
      };
    });
  }, [currentShoppingPlan, manualPantryLookup, pantryInventoryLookup]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.activeTab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.weekSelections, JSON.stringify(weekSelections));
  }, [weekSelections]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.deckIds, JSON.stringify(deckIds));
  }, [deckIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.wishlistIds, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.manualPantryItems, JSON.stringify(manualPantryItems));
  }, [manualPantryItems]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.pantryInventory, JSON.stringify(pantryInventory));
  }, [pantryInventory]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.archivedLists, JSON.stringify(archivedLists));
  }, [archivedLists]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.triedDishes, JSON.stringify(triedDishes));
  }, [triedDishes]);

  function refreshDeck(nextSelections = weekSelections) {
    setDeckIds(buildDeck(nextSelections, triedDishes));
  }

  function handleDaySelection(dayName, nextCategory) {
    const nextSelections = { ...weekSelections, [dayName]: nextCategory };
    setWeekSelections(nextSelections);
    setDeckIds(buildDeck(nextSelections, triedDishes));
  }

  function clearWeekSelections() {
    const cleared = getDefaultWeekSelections();
    setWeekSelections(cleared);
    setDeckIds(buildDeck(cleared, triedDishes));
  }

  function toggleWishlist(dishId) {
    setWishlistIds((current) => (
      current.includes(dishId)
        ? current.filter((id) => id !== dishId)
        : [...current, dishId]
    ));
  }

  function handleGoShop() {
    if (!wishlist.length || !currentShoppingPlan) {
      return;
    }

    const confirmed = window.confirm("ARE YOU SURE?");
    if (!confirmed) {
      return;
    }

    const archive = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      weekLabel: `${weekDays[0].shortDate} - ${weekDays[6].shortDate}`,
      selectedDishIds: wishlist.map((dish) => dish.id),
      rows: pendingGroceryRows,
      inventoryRows: currentShoppingPlan.inventoryRows,
      recommendedStore: currentShoppingPlan.recommendedStore,
    };

    setArchivedLists((current) => [archive, ...current]);
    setPantryInventory((current) => mergePantryAfterShop(current, currentShoppingPlan.inventoryRows));
    setTriedDishes((current) => [
      ...wishlist.map((dish) => ({
        id: `${archive.id}:${dish.id}`,
        archiveId: archive.id,
        dishId: dish.id,
        confirmedAt: archive.createdAt,
        rating: 0,
      })),
      ...current,
    ]);
    setWishlistIds([]);
    setActiveTab("grocery-lists");
  }

  function addManualPantryItem(event) {
    event.preventDefault();

    if (!pantryDraft.name.trim()) {
      return;
    }

    const item = {
      id: `${Date.now()}`,
      name: pantryDraft.name.trim(),
      note: pantryDraft.note.trim(),
      status: pantryDraft.status,
    };

    setManualPantryItems((current) => [item, ...current]);
    setPantryDraft({ name: "", note: "", status: "extra" });
  }

  function removeManualPantryItem(itemId) {
    setManualPantryItems((current) => current.filter((item) => item.id !== itemId));
  }

  function updateDishRating(recordId, rating) {
    setTriedDishes((current) => {
      const next = current.map((record) => (
        record.id === recordId ? { ...record, rating } : record
      ));
      setDeckIds(buildDeck(weekSelections, next));
      return next;
    });
  }

  async function copyArchivePayload(archive) {
    await copyText(JSON.stringify(archive, null, 2));
  }

  function renderCompactOverview() {
    return (
      <header className="workflow-panel">
        <div className="workflow-head">
          <div>
            <div className="eyebrow">Dish Radar</div>
            <h1>Plan dishes, confirm shopping, and keep pantry leftovers until fully consumed.</h1>
          </div>
          <div className="workflow-stats">
            <span>{selectedCategories.length} days planned</span>
            <span>{wishlist.length} dishes saved</span>
            <span>{archivedLists.length} grocery lists</span>
            <span>{pantryInventory.length} pantry leftovers</span>
          </div>
        </div>
        <ol className="workflow-list">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </header>
    );
  }

  function renderPlannerTab() {
    return (
      <div className="workspace">
        <section className="main-column">
          <div className="week-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Weekly calendar</div>
                <h2>Pick what kind of dinner each day needs</h2>
              </div>
              <button className="text-button" onClick={clearWeekSelections}>
                Reset week
              </button>
            </div>

            <div className="day-grid">
              {weekDays.map((day) => (
                <article key={day.key} className="day-card">
                  <span className="day-name">{day.dayName}</span>
                  <strong className="day-date">{day.shortDate}</strong>
                  <label className="sr-only" htmlFor={`day-${day.key}`}>
                    {day.fullDate}
                  </label>
                  <select
                    id={`day-${day.key}`}
                    value={weekSelections[day.key]}
                    onChange={(event) => handleDaySelection(day.key, event.target.value)}
                  >
                    <option value="">Anything fun</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </div>

          <div className="control-panel">
            <div className="control-block grow">
              <label>Planner status</label>
              <div className="summary-box">
                <strong>{selectedCategories.length ? `${selectedCategories.length} days planned` : "No days locked yet"}</strong>
                <span>
                  {triedDishes.some((record) => record.rating >= 4)
                    ? "Recommendations are being biased toward dishes that match your highest-rated meals."
                    : "Rate dishes in Tried Dishes to bias future recommendations."}
                </span>
              </div>
            </div>
            <div className="button-row">
              <button className="action-button" onClick={() => refreshDeck()}>
                Generate dishes
              </button>
              <button className="ghost-button" onClick={() => refreshDeck()}>
                Refresh ideas
              </button>
            </div>
          </div>

          <div className="info-strip">
            <p>
              {selectedCategories.length
                ? `Current dish groups follow your selected meal types: ${[...new Set(selectedCategories)].map((category) => CATEGORY_LABELS[category]).join(", ")}.`
                : "Choose one or more meal types above, or leave the week blank to browse everything fun."}
            </p>
            <p>
              {preferredSourceMix.length
                ? `Source mix is now biased toward large recipe libraries: ${preferredSourceMix.map((item) => `${item.source} (${item.count})`).join(", ")}.`
                : `Dish generation is now rotating more ideas from ${PREFERRED_RECIPE_SOURCES.join(", ")} for broader variety.`}
            </p>
          </div>

          <section className="dish-list-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Dish ideas</div>
                <h2>Potential dishes for the selected week</h2>
              </div>
            </div>

            <div className="dish-groups">
              {groupedDeck.map((group) => (
                <section key={group.category} className="dish-group">
                  <div className="dish-group-head">
                    <h3>{group.label}</h3>
                    <span>{group.dishes.length} ideas</span>
                  </div>
                  <ul className="dish-list">
                    {group.dishes.map((dish) => (
                      <DishListItem
                        key={dish.id}
                        dish={dish}
                        saved={wishlistIds.includes(dish.id)}
                        onToggle={toggleWishlist}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        </section>

        <aside className="side-column">
          <section className="panel sticky-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Wishlist</div>
                <h2>This week’s picks</h2>
              </div>
              <button className="text-button" onClick={() => setWishlistIds([])}>
                Clear
              </button>
            </div>

            {wishlist.length ? (
              <div className="wishlist-list">
                {wishlist.map((dish) => (
                  <div key={dish.id} className="wishlist-item">
                    <div>
                      <strong>{dish.name}</strong>
                      <p>{CATEGORY_LABELS[DISH_CATEGORY_MAP[dish.id]]} • {formatCalories(estimateDishCalories(dish))} cal est.</p>
                    </div>
                    <button className="mini-button" onClick={() => toggleWishlist(dish.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Save dishes from the list, then switch to <strong>Grocery List</strong> to confirm the shopping run.
              </p>
            )}
          </section>
        </aside>
      </div>
    );
  }

  function renderGroceriesTab() {
    return (
      <div className="workspace single-column-layout">
        <section className="main-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Current grocery list</div>
                <h2>Upcoming shopping run for the active wishlist</h2>
              </div>
              {currentShoppingPlan ? <strong>{formatCurrency(currentShoppingPlan.recommendedStore.estimatedTotal)}</strong> : null}
            </div>

            {currentShoppingPlan ? (
              <>
                <div className="sheet-summary grocery-summary">
                  <div>
                    <span>Store recommended</span>
                    <strong>{currentShoppingPlan.recommendedStore.name}</strong>
                  </div>
                  <div>
                    <span>Expected grocery cost</span>
                    <strong>{formatCurrency(currentShoppingPlan.recommendedStore.estimatedTotal)}</strong>
                  </div>
                  <div>
                    <span>Pantry-aware rows</span>
                    <strong>{pendingGroceryRows.filter((row) => row.pantryFlag !== "Buy").length}</strong>
                  </div>
                </div>

                <p className="summary-copy">{currentShoppingPlan.recommendedStore.reason}</p>
                <p className="summary-copy subtle">
                  Click <strong>GO SHOP</strong> to confirm this week, archive the list, and update pantry leftovers.
                </p>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Qty</th>
                        <th>Expected Price</th>
                        <th>Dish used in</th>
                        <th>Pantry check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingGroceryRows.map((row) => (
                        <tr key={`${row.ingredient}-${row.qty}`}>
                          <td>{row.ingredient}</td>
                          <td>{row.qty}</td>
                          <td>{formatCurrency(row.expectedPrice)}</td>
                          <td>{row.dishUsedIn}</td>
                          <td>
                            <span className={`flag-pill ${row.pantryFlag === "Use pantry first" ? "flag-check" : row.pantryFlag === "Top up" || row.pantryFlag === "Check pantry" ? "flag-low" : "flag-buy"}`}>
                              {row.pantryFlag}
                            </span>
                            {row.pantryNote ? <p className="table-note">{row.pantryNote}</p> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="side-actions compact-actions">
                  <button className="action-button wide" onClick={handleGoShop}>
                    GO SHOP
                  </button>
                </div>
              </>
            ) : (
              <p className="empty-copy">
                Add dishes in <strong>Dish Planner</strong> and the grocery list will appear here. If pantry still has an ingredient from a previous week, it will be flagged here before you shop.
              </p>
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderPantryTab() {
    return (
      <div className="workspace pantry-layout">
        <section className="main-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Pantry leftovers</div>
                <h2>Stored until fully consumed</h2>
              </div>
            </div>

            {pantryInventory.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Remaining</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pantryInventory.map((item) => (
                      <tr key={`${item.ingredient}-${item.unit}`}>
                        <td>{item.ingredient}</td>
                        <td>{formatAmount(item.amount)}</td>
                        <td>{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-copy">
                Pantry leftovers appear here after you confirm <strong>GO SHOP</strong>. Ingredients stay stored until future weeks consume them.
              </p>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Manual pantry notes</div>
                <h2>Track staples and open containers</h2>
              </div>
            </div>

            <form className="pantry-form" onSubmit={addManualPantryItem}>
              <div className="control-block">
                <label htmlFor="pantry-name">Ingredient</label>
                <input
                  id="pantry-name"
                  type="text"
                  placeholder="Honey"
                  value={pantryDraft.name}
                  onChange={(event) => setPantryDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="control-block">
                <label htmlFor="pantry-note">Note</label>
                <input
                  id="pantry-note"
                  type="text"
                  placeholder="About half a jar left"
                  value={pantryDraft.note}
                  onChange={(event) => setPantryDraft((current) => ({ ...current, note: event.target.value }))}
                />
              </div>
              <div className="control-block">
                <label htmlFor="pantry-status">Status</label>
                <select
                  id="pantry-status"
                  value={pantryDraft.status}
                  onChange={(event) => setPantryDraft((current) => ({ ...current, status: event.target.value }))}
                >
                  {PANTRY_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="action-button" type="submit">
                Add pantry item
              </button>
            </form>

            {manualPantryItems.length ? (
              <div className="wishlist-list">
                {manualPantryItems.map((item) => (
                  <div key={item.id} className="wishlist-item pantry-item">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="pantry-meta">
                        <PantryStatusBadge status={item.status} />
                      </div>
                      {item.note ? <p>{item.note}</p> : null}
                    </div>
                    <button className="mini-button" onClick={() => removeManualPantryItem(item.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </section>
      </div>
    );
  }

  function renderArchivedListsTab() {
    return (
      <div className="workspace single-column-layout">
        <section className="main-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Grocery lists</div>
                <h2>Archived confirmed shopping lists</h2>
              </div>
            </div>

            {archivedLists.length ? (
              <div className="archive-list">
                {archivedLists.map((archive) => (
                  <article key={archive.id} className="archive-card">
                    <div className="archive-head">
                      <div>
                        <strong>{archive.weekLabel}</strong>
                        <p>{new Date(archive.createdAt).toLocaleString("en-US")}</p>
                      </div>
                      <div className="archive-actions">
                        <span>{archive.selectedDishIds.length} dishes</span>
                        <button className="mini-button" onClick={() => copyArchivePayload(archive)}>
                          Copy JSON
                        </button>
                      </div>
                    </div>

                    <div className="archive-meta">
                      <span className="chip chip-primary">{archive.recommendedStore.name}</span>
                      <span className="chip">{formatCurrency(archive.recommendedStore.estimatedTotal)}</span>
                    </div>

                    <div className="archive-dishes">
                      {archive.selectedDishIds.map((dishId) => {
                        const dish = DISH_LOOKUP[dishId];
                        return dish ? (
                          <div key={dishId} className="archive-dish-row">
                            <div>
                              <strong>{dish.name}</strong>
                              <p>{CATEGORY_LABELS[DISH_CATEGORY_MAP[dish.id]]}</p>
                            </div>
                            <span className="chip">{formatCalories(estimateDishCalories(dish))} cal est.</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Confirm <strong>GO SHOP</strong> from the Grocery List tab to create your first archived grocery list here.
              </p>
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderTriedDishesTab() {
    const sortedRecords = [...triedDishes].sort((left, right) => (
      new Date(right.confirmedAt).getTime() - new Date(left.confirmedAt).getTime()
    ));

    return (
      <div className="workspace single-column-layout">
        <section className="main-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Tried dishes</div>
                <h2>Rate completed dishes to influence future recommendations</h2>
              </div>
            </div>

            {sortedRecords.length ? (
              <div className="archive-list">
                {sortedRecords.map((record) => {
                  const dish = DISH_LOOKUP[record.dishId];
                  const archive = archivedLists.find((entry) => entry.id === record.archiveId);

                  if (!dish) {
                    return null;
                  }

                  return (
                    <article key={record.id} className="archive-card">
                      <div className="archive-head">
                        <div>
                          <strong>{dish.name}</strong>
                          <p>{archive?.weekLabel || "Confirmed shopping week"} • {CATEGORY_LABELS[DISH_CATEGORY_MAP[dish.id]]}</p>
                        </div>
                        <span className="chip">{formatCalories(estimateDishCalories(dish))} cal est.</span>
                      </div>

                      <div className="rating-row">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <RatingButton
                            key={value}
                            value={value}
                            active={record.rating === value}
                            onClick={() => updateDishRating(record.id, value)}
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-copy">
                Dishes move here automatically after you confirm <strong>GO SHOP</strong>.
              </p>
            )}
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {renderCompactOverview()}

      <nav className="tab-row" aria-label="Main sections">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            className={`tab-button ${activeTab === tab.value ? "active" : ""}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "planner" ? renderPlannerTab() : null}
      {activeTab === "groceries" ? renderGroceriesTab() : null}
      {activeTab === "pantry" ? renderPantryTab() : null}
      {activeTab === "grocery-lists" ? renderArchivedListsTab() : null}
      {activeTab === "tried" ? renderTriedDishesTab() : null}
    </div>
  );
}

export default App;
