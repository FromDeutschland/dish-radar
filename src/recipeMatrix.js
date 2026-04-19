const CATEGORY_MATRIX = {
  "salads-veggie-bowls": [
    {
      id: "sesame-crunch",
      label: "Sesame Crunch",
      timeDelta: 0,
      tags: ["crunchy", "fresh"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "sesame ginger dressing", amount: 1, unit: "bottle", category: "specialty", basePrice: 5.3 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "cabbage slaw", amount: 1, unit: "bag", category: "produce", basePrice: 2.9 },
        },
      ],
    },
    {
      id: "harissa-feta",
      label: "Harissa Feta",
      timeDelta: 5,
      tags: ["spicy", "veg"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "harissa dressing", amount: 1, unit: "bottle", category: "specialty", basePrice: 5.4 },
        },
        {
          match: (ingredient) => ingredient.category === "dairy",
          ingredient: { name: "feta", amount: 1, unit: "tub", category: "dairy", basePrice: 4.9 },
        },
      ],
    },
  ],
  "balanced-plate": [
    {
      id: "lemon-herb",
      label: "Lemon Herb",
      timeDelta: 0,
      tags: ["bright", "protein"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "lemon herb sauce", amount: 1, unit: "bottle", category: "specialty", basePrice: 4.9 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "baby potatoes", amount: 2, unit: "bag", category: "produce", basePrice: 3.7 },
        },
      ],
    },
    {
      id: "gochujang-glaze",
      label: "Gochujang Glaze",
      timeDelta: 5,
      tags: ["spicy", "protein"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "gochujang glaze", amount: 1, unit: "bottle", category: "specialty", basePrice: 5.7 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "cucumbers", amount: 2, unit: "piece", category: "produce", basePrice: 1.2 },
        },
      ],
    },
  ],
  "pasta-noodles": [
    {
      id: "roasted-red-pepper",
      label: "Roasted Red Pepper",
      timeDelta: 0,
      tags: ["cozy", "veg"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "roasted red pepper sauce", amount: 1, unit: "jar", category: "specialty", basePrice: 5.1 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "baby spinach", amount: 1, unit: "bag", category: "produce", basePrice: 2.8 },
        },
      ],
    },
    {
      id: "chili-crisp-greens",
      label: "Chili Crisp Greens",
      timeDelta: 5,
      tags: ["spicy", "cozy"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "chili crisp", amount: 1, unit: "jar", category: "specialty", basePrice: 6.4 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "broccoli florets", amount: 2, unit: "bag", category: "produce", basePrice: 3.3 },
        },
      ],
    },
  ],
  "one-pot": [
    {
      id: "tomato-basil",
      label: "Tomato Basil",
      timeDelta: 0,
      tags: ["cozy", "weeknight"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "tomato basil sauce", amount: 1, unit: "jar", category: "specialty", basePrice: 4.9 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "basil", amount: 1, unit: "bunch", category: "produce", basePrice: 2.1 },
        },
      ],
    },
    {
      id: "green-chile",
      label: "Green Chile",
      timeDelta: 5,
      tags: ["spicy", "cozy"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "green chile sauce", amount: 1, unit: "jar", category: "specialty", basePrice: 4.8 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "jalapenos", amount: 2, unit: "piece", category: "produce", basePrice: 0.7 },
        },
      ],
    },
  ],
  "handhelds-casual": [
    {
      id: "chipotle-crunch",
      label: "Chipotle Crunch",
      timeDelta: 0,
      tags: ["spicy", "casual"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "chipotle crema", amount: 1, unit: "bottle", category: "specialty", basePrice: 4.9 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "cabbage slaw", amount: 1, unit: "bag", category: "produce", basePrice: 2.9 },
        },
      ],
    },
    {
      id: "greek-street",
      label: "Greek Street",
      timeDelta: 5,
      tags: ["fresh", "casual"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "tzatziki", amount: 1, unit: "tub", category: "dairy", basePrice: 4.8 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "cucumbers", amount: 2, unit: "piece", category: "produce", basePrice: 1.2 },
        },
      ],
    },
  ],
  "soups-stews-chilis": [
    {
      id: "coconut-lime",
      label: "Coconut Lime",
      timeDelta: 5,
      tags: ["brothy", "bright"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "specialty",
          ingredient: { name: "red curry paste", amount: 1, unit: "jar", category: "specialty", basePrice: 5.2 },
        },
        {
          match: (ingredient) => ingredient.category === "pantry",
          ingredient: { name: "coconut milk", amount: 2, unit: "can", category: "pantry", basePrice: 2.8 },
        },
      ],
    },
    {
      id: "white-bean",
      label: "White Bean",
      timeDelta: 0,
      tags: ["cozy", "protein"],
      replacements: [
        {
          match: (ingredient) => ingredient.category === "pantry",
          ingredient: { name: "white beans", amount: 2, unit: "can", category: "pantry", basePrice: 1.3 },
        },
        {
          match: (ingredient) => ingredient.category === "produce",
          ingredient: { name: "baby spinach", amount: 1, unit: "bag", category: "produce", basePrice: 2.8 },
        },
      ],
    },
  ],
};

function hashValue(value) {
  return value.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

function replaceIngredientSet(ingredients, replacements) {
  const nextIngredients = ingredients.map((ingredient) => ({ ...ingredient }));

  replacements.forEach((replacement) => {
    const index = nextIngredients.findIndex((ingredient) => replacement.match(ingredient));

    if (index >= 0) {
      nextIngredients[index] = { ...replacement.ingredient };
      return;
    }

    if (nextIngredients.length < 6) {
      nextIngredients.push({ ...replacement.ingredient });
    } else {
      nextIngredients[nextIngredients.length - 1] = { ...replacement.ingredient };
    }
  });

  return nextIngredients;
}

function mergeTags(baseTags, variationTags) {
  return [...new Set([...baseTags, ...variationTags])].slice(0, 5);
}

export function buildRecipeMatrixDishes(basePool, triedDishes, getDishCategory) {
  const lookup = Object.fromEntries(basePool.map((dish) => [dish.id, dish]));
  const eligibleRecords = triedDishes
    .filter((record) => record.rating >= 4)
    .sort((left, right) => right.rating - left.rating);

  const seen = new Set();
  const variations = [];

  eligibleRecords.forEach((record) => {
    const baseDish = lookup[record.dishId];

    if (!baseDish) {
      return;
    }

    const category = getDishCategory(baseDish);
    const profiles = CATEGORY_MATRIX[category] || [];

    if (!profiles.length) {
      return;
    }

    const totalVariations = record.rating >= 5 ? 2 : 1;
    const startIndex = hashValue(baseDish.id) % profiles.length;

    for (let offset = 0; offset < totalVariations; offset += 1) {
      const profile = profiles[(startIndex + offset) % profiles.length];
      const variationId = `${baseDish.id}--matrix-${profile.id}`;

      if (seen.has(variationId)) {
        continue;
      }

      seen.add(variationId);

      variations.push({
        ...baseDish,
        id: variationId,
        name: `${profile.label} ${baseDish.name}`,
        time: Math.max(10, baseDish.time + profile.timeDelta),
        tags: mergeTags(baseDish.tags, profile.tags),
        trendNote: `Built from your ${record.rating}-star rating history to keep the same vibe with fresh ingredients.`,
        sources: ["Dish Radar Matrix", ...baseDish.sources],
        ingredients: replaceIngredientSet(baseDish.ingredients, profile.replacements),
        category,
      });
    }
  });

  return variations;
}
