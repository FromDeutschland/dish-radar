#!/usr/bin/env python3

import csv
import json
import re
import sys
import zipfile
from pathlib import Path


CURATED_RECIPES = {
    "Black Bean, Corn, and Tomato Salad": "salads-veggie-bowls",
    "Thai Citrus Chicken Salad": "salads-veggie-bowls",
    "BBQ Ranchero Chicken Salad": "salads-veggie-bowls",
    "Greek Mushroom Salad": "salads-veggie-bowls",
    "Cheesy Stuffed Acorn Squash": "salads-veggie-bowls",
    "Chicken Breasts Lombardi": "balanced-plate",
    "Thai Chicken Curry": "balanced-plate",
    "Curry Chicken": "balanced-plate",
    "Lemon Chicken": "balanced-plate",
    "Crunchy Oven Fried Fish": "balanced-plate",
    "Thai Chicken Noodles": "pasta-noodles",
    "Fat-Free Fettuccine Alfredo": "pasta-noodles",
    "Yummy and Comforting Chicken Tetrazzini": "pasta-noodles",
    "Orzo / Tomato Salad with Feta and Olives": "pasta-noodles",
    "Shrimp Linguine": "pasta-noodles",
    "Cheeseburger Casserole": "one-pot",
    "Chicken Fried Brown Rice": "one-pot",
    "Low-Fat Cauliflower Tomato Casserole": "one-pot",
    "Taco Rice": "one-pot",
    "Ground Beef Stuffed Green Bell Peppers II - Oven or Crock Pot": "one-pot",
    "Chicken Caesar Wraps": "handhelds-casual",
    "Best Hamburger Diane": "handhelds-casual",
    "Leek, Tomato, Goat Cheese Pizza": "handhelds-casual",
    "Chicken Quesadillas": "handhelds-casual",
    "Barbecue Chicken Pizza": "handhelds-casual",
    "Cabbage Soup": "soups-stews-chilis",
    "Chinese Hot and Sour Pork Soup": "soups-stews-chilis",
    "Crab Bisque Chincoteague": "soups-stews-chilis",
    "Fish Chowder": "soups-stews-chilis",
    "Corn and Potato Chowder": "soups-stews-chilis",
}

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


def parse_r_list(value):
    if not value or value == "NA":
        return []
    return [match.replace('\\"', '"').strip() for match in re.findall(r'"((?:[^"\\]|\\.)*)"', value)]


def parse_minutes(value):
    if not value or value == "NA":
        return None

    match = re.match(r"P(?:([0-9]+)D)?T?(?:([0-9]+)H)?(?:([0-9]+)M)?", value)
    if not match:
        return None

    days, hours, minutes = [int(part or 0) for part in match.groups()]
    total = (days * 1440) + (hours * 60) + minutes
    return total or None


def slugify(text):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))


def infer_ingredient_category(name):
    value = name.lower()

    seafood_tokens = ["shrimp", "crab", "cod", "fish", "salmon", "tuna"]
    protein_tokens = [
        "chicken",
        "beef",
        "pork",
        "turkey",
        "sausage",
        "meatball",
        "corned beef",
    ]
    dairy_tokens = [
        "cheese",
        "milk",
        "cream",
        "yogurt",
        "butter",
        "parmesan",
        "feta",
        "goat cheese",
        "colby",
        "swiss",
    ]
    bakery_tokens = ["tortilla", "pizza crust", "bread", "bun", "roll", "pita", "loaf"]
    frozen_tokens = ["frozen"]
    produce_tokens = [
        "onion",
        "tomato",
        "pepper",
        "cabbage",
        "carrot",
        "celery",
        "mushroom",
        "squash",
        "corn",
        "potato",
        "lime",
        "lemon",
        "orange",
        "cilantro",
        "parsley",
        "dill",
        "scallion",
        "leek",
        "garlic",
        "ginger",
        "green onion",
        "zucchini",
    ]
    specialty_tokens = [
        "sauce",
        "vinegar",
        "mustard",
        "mayo",
        "mayonnaise",
        "worcestershire",
        "paprika",
        "cumin",
        "oregano",
        "curry",
        "soy",
        "broth",
        "chili",
        "sherry",
        "wine",
        "pepper",
        "salt",
    ]
    pantry_tokens = [
        "rice",
        "pasta",
        "linguine",
        "fettuccine",
        "flour",
        "cornmeal",
        "bean",
        "tomato juice",
        "tomato paste",
        "tomato",
        "olive oil",
        "oil",
        "water chestnut",
        "bamboo shoot",
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
    value = name.lower()

    if category in {"protein", "seafood"}:
        return "lb"
    if category == "produce":
        if any(token in value for token in ["cilantro", "parsley", "dill", "scallion", "green onion", "leek"]):
            return "bunch"
        if any(token in value for token in ["cabbage", "squash"]):
            return "head"
        return "piece"
    if category == "dairy":
        if any(token in value for token in ["milk", "cream", "yogurt"]):
            return "tub"
        return "pack"
    if category == "bakery":
        return "pack"
    if category == "specialty":
        if any(token in value for token in ["salt", "pepper", "paprika", "cumin", "oregano", "curry"]):
            return "jar"
        return "bottle"
    if category == "frozen":
        return "bag"
    if any(token in value for token in ["bean", "tomato", "bamboo shoot", "water chestnut"]):
        return "can"
    if any(token in value for token in ["rice", "pasta", "linguine", "fettuccine", "flour", "cornmeal"]):
        return "box"
    return "box"


def parse_amount(quantity_text, category):
    if not quantity_text or quantity_text == "NA":
        return 2 if category in {"protein", "seafood"} else 1

    match = re.search(r"([0-9]+(?:/[0-9]+)?(?:\.[0-9]+)?)", quantity_text)
    if not match:
        return 2 if category in {"protein", "seafood"} else 1

    raw = match.group(1)
    if "/" in raw:
        numerator, denominator = raw.split("/", 1)
        quantity = float(numerator) / float(denominator)
    else:
        quantity = float(raw)

    if category in {"protein", "seafood"}:
        return max(1, min(2, round(quantity)))
    if category == "produce":
        return max(1, min(4, round(quantity) or 1))
    return max(1, min(2, round(quantity) or 1))


def derive_tags(category, name, keywords, minutes):
    text = f"{name} {' '.join(keywords)}".lower()
    tags = list(CATEGORY_DEFAULT_TAGS[category])

    if minutes <= 20:
        tags.append("quick")
    if any(token in text for token in ["spicy", "chili", "curry", "pepper"]):
        tags.append("spicy")
    if "salad" in text:
        tags.append("salad")
    if any(token in text for token in ["chicken", "beef", "pork", "shrimp", "fish", "crab"]):
        tags.append("protein")

    deduped = []
    for tag in tags:
        if tag not in deduped:
            deduped.append(tag)
    return deduped[:4]


def build_ingredients(parts, quantities):
    items = []
    for index, part in enumerate(parts[:6]):
        category = infer_ingredient_category(part)
        items.append(
            {
                "name": part.strip(),
                "amount": parse_amount(quantities[index] if index < len(quantities) else "", category),
                "unit": infer_unit(category, part),
                "category": category,
                "basePrice": CATEGORY_DEFAULT_PRICE[category],
            }
        )
    return items


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: extract_archive_subset.py /path/to/archive.zip [output-path]")

    archive_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("src/archiveDishPool.js")
    found = {}

    with zipfile.ZipFile(archive_path) as archive:
        with archive.open("recipes.csv", "r") as recipe_file:
            reader = csv.DictReader((line.decode("utf-8", "replace") for line in recipe_file))

            for row in reader:
                name = row["Name"]
                category = CURATED_RECIPES.get(name)
                if not category or name in found:
                    continue

                keywords = parse_r_list(row.get("Keywords", ""))
                ingredients = parse_r_list(row.get("RecipeIngredientParts", ""))
                quantities = parse_r_list(row.get("RecipeIngredientQuantities", ""))
                minutes = parse_minutes(row.get("TotalTime")) or parse_minutes(row.get("CookTime")) or parse_minutes(row.get("PrepTime")) or 30
                rating = float(row.get("AggregatedRating") or 0)
                reviews = int(float(row.get("ReviewCount") or 0))
                effort = "easy" if minutes <= 15 else "medium" if minutes <= 30 else "hard"

                found[name] = {
                    "id": f"archive-{slugify(name)}",
                    "name": name,
                    "emoji": CATEGORY_EMOJI[category],
                    "time": minutes,
                    "effort": effort,
                    "tags": derive_tags(category, name, keywords, minutes),
                    "trendNote": f"Food.com archive favorite rated {rating:.1f}/5 across {reviews} reviews.",
                    "sources": ["Food.com", "Food.com Archive", "Recipe Dataset"],
                    "ingredients": build_ingredients(ingredients, quantities),
                    "category": category,
                    "datasetRating": rating,
                    "datasetReviewCount": reviews,
                }

                if len(found) == len(CURATED_RECIPES):
                    break

    missing = sorted(set(CURATED_RECIPES) - set(found))
    if missing:
        raise SystemExit(f"Missing curated recipes in archive: {', '.join(missing)}")

    ordered = [found[name] for name in CURATED_RECIPES]
    payload = json.dumps(ordered, indent=2, ensure_ascii=True)

    output_path.write_text(
        "export const ARCHIVE_DISH_POOL = " + payload + ";\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(ordered)} archive recipes to {output_path}")


if __name__ == "__main__":
    main()
