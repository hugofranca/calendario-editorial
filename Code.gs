/**
 * Backend do Calendário Editorial — Google Apps Script Web App.
 *
 * Guarda os eventos numa folha ("Eventos") da Google Sheet a que este
 * script está associado, e expõe uma API JSON simples:
 *
 *   GET  /exec                       -> [ {id,date,title,type,description}, ... ]
 *   POST /exec  {action:'upsert', event:{...}}   -> insere/atualiza por id
 *   POST /exec  {action:'delete', id:'...'}       -> elimina por id
 *   POST /exec  {action:'replace', events:[...]}  -> substitui tudo (import)
 *
 * Todas as respostas de escrita devolvem { ok:true, events:[...] } com a
 * lista completa e atualizada, para o cliente reconciliar o estado.
 *
 * SETUP (ver README.md):
 *   1. Cria uma Google Sheet nova.
 *   2. Extensões -> Apps Script, cola este ficheiro, guarda.
 *   3. Implementar -> Nova implementação -> Tipo: Aplicação Web.
 *      Executar como: Eu.   Quem tem acesso: Qualquer pessoa.
 *   4. Copia o URL /exec e cola no API_URL do index.html.
 */

var SHEET_NAME = 'Eventos';
var HEADERS = ['id', 'date', 'title', 'type', 'description'];

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
  }
  // Força todas as colunas a texto para as datas 'yyyy-mm-dd' não serem
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
  var data = [rowFromEvent(ev)];
  if (row === -1) {
    sh.appendRow(rowFromEvent(ev));
  } else {
    sh.getRange(row, 1, 1, HEADERS.length).setValues(data);
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

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    return json(readAll(getSheet()));
  } catch (err) {
    return json({ error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet();
    var req = JSON.parse(e.postData.contents);
    switch (req.action) {
      case 'upsert':  upsert(sh, req.event); break;
      case 'delete':  remove(sh, req.id); break;
      case 'replace': replaceAll(sh, req.events || []); break;
      default: return json({ error: 'ação desconhecida: ' + req.action });
    }
    return json({ ok: true, events: readAll(sh) });
  } catch (err) {
    return json({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
