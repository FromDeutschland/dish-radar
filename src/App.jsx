import { useEffect, useState } from "react";
import { DISH_POOL } from "./mockDishPool";
import {
  createShoppingPlan,
  estimateDishCalories,
  formatCalories,
  formatCurrency,
} from "./storeLogic";

const STORAGE_KEYS = {
  activeTab: "dish-radar.active-tab",
  deckIds: "dish-radar.deck-ids",
  pantryItems: "dish-radar.pantry-items",
  weekSelections: "dish-radar.week-selections",
  wishlistIds: "dish-radar.wishlist-ids",
};

const TABS = [
  { value: "planner", label: "Dish Planner" },
  { value: "groceries", label: "Grocery List" },
  { value: "pantry", label: "Pantry" },
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
  { value: "empty", label: "Out / discard" },
];

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

function buildDeck(weekSelections) {
  const selectedCategories = getSelectedCategories(weekSelections);
  const matching = selectedCategories.length
    ? DISH_POOL.filter((dish) => selectedCategories.includes(DISH_CATEGORY_MAP[dish.id]))
    : DISH_POOL;
  const fallback = DISH_POOL.filter((dish) => !matching.some((match) => match.id === dish.id));
  const ordered = [...shuffle(matching), ...shuffle(fallback)];
  return ordered.slice(0, 30).map((dish) => dish.id);
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

function Badge({ children, tone = "olive" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function DishListItem({ dish, saved, onToggle }) {
  const calories = estimateDishCalories(dish);

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
          <Badge>{dish.effort}</Badge>
          <span className="chip chip-primary">{CATEGORY_LABELS[DISH_CATEGORY_MAP[dish.id]]}</span>
          <span className="chip">{formatCalories(calories)} cal est.</span>
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

function App() {
  const [activeTab, setActiveTab] = useState(() => safeRead(STORAGE_KEYS.activeTab, "planner"));
  const [weekSelections, setWeekSelections] = useState(() => getSavedWeekSelections());
  const [deckIds, setDeckIds] = useState(() => safeRead(STORAGE_KEYS.deckIds, buildDeck(getSavedWeekSelections())));
  const [wishlistIds, setWishlistIds] = useState(() => safeRead(STORAGE_KEYS.wishlistIds, []));
  const [pantryItems, setPantryItems] = useState(() => safeRead(STORAGE_KEYS.pantryItems, []));
  const [pantryDraft, setPantryDraft] = useState({ name: "", note: "", status: "extra" });

  const weekDays = getCurrentWeekDates();
  const selectedCategories = getSelectedCategories(weekSelections);
  const plannedCategoryCount = new Set(selectedCategories).size;
  const deck = deckIds.map((id) => DISH_LOOKUP[id]).filter(Boolean);
  const wishlist = wishlistIds.map((id) => DISH_LOOKUP[id]).filter(Boolean);
  const shoppingPlan = wishlist.length ? createShoppingPlan(wishlist) : null;
  const pantryLookup = new Map(
    pantryItems.map((item) => [normalizeIngredient(item.name), item]),
  );
  const groceryRows = shoppingPlan
    ? shoppingPlan.rows.map((row) => {
        const pantryMatch = pantryLookup.get(normalizeIngredient(row.ingredient));
        let pantryFlag = "Buy";

        if (pantryMatch?.status === "extra") {
          pantryFlag = "Check pantry";
        } else if (pantryMatch?.status === "low") {
          pantryFlag = "Probably need more";
        } else if (pantryMatch?.status === "empty") {
          pantryFlag = "Buy fresh";
        }

        return {
          ...row,
          pantryFlag,
          pantryNote: pantryMatch?.note ?? "",
        };
      })
    : [];

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
    window.localStorage.setItem(STORAGE_KEYS.pantryItems, JSON.stringify(pantryItems));
  }, [pantryItems]);

  function refreshDeck(nextSelections = weekSelections) {
    setDeckIds(buildDeck(nextSelections));
  }

  function handleDaySelection(dayName, nextCategory) {
    const nextSelections = { ...weekSelections, [dayName]: nextCategory };
    setWeekSelections(nextSelections);
    setDeckIds(buildDeck(nextSelections));
  }

  function clearWeekSelections() {
    const cleared = getDefaultWeekSelections();
    setWeekSelections(cleared);
    setDeckIds(buildDeck(cleared));
  }

  function toggleWishlist(dishId) {
    setWishlistIds((current) => (
      current.includes(dishId)
        ? current.filter((id) => id !== dishId)
        : [...current, dishId]
    ));
  }

  function addPantryItem(event) {
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

    setPantryItems((current) => [item, ...current]);
    setPantryDraft({ name: "", note: "", status: "extra" });
  }

  function removePantryItem(itemId) {
    setPantryItems((current) => current.filter((item) => item.id !== itemId));
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
                <span>{selectedCategories.length ? "The dish list updates around your meal-type picks." : "Leave it open to browse all dish ideas."}</span>
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
                ? `Your current dish list is tuned to: ${[...new Set(selectedCategories)].map((category) => CATEGORY_LABELS[category]).join(", ")}.`
                : "Choose one or more meal types above, or leave the week blank to browse everything fun."}
            </p>
          </div>

          <section className="dish-list-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Dish ideas</div>
                <h2>Potential dishes for the selected week</h2>
              </div>
            </div>
            <ul className="dish-list">
              {deck.map((dish) => (
                <DishListItem
                  key={dish.id}
                  dish={dish}
                  saved={wishlistIds.includes(dish.id)}
                  onToggle={toggleWishlist}
                />
              ))}
            </ul>
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
                Save dishes from the list, then switch to <strong>Grocery List</strong> to see the combined ingredients.
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
                <div className="eyebrow">Grocery list</div>
                <h2>Everything to buy for the saved dishes</h2>
              </div>
              {shoppingPlan ? <strong>{formatCurrency(shoppingPlan.recommendedStore.estimatedTotal)}</strong> : null}
            </div>

            {shoppingPlan ? (
              <>
                <div className="sheet-summary grocery-summary">
                  <div>
                    <span>Store recommended</span>
                    <strong>{shoppingPlan.recommendedStore.name}</strong>
                  </div>
                  <div>
                    <span>Expected grocery cost</span>
                    <strong>{formatCurrency(shoppingPlan.recommendedStore.estimatedTotal)}</strong>
                  </div>
                  <div>
                    <span>Pantry-linked items</span>
                    <strong>{groceryRows.filter((row) => row.pantryFlag === "Check pantry").length}</strong>
                  </div>
                </div>

                <p className="summary-copy">{shoppingPlan.recommendedStore.reason}</p>
                <p className="summary-copy subtle">{shoppingPlan.recommendedStore.tradeoff}</p>

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
                      {groceryRows.map((row) => (
                        <tr key={`${row.ingredient}-${row.qty}`}>
                          <td>{row.ingredient}</td>
                          <td>{row.qty}</td>
                          <td>{formatCurrency(row.expectedPrice)}</td>
                          <td>{row.dishUsedIn}</td>
                          <td>
                            <span className={`flag-pill ${row.pantryFlag === "Check pantry" ? "flag-check" : row.pantryFlag === "Probably need more" ? "flag-low" : "flag-buy"}`}>
                              {row.pantryFlag}
                            </span>
                            {row.pantryNote ? <p className="table-note">{row.pantryNote}</p> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="empty-copy">
                Add dishes in <strong>Dish Planner</strong> and the grocery tab will automatically build your ingredient list here.
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
                <div className="eyebrow">Pantry</div>
                <h2>Track leftovers and staples you might still have</h2>
              </div>
            </div>

            <form className="pantry-form" onSubmit={addPantryItem}>
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
          </section>
        </section>

        <aside className="side-column">
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Stored items</div>
                <h2>{pantryItems.length} pantry entries</h2>
              </div>
            </div>

            {pantryItems.length ? (
              <div className="wishlist-list">
                {pantryItems.map((item) => (
                  <div key={item.id} className="wishlist-item pantry-item">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="pantry-meta">
                        <PantryStatusBadge status={item.status} />
                      </div>
                      {item.note ? <p>{item.note}</p> : null}
                    </div>
                    <button className="mini-button" onClick={() => removePantryItem(item.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">
                Add pantry items like honey, peanut butter, sauces, or spices here. Matching grocery items will be flagged for a pantry check.
              </p>
            )}
          </section>
        </aside>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="hero-panel">
        <div className="eyebrow">Dish Radar</div>
        <div className="hero-grid">
          <div>
            <h1>Plan meals, track what to buy, and keep pantry leftovers in the same app.</h1>
            <p className="hero-copy">
              The app now works as three connected spaces: pick dishes in the planner, see the combined ingredient list in groceries,
              and track leftover pantry items so the grocery list can warn you to check at home first.
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <span>Days planned</span>
              <strong>{selectedCategories.length} of 7</strong>
            </div>
            <div className="stat-card">
              <span>Wishlist</span>
              <strong>{wishlist.length} dishes</strong>
            </div>
            <div className="stat-card">
              <span>Pantry items</span>
              <strong>{pantryItems.length}</strong>
            </div>
          </div>
        </div>
      </header>

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
    </div>
  );
}

export default App;
