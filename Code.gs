// Code.gs

// IDs y constantes globales (defínelos si no están en Code.gs)
var SHEET_ID = '1vIypahljrzaNC7v0DDswRs3AjBf0xcKltIWNcIlXg8o';
var SHEET_USERS = 'Users';
var SHEET_POSITIONS       = 'Positions';
var SHEET_WORKCENTERS     = 'WorkCenters';
var SHEET_CATEGORY = 'Category';
var SHEET_DOCS = 'Documents';
var SHEET_PERSONAL_DOCS = 'PersonalDocuments';
var SHEET_ADMIN_DOCS     = 'AdminDocuments';    // ← añade esta línea
var DRIVE_PARENT_ID = '107Z63tpEXlJazEZu4JxNmWUL7uxZo1hV';
const AVATAR_ROOT_FOLDER_ID = '1iBfaqi3XKKWKJeVK5iOlJUSgfHTZi3e9';

/** include() genérico */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  var page = e.parameter.page;
  switch (page) {
    case 'login':
    case undefined:
      return HtmlService.createTemplateFromFile('login')
                       .evaluate().setTitle('Ingreso');
    case 'dashboard':
      var tpl = HtmlService.createTemplateFromFile('dashboard');
      tpl.categories = getCategories();  // viene de resources.gs
      return tpl.evaluate().setTitle('Dashboard');
    case 'admin':
      return HtmlService.createTemplateFromFile('admin')
                       .evaluate().setTitle('Panel Admin');
    default:
      return HtmlService.createTemplateFromFile('login')
                       .evaluate().setTitle('Ingreso');
  }
}

/**
 * Función de prueba para comprobar acceso a Drive
 */
function testDrive() {
  return DriveApp.getFolderById(DRIVE_PARENT_ID).getName();
}
