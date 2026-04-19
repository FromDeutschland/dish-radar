import { useEffect, useMemo, useState } from "react";
import {
  buildGoogleSheetPayload,
  createShoppingPlan,
  estimateDishCalories,
  fetchDishOptions,
  fetchRecipeDatabaseMeta,
  formatCalories,
  formatCurrency,
  getDishLibrarySnapshot,
  INGREDIENT_LIBRARY_UPDATED_AT,
  pushShoppingPlanToGoogleSheet,
} from "./storeLogic";

const STORAGE_KEYS = {
  activeTab: "dish-radar.active-tab",
  archivedLists: "dish-radar.archived-lists",
  deckIds: "dish-radar.deck-ids",
  dayDishSelections: "dish-radar.day-dish-selections",
  dishCatalog: "dish-radar.dish-catalog",
  manualPantryItems: "dish-radar.manual-pantry-items",
  pantryInventory: "dish-radar.pantry-inventory",
  ratingHistory: "dish-radar.rating-history",
  triedDishes: "dish-radar.tried-dishes",
  weekSelections: "dish-radar.week-selections",
  wishlistIds: "dish-radar.wishlist-ids",
};

const TABS = [
  { value: "planner", label: "Dish Planner" },
  { value: "groceries", label: "Grocery List" },
  { value: "pantry", label: "Pantry" },
  { value: "grocery-lists", label: "Grocery Lists" },
  { value: "analytics", label: "Analytics" },
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
  "2. Choose a dish type for a day.",
  "3. Pick that day’s dish from 50 matching options.",
  "4. Tap Ready to shop to review what was actually made last week.",
  "5. Open Grocery List and confirm Go Shop to update pantry leftovers and export the list.",
];

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1Tk4ny0z2fEUUquuvBwBpLQMhTt9BsGpep69l0RmvxmE/edit?gid=0#gid=0";

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const PANTRY_STATUS_LABELS = Object.fromEntries(PANTRY_STATUSES.map((option) => [option.value, option.label]));

function safeRead(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeIngredient(value) {
  return `${value || ""}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");
}

function ingredientKey(ingredientId, ingredientName, unit) {
  return `${ingredientId || normalizeIngredient(ingredientName)}::${unit || ""}`;
}

function roundAmount(value) {
  return Math.round(value * 100) / 100;
}

function formatAmount(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function getSavedActiveTab() {
  const saved = safeRead(STORAGE_KEYS.activeTab, "planner");
  return saved === "tried" ? "analytics" : saved;
}

function buildReviewDraft(records) {
  return records.map((record) => ({
    id: record.id,
    made: true,
    rating: record.rating || 0,
  }));
}

function toNumberOrZero(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function getDishCategory(dish) {
  return dish?.category || "";
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
    currentPantry.map((item) => [ingredientKey(item.ingredientId, item.ingredient, item.unit), { ...item }]),
  );

  inventoryRows.forEach((row) => {
    const key = ingredientKey(row.ingredientId, row.ingredient, row.unit);
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
        ingredientId: row.ingredientId || "",
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

function buildSheetName(weekDays) {
  return `Dish Radar ${weekDays[0].shortDate}-${weekDays[6].shortDate}`;
}

function mergeDishCatalog(currentCatalog, nextDishes) {
  const merged = new Map(currentCatalog.map((dish) => [dish.id, dish]));
  nextDishes.forEach((dish) => {
    merged.set(dish.id, dish);
  });
  return Array.from(merged.values());
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
          <span className="chip chip-primary">{CATEGORY_LABELS[getDishCategory(dish)]}</span>
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
  const [activeTab, setActiveTab] = useState(() => getSavedActiveTab());
  const [weekSelections, setWeekSelections] = useState(() => getSavedWeekSelections());
  const [triedDishes, setTriedDishes] = useState(() => safeRead(STORAGE_KEYS.triedDishes, []));
  const [ratingHistory, setRatingHistory] = useState(() => safeRead(STORAGE_KEYS.ratingHistory, []));
  const [dayDishSelections, setDayDishSelections] = useState(() => safeRead(STORAGE_KEYS.dayDishSelections, {}));
  const [dishCatalog, setDishCatalog] = useState(() => safeRead(STORAGE_KEYS.dishCatalog, []));
  const [deckIds, setDeckIds] = useState(() => safeRead(STORAGE_KEYS.deckIds, []));
  const [wishlistIds, setWishlistIds] = useState(() => safeRead(STORAGE_KEYS.wishlistIds, []));
  const [manualPantryItems, setManualPantryItems] = useState(() => safeRead(STORAGE_KEYS.manualPantryItems, []));
  const [pantryInventory, setPantryInventory] = useState(() => safeRead(STORAGE_KEYS.pantryInventory, []));
  const [archivedLists, setArchivedLists] = useState(() => safeRead(STORAGE_KEYS.archivedLists, []));
  const [pantryDraft, setPantryDraft] = useState({ name: "", note: "", status: "extra" });
  const [pantryStockDraft, setPantryStockDraft] = useState({ ingredient: "", amount: "1", unit: "jar", category: "pantry" });
  const [fetchState, setFetchState] = useState({ error: "", biasKeywords: [], exportMessage: "" });
  const [helpOpen, setHelpOpen] = useState(false);
  const [recipeDatabaseMeta, setRecipeDatabaseMeta] = useState(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [reviewModal, setReviewModal] = useState({ open: false, records: [] });
  const [dayPicker, setDayPicker] = useState({
    dayName: "",
    category: "",
    options: [],
    loading: false,
    error: "",
  });

  const weekDays = getCurrentWeekDates();
  const selectedCategories = getSelectedCategories(weekSelections);
  const orderedSelectedCategories = getOrderedSelectedCategories(weekSelections);
  const dishLookup = useMemo(
    () => Object.fromEntries(dishCatalog.map((dish) => [dish.id, dish])),
    [dishCatalog],
  );
  const selectedDayEntries = weekDays
    .map((day) => {
      const dishId = dayDishSelections[day.key];
      const dish = dishLookup[dishId];
      const category = weekSelections[day.key];

      if (!dishId || !dish || !category) {
        return null;
      }

      return {
        dayKey: day.key,
        dayName: day.dayName,
        shortDate: day.shortDate,
        category,
        dish,
      };
    })
    .filter(Boolean);
  const currentShoppingPlan = selectedDayEntries.length ? createShoppingPlan(selectedDayEntries.map((entry) => entry.dish)) : null;
  const selectedArchive = useMemo(() => {
    if (!archivedLists.length) {
      return null;
    }

    return archivedLists.find((archive) => archive.id === selectedArchiveId) || archivedLists[0];
  }, [archivedLists, selectedArchiveId]);
  const sourceMix = useMemo(() => {
    const counts = new Map();

    selectedDayEntries.forEach(({ dish }) => {
      const source = dish.sources[0] || "Dish Radar";
      counts.set(source, (counts.get(source) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([source, count]) => ({ source, count }));
  }, [selectedDayEntries]);
  const baseDishLibrary = useMemo(() => getDishLibrarySnapshot([]), []);
  const pantryInventoryLookup = useMemo(
    () => new Map(pantryInventory.map((item) => [ingredientKey(item.ingredientId, item.ingredient, item.unit), item])),
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
      const pantryMatch = pantryInventoryLookup.get(ingredientKey(inventoryRow.ingredientId, inventoryRow.ingredient, inventoryRow.unit));
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
  const analytics = useMemo(() => {
    const ratedRecords = ratingHistory.filter((record) => record.made && record.rating > 0);
    const archivedSpend = archivedLists.reduce((total, archive) => total + (archive.recommendedStore?.estimatedTotal || 0), 0);
    const storeCounts = archivedLists.reduce((counts, archive) => {
      const storeName = archive.recommendedStore?.name;
      if (storeName) {
        counts[storeName] = (counts[storeName] || 0) + 1;
      }
      return counts;
    }, {});
    const favoriteDishCounts = ratedRecords.reduce((counts, record) => {
      const key = record.dishSnapshot?.name || "Unknown dish";
      const current = counts.get(key) || { total: 0, count: 0 };
      current.total += record.rating;
      current.count += 1;
      counts.set(key, current);
      return counts;
    }, new Map());
    const topDishes = Array.from(favoriteDishCounts.entries())
      .map(([name, value]) => ({
        name,
        average: value.total / value.count,
        count: value.count,
      }))
      .sort((left, right) => right.average - left.average || right.count - left.count)
      .slice(0, 5);
    const uniqueIngredients = new Set(
      baseDishLibrary.flatMap((dish) => (dish.ingredients || []).map((ingredient) => normalizeIngredient(ingredient.name))),
    );
    const lastArchive = archivedLists[0];

    return {
      weeksShopped: archivedLists.length,
      dishesPlanned: archivedLists.reduce((total, archive) => total + (archive.selectedDishes || []).length, 0),
      dishesRated: ratedRecords.length,
      averageRating: ratedRecords.length
        ? ratedRecords.reduce((total, record) => total + record.rating, 0) / ratedRecords.length
        : 0,
      totalSpend: archivedSpend,
      averageWeeklySpend: archivedLists.length ? archivedSpend / archivedLists.length : 0,
      lastWeeklySpend: lastArchive?.recommendedStore?.estimatedTotal || 0,
      topStore: Object.entries(storeCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || "None yet",
      pendingReviews: triedDishes.length,
      pantryLines: pantryInventory.length + manualPantryItems.length,
      totalLibraryDishes: (recipeDatabaseMeta?.totalDishCount || 0) + baseDishLibrary.length,
      totalLibraryIngredients: recipeDatabaseMeta?.uniqueIngredientCount || uniqueIngredients.size,
      lastIngredientUpdate: recipeDatabaseMeta?.generatedAt || INGREDIENT_LIBRARY_UPDATED_AT,
      topDishes,
      recentRatings: ratedRecords
        .slice()
        .sort((left, right) => new Date(right.confirmedAt).getTime() - new Date(left.confirmedAt).getTime())
        .slice(0, 6),
    };
  }, [archivedLists, baseDishLibrary, manualPantryItems.length, pantryInventory.length, ratingHistory, recipeDatabaseMeta, triedDishes.length]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.activeTab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.weekSelections, JSON.stringify(weekSelections));
  }, [weekSelections]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.dayDishSelections, JSON.stringify(dayDishSelections));
  }, [dayDishSelections]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.dishCatalog, JSON.stringify(dishCatalog));
  }, [dishCatalog]);

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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.ratingHistory, JSON.stringify(ratingHistory));
  }, [ratingHistory]);

  useEffect(() => {
    let cancelled = false;

    fetchRecipeDatabaseMeta()
      .then((metadata) => {
        if (!cancelled) {
          setRecipeDatabaseMeta(metadata);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecipeDatabaseMeta(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setWishlistIds((current) => current.filter((id) => dishLookup[id]));
    setDeckIds((current) => current.filter((id) => dishLookup[id]));
    setDayDishSelections((current) => Object.fromEntries(
      Object.entries(current).filter(([, dishId]) => dishLookup[dishId]),
    ));
  }, [dishLookup]);

  useEffect(() => {
    if (!archivedLists.length) {
      if (selectedArchiveId !== null) {
        setSelectedArchiveId(null);
      }
      return;
    }

    const hasSelected = archivedLists.some((archive) => archive.id === selectedArchiveId);
    if (!hasSelected) {
      setSelectedArchiveId(archivedLists[0].id);
    }
  }, [archivedLists, selectedArchiveId]);

  async function refreshDeck(nextSelections = weekSelections) {
    const dayToRefresh = dayPicker.dayName && nextSelections[dayPicker.dayName]
      ? dayPicker.dayName
      : WEEKDAY_NAMES.find((day) => nextSelections[day]);

    if (!dayToRefresh) {
      setFetchState((current) => ({
        ...current,
        error: "Pick a dish type for at least one day before refreshing options.",
      }));
      return;
    }

    await openDayDishPicker(dayToRefresh, nextSelections[dayToRefresh]);
  }

  async function openDayDishPicker(dayName, category) {
    if (!category) {
      setDayPicker({ dayName: "", category: "", options: [], loading: false, error: "" });
      return;
    }

    setDayPicker({
      dayName,
      category,
      options: [],
      loading: true,
      error: "",
    });
    setFetchState((current) => ({ ...current, error: "", exportMessage: "" }));

    try {
      const result = await fetchDishOptions({
        categories: [category],
        triedDishes: ratingHistory,
        limit: 50,
      });

      setDishCatalog((current) => mergeDishCatalog(current, result.dishes));
      setDayPicker({
        dayName,
        category,
        options: result.dishes.filter((dish) => getDishCategory(dish) === category),
        loading: false,
        error: "",
      });
      setFetchState((current) => ({
        ...current,
        biasKeywords: result.biasKeywords || current.biasKeywords,
      }));
    } catch (error) {
      setDayPicker({
        dayName,
        category,
        options: [],
        loading: false,
        error: error.message || "Unable to load day-specific dish options right now.",
      });
    }
  }

  function handleDaySelection(dayName, nextCategory) {
    setWeekSelections((current) => ({ ...current, [dayName]: nextCategory }));
    setDayDishSelections((current) => {
      const next = { ...current };
      delete next[dayName];
      return next;
    });
    if (nextCategory) {
      openDayDishPicker(dayName, nextCategory);
    } else {
      setDayPicker({ dayName: "", category: "", options: [], loading: false, error: "" });
    }
  }

  function clearWeekSelections() {
    setWeekSelections(getDefaultWeekSelections());
    setDayDishSelections({});
    setDeckIds([]);
    setDayPicker({ dayName: "", category: "", options: [], loading: false, error: "" });
  }

  function applyDayDishSelection(dayName, dish) {
    setDishCatalog((current) => mergeDishCatalog(current, [dish]));
    setDayDishSelections((current) => ({ ...current, [dayName]: dish.id }));
    setDayPicker({ dayName: "", category: "", options: [], loading: false, error: "" });
  }

  function clearDayDishSelection(dayName) {
    setDayDishSelections((current) => {
      const next = { ...current };
      delete next[dayName];
      return next;
    });
  }

  async function handleGoShop() {
    if (!selectedDayEntries.length || !currentShoppingPlan) {
      return;
    }

    const confirmed = window.confirm("ARE YOU SURE?");
    if (!confirmed) {
      return;
    }

    const payload = buildGoogleSheetPayload(currentShoppingPlan, {
      linkedSheetUrl: SHEET_URL,
      sheetName: buildSheetName(weekDays),
      weekLabel: `${weekDays[0].shortDate} - ${weekDays[6].shortDate}`,
      generatedAt: new Date().toISOString(),
      selectedDishes: selectedDayEntries.map(({ dayName, dish }) => ({
        dayName,
        name: dish.name,
        category: getDishCategory(dish),
        calories: estimateDishCalories(dish),
      })),
    });

    let exportMessage = "Google Sheet export skipped because no Apps Script URL is configured.";

    try {
      const exportResult = await pushShoppingPlanToGoogleSheet(payload);
      if (exportResult?.ok) {
        exportMessage = `Google Sheet updated: ${payload.sheetName}`;
      } else if (exportResult?.reason) {
        exportMessage = exportResult.reason;
      }
    } catch (error) {
      exportMessage = error.message || "Google Sheet export failed.";
    }

    const archive = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      weekLabel: `${weekDays[0].shortDate} - ${weekDays[6].shortDate}`,
      selectedDishIds: selectedDayEntries.map(({ dish }) => dish.id),
      selectedDishes: selectedDayEntries.map(({ dayName, shortDate, dish }) => ({
        id: dish.id,
        dayName,
        shortDate,
        name: dish.name,
        category: getDishCategory(dish),
        calories: estimateDishCalories(dish),
        tags: [...(dish.tags || [])],
        cuisines: [...(dish.cuisines || [])],
        time: dish.time,
      })),
      rows: pendingGroceryRows,
      inventoryRows: currentShoppingPlan.inventoryRows,
      recommendedStore: currentShoppingPlan.recommendedStore,
      exportMessage,
    };

    setArchivedLists((current) => [archive, ...current]);
    setPantryInventory((current) => mergePantryAfterShop(current, currentShoppingPlan.inventoryRows));
    setTriedDishes((current) => [
      ...selectedDayEntries.map(({ dayName, dish }) => ({
        id: `${archive.id}:${dayName}:${dish.id}`,
        archiveId: archive.id,
        dishId: dish.id,
        confirmedAt: archive.createdAt,
        rating: 0,
        dishSnapshot: {
          id: dish.id,
          name: dish.name,
          dayName,
          category: getDishCategory(dish),
          calories: estimateDishCalories(dish),
          tags: [...(dish.tags || [])],
          cuisines: [...(dish.cuisines || [])],
          time: dish.time,
        },
      })),
      ...current,
    ]);
    setDayDishSelections({});
    setWishlistIds([]);
    setFetchState((current) => ({ ...current, exportMessage }));
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

  function addPantryStock(event) {
    event.preventDefault();

    const ingredient = pantryStockDraft.ingredient.trim();
    const amount = Number.parseFloat(pantryStockDraft.amount);

    if (!ingredient || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const unit = pantryStockDraft.unit.trim() || "jar";
    const key = ingredientKey("", ingredient, unit);

    setPantryInventory((current) => {
      const existingIndex = current.findIndex((item) => ingredientKey(item.ingredientId, item.ingredient, item.unit) === key);

      if (existingIndex < 0) {
        return [
          {
            ingredientId: "",
            ingredient,
            amount,
            unit,
            category: pantryStockDraft.category || "pantry",
          },
          ...current,
        ];
      }

      return current.map((item, index) => (
        index === existingIndex
          ? { ...item, amount: roundAmount(item.amount + amount), category: pantryStockDraft.category || item.category }
          : item
      ));
    });

    setPantryStockDraft({ ingredient: "", amount: "1", unit: "jar", category: "pantry" });
  }

  function updatePantryInventoryItem(itemKey, field, value) {
    setPantryInventory((current) => current.map((item) => {
      const currentKey = ingredientKey(item.ingredientId, item.ingredient, item.unit);

      if (currentKey !== itemKey) {
        return item;
      }

      if (field === "amount") {
        const amount = Number.parseFloat(value);
        return {
          ...item,
          amount: Number.isFinite(amount) && amount > 0 ? amount : item.amount,
        };
      }

      return {
        ...item,
        [field]: value,
      };
    }));
  }

  function removePantryInventoryItem(itemKey) {
    setPantryInventory((current) => current.filter((item) => ingredientKey(item.ingredientId, item.ingredient, item.unit) !== itemKey));
  }

  function resetPantryAll() {
    const confirmed = window.confirm("Reset all pantry inventory and pantry notes?");
    if (!confirmed) {
      return;
    }

    setPantryInventory([]);
    setManualPantryItems([]);
  }

  function openReadyToShop() {
    if (!selectedDayEntries.length) {
      return;
    }

    if (triedDishes.length) {
      setReviewModal({
        open: true,
        records: buildReviewDraft(triedDishes),
      });
      return;
    }

    setActiveTab("groceries");
  }

  function closeReviewModal() {
    setReviewModal({ open: false, records: [] });
  }

  function updateReviewModalRecord(recordId, nextFields) {
    setReviewModal((current) => ({
      ...current,
      records: current.records.map((record) => (
        record.id === recordId ? { ...record, ...nextFields } : record
      )),
    }));
  }

  function submitWeeklyReview() {
    const draftLookup = new Map(reviewModal.records.map((record) => [record.id, record]));
    const reviewedRecords = triedDishes.map((record) => {
      const draft = draftLookup.get(record.id) || { made: false, rating: 0 };

      return {
        ...record,
        made: draft.made,
        rating: draft.made ? draft.rating : 0,
        reviewedAt: new Date().toISOString(),
      };
    });

    setRatingHistory((current) => [...reviewedRecords, ...current]);
    setTriedDishes([]);
    closeReviewModal();
    setActiveTab("groceries");
  }

  async function copyArchivePayload(archive) {
    await copyText(JSON.stringify(archive, null, 2));
  }

  function updateArchive(archiveId, updater) {
    setArchivedLists((current) => current.map((archive) => (
      archive.id === archiveId ? updater(archive) : archive
    )));
  }

  function updateArchiveMeta(archiveId, field, value) {
    updateArchive(archiveId, (archive) => {
      if (field === "weekLabel" || field === "exportMessage") {
        return { ...archive, [field]: value };
      }

      if (field === "storeName") {
        return {
          ...archive,
          recommendedStore: {
            ...archive.recommendedStore,
            name: value,
          },
        };
      }

      if (field === "estimatedTotal") {
        return {
          ...archive,
          recommendedStore: {
            ...archive.recommendedStore,
            estimatedTotal: toNumberOrZero(value),
          },
        };
      }

      if (field === "reason") {
        return {
          ...archive,
          recommendedStore: {
            ...archive.recommendedStore,
            reason: value,
          },
        };
      }

      return archive;
    });
  }

  function updateArchiveDish(archiveId, dishIndex, field, value) {
    updateArchive(archiveId, (archive) => ({
      ...archive,
      selectedDishes: (archive.selectedDishes || []).map((dish, index) => {
        if (index !== dishIndex) {
          return dish;
        }

        return {
          ...dish,
          [field]: field === "calories" ? toNumberOrZero(value) : value,
        };
      }),
    }));
  }

  function updateArchiveRow(archiveId, rowIndex, field, value) {
    updateArchive(archiveId, (archive) => ({
      ...archive,
      rows: (archive.rows || []).map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        return {
          ...row,
          [field]: field === "expectedPrice" ? toNumberOrZero(value) : value,
        };
      }),
    }));
  }

  function addArchiveRow(archiveId) {
    updateArchive(archiveId, (archive) => ({
      ...archive,
      rows: [
        ...(archive.rows || []),
        {
          ingredient: "",
          qty: "1 box",
          expectedPrice: 0,
          dishUsedIn: "",
          pantryFlag: "Buy",
          pantryNote: "",
        },
      ],
    }));
  }

  function removeArchiveRow(archiveId, rowIndex) {
    updateArchive(archiveId, (archive) => ({
      ...archive,
      rows: (archive.rows || []).filter((_, index) => index !== rowIndex),
    }));
  }

  function removeArchive(archiveId) {
    const confirmed = window.confirm("Delete this archived grocery list?");
    if (!confirmed) {
      return;
    }

    setArchivedLists((current) => current.filter((archive) => archive.id !== archiveId));
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
                  {weekSelections[day.key] ? (
                    <div className="day-selection-block">
                      <span className="chip chip-primary">{CATEGORY_LABELS[weekSelections[day.key]]}</span>
                      {dayDishSelections[day.key] && dishLookup[dayDishSelections[day.key]] ? (
                        <div className="day-picked-card">
                          <strong className="day-picked-title">{dishLookup[dayDishSelections[day.key]].name}</strong>
                          <div className="day-picked-stats">
                            <div>
                              <span>Calories</span>
                              <strong>{formatCalories(estimateDishCalories(dishLookup[dayDishSelections[day.key]]))}</strong>
                            </div>
                            <div>
                              <span>Time</span>
                              <strong>{dishLookup[dayDishSelections[day.key]].time} min</strong>
                            </div>
                          </div>
                          <div className="mini-action-row">
                            <button className="mini-button" onClick={() => openDayDishPicker(day.key, weekSelections[day.key])}>
                              Change dish
                            </button>
                            <button className="mini-button" onClick={() => clearDayDishSelection(day.key)}>
                              Clear
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="action-button wide" onClick={() => openDayDishPicker(day.key, weekSelections[day.key])}>
                          Choose dish
                        </button>
                      )}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="control-panel">
            <div className="control-block grow">
              <label>Planner status</label>
              <div className="summary-box">
                <strong>
                  {dayPicker.loading
                    ? `Loading 50 ${CATEGORY_LABELS[dayPicker.category] || ""} options for ${dayPicker.dayName}...`
                    : selectedDayEntries.length
                      ? `${selectedDayEntries.length} days have a chosen dish`
                      : selectedCategories.length
                        ? "Dish types chosen. Pick a recipe for each day."
                        : "No days locked yet"}
                </strong>
                <span>
                  {fetchState.biasKeywords.length
                    ? `Next fetch is being biased toward: ${fetchState.biasKeywords.join(", ")}.`
                    : "Ratings from your weekly review shape future dish options toward similar cuisines and flavors."}
                </span>
              </div>
            </div>
            <div className="button-row">
              <button className="action-button" onClick={() => refreshDeck()} disabled={dayPicker.loading}>
                {dayPicker.loading ? "Refreshing..." : "Refresh inspiration"}
              </button>
              <button className="ghost-button" onClick={() => setDayDishSelections({})}>
                Clear chosen dishes
              </button>
            </div>
          </div>

          <div className="info-strip">
            <p>
              {selectedCategories.length
                ? "Selecting a dish type now automatically opens a 50-option picker for that day."
                : "Choose one or more meal types above to start building your week day by day."}
            </p>
            <p>
              {sourceMix.length
                ? `Current chosen dishes come from: ${sourceMix.map((item) => `${item.source} (${item.count})`).join(", ")}.`
                : "Day pickers use the built-in recipe library, archive dishes, and rating-based variations."}
            </p>
            {fetchState.error ? <p>{fetchState.error}</p> : null}
          </div>

          <section className="dish-list-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Selected dishes</div>
                <h2>See each day’s chosen recipe at a glance</h2>
              </div>
            </div>

            {selectedDayEntries.length ? (
              <div className="wishlist-list">
                {selectedDayEntries.map((entry) => (
                  <div key={`${entry.dayKey}-${entry.dish.id}`} className="wishlist-item">
                    <div>
                      <strong>{entry.dayName}: {entry.dish.name}</strong>
                      <p>{CATEGORY_LABELS[entry.category]} • {formatCalories(estimateDishCalories(entry.dish))} cal est. • {entry.dish.time} min</p>
                    </div>
                    <button className="mini-button" onClick={() => openDayDishPicker(entry.dayKey, entry.category)}>
                      Swap
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Pick a meal type for a day, then choose one recipe from the 50 matching options shown for that day.
              </p>
            )}

            <button className="hero-shop-button" onClick={openReadyToShop} disabled={!selectedDayEntries.length}>
              <span>Ready to shop</span>
              <small>{triedDishes.length ? "Review last week first, then open the grocery list." : "Open this week’s grocery list and shop."}</small>
            </button>
          </section>
        </section>

        <aside className="side-column">
          <section className="panel sticky-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Week at a glance</div>
                <h2>Dishes assigned to each day</h2>
              </div>
              <button className="text-button" onClick={() => setDayDishSelections({})}>
                Clear
              </button>
            </div>

            {selectedDayEntries.length ? (
              <div className="wishlist-list">
                {selectedDayEntries.map((entry) => (
                  <div key={`${entry.dayKey}-summary`} className="wishlist-item">
                    <div>
                      <strong>{entry.dayName}</strong>
                      <p>{entry.dish.name}</p>
                    </div>
                    <button className="mini-button" onClick={() => openDayDishPicker(entry.dayKey, entry.category)}>
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Choose a dish for each day and they’ll appear here automatically.
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
                <h2>Upcoming shopping run for the selected week</h2>
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
                  Click <strong>GO SHOP</strong> to export this list to your Google Sheet and update pantry leftovers.
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
                        <tr key={`${row.ingredientId || row.ingredient}-${row.qty}`}>
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

                {fetchState.exportMessage ? <p className="summary-copy subtle">{fetchState.exportMessage}</p> : null}
              </>
            ) : (
              <p className="empty-copy">
                Pick dishes for one or more days in <strong>Dish Planner</strong> and the grocery list will appear here. If pantry still has an ingredient from a previous week, it will be flagged here before you shop.
              </p>
            )}
          </section>

          {archivedLists.length ? (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <div className="eyebrow">Past grocery lists</div>
                  <h2>Click a previous week to see what was bought</h2>
                </div>
              </div>

              <div className="archive-selector-row">
                {archivedLists.map((archive) => (
                  <button
                    key={archive.id}
                    className={`archive-selector-button ${selectedArchive?.id === archive.id ? "active" : ""}`}
                    onClick={() => setSelectedArchiveId(archive.id)}
                  >
                    <strong>{archive.weekLabel}</strong>
                    <span>{archive.recommendedStore?.name || "Store pending"}</span>
                  </button>
                ))}
              </div>

              {selectedArchive ? (
                <div className="archive-preview-card">
                  <div className="archive-preview-meta">
                    <div>
                      <span>Week</span>
                      <strong>{selectedArchive.weekLabel}</strong>
                    </div>
                    <div>
                      <span>Store</span>
                      <strong>{selectedArchive.recommendedStore?.name || "Store pending"}</strong>
                    </div>
                    <div>
                      <span>Expected total</span>
                      <strong>{formatCurrency(selectedArchive.recommendedStore?.estimatedTotal || 0)}</strong>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th>Qty</th>
                          <th>Expected Price</th>
                          <th>Dish used in</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedArchive.rows || []).map((row, index) => (
                          <tr key={`${selectedArchive.id}-preview-${index}`}>
                            <td>{row.ingredient}</td>
                            <td>{row.qty}</td>
                            <td>{formatCurrency(row.expectedPrice || 0)}</td>
                            <td>{row.dishUsedIn || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
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
                <h2>Stored until fully consumed and always editable</h2>
              </div>
              <button className="text-button" onClick={resetPantryAll}>
                Reset all
              </button>
            </div>

            <p className="empty-copy">
              Pantry leftovers appear here after you confirm <strong>GO SHOP</strong>. You can still add, adjust, or delete pantry items at any time.
            </p>

            <form className="pantry-form pantry-stock-form" onSubmit={addPantryStock}>
              <div className="control-block">
                <label htmlFor="stock-ingredient">Add ingredient</label>
                <input
                  id="stock-ingredient"
                  type="text"
                  placeholder="Peanut butter"
                  value={pantryStockDraft.ingredient}
                  onChange={(event) => setPantryStockDraft((current) => ({ ...current, ingredient: event.target.value }))}
                />
              </div>
              <div className="control-block">
                <label htmlFor="stock-amount">Amount</label>
                <input
                  id="stock-amount"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={pantryStockDraft.amount}
                  onChange={(event) => setPantryStockDraft((current) => ({ ...current, amount: event.target.value }))}
                />
              </div>
              <div className="control-block">
                <label htmlFor="stock-unit">Unit</label>
                <input
                  id="stock-unit"
                  type="text"
                  placeholder="jar"
                  value={pantryStockDraft.unit}
                  onChange={(event) => setPantryStockDraft((current) => ({ ...current, unit: event.target.value }))}
                />
              </div>
              <div className="control-block">
                <label htmlFor="stock-category">Category</label>
                <select
                  id="stock-category"
                  value={pantryStockDraft.category}
                  onChange={(event) => setPantryStockDraft((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="pantry">Pantry</option>
                  <option value="specialty">Specialty</option>
                  <option value="dairy">Dairy</option>
                  <option value="produce">Produce</option>
                  <option value="protein">Protein</option>
                  <option value="seafood">Seafood</option>
                  <option value="bakery">Bakery</option>
                  <option value="frozen">Frozen</option>
                </select>
              </div>
              <button className="action-button" type="submit">
                Add stock
              </button>
            </form>

            {pantryInventory.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Amount</th>
                      <th>Unit</th>
                      <th>Category</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pantryInventory.map((item) => {
                      const itemKey = ingredientKey(item.ingredientId, item.ingredient, item.unit);

                      return (
                        <tr key={`${itemKey}-editable`}>
                          <td>
                            <input
                              className="table-input"
                              type="text"
                              value={item.ingredient}
                              onChange={(event) => updatePantryInventoryItem(itemKey, "ingredient", event.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="table-input"
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={item.amount}
                              onChange={(event) => updatePantryInventoryItem(itemKey, "amount", event.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="table-input"
                              type="text"
                              value={item.unit}
                              onChange={(event) => updatePantryInventoryItem(itemKey, "unit", event.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="table-input"
                              value={item.category}
                              onChange={(event) => updatePantryInventoryItem(itemKey, "category", event.target.value)}
                            >
                              <option value="pantry">Pantry</option>
                              <option value="specialty">Specialty</option>
                              <option value="dairy">Dairy</option>
                              <option value="produce">Produce</option>
                              <option value="protein">Protein</option>
                              <option value="seafood">Seafood</option>
                              <option value="bakery">Bakery</option>
                              <option value="frozen">Frozen</option>
                            </select>
                          </td>
                          <td>
                            <button className="mini-button" onClick={() => removePantryInventoryItem(itemKey)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-copy">
                No pantry stock tracked yet. Add a pantry item above or confirm a shopping run to start carrying leftovers forward.
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
                        <span>{(archive.selectedDishes || []).length} dishes</span>
                        <button className="mini-button" onClick={() => copyArchivePayload(archive)}>
                          Copy JSON
                        </button>
                        <button className="mini-button" onClick={() => removeArchive(archive.id)}>
                          Delete list
                        </button>
                      </div>
                    </div>

                    <div className="archive-edit-grid">
                      <div className="archive-edit-card">
                        <label>Week label</label>
                        <input
                          className="table-input"
                          type="text"
                          value={archive.weekLabel}
                          onChange={(event) => updateArchiveMeta(archive.id, "weekLabel", event.target.value)}
                        />
                      </div>
                      <div className="archive-edit-card">
                        <label>Store</label>
                        <input
                          className="table-input"
                          type="text"
                          value={archive.recommendedStore.name}
                          onChange={(event) => updateArchiveMeta(archive.id, "storeName", event.target.value)}
                        />
                      </div>
                      <div className="archive-edit-card">
                        <label>Estimated total</label>
                        <input
                          className="table-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={archive.recommendedStore.estimatedTotal}
                          onChange={(event) => updateArchiveMeta(archive.id, "estimatedTotal", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="archive-meta">
                      <span className="chip chip-primary">{archive.recommendedStore.name}</span>
                      <span className="chip">{formatCurrency(archive.recommendedStore.estimatedTotal)}</span>
                    </div>

                    <div className="archive-edit-card archive-reason-card">
                      <label>Why this store</label>
                      <textarea
                        className="table-input archive-textarea"
                        value={archive.recommendedStore.reason}
                        onChange={(event) => updateArchiveMeta(archive.id, "reason", event.target.value)}
                      />
                    </div>

                    <div className="archive-dishes archive-edit-section">
                      <div className="archive-section-head">
                        <strong>Selected dishes</strong>
                      </div>
                      {(archive.selectedDishes || []).map((snapshot, snapshotIndex) => (
                        <div key={`${snapshot.dayName || "day"}-${snapshot.id}`} className="archive-dish-editor">
                          <input
                            className="table-input"
                            type="text"
                            value={snapshot.dayName || ""}
                            onChange={(event) => updateArchiveDish(archive.id, snapshotIndex, "dayName", event.target.value)}
                            placeholder="Day"
                          />
                          <input
                            className="table-input"
                            type="text"
                            value={snapshot.name}
                            onChange={(event) => updateArchiveDish(archive.id, snapshotIndex, "name", event.target.value)}
                            placeholder="Dish"
                          />
                          <select
                            className="table-input"
                            value={snapshot.category}
                            onChange={(event) => updateArchiveDish(archive.id, snapshotIndex, "category", event.target.value)}
                          >
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className="table-input"
                            type="number"
                            min="0"
                            step="1"
                            value={snapshot.calories}
                            onChange={(event) => updateArchiveDish(archive.id, snapshotIndex, "calories", event.target.value)}
                            placeholder="Calories"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="archive-edit-section">
                      <div className="archive-section-head">
                        <strong>Archived grocery rows</strong>
                        <button className="mini-button" onClick={() => addArchiveRow(archive.id)}>
                          Add row
                        </button>
                      </div>

                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Ingredient</th>
                              <th>Qty</th>
                              <th>Expected Price</th>
                              <th>Dish used in</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(archive.rows || []).map((row, rowIndex) => (
                              <tr key={`${archive.id}-row-${rowIndex}`}>
                                <td>
                                  <input
                                    className="table-input"
                                    type="text"
                                    value={row.ingredient}
                                    onChange={(event) => updateArchiveRow(archive.id, rowIndex, "ingredient", event.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="table-input"
                                    type="text"
                                    value={row.qty}
                                    onChange={(event) => updateArchiveRow(archive.id, rowIndex, "qty", event.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="table-input"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.expectedPrice}
                                    onChange={(event) => updateArchiveRow(archive.id, rowIndex, "expectedPrice", event.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="table-input"
                                    type="text"
                                    value={row.dishUsedIn}
                                    onChange={(event) => updateArchiveRow(archive.id, rowIndex, "dishUsedIn", event.target.value)}
                                  />
                                </td>
                                <td>
                                  <button className="mini-button" onClick={() => removeArchiveRow(archive.id, rowIndex)}>
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="archive-edit-card archive-reason-card">
                      <label>Export note</label>
                      <textarea
                        className="table-input archive-textarea"
                        value={archive.exportMessage || ""}
                        onChange={(event) => updateArchiveMeta(archive.id, "exportMessage", event.target.value)}
                      />
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

  function renderAnalyticsTab() {
    return (
      <div className="workspace single-column-layout">
        <section className="main-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Analytics</div>
                <h2>Track usage, ratings, costs, and library coverage</h2>
              </div>
            </div>

            <div className="analytics-grid">
              <article className="stat-card">
                <span>Total shopping weeks</span>
                <strong>{analytics.weeksShopped}</strong>
              </article>
              <article className="stat-card">
                <span>Dishes planned</span>
                <strong>{analytics.dishesPlanned}</strong>
              </article>
              <article className="stat-card">
                <span>Dishes rated</span>
                <strong>{analytics.dishesRated}</strong>
              </article>
              <article className="stat-card">
                <span>Average rating</span>
                <strong>{analytics.averageRating ? analytics.averageRating.toFixed(1) : "0.0"}/5</strong>
              </article>
              <article className="stat-card">
                <span>Total grocery spend</span>
                <strong>{formatCurrency(analytics.totalSpend)}</strong>
              </article>
              <article className="stat-card">
                <span>Average weekly spend</span>
                <strong>{formatCurrency(analytics.averageWeeklySpend)}</strong>
              </article>
              <article className="stat-card">
                <span>Most-used store</span>
                <strong>{analytics.topStore}</strong>
              </article>
              <article className="stat-card">
                <span>Pantry lines tracked</span>
                <strong>{analytics.pantryLines}</strong>
              </article>
              <article className="stat-card">
                <span>Total dish library</span>
                <strong>{analytics.totalLibraryDishes}</strong>
              </article>
              <article className="stat-card">
                <span>Unique ingredients</span>
                <strong>{analytics.totalLibraryIngredients}</strong>
              </article>
              <article className="stat-card">
                <span>Ingredient inputs updated</span>
                <strong>{analytics.lastIngredientUpdate}</strong>
              </article>
              <article className="stat-card">
                <span>Pending weekly reviews</span>
                <strong>{analytics.pendingReviews}</strong>
              </article>
            </div>

            {analytics.topDishes.length ? (
              <div className="archive-list analytics-section">
                <article className="archive-card">
                  <div className="panel-head">
                    <div>
                      <div className="eyebrow">Top-rated dishes</div>
                      <h2>What the household likes most</h2>
                    </div>
                  </div>

                  <div className="archive-dishes">
                    {analytics.topDishes.map((dish) => (
                      <div key={dish.name} className="archive-dish-row">
                        <div>
                          <strong>{dish.name}</strong>
                          <p>{dish.count} rating{dish.count === 1 ? "" : "s"}</p>
                        </div>
                        <span className="chip chip-primary">{dish.average.toFixed(1)}/5</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="archive-card">
                  <div className="panel-head">
                    <div>
                      <div className="eyebrow">Recent ratings</div>
                      <h2>Latest completed dish feedback</h2>
                    </div>
                  </div>

                  <div className="archive-dishes">
                    {analytics.recentRatings.map((record) => (
                      <div key={record.id} className="archive-dish-row">
                        <div>
                          <strong>{record.dishSnapshot?.name || "Dish"}</strong>
                          <p>{record.dishSnapshot?.dayName ? `${record.dishSnapshot.dayName} • ` : ""}{record.made ? "Made" : "Skipped"} • {new Date(record.confirmedAt).toLocaleDateString("en-US")}</p>
                        </div>
                        <span className="chip">{record.rating ? `${record.rating}/5` : "No rating"}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <p className="empty-copy">
                Use the planner, go shopping, and complete a weekly review to populate analytics.
              </p>
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderDayPickerModal() {
    if (!dayPicker.dayName) {
      return null;
    }

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Choose a dish for the selected day">
        <div className="modal-card">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Choose a dish</div>
              <h2>{dayPicker.dayName}: {CATEGORY_LABELS[dayPicker.category]}</h2>
            </div>
            <button
              className="text-button"
              onClick={() => setDayPicker({ dayName: "", category: "", options: [], loading: false, error: "" })}
            >
              Close
            </button>
          </div>

          {dayPicker.loading ? <p className="empty-copy">Loading 50 matching options for this day...</p> : null}
          {dayPicker.error ? <p className="empty-copy">{dayPicker.error}</p> : null}

          {!dayPicker.loading && !dayPicker.error ? (
            <div className="modal-option-list">
              {dayPicker.options.slice(0, 50).map((dish) => (
                <div key={`${dayPicker.dayName}-${dish.id}`} className="modal-option-card">
                  <div>
                    <strong>{dish.name}</strong>
                    <p>{formatCalories(estimateDishCalories(dish))} cal est. • {dish.time} min • {dish.sources[0] || "Dish Radar"}</p>
                  </div>
                  <button className="action-button" onClick={() => applyDayDishSelection(dayPicker.dayName, dish)}>
                    Select
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderWeeklyReviewModal() {
    if (!reviewModal.open) {
      return null;
    }

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Review last week's dishes">
        <div className="modal-card">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Ready to shop</div>
              <h2>What got made last week?</h2>
            </div>
            <button className="text-button" onClick={closeReviewModal}>
              Close
            </button>
          </div>

          <p className="empty-copy">Mark what actually got cooked, add a quick rating, and I’ll use that feedback for future dish suggestions before opening this week’s grocery list.</p>

          <div className="modal-option-list">
            {triedDishes.map((record) => {
              const draft = reviewModal.records.find((item) => item.id === record.id);
              const dish = record.dishSnapshot;

              return (
                <div key={record.id} className="modal-option-card review-option-card">
                  <div>
                    <strong>{dish?.dayName ? `${dish.dayName}: ${dish.name}` : dish?.name}</strong>
                    <p>{CATEGORY_LABELS[dish?.category]} • {formatCalories(dish?.calories || 0)} cal est.</p>
                  </div>
                  <div className="review-controls">
                    <label className="review-toggle">
                      <input
                        type="checkbox"
                        checked={draft?.made ?? true}
                        onChange={(event) => updateReviewModalRecord(record.id, { made: event.target.checked, rating: event.target.checked ? (draft?.rating || 0) : 0 })}
                      />
                      <span>Made it</span>
                    </label>
                    <div className="rating-row">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <RatingButton
                          key={`${record.id}-${value}`}
                          value={value}
                          active={draft?.rating === value}
                          onClick={() => updateReviewModalRecord(record.id, { made: true, rating: value })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="button-row modal-actions">
            <button
              className="ghost-button"
              onClick={() => {
                closeReviewModal();
                setActiveTab("groceries");
              }}
            >
              Skip for now
            </button>
            <button className="action-button" onClick={submitWeeklyReview}>
              Save review and open grocery list
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderHelpModal() {
    if (!helpOpen) {
      return null;
    }

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="How Dish Radar works">
        <div className="modal-card help-modal-card">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Help</div>
              <h2>How Dish Radar works</h2>
            </div>
            <button className="text-button" onClick={() => setHelpOpen(false)}>
              Close
            </button>
          </div>

          <p className="empty-copy">Plan dishes from the built-in recipe library, confirm shopping, and keep pantry leftovers until fully consumed.</p>

          <ol className="workflow-list help-workflow-list">
            {WORKFLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand-block">
          <span className="brand-mark">Dish<br />Radar</span>
          <p>Luxury weekly dinner planning, pantry memory, and grocery flow.</p>
        </div>

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

        <div className="header-actions">
          <button className="ghost-button header-help-button" onClick={() => setHelpOpen(true)}>
            Help
          </button>
        </div>
      </header>

      <main className="content-shell">
        {activeTab === "planner" ? (
          <section className="intro-hero">
            <div className="hero-copy">
              <span className="eyebrow">Weekly planning atelier</span>
              <h1>Plan beautifully. Shop once. Remember what is already at home.</h1>
              <p>
                Select a dish style for each day, lock in exact recipes, keep pantry leftovers live,
                and edit every archived grocery run whenever you need to.
              </p>
            </div>
            <div className="hero-frame" aria-hidden="true">
              <div className="hero-arch">
                <div className="hero-arch-lines" />
                <div className="hero-orb hero-orb-top" />
                <div className="hero-orb hero-orb-bottom" />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "planner" ? renderPlannerTab() : null}
        {activeTab === "groceries" ? renderGroceriesTab() : null}
        {activeTab === "pantry" ? renderPantryTab() : null}
        {activeTab === "grocery-lists" ? renderArchivedListsTab() : null}
        {activeTab === "analytics" ? renderAnalyticsTab() : null}
      </main>

      <div className="page-help-bar">
        <button className="ghost-button help-button" onClick={() => setHelpOpen(true)}>
          Help
        </button>
      </div>
      {renderDayPickerModal()}
      {renderWeeklyReviewModal()}
      {renderHelpModal()}
    </div>
  );
}

export default App;
