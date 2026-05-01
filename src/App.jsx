import { useEffect, useMemo, useState } from "react";
import {
  buildGoogleSheetPayload,
  createShoppingPlan,
  estimateDishCalories,
  extractPreferenceKeywords,
  formatCalories,
  formatCurrency,
  formatIngredientDisplay,
  generateSyntheticRecipeCollection,
  pushShoppingPlanToGoogleSheet,
  screenPantryCarryover,
  screenShoppingPlan,
  sanitizeStoredDishes,
} from "./storeLogic";

const STORAGE_KEYS = {
  activeTab: "dish-radar.active-tab",
  customCodex: "custom_codex",
  dayDishSelections: "dish-radar.day-dish-selections",
  dishCatalog: "dish-radar.dish-catalog",
  generatedPools: "dish-radar.generated-pools",
  lockedWeek: "dish-radar.locked-week",
  pantryCarryover: "dish-radar.pantry-carryover",
  ratingHistory: "dish-radar.rating-history",
  weekSelections: "dish-radar.week-selections",
};

const TABS = [
  { value: "planner", label: "Dish Selection" },
  { value: "recipes", label: "Recipes" },
  { value: "groceries", label: "Grocery List" },
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
  { value: "balanced-plate", label: "Protein + Sides" },
  { value: "pasta-noodles", label: "Pasta & Noodles" },
  { value: "one-pot", label: "One-Pot" },
  { value: "handhelds-casual", label: "Handhelds & Casual" },
  { value: "soups-stews-chilis", label: "Soups, Stews & Chilis" },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const VALID_TAB_VALUES = new Set(TABS.map((tab) => tab.value));
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1Tk4ny0z2fEUUquuvBwBpLQMhTt9BsGpep69l0RmvxmE/edit?gid=0#gid=0";
const HEADER_INGREDIENTS = [
  { emoji: "🥑", label: "Avocado" },
  { emoji: "🍋", label: "Citrus" },
  { emoji: "🥬", label: "Greens" },
  { emoji: "🍅", label: "Tomatoes" },
  { emoji: "🫒", label: "Olives" },
];
const PLANNER_INGREDIENTS = [
  { emoji: "🥕", label: "Fresh produce" },
  { emoji: "🍄", label: "Good texture" },
  { emoji: "🌿", label: "Bright herbs" },
  { emoji: "🧄", label: "Big flavor" },
];

function safeRead(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getSavedActiveTab() {
  const saved = safeRead(STORAGE_KEYS.activeTab, "planner");
  return VALID_TAB_VALUES.has(saved) ? saved : "planner";
}

function getDefaultWeekSelections() {
  return Object.fromEntries(WEEKDAY_NAMES.map((day) => [day, ""]));
}

function getSavedWeekSelections() {
  const defaults = getDefaultWeekSelections();
  const saved = safeRead(STORAGE_KEYS.weekSelections, defaults);
  return { ...defaults, ...saved };
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

function buildWeekLabel(weekDays) {
  return `${weekDays[0].shortDate} - ${weekDays[6].shortDate}`;
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

function uniqById(dishes) {
  const unique = new Map();
  dishes.forEach((dish) => {
    if (dish?.id) {
      unique.set(dish.id, dish);
    }
  });
  return Array.from(unique.values());
}

function getDifficultyLabel(time) {
  if (time <= 15) return "easy";
  if (time <= 30) return "medium";
  return "hard";
}

function createEmptyDayPicker() {
  return {
    dayName: "",
    category: "",
    options: [],
    loading: false,
    error: "",
    searchQuery: "",
    notice: "",
  };
}

function buildGeminiPrompt({ category, dayName, searchText, biasKeywords, count }) {
  const categoryLabel = CATEGORY_LABELS[category] || "dinner";
  const parts = [];

  if (searchText.trim()) {
    parts.push(`Create ${count} ${categoryLabel} dishes inspired by ${searchText.trim()}`);
  } else {
    parts.push(`Create ${count} distinct ${categoryLabel} dinner ideas for ${dayName}`);
  }

  if (biasKeywords.length) {
    parts.push(`Lean toward these flavors and cuisines when they fit: ${biasKeywords.join(", ")}`);
  }

  parts.push("Keep the dishes varied, appealing, and practical for a home cook.");
  return parts.join(". ");
}

function groupRowsByAisle(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const aisle = row.aisleLabel || "Other";
    if (!groups.has(aisle)) {
      groups.set(aisle, []);
    }
    groups.get(aisle).push(row);
  });

  return Array.from(groups.entries()).map(([aisle, items]) => ({ aisle, items }));
}

function IngredientRibbon({ items, tone = "fresh" }) {
  return (
    <div className={`ingredient-ribbon ingredient-ribbon-${tone}`} aria-hidden="true">
      {items.map((item) => (
        <div key={`${item.label}-${item.emoji}`} className="ingredient-card">
          <span className="ingredient-emoji">{item.emoji}</span>
          <span className="ingredient-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(() => getSavedActiveTab());
  const [weekSelections, setWeekSelections] = useState(() => getSavedWeekSelections());
  const [dayDishSelections, setDayDishSelections] = useState(() => safeRead(STORAGE_KEYS.dayDishSelections, {}));
  const [customCodex, setCustomCodex] = useState(() => sanitizeStoredDishes(safeRead(STORAGE_KEYS.customCodex, [])));
  const [dishCatalog, setDishCatalog] = useState(() => sanitizeStoredDishes(safeRead(STORAGE_KEYS.dishCatalog, [])));
  const [generatedPools, setGeneratedPools] = useState(() => safeRead(STORAGE_KEYS.generatedPools, {}));
  const [lockedWeek, setLockedWeek] = useState(() => safeRead(STORAGE_KEYS.lockedWeek, null));
  const [pantryCarryover, setPantryCarryover] = useState(() => safeRead(STORAGE_KEYS.pantryCarryover, []));
  const [ratingHistory] = useState(() => safeRead(STORAGE_KEYS.ratingHistory, []));
  const [dayPicker, setDayPicker] = useState(() => createEmptyDayPicker());
  const [exportMessage, setExportMessage] = useState("");
  const [screenedPlanState, setScreenedPlanState] = useState({
    signature: "",
    loading: false,
    plan: null,
    note: "",
    error: "",
  });

  const weekDays = getCurrentWeekDates();
  const biasKeywords = useMemo(() => extractPreferenceKeywords(ratingHistory), [ratingHistory]);
  const searchableDishLibrary = useMemo(
    () => uniqById([...customCodex, ...dishCatalog]),
    [customCodex, dishCatalog],
  );
  const dishLookup = useMemo(
    () => Object.fromEntries(searchableDishLibrary.map((dish) => [dish.id, dish])),
    [searchableDishLibrary],
  );

  const selectedDayEntries = useMemo(
    () => weekDays
      .map((day) => {
        const dishId = dayDishSelections[day.key];
        const category = weekSelections[day.key];
        const dish = dishLookup[dishId];

        if (!category || !dish) {
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
      .filter(Boolean),
    [dayDishSelections, dishLookup, weekDays, weekSelections],
  );

  const currentShoppingPlan = useMemo(
    () => (selectedDayEntries.length ? createShoppingPlan(selectedDayEntries.map((entry) => entry.dish)) : null),
    [selectedDayEntries],
  );
  const livePlanSignature = useMemo(
    () => selectedDayEntries.map((entry) => `${entry.dayKey}:${entry.dish.id}`).join("|"),
    [selectedDayEntries],
  );
  const screenedCurrentShoppingPlan = screenedPlanState.signature === livePlanSignature
    ? screenedPlanState.plan
    : null;
  const isScreeningShoppingPlan = Boolean(currentShoppingPlan)
    && (screenedPlanState.loading || !screenedCurrentShoppingPlan);

  const visibleShoppingView = currentShoppingPlan
    ? {
        weekLabel: buildWeekLabel(weekDays),
        plan: screenedCurrentShoppingPlan || currentShoppingPlan,
        live: true,
        exportMessage,
      }
    : lockedWeek
      ? {
          weekLabel: lockedWeek.weekLabel,
          plan: lockedWeek.plan,
          live: false,
          exportMessage: lockedWeek.exportMessage || "",
        }
      : null;

  const groceryAisles = useMemo(
    () => (visibleShoppingView?.plan?.rows ? groupRowsByAisle(visibleShoppingView.plan.rows) : []),
    [visibleShoppingView],
  );

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
    window.localStorage.setItem(STORAGE_KEYS.customCodex, JSON.stringify(customCodex));
  }, [customCodex]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.dishCatalog, JSON.stringify(dishCatalog));
  }, [dishCatalog]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.generatedPools, JSON.stringify(generatedPools));
  }, [generatedPools]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.lockedWeek, JSON.stringify(lockedWeek));
  }, [lockedWeek]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.pantryCarryover, JSON.stringify(pantryCarryover));
  }, [pantryCarryover]);

  useEffect(() => {
    if (!currentShoppingPlan || !livePlanSignature) {
      setScreenedPlanState({
        signature: "",
        loading: false,
        plan: null,
        note: "",
        error: "",
      });
      return;
    }

    let cancelled = false;

    setScreenedPlanState({
      signature: livePlanSignature,
      loading: true,
      plan: null,
      note: "",
      error: "",
    });

    screenShoppingPlan(currentShoppingPlan)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setScreenedPlanState({
          signature: livePlanSignature,
          loading: false,
          plan: result.plan,
          note: result.note || "Gemini reviewed this grocery list for duplicates and odd rows.",
          error: "",
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setScreenedPlanState({
          signature: livePlanSignature,
          loading: false,
          plan: currentShoppingPlan,
          note: "",
          error: error.message || "Gemini could not review this grocery list right now.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentShoppingPlan, livePlanSignature]);

  function persistGeneratedDishes(category, dishes) {
    const sanitized = sanitizeStoredDishes(dishes);
    if (!sanitized.length) {
      return sanitized;
    }

    setCustomCodex((current) => mergeDishCatalog(current, sanitized));
    setDishCatalog((current) => mergeDishCatalog(current, sanitized));
    setGeneratedPools((current) => {
      const existingIds = current[category] || [];
      const nextIds = sanitized.map((dish) => dish.id);
      return {
        ...current,
        [category]: Array.from(new Set([...nextIds, ...existingIds])),
      };
    });

    return sanitized;
  }

  function getPoolDishes(category) {
    return (generatedPools[category] || [])
      .map((dishId) => dishLookup[dishId])
      .filter(Boolean);
  }

  async function fillDayPicker({ dayName, category, initialOptions = [], requestedCount, searchText = "" }) {
    try {
      const prompt = buildGeminiPrompt({
        category,
        dayName,
        searchText,
        biasKeywords,
        count: requestedCount,
      });
      const freshDishes = await generateSyntheticRecipeCollection(prompt, category, requestedCount);
      const savedFreshDishes = persistGeneratedDishes(category, freshDishes);
      const mergedOptions = uniqById([...initialOptions, ...savedFreshDishes]).slice(0, 20);

      setDayPicker((current) => ({
        ...current,
        loading: false,
        options: mergedOptions,
        notice: initialOptions.length
          ? `Loaded ${initialOptions.length} saved dishes and added ${Math.max(0, mergedOptions.length - initialOptions.length)} fresh ones.`
          : "20 Gemini dishes are ready.",
        error: "",
      }));
    } catch (error) {
      setDayPicker((current) => ({
        ...current,
        loading: false,
        options: initialOptions,
        error: initialOptions.length
          ? ""
          : (error.message || "Gemini Chef could not generate dishes right now."),
        notice: initialOptions.length
          ? "Showing saved dishes now. Gemini can top this category up again in a moment."
          : "",
      }));
    }
  }

  async function openDayDishPicker(dayName, category) {
    if (!category) {
      setDayPicker(createEmptyDayPicker());
      return;
    }

    const cachedOptions = getPoolDishes(category);
    const preload = cachedOptions.slice(0, 10);
    const requestedCount = preload.length >= 10 ? 10 : Math.max(20 - preload.length, 10);

    setDayPicker({
      dayName,
      category,
      options: preload,
      loading: true,
      error: "",
      searchQuery: "",
      notice: preload.length
        ? `Loaded ${preload.length} saved dishes instantly. Adding ${requestedCount} new ones...`
        : "Gemini Chef is generating 20 dishes for this category...",
    });

    await fillDayPicker({
      dayName,
      category,
      initialOptions: preload,
      requestedCount,
    });
  }

  function handleDaySelection(dayName, category) {
    setExportMessage("");
    setWeekSelections((current) => ({ ...current, [dayName]: category }));
    setDayDishSelections((current) => {
      const next = { ...current };
      delete next[dayName];
      return next;
    });

    if (category) {
      openDayDishPicker(dayName, category);
    } else {
      setDayPicker(createEmptyDayPicker());
    }
  }

  function applyDayDishSelection(dayName, dish) {
    persistGeneratedDishes(dish.category || dayPicker.category, [dish]);
    setDayDishSelections((current) => ({ ...current, [dayName]: dish.id }));
    setDayPicker(createEmptyDayPicker());
  }

  function clearDayDishSelection(dayName) {
    setDayDishSelections((current) => {
      const next = { ...current };
      delete next[dayName];
      return next;
    });
  }

  function resetWeek() {
    setWeekSelections(getDefaultWeekSelections());
    setDayDishSelections({});
    setDayPicker(createEmptyDayPicker());
    setExportMessage("");
  }

  async function curateSearch() {
    if (!dayPicker.dayName || !dayPicker.category || !dayPicker.searchQuery.trim()) {
      return;
    }

    setDayPicker((current) => ({
      ...current,
      loading: true,
      error: "",
      notice: "Gemini Chef is curating 20 dishes from your search...",
      options: [],
    }));

    await fillDayPicker({
      dayName: dayPicker.dayName,
      category: dayPicker.category,
      initialOptions: [],
      requestedCount: 20,
      searchText: dayPicker.searchQuery,
    });
  }

  async function handleGoShop() {
    const finalPlan = screenedCurrentShoppingPlan || currentShoppingPlan;

    if (!finalPlan || !selectedDayEntries.length || isScreeningShoppingPlan) {
      return;
    }

    const confirmed = window.confirm("ARE YOU SURE?");
    if (!confirmed) {
      return;
    }

    const weekLabel = buildWeekLabel(weekDays);
    const payload = buildGoogleSheetPayload(finalPlan, {
      linkedSheetUrl: SHEET_URL,
      sheetName: buildSheetName(weekDays),
      weekLabel,
      generatedAt: new Date().toISOString(),
      selectedDishes: selectedDayEntries.map(({ dayName, dish }) => ({
        dayName,
        name: dish.name,
        category: dish.category,
        calories: estimateDishCalories(dish),
      })),
    });

    let nextExportMessage = "Google Sheet export skipped because no Apps Script URL is configured.";

    try {
      const exportResult = await pushShoppingPlanToGoogleSheet(payload);
      if (exportResult?.ok) {
        nextExportMessage = `Google Sheet updated: ${payload.sheetName}`;
      } else if (exportResult?.reason) {
        nextExportMessage = exportResult.reason;
      }
    } catch (error) {
      nextExportMessage = error.message || "Google Sheet export failed.";
    }

    try {
      const reviewedCarryover = await screenPantryCarryover(finalPlan.inventoryRows);
      setPantryCarryover(reviewedCarryover);
    } catch {
      setPantryCarryover([]);
    }

    setLockedWeek({
      id: `${Date.now()}`,
      weekLabel,
      createdAt: new Date().toISOString(),
      exportMessage: nextExportMessage,
      plan: finalPlan,
      entries: selectedDayEntries.map((entry) => ({
        dayName: entry.dayName,
        shortDate: entry.shortDate,
        category: entry.category,
        dish: entry.dish,
      })),
    });
    setExportMessage(nextExportMessage);
    setWeekSelections(getDefaultWeekSelections());
    setDayDishSelections({});
    setDayPicker(createEmptyDayPicker());
    setActiveTab("recipes");
  }

  function renderPlannerTab() {
    return (
      <div className="workspace single-column-layout">
        <section className="main-column">
          <section className="panel planner-hero-panel">
            <div className="planner-hero-copy">
              <div className="eyebrow">Fresh week, simple choices</div>
              <h2>Build a colorful week of dinners that feels healthy, easy, and fun.</h2>
              <p className="summary-copy">
                Pick the dish type for each day, then let Gemini Chef fill in polished ideas with fresh ingredients and a lighter, produce-forward feel.
              </p>
            </div>
            <IngredientRibbon items={PLANNER_INGREDIENTS} tone="produce" />
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Weekly calendar</div>
                <h2>Pick one dish type per day, then choose the exact recipe</h2>
              </div>
              <button className="text-button" onClick={resetWeek}>
                Reset week
              </button>
            </div>

            <div className="day-grid">
              {weekDays.map((day) => {
                const category = weekSelections[day.key];
                const dish = dishLookup[dayDishSelections[day.key]];

                return (
                  <article key={day.key} className="day-card">
                    <span className="day-name">{day.dayName}</span>
                    <strong className="day-date">{day.shortDate}</strong>
                    <label className="sr-only" htmlFor={`day-${day.key}`}>
                      {day.fullDate}
                    </label>
                    <select
                      id={`day-${day.key}`}
                      value={category}
                      onChange={(event) => handleDaySelection(day.key, event.target.value)}
                    >
                      <option value="">Pick a dish type</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {category ? (
                      <div className="day-selection-block">
                        <span className="chip chip-primary">{CATEGORY_LABELS[category]}</span>
                        {dish ? (
                          <div className="day-picked-card crisp-card">
                            <strong className="day-picked-title">{dish.name}</strong>
                            <div className="day-picked-stats">
                              <div>
                                <span>Time</span>
                                <strong>{dish.time} min</strong>
                              </div>
                              <div>
                                <span>Calories</span>
                                <strong>{formatCalories(estimateDishCalories(dish))}</strong>
                              </div>
                            </div>
                            <div className="mini-action-row">
                              <button className="mini-button" onClick={() => openDayDishPicker(day.key, category)}>
                                Change
                              </button>
                              <button className="mini-button" onClick={() => clearDayDishSelection(day.key)}>
                                Clear
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="action-button wide" onClick={() => openDayDishPicker(day.key, category)}>
                            Choose dish
                          </button>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel compact-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">This week</div>
                <h2>{selectedDayEntries.length ? "Chosen dishes" : "Nothing chosen yet"}</h2>
              </div>
              <span className="chip">{searchableDishLibrary.length} Gemini dishes saved</span>
            </div>

            {selectedDayEntries.length ? (
              <>
                <div className="selected-dishes-list">
                  {selectedDayEntries.map((entry) => (
                    <div key={`${entry.dayKey}-${entry.dish.id}`} className="selected-dish-row">
                      <div>
                        <strong>{entry.dayName}</strong>
                        <p>{entry.dish.name}</p>
                      </div>
                      <div className="selected-dish-meta">
                        <span>{CATEGORY_LABELS[entry.category]}</span>
                        <span>{entry.dish.time} min</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="hero-shop-button" onClick={() => setActiveTab("groceries")}>
                  <span>GO SHOP</span>
                  <small>Open the sorted grocery list for this week.</small>
                </button>
              </>
            ) : (
              <p className="empty-copy">
                Choose dish types above and Gemini will remember what it already generated, so repeat categories load much faster.
              </p>
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderRecipesTab() {
    return (
      <div className="workspace single-column-layout">
        <section className="main-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Recipes</div>
                <h2>{lockedWeek ? `${lockedWeek.weekLabel} cooking recipes` : "Recipes are saved here after Go Shop"}</h2>
              </div>
              {lockedWeek ? <span className="chip">{new Date(lockedWeek.createdAt).toLocaleDateString("en-US")}</span> : null}
            </div>

            <IngredientRibbon items={HEADER_INGREDIENTS} tone="garden" />

            {lockedWeek?.entries?.length ? (
              <div className="recipe-grid">
                {lockedWeek.entries.map((entry) => (
                  <article key={`${entry.dayName}-${entry.dish.id}`} className={`recipe-card ${entry.dish.meta?.isAI ? "recipe-card-ai" : ""}`}>
                    <div className="recipe-card-head">
                      <div>
                        <span className="recipe-day">{entry.dayName} • {entry.shortDate}</span>
                        <h3>{entry.dish.name}</h3>
                      </div>
                      <div className="recipe-meta">
                        <span className="chip chip-primary">{CATEGORY_LABELS[entry.category]}</span>
                        <span className="chip">{entry.dish.time} min</span>
                        <span className="chip">{formatCalories(estimateDishCalories(entry.dish))} cal</span>
                      </div>
                    </div>

                    <div className="recipe-columns">
                      <div className="recipe-block">
                        <strong>Ingredients</strong>
                        <ul className="recipe-ingredient-list">
                          {(entry.dish.ingredients || []).map((ingredient, index) => (
                            <li key={`${entry.dish.id}-ingredient-${index}`}>{formatIngredientDisplay(ingredient)}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="recipe-block">
                        <strong>Cooking snapshot</strong>
                        <div className="recipe-facts">
                          <div>
                            <span>Difficulty</span>
                            <strong>{getDifficultyLabel(entry.dish.time)}</strong>
                          </div>
                          <div>
                            <span>Source</span>
                            <strong>{(entry.dish.sources || [])[0] || "Gemini Chef"}</strong>
                          </div>
                          <div>
                            <span>Tags</span>
                            <strong>{(entry.dish.tags || []).slice(0, 4).join(", ") || "Chef curated"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="recipe-block">
                      <strong>Instructions</strong>
                      {(entry.dish.instructions || []).length ? (
                        <ol className="recipe-instruction-list">
                          {entry.dish.instructions.map((step, index) => (
                            <li key={`${entry.dish.id}-step-${index}`}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="empty-copy">No instructions available for this recipe.</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Pick dishes in <strong>Dish Selection</strong>, then click <strong>GO SHOP</strong>. Once you lock the week, the cooking recipes stay here.
              </p>
            )}
          </section>
        </section>
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
                <div className="eyebrow">Grocery list</div>
                <h2>{visibleShoppingView ? visibleShoppingView.weekLabel : "Sorted by store layout"}</h2>
              </div>
              {visibleShoppingView?.plan ? <strong>{formatCurrency(visibleShoppingView.plan.recommendedStore.estimatedTotal)}</strong> : null}
            </div>

            <IngredientRibbon items={HEADER_INGREDIENTS} tone="citrus" />

            {visibleShoppingView?.plan ? (
              <>
                <div className="sheet-summary grocery-summary">
                  <div>
                    <span>Store</span>
                    <strong>{visibleShoppingView.plan.recommendedStore.name}</strong>
                  </div>
                  <div>
                    <span>Expected total</span>
                    <strong>{formatCurrency(visibleShoppingView.plan.recommendedStore.estimatedTotal)}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{visibleShoppingView.live ? "Current week" : "Most recent shop"}</strong>
                  </div>
                </div>

                <p className="summary-copy">{visibleShoppingView.plan.recommendedStore.reason}</p>
                {visibleShoppingView.live && isScreeningShoppingPlan ? (
                  <p className="summary-copy subtle">Gemini is screening this grocery list for duplicates and anomalies before you publish it.</p>
                ) : null}
                {visibleShoppingView.live && screenedPlanState.note ? (
                  <p className="summary-copy subtle">{screenedPlanState.note}</p>
                ) : null}
                {visibleShoppingView.live && screenedPlanState.error ? (
                  <p className="summary-copy subtle">{screenedPlanState.error}</p>
                ) : null}
                {!visibleShoppingView.live && pantryCarryover.length ? (
                  <p className="summary-copy subtle">
                    Pantry memory kept {pantryCarryover.length} durable leftovers from your last shop for future planning.
                  </p>
                ) : null}

                <div className="grocery-aisle-list">
                  {groceryAisles.map((section) => (
                    <section key={section.aisle} className="aisle-card">
                      <div className="aisle-head">
                        <strong>{section.aisle}</strong>
                        <span>{section.items.length} items</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Ingredient</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Dish</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.items.map((row) => (
                              <tr key={`${row.ingredientId || row.ingredient}-${row.qty}`}>
                                <td>{row.ingredient}</td>
                                <td>{row.qty}</td>
                                <td>{formatCurrency(row.expectedPrice)}</td>
                                <td>{row.dishUsedIn}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>

                {visibleShoppingView.live ? (
                  <div className="side-actions compact-actions">
                    <button className="action-button wide" onClick={handleGoShop} disabled={isScreeningShoppingPlan}>
                      {isScreeningShoppingPlan ? "Checking list..." : "GO SHOP"}
                    </button>
                  </div>
                ) : null}

                {visibleShoppingView.exportMessage ? (
                  <p className="summary-copy subtle">{visibleShoppingView.exportMessage}</p>
                ) : null}
              </>
            ) : (
              <p className="empty-copy">
                Once you choose dishes in <strong>Dish Selection</strong>, your grocery list will appear here in store-style order.
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
            <button className="text-button" onClick={() => setDayPicker(createEmptyDayPicker())}>
              Close
            </button>
          </div>

          <div className="chef-search-bar">
            <div className="chef-search-copy">
              <span className="eyebrow">Gemini Chef</span>
              <strong>Type an ingredient, vibe, or craving</strong>
            </div>
            <div className="chef-fallback-controls">
              <input
                className="table-input chef-prompt-input"
                type="text"
                placeholder="spring chicken salad with herbs"
                value={dayPicker.searchQuery}
                onChange={(event) => setDayPicker((current) => ({ ...current, searchQuery: event.target.value }))}
              />
              <button className="action-button" onClick={curateSearch} disabled={dayPicker.loading}>
                {dayPicker.loading ? "Curating..." : "Curate 20"}
              </button>
            </div>
            {dayPicker.notice ? <p className="picker-note">{dayPicker.notice}</p> : null}
            {dayPicker.error ? <p className="empty-copy">{dayPicker.error}</p> : null}
          </div>

          {dayPicker.options.length ? (
            <div className="modal-option-list compact-option-list">
              {dayPicker.options.map((dish) => (
                <div key={`${dayPicker.dayName}-${dish.id}`} className={`modal-option-card ${dish.meta?.isAI ? "modal-option-card-ai" : ""}`}>
                  <div className="modal-option-copy">
                    <strong>{dish.name}</strong>
                    <p>{CATEGORY_LABELS[dish.category]} • {dish.time} min • {formatCalories(estimateDishCalories(dish))} cal</p>
                  </div>
                  <button className="action-button" onClick={() => applyDayDishSelection(dayPicker.dayName, dish)}>
                    Select
                  </button>
                </div>
              ))}
            </div>
          ) : dayPicker.loading ? (
            <p className="empty-copy">Gemini Chef is building dish options now...</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="site-header simple-header">
        <div className="brand-block">
          <span className="brand-mark">Dish<br />Radar</span>
          <p>Fresh weekly dish picking, cooking recipes, and a cleaner grocery flow.</p>
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
      </header>

      <main className="content-shell">
        {activeTab === "planner" ? renderPlannerTab() : null}
        {activeTab === "recipes" ? renderRecipesTab() : null}
        {activeTab === "groceries" ? renderGroceriesTab() : null}
      </main>

      {renderDayPickerModal()}
    </div>
  );
}

export default App;
