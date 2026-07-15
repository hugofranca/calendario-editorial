/**
 * Backend do Calendário Editorial — Google Apps Script (HtmlService).
 *
 * A app é SERVIDA por este script (doGet devolve a página) e os dados
 * são lidos/gravados através de funções chamadas do cliente via
 * google.script.run — sem fetch, sem CORS. O acesso é restrito ao
 * domínio visma.com pela configuração da implementação (Web App).
 *
 * Funções chamáveis pelo cliente:
 *   listEvents()            -> [ {id,date,title,type,description}, ... ]
 *   upsertEvent(ev)         -> { ok:true, events:[...] }
 *   deleteEvent(id)         -> { ok:true, events:[...] }
 *   replaceEvents(list)     -> { ok:true, events:[...] }
 *
 * SETUP (ver README.md):
 *   1. Cria uma Google Sheet nova.
 *   2. Extensões -> Apps Script.
 *   3. Cola este ficheiro em Code.gs.
 *   4. Cria um ficheiro HTML chamado exatamente "Index" e cola nele todo
 *      o conteúdo do index.html.
 *   5. Implementar -> Nova implementação -> Aplicação Web.
 *      Executar como: Eu.   Quem tem acesso: Qualquer pessoa da Visma.
 */

var SHEET_NAME = 'Eventos';
var HEADERS = ['id', 'date', 'title', 'type', 'description'];

// ---------- página ----------
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Calendário Editorial')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ---------- funções chamáveis (google.script.run) ----------
function listEvents() {
  return readAll(getSheet());
}

function upsertEvent(ev) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet();
    upsert(sh, ev);
    return { ok: true, events: readAll(sh) };
  } finally {
    lock.releaseLock();
  }
}

function deleteEvent(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet();
    remove(sh, id);
    return { ok: true, events: readAll(sh) };
  } finally {
    lock.releaseLock();
  }
}

function replaceEvents(list) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet();
    replaceAll(sh, list || []);
    return { ok: true, events: readAll(sh) };
  } finally {
    lock.releaseLock();
  }
}

// ---------- acesso à folha ----------
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
  }
  // Força as colunas a texto para as datas 'yyyy-mm-dd' não serem
  // convertidas automaticamente em objetos Date pela folha.
  sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).setNumberFormat('@');
  return sh;
}

function readAll(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (r[0] === '' || r[0] == null) continue;
    out.push({
      id: String(r[0]),
      date: String(r[1] || ''),
      title: String(r[2] || ''),
      type: String(r[3] || ''),
      description: String(r[4] || '')
    });
  }
  return out;
}

function rowFromEvent(ev) {
  return [
    String(ev.id || ''),
    String(ev.date || ''),
    String(ev.title || ''),
    String(ev.type || ''),
    String(ev.description || '')
  ];
}

function findRow(sh, id) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1; // 1-based
  }
  return -1;
}

function upsert(sh, ev) {
  if (!ev || !ev.id) throw new Error('evento sem id');
  var row = findRow(sh, ev.id);
  if (row === -1) {
    sh.appendRow(rowFromEvent(ev));
  } else {
    sh.getRange(row, 1, 1, HEADERS.length).setValues([rowFromEvent(ev)]);
  }
}

function remove(sh, id) {
  var row = findRow(sh, id);
  if (row !== -1) sh.deleteRow(row);
}

function replaceAll(sh, list) {
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, HEADERS.length).clearContent();
  if (list && list.length) {
    var rows = list.map(rowFromEvent);
    sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }
}
