const GEMINI_MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const config = {
  maxDuration: 10,
};

function buildSingleSchema() {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      category: { type: "string" },
      calories: { type: "integer" },
      instructions: { type: "string" },
      ingredients: {
        type: "array",
        items: { type: "string" },
      },
      meta: {
        type: "object",
        properties: {
          isAI: { type: "boolean" },
          cuisine: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" },
          },
          prepTimeMinutes: { type: "integer" },
        },
        required: ["isAI"],
      },
    },
    required: ["name", "category", "calories", "instructions", "ingredients", "meta"],
  };
}

function buildCollectionSchema() {
  return {
    type: "object",
    properties: {
      recipes: {
        type: "array",
        items: buildSingleSchema(),
      },
    },
    required: ["recipes"],
  };
}

function buildShoppingReviewSchema() {
  return {
    type: "object",
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ingredientId: { type: "string" },
            ingredient: { type: "string" },
            qty: { type: "string" },
            expectedPrice: { type: "number" },
            dishUsedIn: { type: "string" },
            category: { type: "string" },
            aisleLabel: { type: "string" },
          },
          required: ["ingredient", "qty", "expectedPrice", "dishUsedIn", "category", "aisleLabel"],
        },
      },
      note: { type: "string" },
    },
    required: ["rows"],
  };
}

function buildPantryReviewSchema() {
  return {
    type: "object",
    properties: {
      carryover: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ingredientId: { type: "string" },
            ingredient: { type: "string" },
            amount: { type: "number" },
            unit: { type: "string" },
            category: { type: "string" },
            reason: { type: "string" },
          },
          required: ["ingredient", "amount", "unit", "category", "reason"],
        },
      },
    },
    required: ["carryover"],
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPrompt(body) {
  return `${body?.promptText || ""}`.trim();
}

async function callGeminiApi({ apiKey, promptText, schema, maxOutputTokens = 8192 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(GEMINI_MODEL_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          maxOutputTokens,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        ok: false,
        status: 408,
        data: { error: { message: "Gemini Chef exceeded the 9 second speed budget." } },
      };
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callWithRetry({ apiKey, promptText, schema, maxOutputTokens }) {
  const delays = [];
  let lastResult = null;

  for (let attempt = 0; attempt < delays.length + 1; attempt += 1) {
    const result = await callGeminiApi({ apiKey, promptText, schema, maxOutputTokens });
    lastResult = result;

    if (result.ok) {
      return result;
    }

    if (![429, 500, 503, 504].includes(result.status) || attempt === delays.length) {
      return result;
    }

    await sleep(delays[attempt]);
  }

  return lastResult;
}

function extractText(result) {
  return result?.data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
}

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    sendJson(response, 500, { error: "Gemini Chef is not configured on the server.", code: "NOT_CONFIGURED" });
    return;
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {});
  const supportedModes = new Set(["single", "collection", "shopping_review", "pantry_review"]);
  const mode = supportedModes.has(body.mode) ? body.mode : "collection";
  const promptText = readPrompt(body);

  if (!promptText) {
    sendJson(response, 400, { error: "Missing Gemini Chef prompt.", code: "MISSING_PROMPT" });
    return;
  }

  try {
    const schema = mode === "single"
      ? buildSingleSchema()
      : mode === "shopping_review"
        ? buildShoppingReviewSchema()
        : mode === "pantry_review"
          ? buildPantryReviewSchema()
          : buildCollectionSchema();
    const maxOutputTokens = mode === "collection" ? 8192 : 4096;
    const result = await callWithRetry({ apiKey, promptText, schema, maxOutputTokens });

    if (!result?.ok) {
      const upstreamMessage = result?.data?.error?.message || "";
      if (result?.status === 503) {
        sendJson(response, 503, {
          error: "Gemini Chef is briefly overloaded. Please try again in a few seconds.",
          code: "GEMINI_UNAVAILABLE",
          details: upstreamMessage,
        });
        return;
      }

      sendJson(response, result?.status || 500, {
        error: upstreamMessage || `Gemini Chef request failed (${result?.status || 500}).`,
        code: "GEMINI_UPSTREAM_ERROR",
      });
      return;
    }

    const rawText = extractText(result);
    if (!rawText) {
      sendJson(response, 502, {
        error: "Gemini Chef returned an empty response.",
        code: "EMPTY_RESPONSE",
      });
      return;
    }

    try {
      const payload = JSON.parse(rawText);
      sendJson(response, 200, payload);
    } catch {
      sendJson(response, 502, {
        error: "Gemini Chef returned invalid JSON.",
        code: "INVALID_JSON",
      });
    }
  } catch (error) {
    sendJson(response, 500, {
      error: error?.message || "Gemini Chef failed unexpectedly.",
      code: "UNEXPECTED_ERROR",
    });
  }
}
