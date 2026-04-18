# Dish Radar Build Guide

This repo now includes a working front-end prototype for the flow you described:

1. Pull a fresh set of 30 interesting dishes.
2. Save any number of them to a wishlist.
3. Refresh the deck without losing the wishlist.
4. Click `Go shop!`.
5. Generate a one-store grocery plan with:
   - `Ingredient`
   - `Qty`
   - `Expected Price`
   - `Dish used in`
6. Push the plan into your `Grocery Shopping` Google Sheet through a free Google Apps Script web app.
7. Show dish ideas in a text-first list with estimated total calories per dish.

## Best Product Shape

The best free and shareable setup is:

- Front end: Vite + React
- Hosting: Vercel or Netlify free tier
- Sheet writeback: Google Apps Script web app
- Data store: local browser storage for v1, optional Supabase free tier later
- Trend ingest: one small serverless endpoint that fetches public recipe pages and summarizes trend signals

Why this is the right shape:

- It is cheap to run.
- It is easy to share with friends or family.
- It keeps Google Sheets as the planning artifact instead of forcing a custom admin panel.
- It avoids building around brittle scraping that can break every few weeks.

## Source Strategy That Will Hold Up

Use this order of operations in production:

1. Public recipe websites first
   - Search for recent recipes and list pages.
   - Pull `schema.org/Recipe` metadata, title, image, ingredients, and source URL.
   - This is the cleanest source of structured ingredients.

2. Pinterest as input, not as the backbone
   - Let the user paste board URLs, pin URLs, or save links into an inbox.
   - Parse destination recipe URLs when present.

3. Instagram as optional user-supplied input
   - Let the user paste creator or reel URLs they want mined.
   - If the creator has a linked recipe page, follow that page and parse ingredients there.
   - Do not depend on public Instagram scraping as the main discovery engine.

4. Reddit and the general web for store recommendation evidence
   - Query the web live after the wishlist is final.
   - Ask: for this exact basket, which one of `Whole Foods`, `Trader Joe's`, or `Costco` looks best?
   - Summarize recurring review themes by category:
     - specialty sauces
     - seafood quality
     - produce value
     - pantry staples
     - bulk-friendliness

## Why I Would Not Make Instagram or Pinterest the Core

For a free personal tool, the safest architecture is to treat those channels as inspiration inputs, not your main data feed.

- Meta shut down the Instagram Basic Display API on December 4, 2024, which means old personal-account style pull flows are gone.
- Pinterest's official developer platform is centered around authenticated account actions like creating and managing Pins and Boards, not unrestricted public trend crawling.
- Google Sheets is still free to use through the API and Google Apps Script, which makes it the best output target for your shopping plan.

## Step By Step: Push Into Google Sheets For Free

### 1. Use the destination sheet

This project is now aimed at:

- `Grocery Shopping`
- `https://docs.google.com/spreadsheets/d/1Tk4ny0z2fEUUquuvBwBpLQMhTt9BsGpep69l0RmvxmE/edit`

### 2. Open Apps Script

Inside the sheet:

- Click `Extensions`
- Click `Apps Script`

### 3. Paste the included script

Use the file:

- `docs/grocery-shopping-apps-script.gs`

```javascript
const SPREADSHEET_ID = "1Tk4ny0z2fEUUquuvBwBpLQMhTt9BsGpep69l0RmvxmE";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = payload.sheetName || "Dish Radar";
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  sheet.clear();

  sheet.getRange("A1").setValue("Week");
  sheet.getRange("B1").setValue(payload.weekLabel || "");
  sheet.getRange("A2").setValue("Store recommended");
  sheet.getRange("B2").setValue(payload.recommendedStore || "");
  sheet.getRange("A3").setValue("Why");
  sheet.getRange("B3").setValue(payload.why || "");
  sheet.getRange("A4").setValue("Expected grocery cost");
  sheet.getRange("B4").setValue(payload.expectedCost || "");

  sheet.getRange("D1").setValue("Selected dishes");
  sheet.getRange("D2").setValue("Dish");
  sheet.getRange("E2").setValue("Category");
  sheet.getRange("F2").setValue("Estimated calories");

  const selectedRows = (payload.selectedDishes || []).map((dish) => [
    typeof dish === "string" ? dish : dish.name,
    typeof dish === "string" ? "" : dish.category || "",
    typeof dish === "string" ? "" : dish.calories || "",
  ]);

  if (selectedRows.length) {
    sheet.getRange(3, 4, selectedRows.length, 3).setValues(selectedRows);
  }

  sheet.getRange("A7").setValue("Ingredient");
  sheet.getRange("B7").setValue("Qty");
  sheet.getRange("C7").setValue("Expected Price");
  sheet.getRange("D7").setValue("Dish used in");

  const rows = (payload.rows || []).map((row) => [
    row.ingredient || "",
    row.qty || "",
    row.expectedPrice || "",
    row.dishUsedIn || "",
  ]);

  if (rows.length) {
    sheet.getRange(8, 1, rows.length, 4).setValues(rows);
  }

  sheet.autoResizeColumns(1, 6);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, sheetName }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 4. Deploy the script as a web app

- Click `Deploy`
- Click `New deployment`
- Choose `Web app`
- Execute as: `Me`
- Who has access: whichever visibility you want for your use case
- Copy the web app URL

### 5. Put the deployment URL into the app env

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Then replace the placeholder with your deployed Apps Script URL:

```bash
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID/exec
```

Now `Go shop!` will:

- build the grocery plan locally
- recommend a single store
- create or refresh a weekly tab in your linked `Grocery Shopping` spreadsheet
- write the selected dishes, estimated calories, grocery rows, and store recommendation there

## Step By Step: Turn This Into Real Trend Discovery

The next production feature should be a `/api/discover` route that:

1. accepts a prompt like `fun spring dinners`, `high protein`, or `viral pasta`
2. runs web search over public recipe sites
3. extracts title, image, source, ingredients, and tags
4. ranks the results using:
   - recency
   - image quality
   - ingredient uniqueness
   - repeated appearance across sources
   - short-form social mentions when a URL is available
5. returns 30 cards to the front end

## Store Recommendation Logic For v2

The current repo uses a basket heuristic. For the real version, upgrade it to:

1. Build the exact ingredient basket from the saved dishes.
2. Search the web for recent comparison signals:
   - `Trader Joe's produce value reddit`
   - `Whole Foods specialty ingredients review`
   - `Costco bulk pantry savings reddit`
3. Convert those into category-level scores:
   - coverage
   - value
   - quality
   - bulk penalty
4. Pick exactly one store.
5. Write the explanation and expected total into the sheet header.

## Sharing Plan

If you want this to be something friends can use:

1. Deploy the React app to Vercel.
2. Keep the front end public.
3. Keep one shared Google Sheet for household planning, or let each user bring their own Apps Script URL.
4. Add authentication only if you later need per-user wishlists.

## Best Next Improvements

If we keep going, I would build the next three things in this order:

1. Real web discovery for recipe pages
2. Persistent wishlist + named weekly plans
3. Live review-backed store scoring instead of heuristics
