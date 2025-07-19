// ————— Equipos —————
const SHEET_EQUIP = 'Equipos';

function addEquipment(form) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_EQUIP);
  if (!sh) {
    sh = ss.insertSheet(SHEET_EQUIP);
    sh.appendRow(['ID','Nombre','Categoria','Ubicacion','Estado','FechaAdquisicion','AreaID']);
  }
  sh.appendRow([
    form.id, form.name, form.category, form.location,
    form.status, form.acquisitionDate, form.areaId
  ]);
  return { success: true };
}

function getAllEquipment(areaFilter) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_EQUIP);
  if (!sh) return [];
  const rows = sh.getDataRange().getValues();
  const hdr = rows.shift();
  return rows
    .map(r => hdr.reduce((o,h,i)=>(o[h]=r[i], o), {}))
    .filter(e => !areaFilter || e.AreaID === areaFilter);
}

function updateEquipment(form) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_EQUIP);
  const data = sh.getDataRange().getValues();
  const hdr = data.shift();
  const idx = data.findIndex(r=>r[0]===form.id);
  if (idx<0) throw 'Equipo no encontrado';
  hdr.forEach((h,i)=>{ if (form[h]!==undefined) sh.getRange(idx+2,i+1).setValue(form[h]); });
  return { success:true };
}

function deleteEquipment(id) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_EQUIP);
  const data = sh.getDataRange().getValues();
  for (let i=1;i<data.length;i++){
    if (data[i][0]===id) { sh.deleteRow(i+1); return { success:true }; }
  }
  throw 'Equipo no encontrado';
}
