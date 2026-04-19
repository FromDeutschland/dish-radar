#!/usr/bin/env python3

import ast
import csv
import json
import re
import shutil
import sys
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path


CATEGORY_KEYS = [
    "salads-veggie-bowls",
    "balanced-plate",
    "pasta-noodles",
    "one-pot",
    "handhelds-casual",
    "soups-stews-chilis",
]

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
    "dessert", "cake", "cookie", "cupcake", "brownie", "pie", "pudding", "muffin", "donut",
    "doughnut", "cheesecake", "ice cream", "frosting", "mithai", "sweet", "breakfast", "oats",
    "granola", "smoothie", "juice", "cocktail", "drink", "beverage", "candy", "fudge", "jam",
]

MAX_INGREDIENTS = 6
SHARD_SIZE = 2000
MAX_PER_CATEGORY = 8000


def normalize(text):
    return f"{text or ''}".strip().lower()


def slugify(text):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", normalize(text)))


def parse_listish(value):
    if value is None:
        return []

    text = value.strip()
    if not text:
        return []

    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except Exception:
        pass

    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except Exception:
        pass

    text = text.strip("[]")
    return [part.strip().strip("'").strip('"') for part in text.split(",") if part.strip()]


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
    if any(token in value for token in ["pasta", "noodle", "ramen", "linguine", "fettuccine", "spaghetti", "penne", "orzo", "mac", "udon", "tetrazzini"]):
        return "pasta-noodles"
    if any(token in value for token in ["taco", "wrap", "burger", "sandwich", "pizza", "quesadilla", "slider", "open sandwich", "toastie", "roll-up"]):
        return "handhelds-casual"
    if any(token in value for token in ["skillet", "casserole", "rice", "pot pie", "one pot", "stuffed pepper", "bake"]):
        return "one-pot"
    if any(token in value for token in ["main dish", "main course", "dinner", "chicken", "beef", "pork", "fish", "salmon", "shrimp", "turkey"]):
        return "balanced-plate"
    return None


def infer_ingredient_category(name):
    value = normalize(name)
    seafood_tokens = ["shrimp", "crab", "cod", "fish", "salmon", "tuna", "prawn"]
    protein_tokens = ["chicken", "beef", "pork", "turkey", "sausage", "meatball", "steak"]
    dairy_tokens = ["cheese", "milk", "cream", "yogurt", "butter", "parmesan", "feta", "mozzarella", "cheddar", "sour cream"]
    bakery_tokens = ["tortilla", "pizza crust", "bread", "bun", "roll", "pita", "loaf", "naan"]
    frozen_tokens = ["frozen"]
    produce_tokens = [
        "onion", "tomato", "pepper", "cabbage", "carrot", "celery", "mushroom", "squash", "corn", "potato",
        "lime", "lemon", "orange", "cilantro", "parsley", "dill", "scallion", "leek", "garlic", "ginger",
        "green onion", "zucchini", "spinach", "broccoli", "cucumber", "lettuce", "avocado", "basil", "herb",
    ]
    specialty_tokens = [
        "sauce", "vinegar", "mustard", "mayo", "mayonnaise", "worcestershire", "paprika", "cumin", "oregano",
        "curry", "broth", "stock", "chili", "wine", "salt", "pepper", "dressing", "paste", "seasoning",
        "masala", "harissa", "pesto",
    ]
    pantry_tokens = [
        "rice", "pasta", "linguine", "fettuccine", "flour", "cornmeal", "bean", "olive oil", "oil", "quinoa",
        "lentil", "orzo", "noodle", "sugar", "cereal",
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
        return "tub" if any(token in value for token in ["milk", "cream", "yogurt", "sour cream"] ) else "pack"
    if category == "bakery":
        return "pack"
    if category == "specialty":
        return "jar" if any(token in value for token in ["salt", "pepper", "paprika", "cumin", "oregano", "seasoning"]) else "bottle"
    if category == "frozen":
        return "bag"
    if any(token in value for token in ["bean", "broth", "stock", "soup"]):
        return "can"
    if any(token in value for token in ["rice", "pasta", "linguine", "fettuccine", "flour", "quinoa", "orzo", "noodle", "sugar", "cereal"]):
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


def parse_minutes_text(value):
    text = normalize(value)
    if not text or text in {"no time", "na", "n/a"}:
        return 0
    total = 0
    for amount, unit in re.findall(r"(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins|m)\b", text):
        amount = int(amount)
        total += amount * 60 if unit.startswith("h") else amount
    return total


def parse_minutes_value(value, default=30):
    if value is None:
        return default
    text = str(value).strip()
    if not text:
        return default
    if text.isdigit():
        return max(10, int(text))
    if re.fullmatch(r"\d+(\.\d+)?", text):
        return max(10, int(float(text)))
    minutes = parse_minutes_text(text)
    return minutes or default


def infer_tags(category, name, extra_text, minutes):
    text = f"{name} {extra_text}".lower()
    tags = list(CATEGORY_DEFAULT_TAGS[category])
    if minutes <= 20:
        tags.append("quick")
    if any(token in text for token in ["spicy", "chili", "curry", "pepper", "harissa", "masala"]):
        tags.append("spicy")
    if any(token in text for token in ["chicken", "beef", "pork", "shrimp", "fish", "crab", "salmon", "turkey"]):
        tags.append("protein")
    if "salad" in text or "bowl" in text:
        tags.append("salad")
    if any(token in text for token in ["fresh", "lemon", "lime", "herb", "cucumber"]):
        tags.append("fresh")
    deduped = []
    for tag in tags:
        if tag not in deduped:
            deduped.append(tag)
    return deduped[:5]


def build_ingredients(names, quantity_texts=None):
    quantity_texts = quantity_texts or []
    items = []
    for index, raw_name in enumerate(names[:MAX_INGREDIENTS]):
        name = str(raw_name).strip().strip('"').strip("'")
        if not name:
            continue
        category = infer_ingredient_category(name)
        items.append({
            "id": slugify(f"{name}-{infer_unit(category, name)}"),
            "name": name,
            "amount": parse_amount(quantity_texts[index] if index < len(quantity_texts) else "", category),
            "unit": infer_unit(category, name),
            "category": category,
            "basePrice": CATEGORY_DEFAULT_PRICE[category],
        })
    return items


def build_entry(source_key, source_label, recipe_id, name, minutes, category, ingredients, extra_text="", url="", rating=None, reviews=None):
    effort = "easy" if minutes <= 15 else "medium" if minutes <= 30 else "hard"
    return {
        "id": f"{source_key}-{recipe_id or slugify(name)}",
        "name": name,
        "emoji": CATEGORY_EMOJI[category],
        "time": minutes,
        "effort": effort,
        "tags": infer_tags(category, name, extra_text, minutes),
        "trendNote": f"{source_label} recipe option from the expanded Dish Radar database.",
        "sources": [source_label, "Dish Radar Database"],
        "ingredients": ingredients,
        "category": category,
        "url": url,
        "datasetRating": rating,
        "datasetReviewCount": reviews,
        "cuisines": [],
    }


def iter_archive_four(path):
    with zipfile.ZipFile(path) as archive:
        with archive.open("RAW_recipes.csv", "r") as recipe_file:
            reader = csv.DictReader((line.decode("utf-8", "replace") for line in recipe_file))
            for row in reader:
                name = row.get("name", "").strip()
                text = " ".join([name, row.get("description", ""), row.get("tags", "")])
                category = infer_category(text)
                if not category:
                    continue
                ingredients = parse_listish(row.get("ingredients", ""))
                if len(ingredients) < 3:
                    continue
                yield build_entry(
                    "archive4",
                    "Archive Four",
                    row.get("id", ""),
                    name,
                    parse_minutes_value(row.get("minutes"), 35),
                    category,
                    build_ingredients(ingredients),
                    extra_text=text,
                )


def iter_archive_five(path):
    with zipfile.ZipFile(path) as archive:
        with archive.open("1_Recipe_csv.csv", "r") as recipe_file:
            reader = csv.DictReader((line.decode("utf-8", "replace") for line in recipe_file))
            for row in reader:
                name = row.get("recipe_title", "").strip()
                text = " ".join([name, row.get("category", ""), row.get("subcategory", ""), row.get("description", "")])
                category = infer_category(text)
                if not category:
                    continue
                ingredients = parse_listish(row.get("ingredients", ""))
                if len(ingredients) < 3:
                    continue
                yield build_entry(
                    "archive5",
                    "Archive Five",
                    slugify(name),
                    name,
                    30,
                    category,
                    build_ingredients(ingredients),
                    extra_text=text,
                )


def iter_archive_six(path):
    with zipfile.ZipFile(path) as archive:
        with archive.open("RecipeNLG_dataset.csv", "r") as recipe_file:
            reader = csv.DictReader((line.decode("utf-8", "replace") for line in recipe_file))
            for row in reader:
                name = row.get("title", "").strip()
                text = " ".join([name, row.get("source", ""), row.get("directions", "")])
                category = infer_category(text)
                if not category:
                    continue
                ingredients = parse_listish(row.get("NER", "")) or parse_listish(row.get("ingredients", ""))
                if len(ingredients) < 3:
                    continue
                yield build_entry(
                    "archive6",
                    "Archive Six",
                    slugify(name),
                    name,
                    30,
                    category,
                    build_ingredients(ingredients),
                    extra_text=text,
                    url=row.get("link", ""),
                )


def chunked(items, size):
    for index in range(0, len(items), size):
        yield items[index:index + size]


def main():
    if len(sys.argv) != 5:
        raise SystemExit("Usage: build_static_recipe_db.py archive4.zip archive5.zip archive6.zip output-dir")

    archive4_path = Path(sys.argv[1])
    archive5_path = Path(sys.argv[2])
    archive6_path = Path(sys.argv[3])
    output_dir = Path(sys.argv[4])

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    buckets = defaultdict(list)
    seen = set()

    for iterator in (iter_archive_four(archive4_path), iter_archive_five(archive5_path), iter_archive_six(archive6_path)):
        for entry in iterator:
            name_key = (entry["category"], normalize(entry["name"]))
            if name_key in seen:
                continue
            seen.add(name_key)
            buckets[entry["category"]].append(entry)

    metadata = {
        "generatedAt": date.today().isoformat(),
        "totalDishCount": 0,
        "uniqueIngredientCount": 0,
        "categories": {},
    }
    shipped_unique_ingredients = set()

    for category in CATEGORY_KEYS:
        entries = buckets[category][:MAX_PER_CATEGORY]
        entries.sort(key=lambda item: item["name"])
        metadata["totalDishCount"] += len(entries)
        for entry in entries:
            for ingredient in entry["ingredients"]:
                shipped_unique_ingredients.add(normalize(ingredient["name"]))
        shard_names = []
        for shard_index, shard in enumerate(chunked(entries, SHARD_SIZE), start=1):
            shard_name = f"{category}-{shard_index}.json"
            (output_dir / shard_name).write_text(json.dumps(shard, ensure_ascii=True), encoding="utf-8")
            shard_names.append(shard_name)
        metadata["categories"][category] = {
            "count": len(entries),
            "shards": shard_names,
        }

    metadata["uniqueIngredientCount"] = len(shipped_unique_ingredients)

    (output_dir / "index.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=True), encoding="utf-8")
    print(f"Wrote {metadata['totalDishCount']} recipes across {len(CATEGORY_KEYS)} categories to {output_dir}")


if __name__ == "__main__":
    main()
