const INSTANCE_SPREADSHEET_ID_KEY_ = 'INSTANCE_SPREADSHEET_ID';
function ss_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const id = PropertiesService.getScriptProperties().getProperty(INSTANCE_SPREADSHEET_ID_KEY_);
  if (!id) throw new Error('Не найден ID таблицы экземпляра. Откройте таблицу и повторно выполните «Установить систему».');
  return SpreadsheetApp.openById(String(id));
}
function bindInstanceSpreadsheet_(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Не удалось определить активную Google-таблицу для установки.');
  PropertiesService.getScriptProperties().setProperty(INSTANCE_SPREADSHEET_ID_KEY_, String(ss.getId()));
  return ss;
}
function sheet_(name) { const s = ss_().getSheetByName(name); if (!s) throw new Error('Не найден лист: ' + name); return s; }
function now_() { return new Date(); }
function uuid_() { return Utilities.getUuid(); }
function boolText_(v) { return v === true || String(v).toLowerCase() === 'да' || String(v).toLowerCase() === 'вкл'; }
function asText_(v) { return v == null ? '' : String(v).trim(); }
function safeJson_(text) { try { return JSON.parse(text); } catch (e) { return {raw:text}; } }
function projectTimeZone_() {
  let tz = '';
  try { tz = ss_().getSpreadsheetTimeZone(); } catch (e) {}
  if (!asText_(tz)) { try { tz = Session.getScriptTimeZone(); } catch (e) {} }
  tz = asText_(tz) || 'Europe/Moscow';
  return String(tz);
}
function formatDateTime_(d) { return d ? Utilities.formatDate(new Date(d), projectTimeZone_(), 'dd.MM.yyyy HH:mm:ss') : ''; }
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
