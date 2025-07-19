// ————————— ÁREAS —————————
const SHEET_AREAS = 'Areas';

function addArea(form) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_AREAS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_AREAS);
    sh.appendRow(['ID','Nombre','Tipo','Descripción']);
  }
  sh.appendRow([form.id, form.name, form.type, form.description]);
  return { success: true };
}

function getAllAreas() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_AREAS);
  if (!sh) return [];
  const rows = sh.getDataRange().getValues();
  const headers = rows.shift();
  return rows.map(r => {
    let o = {};
    headers.forEach((h,i) => o[h] = r[i]);
    return o;
  });
}

function updateArea(form) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_AREAS);
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  const idx = data.findIndex(r => r[0] === form.id);
  if (idx < 0) throw 'Área no encontrada';
  headers.forEach((h,i) => {
    if (form[h] !== undefined) sh.getRange(idx+2, i+1).setValue(form[h]);
  });
  return { success: true };
}

function deleteArea(id) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_AREAS);
  const data = sh.getDataRange().getValues();
  const idx = data.findIndex((r,i) => i>0 && r[0] === id);
  if (idx < 1) throw 'Área no encontrada';
  sh.deleteRow(idx+1);
  return { success: true };
}
