#!/usr/bin/env python3

import csv
import json
import re
import sys
import zipfile
from pathlib import Path


CATEGORY_EMOJI = {
    "salads-veggie-bowls": "🥗",
    "balanced-plate": "🍽️",
    "pasta-noodles": "🍝",
    "one-pot": "🍲",
    "handhelds-casual": "🌯",
    "soups-stews-chilis": "🥣",
}

CATEGORY_DEFAULT_TAGS = {
    "salads-veggie-bowls": ["fresh", "veg"],
    "balanced-plate": ["protein", "weeknight"],
    "pasta-noodles": ["cozy", "comfort"],
    "one-pot": ["cozy", "low-cleanup"],
    "handhelds-casual": ["fun", "casual"],
    "soups-stews-chilis": ["cozy", "brothy"],
}

CATEGORY_DEFAULT_PRICE = {
    "bakery": 4.4,
    "dairy": 5.2,
    "frozen": 4.8,
    "pantry": 3.4,
    "produce": 2.2,
    "protein": 6.9,
    "seafood": 10.9,
    "specialty": 5.1,
}

BAD_TOKENS = [
    "dessert",
    "cake",
    "cookie",
    "cupcake",
    "brownie",
    "pie",
    "pudding",
    "muffin",
    "donut",
    "doughnut",
    "cheesecake",
    "ice cream",
    "frosting",
    "mithai",
    "sweet",
    "breakfast",
    "oats",
    "granola",
    "smoothie",
    "juice",
    "cocktail",
    "drink",
    "beverage",
]

PER_CATEGORY_PER_SOURCE = 12
MAX_INGREDIENTS = 6


def slugify(text):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))


def normalize(text):
    return f"{text or ''}".strip().lower()


def infer_ingredient_category(name):
    value = normalize(name)

    seafood_tokens = ["shrimp", "crab", "cod", "fish", "salmon", "tuna", "prawn"]
    protein_tokens = ["chicken", "beef", "pork", "turkey", "sausage", "meatball", "steak"]
    dairy_tokens = ["cheese", "milk", "cream", "yogurt", "butter", "parmesan", "feta", "mozzarella", "cheddar"]
    bakery_tokens = ["tortilla", "pizza crust", "bread", "bun", "roll", "pita", "loaf", "naan"]
    frozen_tokens = ["frozen"]
    produce_tokens = [
        "onion", "tomato", "pepper", "cabbage", "carrot", "celery", "mushroom", "squash", "corn",
        "potato", "lime", "lemon", "orange", "cilantro", "parsley", "dill", "scallion", "leek",
        "garlic", "ginger", "green onion", "zucchini", "spinach", "broccoli", "cucumber", "lettuce",
        "avocado", "basil", "herb",
    ]
    specialty_tokens = [
        "sauce", "vinegar", "mustard", "mayo", "mayonnaise", "worcestershire", "paprika", "cumin",
        "oregano", "curry", "soy", "broth", "chili", "sherry", "wine", "salt", "pepper", "dressing",
        "paste", "seasoning", "masala", "harissa", "pesto",
    ]
    pantry_tokens = [
        "rice", "pasta", "linguine", "fettuccine", "flour", "cornmeal", "bean", "tomato juice",
        "tomato paste", "olive oil", "oil", "stock", "quinoa", "lentil", "orzo", "noodle",
    ]

    if any(token in value for token in seafood_tokens):
        return "seafood"
    if any(token in value for token in protein_tokens):
        return "protein"
    if any(token in value for token in dairy_tokens):
        return "dairy"
    if any(token in value for token in bakery_tokens):
        return "bakery"
    if any(token in value for token in frozen_tokens):
        return "frozen"
    if any(token in value for token in produce_tokens):
        return "produce"
    if any(token in value for token in specialty_tokens):
        return "specialty"
    if any(token in value for token in pantry_tokens):
        return "pantry"
    return "pantry"


def infer_unit(category, name):
    value = normalize(name)

    if category in {"protein", "seafood"}:
        return "lb"
    if category == "produce":
        if any(token in value for token in ["cilantro", "parsley", "dill", "scallion", "green onion", "leek", "basil"]):
            return "bunch"
        if any(token in value for token in ["cabbage", "squash", "lettuce"]):
            return "head"
        return "piece"
    if category == "dairy":
        if any(token in value for token in ["milk", "cream", "yogurt"]):
            return "tub"
        return "pack"
    if category == "bakery":
        return "pack"
    if category == "specialty":
        return "jar" if any(token in value for token in ["salt", "pepper", "paprika", "cumin", "oregano", "seasoning"]) else "bottle"
    if category == "frozen":
        return "bag"
    if any(token in value for token in ["bean", "tomato", "broth", "stock"]):
        return "can"
    if any(token in value for token in ["rice", "pasta", "linguine", "fettuccine", "flour", "cornmeal", "quinoa", "orzo", "noodle"]):
        return "box"
    return "box"


def parse_amount(text, category):
    value = normalize(text)
    match = re.search(r"([0-9]+(?:/[0-9]+)?(?:\.[0-9]+)?)", value)
    if not match:
        return 2 if category in {"protein", "seafood"} else 1

    raw = match.group(1)
    if "/" in raw:
        left, right = raw.split("/", 1)
        quantity = float(left) / float(right)
    else:
        quantity = float(raw)

    if category in {"protein", "seafood"}:
        return max(1, min(2, round(quantity)))
    if category == "produce":
        return max(1, min(4, round(quantity) or 1))
    return max(1, min(2, round(quantity) or 1))


def dedupe_tags(tags):
    items = []
    for tag in tags:
        if tag and tag not in items:
            items.append(tag)
    return items[:5]


def infer_tags(category, name, extra_text, minutes):
    text = f"{name} {extra_text}".lower()
    tags = list(CATEGORY_DEFAULT_TAGS[category])

    if minutes <= 20:
        tags.append("quick")
    if any(token in text for token in ["spicy", "chili", "curry", "pepper", "harissa", "masala"]):
        tags.append("spicy")
    if "salad" in text or "bowl" in text:
        tags.append("salad")
    if any(token in text for token in ["chicken", "beef", "pork", "shrimp", "fish", "crab", "salmon"]):
        tags.append("protein")
    if any(token in text for token in ["fresh", "lemon", "lime", "herb", "cucumber"]):
        tags.append("fresh")

    return dedupe_tags(tags)


def should_skip(text):
    value = normalize(text)
    return any(token in value for token in BAD_TOKENS)


def infer_category(text):
    value = normalize(text)
    if should_skip(value):
        return None
    if any(token in value for token in ["soup", "stew", "chili", "chowder", "bisque", "broth"]):
        return "soups-stews-chilis"
    if any(token in value for token in ["salad", "grain bowl", "veggie bowl", "bowl"]):
        return "salads-veggie-bowls"
    if any(token in value for token in ["pasta", "noodle", "ramen", "linguine", "fettuccine", "spaghetti", "penne", "orzo", "mac", "udon"]):
        return "pasta-noodles"
    if any(token in value for token in ["taco", "wrap", "burger", "sandwich", "pizza", "quesadilla", "slider", "open sandwich", "roll-up"]):
        return "handhelds-casual"
    if any(token in value for token in ["skillet", "casserole", "rice", "pot pie", "one pot", "stuffed pepper", "bake", "tetrazzini"]):
        return "one-pot"
    if any(token in value for token in ["main dish", "main course", "dinner", "chicken", "beef", "pork", "fish", "salmon", "shrimp"]):
        return "balanced-plate"
    return None


def to_minutes_from_text(text):
    value = normalize(text)
    if not value or value in {"no time", "na", "n/a"}:
        return 0

    total = 0
    for amount, unit in re.findall(r"(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins|m)\b", value):
        amount = int(amount)
        if unit.startswith("h"):
            total += amount * 60
        else:
            total += amount
    return total


def build_ingredients(names, quantities=None):
    quantities = quantities or []
    items = []
    for index, raw_name in enumerate(names[:MAX_INGREDIENTS]):
        name = raw_name.strip().strip('"').strip("'")
        if not name:
            continue
        category = infer_ingredient_category(name)
        quantity_text = quantities[index] if index < len(quantities) else ""
        items.append(
            {
                "name": name,
                "amount": parse_amount(quantity_text, category),
                "unit": infer_unit(category, name),
                "category": category,
                "basePrice": CATEGORY_DEFAULT_PRICE[category],
            }
        )
    return items


def build_entry(source_key, source_label, name, url, rating, reviews, minutes, category, ingredients, extra_text):
    effort = "easy" if minutes <= 15 else "medium" if minutes <= 30 else "hard"
    return {
        "id": f"{source_key}-{slugify(name)}",
        "name": name,
        "emoji": CATEGORY_EMOJI[category],
        "time": minutes,
        "effort": effort,
        "tags": infer_tags(category, name, extra_text, minutes),
        "trendNote": f"{source_label} import rated {rating:.1f}/5 across {reviews} reviews.",
        "sources": [source_label, "Imported Archive", "Recipe Dataset"],
        "ingredients": ingredients,
        "category": category,
        "datasetRating": round(rating, 2),
        "datasetReviewCount": int(reviews),
        "url": url or "",
    }


def collect_archive_one(path):
    candidates = []
    with zipfile.ZipFile(path) as archive:
        with archive.open("food_recipes.csv", "r") as recipe_file:
            reader = csv.DictReader((line.decode("utf-8", "replace") for line in recipe_file))
            for row in reader:
                name = row.get("recipe_title", "").strip()
                if not name:
                    continue
                text = " ".join([
                    name,
                    row.get("course", ""),
                    row.get("category", ""),
                    row.get("cuisine", ""),
                    row.get("description", ""),
                    row.get("tags", ""),
                ])
                category = infer_category(text)
                if not category:
                    continue
                ingredients = [part.strip() for part in row.get("ingredients", "").split("|") if part.strip()]
                if len(ingredients) < 3:
                    continue
                minutes = to_minutes_from_text(row.get("prep_time", "")) + to_minutes_from_text(row.get("cook_time", ""))
                if not minutes:
                    minutes = 30
                rating = float(row.get("rating") or 0)
                reviews = int(float(row.get("vote_count") or 0))
                score = (rating * 100) + min(reviews, 2000) * 0.02
                candidates.append({
                    "category": category,
                    "score": score,
                    "entry": build_entry(
                        "archive1",
                        "Archive One",
                        name,
                        row.get("url", ""),
                        rating,
                        reviews,
                        minutes,
                        category,
                        build_ingredients(ingredients),
                        text,
                    ),
                })
    return candidates


def collect_archive_two(path):
    candidates = []
    with zipfile.ZipFile(path) as archive:
        for member in archive.namelist():
            data = json.loads(archive.read(member))
            for row in data:
                name = row.get("name", "").strip()
                if not name:
                    continue
                text = " ".join([
                    name,
                    row.get("description", ""),
                    row.get("dish_type", ""),
                    row.get("maincategory", ""),
                    row.get("subcategory", ""),
                ])
                category = infer_category(text)
                if not category:
                    continue
                ingredients = row.get("ingredients") or []
                if len(ingredients) < 3:
                    continue
                times = row.get("times") or {}
                minutes = to_minutes_from_text(times.get("Preparation", "")) + to_minutes_from_text(times.get("Cooking", ""))
                if not minutes:
                    minutes = 25
                rating = float(row.get("rattings") or 0)
                reviews = int(float(row.get("vote_count") or 0))
                score = (rating * 100) + min(reviews, 2000) * 0.03
                candidates.append({
                    "category": category,
                    "score": score,
                    "entry": build_entry(
                        "archive2",
                        "Archive Two",
                        name,
                        row.get("url", ""),
                        rating,
                        reviews,
                        minutes,
                        category,
                        build_ingredients(ingredients),
                        text,
                    ),
                })
    return candidates


def parse_archive_three_ingredients(raw):
    value = raw.strip().strip("[]")
    if not value:
        return []
    return [part.strip().strip("'").strip('"') for part in value.split(",") if part.strip()]


def collect_archive_three(path):
    candidates = []
    with zipfile.ZipFile(path) as archive:
        with archive.open("recipes.csv", "r") as recipe_file:
            reader = csv.DictReader((line.decode("utf-8", "replace") for line in recipe_file))
            for row in reader:
                name = row.get("recipeName", "").strip()
                if not name:
                    continue
                text = " ".join([
                    name,
                    row.get("course", ""),
                    row.get("cuisine", ""),
                ])
                category = infer_category(text)
                if not category:
                    continue
                ingredients = parse_archive_three_ingredients(row.get("ingredients", ""))
                if len(ingredients) < 3:
                    continue
                minutes = max(10, int(float(row.get("totalTimeInSeconds") or 0) / 60)) if row.get("totalTimeInSeconds") else 30
                rating = float(row.get("rating") or 0)
                reviews = 0
                score = rating * 100
                candidates.append({
                    "category": category,
                    "score": score,
                    "entry": build_entry(
                        "archive3",
                        "Archive Three",
                        name,
                        "",
                        rating,
                        reviews,
                        minutes,
                        category,
                        build_ingredients(ingredients),
                        text,
                    ),
                })
    return candidates


def pick_top_per_category(candidates):
    selected = []
    seen = set()
    for category in CATEGORY_EMOJI:
        category_candidates = [item for item in candidates if item["category"] == category]
        category_candidates.sort(key=lambda item: (-item["score"], item["entry"]["name"]))

        count = 0
        for item in category_candidates:
            name_key = normalize(item["entry"]["name"])
            if name_key in seen:
                continue
            seen.add(name_key)
            selected.append(item["entry"])
            count += 1
            if count >= PER_CATEGORY_PER_SOURCE:
                break
    return selected


def main():
    if len(sys.argv) != 5:
        raise SystemExit(
            "Usage: extract_multi_archive_pool.py /path/to/archive1.zip /path/to/archive2.zip /path/to/archive3.zip output-path"
        )

    archive1 = Path(sys.argv[1])
    archive2 = Path(sys.argv[2])
    archive3 = Path(sys.argv[3])
    output_path = Path(sys.argv[4])

    combined = []
    combined.extend(pick_top_per_category(collect_archive_one(archive1)))
    combined.extend(pick_top_per_category(collect_archive_two(archive2)))
    combined.extend(pick_top_per_category(collect_archive_three(archive3)))

    payload = json.dumps(combined, indent=2, ensure_ascii=True)
    output_path.write_text(
        "export const EXPANDED_ARCHIVE_DISH_POOL = " + payload + ";\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(combined)} recipes to {output_path}")


if __name__ == "__main__":
    main()
