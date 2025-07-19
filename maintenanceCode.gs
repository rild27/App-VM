// ————— Mantenimientos —————
const SHEET_MAINT = 'Mantenimientos';

function scheduleMaintenance(form) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_MAINT);
  if (!sh) {
    sh = ss.insertSheet(SHEET_MAINT);
    sh.appendRow(['ID','EquipoID','Tipo','Descripcion','FechaProgramada','FechaRealizada','Responsable','Coste']);
  }
  sh.appendRow([
    form.id, form.equipmentId, form.type, form.description,
    form.dateScheduled, form.dateCompleted || '', form.responsible, form.cost
  ]);
  return { success: true };
}

function getMaintenanceByEquipment(equipmentId) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_MAINT);
  if (!sh) return [];
  const rows = sh.getDataRange().getValues();
  const hdr = rows.shift();
  return rows
    .map(r=>hdr.reduce((o,h,i)=>(o[h]=r[i],o),{}))
    .filter(m=>m.EquipoID===equipmentId);
}

function updateMaintenance(form) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_MAINT);
  const data = sh.getDataRange().getValues();
  const hdr = data.shift();
  const idx = data.findIndex(r=>r[0]===form.id);
  if (idx<0) throw 'Mantenimiento no encontrado';
  hdr.forEach((h,i)=>{ if (form[h]!==undefined) sh.getRange(idx+2,i+1).setValue(form[h]); });
  return { success:true };
}

function cancelMaintenance(id) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_MAINT);
  const data = sh.getDataRange().getValues();
  for (let i=1;i<data.length;i++){
    if (data[i][0]===id) { sh.deleteRow(i+1); return { success:true }; }
  }
  throw 'Mantenimiento no encontrado';
}
