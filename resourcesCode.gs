// resources.gs

// —————— INCLUYE HTML ——————
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// —————— LOGIN & PERFIL ——————
function processLogin(form) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(SHEET_USERS);
    if (!sh) return { success:false, message:'Hoja Users no encontrada.' };

    var rows = sh.getDataRange().getValues();
    var headers = rows.shift();
    var roleIdx = headers.map(h=>h.toLowerCase()).indexOf('role');

    var username = form.username.trim().toLowerCase();
    var password = form.password;
    for (var i=0; i<rows.length; i++) {
      var row = rows[i];
      if (String(row[0]).toLowerCase()===username && String(row[1])===password) {
        // chequea Enabled
        var enIdx = headers.indexOf('Enabled');
        if (enIdx>-1 && String(row[enIdx]).toLowerCase()!=='true') {
          return { success:false, message:'Cuenta deshabilitada.' };
        }
        var tz = Session.getScriptTimeZone();
        var hire  = row[8] instanceof Date  ? Utilities.formatDate(row[8], tz,'dd/MM/yyyy') : '';
        var birth = row[9] instanceof Date  ? Utilities.formatDate(row[9], tz,'dd/MM/yyyy') : '';
        var role  = roleIdx>-1 && row[roleIdx] ? String(row[roleIdx]).toLowerCase() : 'user';

        var user = {
          username: row[0], fullName: row[2], email: row[3], imageUrl: row[4],
          employeeNumber: row[5], position: row[6], workCenter: row[7],
          hireDate: hire, birthDate: birth,
          address: row[10], ssn: row[11], curp: row[12], rfc: row[13],
          personalPhone: row[14], emergencyPhone: row[15],
          emergencyContactRelation: row[16],
          highestEducation: row[17], maritalStatus: row[18],
          numberOfChildren: row[19], professionalSummary: row[20],
          role: role
        };
        return { success:true, user: user };
      }
    }
    return { success:false, message:'Usuario o contraseña inválidos.' };
  } catch(e) {
    return { success:false, message:'Error en servidor.' };
  }
}

function getUserProfile(username) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) return null;
  var rows = sh.getDataRange().getValues();
  var headers = rows.shift().map(String);
  var tz = Session.getScriptTimeZone();

  for (var i=0; i<rows.length; i++) {
    var row = rows[i];
    if (String(row[0]).toLowerCase()===username.toLowerCase()) {
      var hire  = row[8] instanceof Date ? Utilities.formatDate(row[8], tz,'dd/MM/yyyy') : '';
      var birth = row[9] instanceof Date ? Utilities.formatDate(row[9], tz,'dd/MM/yyyy') : '';
      var roleIdx = headers.map(h=>h.toLowerCase()).indexOf('role');
      var role = roleIdx>-1 && row[roleIdx] ? String(row[roleIdx]).toLowerCase() : 'user';
      return {
        username: row[0], fullName: row[2], email: row[3], imageUrl: row[4],
        employeeNumber: row[5], position: row[6], workCenter: row[7],
        hireDate: hire, birthDate: birth,
        address: row[10], ssn: row[11], curp: row[12], rfc: row[13],
        personalPhone: row[14], emergencyPhone: row[15],
        emergencyContactRelation: row[16],
        highestEducation: row[17], maritalStatus: row[18],
        numberOfChildren: row[19], professionalSummary: row[20],
        role: role
      };
    }
  }
  return null;
}

function updateProfile(form) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(SHEET_USERS);
    var data = sh.getDataRange().getValues();
    var headers = data.shift();
    var idxU = headers.indexOf('Username');
    var rowI = data.findIndex(r=>String(r[idxU]).toLowerCase()===form.username.toLowerCase());
    if (rowI<0) throw 'Usuario no encontrado.';

    var mapping = {
      fullName:'FullName', email:'Email', birthDate:'BirthDate',
      address:'Address', ssn:'SSN', curp:'CURP', rfc:'RFC',
      personalPhone:'PersonalPhone', emergencyPhone:'EmergencyPhone',
      emergencyContactRelation:'EmergencyContactRelation',
      highestEducation:'HighestEducation', maritalStatus:'MaritalStatus',
      numberOfChildren:'NumberOfChildren', professionalSummary:'ProfessionalSummary'
    };
    headers.forEach(function(h,i){
      for (var key in mapping) {
        if (mapping[key]===h && form[key]!==undefined) {
          var v = form[key];
          if (key==='birthDate') v = new Date(v);
          sh.getRange(rowI+2, i+1).setValue(v);
        }
      }
    });
    SpreadsheetApp.flush();
    var pwd = sh.getRange(rowI+2, headers.indexOf('Password')+1).getValue();
    return {
      success: true,
      user: getUserProfile(form.username)
    };
  } catch(e) {
    return { success:false, message: e.toString() };
  }
}

function changeUserPassword(form) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(SHEET_USERS);
    var data = sh.getDataRange().getValues();
    var hdrs = data.shift();
    var iu = hdrs.indexOf('Username'), ip = hdrs.indexOf('Password');
    for (var i=0; i<data.length; i++) {
      if (String(data[i][iu]).toLowerCase()===form.username.toLowerCase()) {
        if (String(data[i][ip]) !== form.currentPassword) {
          return { success:false, message:'Contraseña actual incorrecta.' };
        }
        sh.getRange(i+2, ip+1).setValue(form.newPassword);
        return { success:true };
      }
    }
    return { success:false, message:'Usuario no encontrado.' };
  } catch(e) {
    return { success:false, message:e.toString() };
  }
}

// —————— AVATAR ——————
function uploadProfileImage(payload) {
  try {
    var folder = DriveApp.getFolderById(AVATAR_ROOT_FOLDER_ID);
    var files = folder.getFiles();
    var prefix = payload.username + '.';
    while (files.hasNext()) {
      var f = files.next();
      if (f.getName().startsWith(prefix)) f.setTrashed(true);
    }
    var ext  = payload.profileImage.name.split('.').pop();
    var blob = Utilities.newBlob(
      Utilities.base64Decode(payload.profileImage.base64),
      payload.profileImage.mimeType,
      payload.username + '.' + ext
    );
    var file = folder.createFile(blob)
                     .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url  = 'https://drive.google.com/uc?export=view&id=' + file.getId();

    // actualiza URL en hoja Users
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(SHEET_USERS);
    var rows = sh.getDataRange().getValues();
    var hdr  = rows.shift().map(String);
    var iu   = hdr.indexOf('Username'), ii = hdr.indexOf('ImageUrl');
    rows.forEach(function(r,i){
      if (String(r[iu]).toLowerCase()===payload.username.toLowerCase()) {
        sh.getRange(i+2, ii+1).setValue(url);
      }
    });
    return url;
  } catch(e) {
    return null;
  }
}

function getProfileImageDataUrl(username) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_USERS);
  var rows = sh.getDataRange().getValues();
  var hdr  = rows.shift().map(String);
  var iu   = hdr.indexOf('Username'), ii = hdr.indexOf('ImageUrl');
  for (var i=0; i<rows.length; i++) {
    if (String(rows[i][iu]).toLowerCase()===username.toLowerCase()) {
      var m = String(rows[i][ii]).match(/id=([^&]+)/);
      if (!m) return null;
      var blob = DriveApp.getFileById(m[1]).getBlob();
      return 'data:' + blob.getContentType() +
             ';base64,' + Utilities.base64Encode(blob.getBytes());
    }
  }
  return null;
}

// —————— CATEGORÍAS ——————
function getCategories() {
  try {
    return SpreadsheetApp
      .openById(SHEET_ID)
      .getSheetByName('Category')
      .getRange('A2:A')
      .getValues()
      .flat()
      .filter(String);
  } catch (e) {
    console.error('getCategories error:', e);
    return [];
  }
}

// —————— DOCUMENTOS & CAPACITACIONES ——————
function getDocsForUser(username, sheetName) {
  try {
    var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
    if (!sh || sh.getLastRow()<2) return [];
    var rows = sh.getDataRange().getValues();
    var hdr  = rows.shift();
    var tz   = Session.getScriptTimeZone();
    var out  = [];
    rows.forEach(function(r){
      if (String(r[1]).toLowerCase()===username.toLowerCase()) {
        var obj = {};
        hdr.forEach(function(h,i){
          obj[h] = r[i] instanceof Date
                    ? Utilities.formatDate(r[i], tz,'dd/MM/yyyy')
                    : r[i];
        });
        out.push(obj);
      }
    });
    return out;
  } catch(e) {
    return [];
  }
}
function getUserDocuments(username)         { return getDocsForUser(username, SHEET_DOCS); }
function getUserPersonalDocuments(username) { return getDocsForUser(username, SHEET_PERSONAL_DOCS); }

function saveFileToDrive(info, updatingName) {
  var parent = DriveApp.getFolderById(DRIVE_PARENT_ID);
  var uf     = getOrCreate(parent, info.username);

  if (info.isPersonal) {
    var personal = getOrCreate(uf, 'Documentos Personales');
    if (updatingName) {
      var old = personal.getFilesByName(updatingName + '_' + info.username);
      var arch = getOrCreate(personal, 'Archivo');
      while (old.hasNext()) arch.addFile(old.next());
    }
    var blob = Utilities.newBlob(
      Utilities.base64Decode(info.file.base64),
      info.file.mimeType,
      info.documentName + '_' + info.username
    );
    var file = personal.createFile(blob);
    return 'https://drive.google.com/uc?export=view&id=' + file.getId();
  }

  // capacitaciones
  var cap = getOrCreate(uf, 'capacitaciones');
  var cat = getOrCreate(cap, info.categoria);
  var blob = Utilities.newBlob(
    Utilities.base64Decode(info.file.base64),
    info.file.mimeType,
    info.file.name
  );
  var file = cat.createFile(blob).setName(info.curso + '-' + info.file.name);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function uploadDocument(form) {
  form.isPersonal = false;
  var url = saveFileToDrive(form);
  var sh  = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_DOCS);
  if (sh.getLastRow()===0) {
    sh.appendRow(['Timestamp','Usuario','Categoría','Curso','Empresa','Profesor','Inicio','Fin','Horas','URL']);
  }
  sh.appendRow([new Date(), form.username, form.categoria, form.curso,
                form.empresa, form.profesor, form.inicio, form.fin, form.horas, url]);
  return 'Constancia subida con éxito';
}

function uploadPersonalDocument(form, updatingName) {
  form.isPersonal = true;
  var url = saveFileToDrive(form, updatingName);
  var sh  = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_PERSONAL_DOCS);
  if (sh.getLastRow()===0) {
    sh.appendRow(['Timestamp','Usuario','Nombre del Documento','URL']);
  }
  if (updatingName) {
    var data = sh.getDataRange().getValues();
    var hdr  = data.shift();
    var ui   = hdr.indexOf('Usuario'), ni = hdr.indexOf('Nombre del Documento');
    for (var i=data.length;i>=1;i--) {
      if (data[i-1][ui]===form.username && data[i-1][ni]===updatingName) {
        sh.deleteRow(i+1);
      }
    }
  }
  sh.appendRow([new Date(), form.username, form.documentName, url]);
  return 'Documento subido con éxito';
}

// —————— EXPERIENCIA LABORAL ——————
function uploadWorkExperience(form) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('WorkExperience');
  if (!sh) {
    sh = ss.insertSheet('WorkExperience');
    sh.appendRow(['Timestamp','Usuario','Empresa','Inicio','Fin','Puesto']);
  }
  var ini = form.inicio ? new Date(form.inicio) : '';
  var fin = form.fin    ? new Date(form.fin) : '';
  sh.appendRow([new Date(), form.username, form.empresa, ini, fin, form.puesto]);
  return 'Experiencia laboral guardada con éxito';
}

function getUserWorkExperience(username) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('WorkExperience');
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues();
  var hdr  = rows.shift();
  var ui   = hdr.indexOf('Usuario'),
      ii   = hdr.indexOf('Inicio'),
      fi   = hdr.indexOf('Fin'),
      pi   = hdr.indexOf('Puesto'),
      tsi  = hdr.indexOf('Timestamp');
  var tz   = Session.getScriptTimeZone();
  var out  = [];

  rows.forEach(function(r, i) {
    if (r[ui] === username) {
      var start = r[ii] instanceof Date ? r[ii] : new Date(r[ii]);
      var end   = r[fi] instanceof Date ? r[fi] : new Date(r[fi]);

      // Cálculo de años y meses
      var y = end.getFullYear() - start.getFullYear();
      var m = end.getMonth() - start.getMonth();
      var d = end.getDate() - start.getDate();
      if (d < 0) m--;
      if (m < 0) { y--; m += 12; }

      // Construcción legible de "Tiempo"
      var t = '';
      if (y > 0 && m > 0) {
        t = y + ' año' + (y > 1 ? 'es' : '') + ' y ' +
            m + ' mes' + (m > 1 ? 'es' : '');
      } else if (y > 0) {
        t = y + ' año' + (y > 1 ? 'es' : '');
      } else if (m > 0) {
        t = m + ' mes' + (m > 1 ? 'es' : '');
      } else {
        t = '0 meses';
      }

      out.push({
        Empresa:   r[2],
        Inicio:    Utilities.formatDate(start, tz, 'dd/MM/yyyy'),
        Fin:       Utilities.formatDate(end,   tz, 'dd/MM/yyyy'),
        Tiempo:    t,
        Puesto:    r[pi],
        rowIndex:  i + 2
      });
    }
  });

  // Orden descendente por fecha de inicio
  return out.sort(function(a, b) {
    return new Date(b.Inicio) - new Date(a.Inicio);
  });
}

function updateWorkExperience(o) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('WorkExperience');
  var hdr = sh.getDataRange().getValues().shift();
  var ei  = hdr.indexOf('Empresa')+1, ii = hdr.indexOf('Inicio')+1,
      fi  = hdr.indexOf('Fin')+1,     pi = hdr.indexOf('Puesto')+1;
  var row = Number(o.rowIndex);
  if (!row||row<2) throw 'Fila inválida';
  if (o.empresa) sh.getRange(row, ei).setValue(o.empresa);
  if (o.inicio)  sh.getRange(row, ii).setValue(new Date(o.inicio));
  if (o.fin)     sh.getRange(row, fi).setValue(new Date(o.fin));
  if (o.puesto)  sh.getRange(row, pi).setValue(o.puesto);
  return 'OK';
}

// —————— FORMACIÓN ACADÉMICA ——————
function uploadAcademic(form) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('FormacionAcademica');
  if (!sh) {
    sh = ss.insertSheet('FormacionAcademica');
    sh.appendRow(['Timestamp','Usuario','Nivel','Institucion','Ingreso','Egreso']);
  }
  var ing = form.ingreso ? new Date(form.ingreso) : '';
  var eg  = form.egreso  ? new Date(form.egreso)  : '';
  sh.appendRow([new Date(), form.username, form.nivel, form.institucion, ing, eg]);
  return 'Formación académica guardada con éxito';
}

function getUserAcademic(username) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('FormacionAcademica');
  if (!sh || sh.getLastRow()<2) return [];
  var rows = sh.getDataRange().getValues();
  var hdr  = rows.shift();
  var ui   = hdr.indexOf('Usuario'), ni = hdr.indexOf('Nivel'),
      ii   = hdr.indexOf('Ingreso'), ei = hdr.indexOf('Egreso'),
      tsi  = hdr.indexOf('Timestamp');
  var tz   = Session.getScriptTimeZone();
  var out  = [];
  rows.forEach(function(r){
    if (r[ui]===username) {
      var ing = r[ii] instanceof Date ? r[ii] : new Date(r[ii]);
      var eg  = r[ei] instanceof Date ? r[ei] : new Date(r[ei]);
      out.push({
        Nivel:        r[ni],
        Institucion:  r[hdr.indexOf('Institucion')],
        Ingreso:      Utilities.formatDate(ing, tz,'dd/MM/yyyy'),
        Egreso:       Utilities.formatDate(eg,  tz,'dd/MM/yyyy'),
        _ts:          r[tsi].getTime()
      });
    }
  });
  return out.sort((a,b)=>b._ts - a._ts);
}

function updateAcademic(form) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('FormacionAcademica');
  var rows = sh.getDataRange().getValues();
  var hdr  = rows.shift();
  var ui   = hdr.indexOf('Usuario'), tsi = hdr.indexOf('Timestamp');
  for (var i=0;i<rows.length;i++) {
    var r = rows[i];
    if (r[ui]===form.username &&
        r[tsi] instanceof Date &&
        r[tsi].getTime()===Number(form._ts)) {
      if (form.nivel)        sh.getRange(i+2, hdr.indexOf('Nivel')+1).setValue(form.nivel);
      if (form.institucion)  sh.getRange(i+2, hdr.indexOf('Institucion')+1).setValue(form.institucion);
      if (form.ingreso)      sh.getRange(i+2, hdr.indexOf('Ingreso')+1).setValue(new Date(form.ingreso));
      if (form.egreso)       sh.getRange(i+2, hdr.indexOf('Egreso')+1).setValue(new Date(form.egreso));
      return { success:true };
    }
  }
  return { success:false, message:'Registro no encontrado.' };
}

// —————— AUXILIAR: crea o recupera carpeta ——————
function getOrCreate(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/**
 * Devuelve la lista de documentos administrativos de un usuario.
 */
function getUserAdminDocuments(username) {
  return getDocsForUser(username, SHEET_ADMIN_DOCS);
}
