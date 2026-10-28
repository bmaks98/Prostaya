function installProject() {
  const ss = ss_();
  ss.toast('Создаю структуру проекта…', APP.NAME, 5);
  ensureSheet_(APP.SHEETS.START);
  ensureSettingsSheet_();
  Object.keys(SHEET_SCHEMAS).forEach(name => ensureTableSheet_(name, SHEET_SCHEMAS[name]));
  ensureDashboard_();
  ensureStartSheet_();
  ensureRegulations_();
  applyValidations_();
  hideTechnicalColumns_();
  setSetting_('Дата установки', formatDateTime_(now_()));
  setSetting_('ID таблицы', ss.getId());
  setSetting_('Версия', APP.VERSION);
  onOpen();
  installMasterTrigger();
  logEvent_({regulation:'Установка', result:'Успешно', info:'Структура проекта создана/проверена'});
  toast_('Установка завершена. Откройте лист «Начало работы».');
}

function ensureSheet_(name) {
  let sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  return sh;
}

function ensureTableSheet_(name, headers) {
  const sh = ensureSheet_(name);
  if (sh.getLastRow() === 0 || sh.getRange(1,1).getValue() === '') {
    sh.clear();
    sh.getRange(1,1,1,headers.length).setValues([headers]);
  } else {
    const existing = sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getValues()[0].map(String);
    headers.forEach((h,i)=>{ if (!existing[i]) sh.getRange(1,i+1).setValue(h); });
  }
  styleHeader_(sh, headers.length);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, Math.min(headers.length, 12));
  return sh;
}

function ensureSettingsSheet_() {
  const sh = ensureSheet_(APP.SHEETS.SETTINGS);
  if (sh.getLastRow() < 2) {
    sh.clear();
    sh.getRange(1,1,1,5).setValues([['Группа','Параметр','Значение','Описание','Статус']]);
    sh.getRange(2,1,DEFAULT_SETTINGS.length,5).setValues(DEFAULT_SETTINGS);
  } else {
    const existing={}; sh.getRange(2,2,sh.getLastRow()-1,1).getValues().flat().forEach(x=>existing[asText_(x)]=true);
    const missing=DEFAULT_SETTINGS.filter(r=>!existing[r[1]]); if(missing.length) sh.getRange(sh.getLastRow()+1,1,missing.length,5).setValues(missing);
  }
  styleHeader_(sh,5); sh.setFrozenRows(1);
  sh.setColumnWidth(1,150); sh.setColumnWidth(2,260); sh.setColumnWidth(3,210); sh.setColumnWidth(4,420); sh.setColumnWidth(5,150);
}

function ensureStartSheet_() {
  const sh = sheet_(APP.SHEETS.START);
  sh.clear();
  sh.getRange('A1:E1').merge().setValue('WB + Ozon — Начало работы').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.COLORS.HEADER);
  sh.getRange('A3:E3').setValues([['Шаг','Действие','Статус','Комментарий','Что сделать']]);
  styleHeaderAt_(sh,3,5);
  const rows = [
    [1,'Выбрать маркетплейсы','Не выполнено','На листе «Настройки» включите WB и/или Ozon','Настройки'],
    [2,'Ввести API-данные','Не выполнено','Вставьте токены и сохраните их в Script Properties','Настройки → Сохранить API-ключи'],
    [3,'Проверить подключения','Не выполнено','Проверяются только подключённые маркетплейсы','Начало работы → Проверить подключения'],
    [4,'Импортировать каталог','Не выполнено','Загрузить существующие товары','Начало работы → Импортировать каталог'],
    [5,'Проверить сопоставление','Не выполнено','Артикул → штрихкод → название','Начало работы → Проверить сопоставление'],
    [6,'Заполнить обязательные данные','Не выполнено','Остатки, себестоимость, маржинальность, сроки поставки','Склад / Маржинальность'],
    [7,'Проверить систему','Не выполнено','До этого шага отправка цен/остатков/акций запрещена','Начало работы → Проверить систему'],
    [8,'Включить автоматизацию','Не выполнено','Разрешите нужные защитные переключатели и регламенты','Настройки / Регламенты']
  ];
  sh.getRange(4,1,rows.length,5).setValues(rows);
  sh.setColumnWidth(1,60); sh.setColumnWidth(2,260); sh.setColumnWidth(3,150); sh.setColumnWidth(4,430); sh.setColumnWidth(5,300);
  sh.setFrozenRows(3);
}

function ensureDashboard_() {
  const sh = ensureSheet_(APP.SHEETS.DASHBOARD);
  if (sh.getLastRow() > 0 && sh.getRange('A1').getValue()) return;
  sh.clear();
  sh.getRange('A1:D1').merge().setValue('Дашборд WB / Ozon / Общий').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.COLORS.HEADER);
  sh.getRange('A3:B5').setValues([['Период','Значение'],['Дата начала',''],['Дата окончания','']]);
  sh.getRange('A7:D7').setValues([['Показатель','WB','Ozon','Общий']]); styleHeaderAt_(sh,7,4);
  const metrics=['Выручка','Реализовано, шт.','Себестоимость','Комиссии','Логистика','Прочие удержания','Чистая прибыль','Маржинальность, %','Средний чек','Возвраты','Стоимость текущего склада','Остаток, шт.'];
  sh.getRange(8,1,metrics.length,1).setValues(metrics.map(x=>[x]));
  sh.getRange(22,1,1,9).setValues([['Дата/месяц','Выручка WB','Выручка Ozon','Прибыль WB','Прибыль Ozon','Реализовано WB','Реализовано Ozon','Маржинальность WB','Маржинальность Ozon']]); styleHeaderAt_(sh,22,9);
  sh.getRange(40,1,1,7).setValues([['Маркетплейс','Товар','Выручка','Количество','Себестоимость','Прибыль','Маржинальность']]); styleHeaderAt_(sh,40,7);
  sh.setFrozenRows(1);
}

function ensureRegulations_() {
  const sh = sheet_(APP.SHEETS.REGULATIONS);
  if (sh.getLastRow() <= 1) {
    const rows = DEFAULT_REGULATIONS.map(r => [r[0],r[1],r[2],r[3],'','','Выключен','','','','','']);
    sh.getRange(2,1,rows.length,12).setValues(rows);
  }
}

function styleHeader_(sh, count) { styleHeaderAt_(sh,1,count); }
function styleHeaderAt_(sh,row,count) { sh.getRange(row,1,1,count).setFontWeight('bold').setBackground(APP.COLORS.HEADER).setWrap(true); }

function applyValidations_() {
  const settings = sheet_(APP.SHEETS.SETTINGS);
  const map = settings.getRange(2,2,Math.max(settings.getLastRow()-1,1),2).getValues();
  const yesNo = SpreadsheetApp.newDataValidation().requireValueInList(['Да','Нет'],true).build();
  const onOff = SpreadsheetApp.newDataValidation().requireValueInList(['Вкл','Выкл'],true).build();
  const priceMode = SpreadsheetApp.newDataValidation().requireValueInList(['Авто','Ручной'],true).build();
  const period = SpreadsheetApp.newDataValidation().requireValueInList(['30','60','90','360','Свое значение'],true).build();
  map.forEach((r,i)=>{
    const p=r[0], cell=settings.getRange(i+2,3);
    if (['Использовать WB','Использовать Ozon','Использовать сезонность','Генерировать штрихкод автоматически','Разрешить отправку остатков','Разрешить отправку цен','Разрешить управление акциями'].includes(p)) cell.setDataValidation(yesNo);
    if (['Автоматическая установка цен','Автоматическое управление акциями','Автоматическая отправка остатков','Email-уведомления'].includes(p)) cell.setDataValidation(onOff);
    if (p==='Режим цены по умолчанию') cell.setDataValidation(priceMode);
    if (p==='НДС Ozon по умолчанию') cell.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['0','0.05','0.07','0.1','0.2','0.22'],true).setAllowInvalid(true).build());
    if (p==='Период анализа' || p==='Горизонт планирования') cell.setDataValidation(period);
  });
  const regs=sheet_(APP.SHEETS.REGULATIONS);
  if (regs.getMaxRows()>1) {
    regs.getRange(2,3,regs.getMaxRows()-1,1).insertCheckboxes();
    regs.getRange(2,4,regs.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['5 минут','10 минут','15 минут','30 минут','1 час','3 часа','6 часов','12 часов','1 день'],true).build());
  }
  const cards=sheet_(APP.SHEETS.NEW_CARDS); cards.getRange(2,1,cards.getMaxRows()-1,1).insertCheckboxes();
  const forecast=sheet_(APP.SHEETS.FORECAST); forecast.getRange(2,1,forecast.getMaxRows()-1,1).insertCheckboxes();
  const margins=sheet_(APP.SHEETS.MARGINS); margins.getRange(2,3,margins.getMaxRows()-1,1).insertCheckboxes();
  const cats=sheet_(APP.SHEETS.CATEGORIES); cats.getRange(2,4,cats.getMaxRows()-1,1).insertCheckboxes();
  const matching=sheet_(APP.SHEETS.MATCHING); const mh=findHeaderMap_(matching); if(mh['Подтверждено вручную']) matching.getRange(2,mh['Подтверждено вручную'],matching.getMaxRows()-1,1).insertCheckboxes();
  const supplier=sheet_(APP.SHEETS.SUPPLIER_ORDERS), sph=findHeaderMap_(supplier); if(sph['Статус']) supplier.getRange(2,sph['Статус'],supplier.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Заказан','В пути','Частично получен','Получен','Отменён'],true).build());
}

function hideTechnicalColumns_() {
  const sh=sheet_(APP.SHEETS.CATEGORIES);
  if (sh.getMaxColumns()>=8) sh.hideColumns(5,4);
  const stock=sheet_(APP.SHEETS.STOCK), h=findHeaderMap_(stock);
  ['WB chrtId (служебно)','WB Subject ID (служебно)','WB Длина, см (служебно)','WB Ширина, см (служебно)','WB Высота, см (служебно)'].forEach(name=>{if(h[name])stock.hideColumns(h[name]);});
  if(typeof ensureCardCategoryServiceColumns_==='function') ensureCardCategoryServiceColumns_(sheet_(APP.SHEETS.CATEGORIES));
  if(typeof applyCardCategoryValidations_==='function') applyCardCategoryValidations_();
  if(typeof styleDynamicCardCells_==='function') styleDynamicCardCells_(sheet_(APP.SHEETS.NEW_CARDS));
  if(typeof applyPriceSheetValidation_==='function') applyPriceSheetValidation_();
}
