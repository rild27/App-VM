// admin.gs
// ===================== ADMINISTRACIÓN DE USUARIOS =====================

// -------------------- USUARIOS --------------------
/**
 * Devuelve lista de todos los usuarios (campos públicos).
 */
function getAllUsers() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh || sh.getLastRow()<2) return [];
  var data = sh.getDataRange().getValues();
  var hdr  = data.shift().map(String);
  var idx = {
    u: hdr.indexOf('Username'),
    n: hdr.indexOf('FullName'),
    e: hdr.indexOf('Email'),
    r: hdr.indexOf('Role'),
    d: hdr.indexOf('Enabled')
  };
  return data.map(function(r){
    return {
      username: r[idx.u],
      fullName: r[idx.n],
      email:    idx.e>-1? r[idx.e] : '',
      role:     idx.r>-1? r[idx.r] : 'user',
      enabled:  idx.d>-1? (String(r[idx.d]).toLowerCase()==='true') : true
    };
  });
}

/**
 * Crea un nuevo usuario.
 * form debe contener campos: username, password, fullName, email, position, workCenter, hireDate, birthDate, role
 */
function createUser(form) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return { success:false, message:'Hoja Users no encontrada' };

  // Leer encabezados y datos
  var rows = sh.getDataRange().getValues();
  var hdrs = rows.shift().map(String);
  var idxU = hdrs.indexOf('Username');
  if (idxU<0) return { success:false, message:'Columna Username no existe' };

  // Verificar duplicados
  var newUser = form.username.trim().toLowerCase();
  for (var i=0;i<rows.length;i++) {
    if (String(rows[i][idxU]).toLowerCase()===newUser) {
      return { success:false, message:'El usuario ya existe' };
    }
  }

  // Construir fila en orden de encabezados
  var row = hdrs.map(function(h){
    switch(h) {
      case 'Username': return form.username;
      case 'Password': return form.password;
      case 'FullName': return form.fullName || '';
      case 'Email':    return form.email || '';
      case 'Position': return form.position || '';
      case 'WorkCenter':return form.workCenter || '';
      case 'HireDate': return form.hireDate? new Date(form.hireDate): '';
      case 'BirthDate':return form.birthDate? new Date(form.birthDate): '';
      case 'Role':     return form.role || 'user';
      case 'Enabled':  return true;
      default:         return '';
    }
  });
  sh.appendRow(row);
  return { success:true };
}

/**
 * Habilita o deshabilita un usuario existente.
 */
function toggleUserEnabled(form) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return { success:false, message:'Hoja Users no encontrada' };

  var data = sh.getDataRange().getValues();
  var hdrs = data.shift().map(String);
  var idxU = hdrs.indexOf('Username');
  var idxE = hdrs.indexOf('Enabled');
  if (idxU<0 || idxE<0) return { success:false, message:'Columnas no encontradas' };

  for (var i=0;i<data.length;i++) {
    if (String(data[i][idxU]).toLowerCase()===form.username.toLowerCase()) {
      sh.getRange(i+2, idxE+1).setValue(form.enabled);
      return { success:true };
    }
  }
  return { success:false, message:'Usuario no encontrado' };
}

// -------------------- LOOKUPS --------------------
/**
 * Lee todas las posiciones.
 */
function getPositions() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_POSITIONS);
  if (!sh) return [];
  return sh.getRange('A2:A').getValues().flat().filter(String);
}

/**
 * Agrega una nueva posición.
 */
function addPosition(pos) {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_POSITIONS);
  if (!sh) throw 'Hoja Positions no encontrada';
  sh.appendRow([pos]);
  return { success:true };
}

/**
 * Lee todos los centros de trabajo.
 */
function getWorkCenters() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_WORKCENTERS);
  if (!sh) return [];
  return sh.getRange('A2:A').getValues().flat().filter(String);
}

/**
 * Agrega un nuevo centro de trabajo.
 */
function addWorkCenter(wc) {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_WORKCENTERS);
  if (!sh) throw 'Hoja WorkCenters no encontrada';
  sh.appendRow([wc]);
  return { success:true };
}

// -------------------- DOCUMENTOS ADMINISTRATIVOS --------------------
/**
 * Obtiene documentos administrativos de un usuario.
 */
function getUserAdminDocuments(username) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_ADMIN_DOCS);
  if (!sh || sh.getLastRow()<2) return [];
  var rows = sh.getDataRange().getValues();
  var hdrs = rows.shift().map(String);
  var iu = hdrs.indexOf('Usuario');
  var iname = hdrs.indexOf('Nombre del Documento');
  var its = hdrs.indexOf('Timestamp');
  var iuRL= hdrs.indexOf('URL');
  var tz = Session.getScriptTimeZone();
  var out = [];
  rows.forEach(function(r){
    if (String(r[iu]).toLowerCase()===username.toLowerCase()) {
      out.push({
        Nombre: r[iname],
        Fecha:  r[its] instanceof Date ? Utilities.formatDate(r[its],tz,'dd/MM/yyyy') : r[its],
        URL:    r[iuRL]
      });
    }
  });
  return out;
}

/**
 * Sube o actualiza un documento administrativo.
 */
function uploadAdminDoc(form, updatingName) {
  var parent = DriveApp.getFolderById(DRIVE_PARENT_ID);
  var uf     = getOrCreate(parent, form.username);
  var adminF = getOrCreate(uf, 'Documentos administrativos');
  var archF  = getOrCreate(adminF, 'Archivo');

  if (updatingName) {
    var prev = adminF.getFilesByName(updatingName + '_' + form.username);
    while(prev.hasNext()) {
      var f = prev.next();
      archF.addFile(f);
      adminF.removeFile(f);
    }
  }
  var ext      = form.file.name.split('.').pop();
  var fname    = form.documentName + '_' + form.username + '.' + ext;
  var blob     = Utilities.newBlob(Utilities.base64Decode(form.file.base64), form.file.mimeType, fname);
  var file     = adminF.createFile(blob);
  var url      = 'https://drive.google.com/uc?export=view&id=' + file.getId();

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_ADMIN_DOCS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_ADMIN_DOCS);
    sh.appendRow(['Timestamp','Usuario','Nombre del Documento','URL']);
  }
  // Reemplazar o agregar
  var data = sh.getDataRange().getValues();
  var hdr  = data.shift();
  var iu2 = hdr.indexOf('Usuario');
  var in2 = hdr.indexOf('Nombre del Documento');
  var updated = false;
  for (var i=1;i<data.length;i++) {
    if (data[i-1][iu2]===form.username && data[i-1][in2]===form.documentName) {
      var row = i+1;
      sh.getRange(row,1).setValue(new Date());
      sh.getRange(row,iu2+1).setValue(form.username);
      sh.getRange(row,in2+1).setValue(form.documentName);
      sh.getRange(row, hdr.indexOf('URL')+1).setValue(url);
      updated = true;
      break;
    }
  }
  if (!updated) {
    sh.appendRow([new Date(), form.username, form.documentName, url]);
  }
  return url;
}

/**
 * Helper para buscar o crear carpeta.
 */
function getOrCreate(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/**
 * Devuelve la lista de asignaciones usuario ↔ área.
 */
function getAllUserAreas() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_USER_AREAS);
  if (!sh || sh.getLastRow() < 2) return [];
  
  // Leemos todo y separamos encabezado de datos
  var data = sh.getDataRange().getValues();
  var hdr  = data.shift();     // hdr es un array de nombres de columna
  
  // Índices de cada campo (ajusta 'ÁreaId' y 'ÁreaNombre' al encabezado EXACTO que usas)
  var iu    = hdr.indexOf('Usuario');
  var ia    = hdr.indexOf('ÁreaId');
  var iname = hdr.indexOf('ÁreaNombre');
  
  var out = [];
  data.forEach(function(r) {
    out.push({
      username: r[iu],
      areaId:   r[ia],
      areaName: r[iname]
    });
  });
  return out;
}
