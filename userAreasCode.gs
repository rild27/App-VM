// ——— Asignación Usuario–Área ———
const SHEET_USER_AREAS = 'UserAreas';

function assignUserArea(form) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_USER_AREAS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_USER_AREAS);
    sh.appendRow(['Username','AreaID']);
  }
  sh.appendRow([form.username, form.areaId]);
  return { success: true };
}

function getUserAreas() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_USER_AREAS);
  if (!sh) return [];
  const rows = sh.getDataRange().getValues().slice(1);
  return rows.map(r=>({ username: r[0], areaId: r[1] }));
}

function removeUserArea(form) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_USER_AREAS);
  const data = sh.getDataRange().getValues();
  for (let i=1;i<data.length;i++){
    if (data[i][0]===form.username && data[i][1]===form.areaId) {
      sh.deleteRow(i+1);
      return { success: true };
    }
  }
  throw 'Asignación no encontrada';
}
