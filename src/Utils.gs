function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name) { const s = ss_().getSheetByName(name); if (!s) throw new Error('Не найден лист: ' + name); return s; }
function now_() { return new Date(); }
function uuid_() { return Utilities.getUuid(); }
function boolText_(v) { return v === true || String(v).toLowerCase() === 'да' || String(v).toLowerCase() === 'вкл'; }
function asText_(v) { return v == null ? '' : String(v).trim(); }
function safeJson_(text) { try { return JSON.parse(text); } catch (e) { return {raw:text}; } }
function formatDateTime_(d) { return d ? Utilities.formatDate(new Date(d), ss_().getSpreadsheetTimeZone(), 'dd.MM.yyyy HH:mm:ss') : ''; }
function toast_(msg, title) { ss_().toast(msg, title || APP.NAME, 7); }
function findHeaderMap_(sheet, row) {
  row = row || 1;
  const lastCol = sheet.getLastColumn();
  if (!lastCol) return {};
  const vals = sheet.getRange(row,1,1,lastCol).getValues()[0];
  const out = {}; vals.forEach((v,i)=>{ if (v !== '') out[String(v).trim()] = i+1; }); return out;
}
function appendRowObject_(sheetName, headers, obj) {
  const sh = sheet_(sheetName);
  const row = headers.map(h => Object.prototype.hasOwnProperty.call(obj,h) ? obj[h] : '');
  sh.appendRow(row);
}
function setStatusColor_(range, status) {
  const s = String(status || '').toLowerCase();
  if (s.indexOf('ошиб') >= 0 || s.indexOf('крит') >= 0 || s.indexOf('остановлен') >= 0) range.setBackground(APP.COLORS.ERROR);
  else if (s.indexOf('предуп') >= 0 || s.indexOf('требует') >= 0) range.setBackground(APP.COLORS.WARN);
  else if (s.indexOf('готов') >= 0 || s.indexOf('работает') >= 0 || s.indexOf('подключено') >= 0) range.setBackground(APP.COLORS.OK);
  else range.setBackground(null);
}
