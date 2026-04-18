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
  sheet.getRange("A5").setValue("Generated at");
  sheet.getRange("B5").setValue(payload.generatedAt || "");

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
