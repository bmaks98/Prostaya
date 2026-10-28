/** Prostaya All-in-One dev8. Generated from bmaks98/Prostaya src. */
const PROSTAYA_SUPPLIER_ORDER_HTML_ = `<!doctype html><html><head><base target="_top"><style>
body{font-family:Arial,sans-serif;margin:18px;color:#222}label{display:block;font-weight:600;margin:10px 0 4px}input,select,textarea{box-sizing:border-box;width:100%;padding:8px;border:1px solid #bbb;border-radius:6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.row{margin:8px 0}.lines{max-height:270px;overflow:auto;border:1px solid #ddd;border-radius:6px;margin-top:12px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #eee;padding:6px;text-align:left}td input{padding:5px}.btns{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}button{padding:9px 14px;border:0;border-radius:6px;cursor:pointer}.primary{background:#2f6f3e;color:#fff}.muted{background:#eee}.msg{margin-top:10px;color:#a00;white-space:pre-wrap}
</style></head><body>
<div class="grid"><div><label>Поставщик</label><input id="supplier"></div><div><label>Дата заказа</label><input id="orderDate" type="date"></div><div><label>Ожидаемая дата поставки</label><input id="expectedDate" type="date"></div><div><label>Комментарий</label><input id="comment"></div></div>
<div id="manual" style="display:none"><label>Товар</label><select id="product"></select><div class="grid"><div><label>Количество</label><input id="qty" type="number" min="1" step="1"></div><div><label>Себестоимость по заказу</label><input id="cost" type="number" min="0" step="0.01"></div></div></div>
<div id="forecast" style="display:none"><div class="lines"><table><thead><tr><th>Товар</th><th style="width:100px">Количество</th><th style="width:110px">Цена</th></tr></thead><tbody id="tbody"></tbody></table></div></div>
<div class="msg" id="msg"></div><div class="btns"><button class="muted" onclick="google.script.host.close()">Отмена</button><button class="primary" onclick="submitForm()">Создать заказ</button></div>
<script>
const DATA=<?!= JSON.stringify(data) ?>;document.getElementById('orderDate').value=DATA.today;
if(DATA.mode==='manual'){document.getElementById('manual').style.display='block';const s=document.getElementById('product');DATA.products.forEach(p=>{const o=document.createElement('option');o.value=p.internalId;o.textContent=(p.article?p.article+' — ':'')+p.name;o.dataset.cost=p.cost;o.dataset.lead=p.leadDays;s.appendChild(o)});function sync(){const o=s.selectedOptions[0];if(!o)return;document.getElementById('cost').value=o.dataset.cost||'';const d=new Date(document.getElementById('orderDate').value||DATA.today);d.setDate(d.getDate()+Number(o.dataset.lead||0));document.getElementById('expectedDate').value=d.toISOString().slice(0,10)}s.addEventListener('change',sync);sync();}
else{document.getElementById('forecast').style.display='block';const tb=document.getElementById('tbody');DATA.lines.forEach((p,i)=>{const tr=document.createElement('tr');tr.dataset.id=p.internalId;tr.innerHTML='<td>'+(p.article?p.article+' — ':'')+p.name+'</td><td><input class="q" type="number" min="0" step="1" value="'+p.qty+'"></td><td><input class="c" type="number" min="0" step="0.01" value="'+(p.cost||0)+'"></td>';tb.appendChild(tr)});const maxLead=Math.max(0,...DATA.lines.map(x=>Number(x.leadDays||0)));const d=new Date(DATA.today);d.setDate(d.getDate()+maxLead);document.getElementById('expectedDate').value=d.toISOString().slice(0,10);}
function submitForm(){const msg=document.getElementById('msg');msg.textContent='';let lines=[];if(DATA.mode==='manual'){lines=[{internalId:document.getElementById('product').value,qty:document.getElementById('qty').value,cost:document.getElementById('cost').value}]}else{document.querySelectorAll('#tbody tr').forEach(tr=>lines.push({internalId:tr.dataset.id,qty:tr.querySelector('.q').value,cost:tr.querySelector('.c').value}))}const payload={mode:DATA.mode,supplier:document.getElementById('supplier').value,orderDate:document.getElementById('orderDate').value,expectedDate:document.getElementById('expectedDate').value,comment:document.getElementById('comment').value,lines};google.script.run.withSuccessHandler(r=>{google.script.host.close()}).withFailureHandler(e=>{msg.textContent=e.message||e}).submitSupplierOrderDialog(payload)}
</script></body></html>
`;
const PROSTAYA_RECEIVE_DELIVERY_HTML_ = `<!doctype html><html><head><base target="_top"><style>
body{font-family:Arial,sans-serif;margin:18px;color:#222}label{display:block;font-weight:600;margin:10px 0 4px}input,select{box-sizing:border-box;width:100%;padding:8px;border:1px solid #bbb;border-radius:6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.info{background:#f5f5f5;padding:10px;border-radius:6px;margin-top:10px}.btns{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}button{padding:9px 14px;border:0;border-radius:6px;cursor:pointer}.primary{background:#2f6f3e;color:#fff}.muted{background:#eee}.msg{margin-top:10px;color:#a00;white-space:pre-wrap}
</style></head><body>
<label>Строка заказа</label><select id="line"></select><div class="info" id="info"></div>
<div class="grid"><div><label>Принять сейчас, шт.</label><input id="qty" type="number" min="1" step="1"></div><div><label>Дата приёмки</label><input id="date" type="date"></div><div><label>Новая закупочная цена (необязательно)</label><input id="cost" type="number" min="0" step="0.01"></div><div><label>Как обновить себестоимость</label><select id="rule"><option>Не обновлять</option><option>Заменить текущую</option><option>Средневзвешенная</option></select></div></div>
<div class="msg" id="msg"></div><div class="btns"><button class="muted" onclick="google.script.host.close()">Отмена</button><button class="primary" onclick="submitForm()">Принять</button></div>
<script>
const DATA=<?!= JSON.stringify(data) ?>,s=document.getElementById('line');document.getElementById('date').value=DATA.today;DATA.lines.forEach((x,i)=>{const o=document.createElement('option');o.value=x.row;o.textContent=x.orderId+' · '+(x.article?x.article+' — ':'')+x.name;o.dataset.i=i;s.appendChild(o)});function sync(){const x=DATA.lines[Number(s.selectedOptions[0].dataset.i)];document.getElementById('info').textContent='Поставщик: '+x.supplier+' · Заказано: '+x.ordered+' · Получено: '+x.received+' · Осталось: '+x.remaining;document.getElementById('qty').value=x.remaining;document.getElementById('qty').max=x.remaining;document.getElementById('cost').placeholder=x.orderCost||''}s.addEventListener('change',sync);sync();
function submitForm(){const msg=document.getElementById('msg');msg.textContent='';google.script.run.withSuccessHandler(()=>google.script.host.close()).withFailureHandler(e=>msg.textContent=e.message||e).submitSupplierReceipt({row:s.value,qty:document.getElementById('qty').value,date:document.getElementById('date').value,newCost:document.getElementById('cost').value,costRule:document.getElementById('rule').value})}
</script></body></html>
`;
function prostayaRenderHtml_(html, data) {
  const json = JSON.stringify(data || {}).replace(/</g, '\\u003c');
  return html.replace('<?!= JSON.stringify(data) ?>', json);
}
function installSystemFromTemplate(){ bindInstanceSpreadsheet_(); return installProject(); }
/* ===== Config.gs ===== */
const APP = Object.freeze({
  NAME: 'WB + Ozon',
  VERSION: '1.1.0-dev.8',
  SHEETS: {
    START: 'Начало работы',
    SETTINGS: 'Настройки',
    STOCK: 'Склад',
    MATCHING: 'Сопоставление товаров',
    MARGINS: 'Маржинальность',
    PRICES: 'Цены',
    ACTIONS: 'Акции',
    ORDER_LOG: 'Журнал заказов',
    FORECAST: 'Прогноз закупок',
    SUPPLIER_ORDERS: 'Заказы поставщикам',
    DASHBOARD: 'Дашборд',
    REGULATIONS: 'Регламенты',
    LOG: 'Журнал',
    NOTIFICATIONS: 'Уведомления',
    NEW_CARDS: 'Новые карточки',
    CATEGORIES: 'Категории'
  },
  SECRET_KEYS: {
    WB_TOKEN: 'WB_API_TOKEN',
    OZON_CLIENT_ID: 'OZON_CLIENT_ID',
    OZON_API_KEY: 'OZON_API_KEY'
  },
  SAFE_GUARDS: {
    SEND_STOCKS: 'Разрешить отправку остатков',
    SEND_PRICES: 'Разрешить отправку цен',
    MANAGE_ACTIONS: 'Разрешить управление акциями'
  },
  COLORS: {
    HEADER: '#d9ead3',
    SECTION: '#eef4ea',
    OK: '#d9ead3',
    WARN: '#fff2cc',
    ERROR: '#f4cccc',
    MUTED: '#eeeeee'
  }
});

const SHEET_SCHEMAS = Object.freeze({
  'Склад': ['Внутренний ID','Наименование','Категория','Артикул основной','Штрихкод','Себестоимость','Фактический остаток','Срок поставки, дней','Запас, дней','Маржинальность товара, %','Используемая маржинальность, %','WB подключён','WB NMID','WB артикул','WB SKU / barcode','Ozon подключён','Ozon Product ID','Ozon Offer ID','Ozon SKU','Статус сопоставления','Источник названия','Последнее движение','Последняя синхронизация','WB chrtId (служебно)','WB Subject ID (служебно)','WB Длина, см (служебно)','WB Ширина, см (служебно)','WB Высота, см (служебно)'],
  'Сопоставление товаров': ['Внутренний ID','WB NMID','WB артикул','WB наименование','WB штрихкод','Ozon Product ID','Ozon Offer ID','Ozon наименование','Ozon штрихкод','Найдено по','Уверенность совпадения','Статус','Подтверждено вручную','Комментарий'],
  'Маржинальность': ['Категория','Маржинальность по умолчанию, %','Активна','Комментарий'],
  'Цены': ['Внутренний ID','Наименование','Категория','Себестоимость','Используемая маржинальность, %','WB текущая цена','WB расчётная цена','WB минимально допустимая цена','WB режим','WB ручная цена','WB цена к отправке','WB статус','Ozon текущая цена','Ozon расчётная цена','Ozon минимально допустимая цена','Ozon режим','Ozon ручная цена','Ozon цена к отправке','Ozon статус','Последний расчёт','Последняя отправка','Ошибка'],
  'Акции': ['Маркетплейс','ID акции','Название акции','Дата начала','Дата окончания','Внутренний ID товара','Наименование','Текущая цена','Цена по акции','Минимально допустимая цена','Маржинальность в акции, %','Подходит по маржинальности','Сейчас участвует','Требуемое действие','Результат действия','Последняя проверка','Ошибка'],
  'Журнал заказов': ['Маркетплейс','ID заказа','ID позиции заказа','Внутренний ID товара','Артикул','Количество','Дата заказа','Текущий статус','Списано со склада','Дата списания','Отменён до отправки','Количество возвращено','Дата возврата','Последняя проверка','Ошибка'],
  'Прогноз закупок': ['В заказ','Внутренний ID','Наименование','Артикул','Фактический остаток','В пути','Период анализа, дней','Горизонт планирования, дней','Продажи WB за период','Средние продажи WB/день','Продажи Ozon за период','Средние продажи Ozon/день','Общие продажи','Средние продажи всего/день','Доля WB, %','Доля Ozon, %','Ks WB','Ks Ozon','Ks общий','Сезонность / комментарий','Срок поставки, дней','Запас, дней','Дней хватит остатка','Ожидаемая дата дефицита','Потребность на горизонт','Уже заказано','Рекомендуется заказать','Статус'],
  'Заказы поставщикам': ['ID заказа','Поставщик','Дата заказа','Ожидаемая дата поставки','Внутренний ID товара','Наименование','Артикул основной','WB артикул / NMID','Ozon Offer ID / SKU','Количество заказано','Получено','Осталось получить','Себестоимость по заказу','Общая сумма','Дата последней приёмки','Статус','Комментарий'],
  'Регламенты': ['ID регламента','Название','Включён','Период','Последний запуск','Следующий запуск','Статус','Причина остановки','Обработано','Ошибок','Длительность','Результат последнего запуска'],
  'Журнал': ['Дата и время','ID запуска','Название регламента','Маркетплейс','Тип запуска','Результат','Обработано','Успешно','Ошибок','Текст ошибки','Длительность, сек','Дополнительная информация'],
  'Уведомления': ['Дата и время','Уровень','Тип','Маркетплейс','Регламент','Товар / объект','Сообщение','Отправлено на email','Email','Статус отправки','Прочитано','Комментарий'],
  'Категории': ['Наша категория','Предмет WB','Тип товара Ozon','Активна','WB Subject ID','Ozon Description Category ID','Ozon Type ID','Родительская категория Ozon'],
  'Новые карточки': ['Создать','Внутренний ID','Артикул продавца','Штрихкод','Название','Описание','Бренд','Наша категория','Предмет WB','Тип товара Ozon','Цена','Длина упаковки, см','Ширина упаковки, см','Высота упаковки, см','Вес с упаковкой, г','Фото 1','Фото 2','Фото 3','Фото 4','Фото 5','Фото 6','Фото 7','Фото 8','Фото 9','Фото 10','Проверка WB','Проверка Ozon','Статус WB','WB NMID','Статус Ozon','Ozon Product ID','Ozon SKU','Дата создания','Ошибка WB','Ошибка Ozon']
});

const DEFAULT_SETTINGS = Object.freeze([
  ['Подключение','Использовать WB','Нет','Подключать Wildberries к системе',''],
  ['Подключение','Использовать Ozon','Нет','Подключать Ozon к системе',''],
  ['Подключение','WB API Token','','Вставьте токен и выполните «Сохранить API-ключи»','Не сохранён'],
  ['Подключение','Ozon Client ID','','Вставьте Client ID и выполните «Сохранить API-ключи»','Не сохранён'],
  ['Подключение','Ozon API Key','','Вставьте API Key и выполните «Сохранить API-ключи»','Не сохранён'],
  ['Подключение','Статус WB','Не проверено','Результат проверки подключения',''],
  ['Подключение','Статус Ozon','Не проверено','Результат проверки подключения',''],
  ['Подключение','Последняя проверка','','Дата последней проверки API',''],
  ['Цены','Маржинальность по умолчанию, %','100','Используется, если не задана категория/товар',''],
  ['Цены','Режим цены по умолчанию','Авто','Авто или Ручной',''],
  ['Цены','Автоматическая установка цен','Выкл','Общий переключатель регламента цен',''],
  ['Цены','Автоматическое управление акциями','Выкл','Вход и выход из акций одним переключателем',''],
  ['Остатки','Автоматическая отправка остатков','Выкл','Синхронизация фактического остатка',''],
  ['Остатки','Последняя синхронизация','','Информационное поле',''],
  ['Остатки','WB склад для остатков','','Название управляемого FBS-склада WB',''],
  ['Остатки','Ozon склад для остатков','','Название управляемого FBS-склада Ozon',''],
  ['Остатки','Последнее обновление складов','','Информационное поле',''],
  ['Прогноз закупок','Период анализа','30','30 / 60 / 90 / 360 / Свое значение',''],
  ['Прогноз закупок','Пользовательский период анализа, дней','','Используется при выборе «Свое значение»',''],
  ['Прогноз закупок','Горизонт планирования','30','30 / 60 / 90 / 360 / Свое значение',''],
  ['Прогноз закупок','Пользовательский горизонт, дней','','Используется при выборе «Свое значение»',''],
  ['Прогноз закупок','Использовать сезонность','Да','Коэффициент Ks',''],
  ['Прогноз закупок','Последний расчёт прогноза','','Информационное поле',''],
  ['Уведомления','Email-уведомления','Выкл','Отправлять критичные уведомления на почту',''],
  ['Уведомления','Email получателя','','Адрес получателя',''],
  ['Уведомления','Ошибки API','Да','Уведомлять',''],
  ['Уведомления','Ошибки регламентов','Да','Уведомлять',''],
  ['Уведомления','Ошибки цен','Да','Уведомлять',''],
  ['Уведомления','Ошибки остатков','Да','Уведомлять',''],
  ['Уведомления','Ошибки акций','Да','Уведомлять',''],
  ['Уведомления','Ошибки сопоставления','Да','Уведомлять',''],
  ['Уведомления','Нет себестоимости','Да','Уведомлять',''],
  ['Карточки','Бренд по умолчанию','','Если бренд строки пуст — используется это значение',''],
  ['Карточки','Генерировать штрихкод автоматически','Да','Если штрихкод новой карточки не заполнен',''],
  ['Система','Версия',APP.VERSION,'Версия проекта',''],
  ['Система','Дата установки','','Заполняется автоматически',''],
  ['Система','ID таблицы','','Заполняется автоматически',''],
  ['Система','Последняя проверка системы','','Информационное поле',''],
  ['Система','Статус системы','Требует настройки','Готова / Требует настройки / Ошибка',''],
  ['Защита','Разрешить отправку остатков','Нет','Включается только после проверки',''],
  ['Защита','Разрешить отправку цен','Нет','Включается только после проверки',''],
  ['Защита','Разрешить управление акциями','Нет','Включается только после проверки','']
]);

const DEFAULT_REGULATIONS = Object.freeze([
  ['orders_wb','Проверка заказов WB',false,'10 минут'],
  ['orders_ozon','Проверка заказов Ozon',false,'10 минут'],
  ['stocks_sync','Синхронизация остатков',false,'10 минут'],
  ['prices_sync','Пересчёт и отправка цен',false,'3 часа'],
  ['actions_sync','Проверка и обновление акций',false,'3 часа'],
  ['dashboard_refresh','Обновить дашборды',false,'1 день'],
  ['forecast_refresh','Обновить прогноз закупок',false,'1 день']
]);
/* ===== Utils.gs ===== */
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
/* ===== Logging.gs ===== */
function logEvent_(o) {
  const sh=sheet_(APP.SHEETS.LOG);
  sh.appendRow([now_(),o.runId||uuid_(),o.regulation||'',o.marketplace||'',o.runType||'Системный',o.result||'',o.processed||0,o.success||0,o.errors||0,o.error||'',o.duration||0,o.info||'']);
}
function notify_(o) {
  const sh=sheet_(APP.SHEETS.NOTIFICATIONS); const email=asText_(getSetting_('Email получателя',''));
  let sent='Нет', sendStatus='Отключено';
  if (boolText_(getSetting_('Email-уведомления','Выкл')) && email && (o.email!==false)) {
    try { MailApp.sendEmail({to:email,subject:'['+APP.NAME+'] '+(o.level||'Уведомление')+': '+(o.type||''),htmlBody:'<b>'+escapeHtml_(o.message||'')+'</b><br><br>Маркетплейс: '+escapeHtml_(o.marketplace||'—')+'<br>Регламент: '+escapeHtml_(o.regulation||'—')+'<br>Объект: '+escapeHtml_(o.object||'—')}); sent='Да'; sendStatus='Отправлено'; }
    catch(e){ sendStatus='Ошибка: '+e.message; }
  }
  sh.appendRow([now_(),o.level||'Информация',o.type||'',o.marketplace||'',o.regulation||'',o.object||'',o.message||'',sent,email,sendStatus,false,o.comment||'']);
}
function escapeHtml_(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function sendTestNotification(){ notify_({level:'Информация',type:'Тест',message:'Тестовое уведомление. Email-настройка работает.'}); toast_('Тестовое уведомление создано.'); }
/* ===== Settings.gs ===== */
function settingsMap_() {
  const sh=sheet_(APP.SHEETS.SETTINGS); const n=sh.getLastRow()-1; const out={}; if(n<=0)return out;
  sh.getRange(2,1,n,5).getValues().forEach((r,i)=>{ out[String(r[1])]={row:i+2,group:r[0],value:r[2],description:r[3],status:r[4]}; }); return out;
}
function getSetting_(name, fallback) { const m=settingsMap_(); return m[name] ? m[name].value : fallback; }
function setSetting_(name, value, status) { const m=settingsMap_(); if(!m[name]) throw new Error('Неизвестная настройка: '+name); const sh=sheet_(APP.SHEETS.SETTINGS); sh.getRange(m[name].row,3).setValue(value); if(status!==undefined) sh.getRange(m[name].row,5).setValue(status); }
function setSettingIfExists_(name,value,status){try{setSetting_(name,value,status)}catch(e){}}

function saveApiCredentials() {
  const props=PropertiesService.getScriptProperties(); const m=settingsMap_(); let saved=0;
  [['WB API Token',APP.SECRET_KEYS.WB_TOKEN],['Ozon Client ID',APP.SECRET_KEYS.OZON_CLIENT_ID],['Ozon API Key',APP.SECRET_KEYS.OZON_API_KEY]].forEach(pair=>{
    const entry=m[pair[0]]; if(!entry) return; const v=asText_(entry.value);
    if(v && v.indexOf('••••')!==0){ props.setProperty(pair[1],v); const sh=sheet_(APP.SHEETS.SETTINGS); sh.getRange(entry.row,3).setValue('•••••• сохранено'); sh.getRange(entry.row,5).setValue('Сохранено'); saved++; }
  });
  toast_(saved ? 'API-данные сохранены безопасно.' : 'Новых API-данных для сохранения нет.');
}
function secret_(key){ return PropertiesService.getScriptProperties().getProperty(key)||''; }
function hasWbCredentials_(){return !!secret_(APP.SECRET_KEYS.WB_TOKEN)}
function hasOzonCredentials_(){return !!secret_(APP.SECRET_KEYS.OZON_CLIENT_ID)&&!!secret_(APP.SECRET_KEYS.OZON_API_KEY)}
function resetServiceState(){
  const props=PropertiesService.getScriptProperties();
  let instanceId=props.getProperty(INSTANCE_SPREADSHEET_ID_KEY_)||'';
  if(!instanceId){try{const active=SpreadsheetApp.getActiveSpreadsheet();if(active)instanceId=String(active.getId());}catch(e){}}
  props.deleteAllProperties();
  if(instanceId)props.setProperty(INSTANCE_SPREADSHEET_ID_KEY_,String(instanceId));
  ['Статус WB','Статус Ozon'].forEach(k=>{try{setSetting_(k,'Не проверено')}catch(e){}});
  ['Разрешить отправку остатков','Разрешить отправку цен','Разрешить управление акциями'].forEach(k=>{try{setSetting_(k,'Нет')}catch(e){}});
  toast_('Служебное состояние и сохранённые API-ключи сброшены. Привязка к этой таблице сохранена. Пользовательские данные листов не удалены.');
}

function clearSheetBodyForTemplate_(name){
  try{
    const sh=sheet_(name);
    if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  }catch(e){}
}

function prepareTemplateForCopy(){
  const ui=SpreadsheetApp.getUi();
  const answer=ui.alert('Подготовить мастер-шаблон к копированию?',
    'Будут удалены только служебные свойства, API-ключи, installable-триггеры и тестовые данные журналов. Код, листы, заголовки и структура останутся. После этого мастер-шаблон не должен использоваться как рабочий магазин.',
    ui.ButtonSet.YES_NO);
  if(answer!==ui.Button.YES)return;

  ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));
  PropertiesService.getScriptProperties().deleteAllProperties();

  const resets=[
    ['Использовать WB','Нет',''],['Использовать Ozon','Нет',''],
    ['WB API Token','','Не сохранён'],['Ozon Client ID','','Не сохранён'],['Ozon API Key','','Не сохранён'],
    ['Статус WB','Не проверено',''],['Статус Ozon','Не проверено',''],['Последняя проверка','',''],
    ['Автоматическая установка цен','Выкл',''],['Автоматическое управление акциями','Выкл',''],['Автоматическая отправка остатков','Выкл',''],
    ['Последняя синхронизация','',''],['WB склад для остатков','',''],['Ozon склад для остатков','',''],['Последнее обновление складов','',''],
    ['Последний расчёт прогноза','',''],['Email-уведомления','Выкл',''],['Email получателя','',''],
    ['Версия',APP.VERSION,''],['Дата установки','',''],['ID таблицы','',''],['Последняя проверка системы','',''],['Статус системы','Требует настройки',''],
    ['Разрешить отправку остатков','Нет',''],['Разрешить отправку цен','Нет',''],['Разрешить управление акциями','Нет','']
  ];
  resets.forEach(r=>setSettingIfExists_(r[0],r[1],r[2]));

  try{
    const regs=sheet_(APP.SHEETS.REGULATIONS);
    if(regs.getLastRow()>1){
      const n=regs.getLastRow()-1;
      regs.getRange(2,3,n,1).setValue(false);
      regs.getRange(2,5,n,8).clearContent();
      regs.getRange(2,7,n,1).setValue('Выключен');
    }
  }catch(e){}

  [APP.SHEETS.LOG,APP.SHEETS.NOTIFICATIONS,APP.SHEETS.ORDER_LOG].forEach(clearSheetBodyForTemplate_);
  try{ensureStartSheet_();}catch(e){}
  try{
    const sh=sheet_(APP.SHEETS.START);
    sh.getRange('A13:E14').clearContent();
    sh.getRange('A13:E13').merge().setValue('ШАБЛОН ГОТОВ К КОПИРОВАНИЮ').setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.COLORS.OK);
    sh.getRange('A14:E14').merge().setValue('Создайте копию файла. В каждой новой копии начните с: «Начало работы → 🟢 УСТАНОВИТЬ СИСТЕМУ».').setWrap(true).setHorizontalAlignment('center');
  }catch(e){}
  ui.alert('Готово','Мастер-шаблон очищен и готов к созданию копий. Теперь сделайте копию и продолжайте тестирование уже в ней.',ui.ButtonSet.OK);
}
/* ===== ApiClient.gs ===== */
function apiFetchWithRetry_(cfg) {
  const retryCodes={408:true,429:true,500:true,502:true,503:true,504:true}; let lastErr=null;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const resp=UrlFetchApp.fetch(cfg.url,{method:cfg.method||'get',headers:cfg.headers||{},payload:cfg.payload===undefined?undefined:(typeof cfg.payload==='string'?cfg.payload:JSON.stringify(cfg.payload)),contentType:cfg.contentType||'application/json',muteHttpExceptions:true});
      const code=resp.getResponseCode(), text=resp.getContentText();
      if(code>=200 && code<300) return {ok:true,code:code,text:text,json:safeJson_(text),headers:resp.getAllHeaders()};
      const err=new Error('HTTP '+code+': '+text.substring(0,1000)); err.httpCode=code;
      if(!retryCodes[code]) throw err;
      lastErr=err; if(attempt<3) Utilities.sleep(attempt*1500);
    } catch(e){
      lastErr=e; const code=e.httpCode||0; if(code && !retryCodes[code]) break; if(attempt<3) Utilities.sleep(attempt*1500);
    }
  }
  const msg=(lastErr&&lastErr.message)||'Неизвестная ошибка API';
  logEvent_({regulation:cfg.regulation||'API',marketplace:cfg.marketplace||'',result:'Ошибка',errors:1,error:msg});
  notify_({level:'Критическая ошибка',type:'Ошибка API после 3 попыток',marketplace:cfg.marketplace||'',regulation:cfg.regulation||'',message:msg});
  throw lastErr||new Error(msg);
}

function wbRequestAt_(base, path, method, payload, regulation) {
  const token=secret_(APP.SECRET_KEYS.WB_TOKEN); if(!token) throw new Error('WB API Token не сохранён.');
  return apiFetchWithRetry_({url:base+path,method:method||'get',payload:payload,headers:{Authorization:token},marketplace:'WB',regulation:regulation||'WB API'});
}
function wbRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://common-api.wildberries.ru',path,method,payload,regulation);
}
function wbMarketplaceRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://marketplace-api.wildberries.ru',path,method,payload,regulation||'WB Marketplace API');
}
function wbContentRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://content-api.wildberries.ru',path,method,payload,regulation||'WB Content API');
}
function ozonRequestMethod_(path, method, payload, regulation) {
  const cid=secret_(APP.SECRET_KEYS.OZON_CLIENT_ID), key=secret_(APP.SECRET_KEYS.OZON_API_KEY); if(!cid||!key) throw new Error('Ozon Client ID / API Key не сохранены.');
  return apiFetchWithRetry_({url:'https://api-seller.ozon.ru'+path,method:method||'post',payload:payload,headers:{'Client-Id':cid,'Api-Key':key},marketplace:'Ozon',regulation:regulation||'Ozon API'});
}
function ozonRequest_(path, payload, regulation) { return ozonRequestMethod_(path,'post',payload||{},regulation); }
function ozonGet_(path, regulation) { return ozonRequestMethod_(path,'get',undefined,regulation); }

function wbPromotionRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://dp-calendar-api.wildberries.ru',path,method,payload,regulation||'WB Promotions API');
}

function wbPricesRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://discounts-prices-api.wildberries.ru',path,method,payload,regulation||'WB Prices API');
}
function wbFinanceRequest_(path, method, payload, regulation) {
  // Finance API WB допускает редкие запросы. Соблюдаем интервал централизованно,
  // чтобы повторный ручной запуск и пагинация не ловили 429.
  const props=PropertiesService.getScriptProperties(), key='WB_FINANCE_LAST_CALL_MS';
  const last=Number(props.getProperty(key)||0), wait=Math.max(0,61000-(Date.now()-last));
  if(wait>0) Utilities.sleep(wait);
  const result=wbRequestAt_('https://finance-api.wildberries.ru',path,method,payload,regulation||'WB Finance API');
  props.setProperty(key,String(Date.now()));
  return result;
}
/* ===== Connections.gs ===== */
function checkWbConnection() {
  try { const r=wbRequest_('/api/v1/seller-info','get',undefined,'Проверка подключения WB'); setSetting_('Статус WB','Подключено','OK'); setSetting_('Последняя проверка',formatDateTime_(now_())); toast_('WB: подключение успешно.'); return r.json; }
  catch(e){ setSetting_('Статус WB','Ошибка','Ошибка'); notify_({level:'Критическая ошибка',type:'Подключение WB',marketplace:'WB',message:e.message}); toast_('WB: ошибка подключения.'); return null; }
}
function checkOzonConnection() {
  try { const r=ozonRequest_('/v1/roles',{},'Проверка подключения Ozon'); setSetting_('Статус Ozon','Подключено','OK'); setSetting_('Последняя проверка',formatDateTime_(now_()));
    const exp=r.json&&r.json.expires_at; if(exp){ const days=Math.floor((new Date(exp)-new Date())/86400000); if(days<=30) notify_({level:'Предупреждение',type:'Срок API-ключа Ozon',marketplace:'Ozon',message:'API-ключ Ozon истекает через '+days+' дн. ('+exp+').'}); }
    toast_('Ozon: подключение успешно.'); return r.json; }
  catch(e){ setSetting_('Статус Ozon','Ошибка','Ошибка'); notify_({level:'Критическая ошибка',type:'Подключение Ozon',marketplace:'Ozon',message:e.message}); toast_('Ozon: ошибка подключения.'); return null; }
}
function checkAllConnections(){ if(boolText_(getSetting_('Использовать WB','Нет'))) checkWbConnection(); if(boolText_(getSetting_('Использовать Ozon','Нет'))) checkOzonConnection(); }
/* ===== Warehouses.gs ===== */
function refreshWarehouseSettings() {
  const useWb=boolText_(getSetting_('Использовать WB','Нет'));
  const useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon) throw new Error('В настройках не выбран ни один маркетплейс.');
  if(useWb) refreshWbWarehouses_();
  if(useOzon) refreshOzonWarehouses_();
  setSetting_('Последнее обновление складов',formatDateTime_(now_()));
  toast_('Список складов обновлён.');
}

function refreshWbWarehouses_() {
  const r=wbMarketplaceRequest_('/api/v3/warehouses','get',undefined,'Склады WB').json;
  const arr=Array.isArray(r)?r:(Array.isArray(r&&r.warehouses)?r.warehouses:[]);
  const list=arr.filter(x=>!x.isDeleting).map(x=>({id:asText_(x.id),name:asText_(x.name)})).filter(x=>x.id&&x.name);
  saveWarehouseMap_('WB',list);
  applyWarehouseValidation_('WB склад для остатков',list);
  return list;
}

function refreshOzonWarehouses_() {
  const list=[]; let cursor='', safety=0;
  do {
    const body={limit:100}; if(cursor) body.cursor=cursor;
    const r=ozonRequest_('/v2/warehouse/list',body,'Склады Ozon').json||{};
    const arr=Array.isArray(r.warehouses)?r.warehouses:[];
    arr.forEach(x=>{ const id=asText_(x.warehouse_id||x.id), name=asText_(x.name); if(id&&name&&!list.some(y=>y.id===id)) list.push({id:id,name:name}); });
    if(!r.has_next) break;
    const next=asText_(r.cursor); if(!next||next===cursor) break; cursor=next; safety++;
  } while(safety<100);
  saveWarehouseMap_('OZON',list);
  applyWarehouseValidation_('Ozon склад для остатков',list);
  return list;
}

function saveWarehouseMap_(market,list){ PropertiesService.getScriptProperties().setProperty(market+'_WAREHOUSES_JSON',JSON.stringify(list||[])); }
function warehouseMap_(market){ try{return JSON.parse(PropertiesService.getScriptProperties().getProperty(market+'_WAREHOUSES_JSON')||'[]');}catch(e){return [];} }

function applyWarehouseValidation_(settingName,list){
  const m=settingsMap_(), e=m[settingName]; if(!e) return;
  const sh=sheet_(APP.SHEETS.SETTINGS), cell=sh.getRange(e.row,3), names=(list||[]).map(x=>x.name);
  if(names.length) cell.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(names,true).setAllowInvalid(false).build());
  else cell.clearDataValidations();
  const current=asText_(cell.getValue());
  if(names.length===1) { cell.setValue(names[0]); sh.getRange(e.row,5).setValue('Выбран автоматически'); }
  else if(current && names.indexOf(current)>=0) sh.getRange(e.row,5).setValue('Выбран');
  else { cell.setValue(''); sh.getRange(e.row,5).setValue(names.length?'Выберите склад':'Склады не найдены'); }
}

function selectedWarehouse_(market){
  const setting=market==='WB'?'WB склад для остатков':'Ozon склад для остатков';
  const selected=asText_(getSetting_(setting,''));
  let list=warehouseMap_(market==='WB'?'WB':'OZON');
  if(!list.length){ if(market==='WB') list=refreshWbWarehouses_(); else list=refreshOzonWarehouses_(); }
  if(!selected && list.length===1){ setSetting_(setting,list[0].name,'Выбран автоматически'); return list[0]; }
  const found=list.find(x=>x.name===selected);
  if(!found) throw new Error(market+': выберите склад для остатков на листе «Настройки» и выполните «Обновить список складов».');
  return found;
}
/* ===== Installer.gs ===== */
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
/* ===== Menu.gs ===== */
function onOpen() {
  const ui=SpreadsheetApp.getUi();
  ui.createMenu('Начало работы')
    .addItem('🟢 УСТАНОВИТЬ СИСТЕМУ','installProject')
    .addSeparator().addItem('Открыть лист «Начало работы»','openStartSheet')
    .addSeparator().addItem('Проверить подключение WB','checkWbConnection')
    .addItem('Проверить подключение Ozon','checkOzonConnection')
    .addItem('Проверить подключения','checkAllConnections')
    .addItem('Обновить список складов','refreshWarehouseSettings')
    .addSeparator().addItem('Импортировать каталог','importCatalogs')
    .addItem('Проверить сопоставление','runMatching')
    .addItem('Проверить готовность системы','checkSystemReadiness').addToUi();

  ui.createMenu('Склад')
    .addItem('Обновить каталог WB','updateWbCatalog')
    .addItem('Обновить каталог Ozon','updateOzonCatalog')
    .addItem('Синхронизировать остатки','syncStocks').addToUi();

  ui.createMenu('Цены').addItem('Пересчитать цены','calculatePrices')
    .addItem('Отправить цены WB','sendWbPrices').addItem('Отправить цены Ozon','sendOzonPrices')
    .addSeparator().addItem('Открыть лист «Маржинальность»','openMarginsSheet')
    .addItem('Открыть лист «Цены»','openPricesSheet').addToUi();

  ui.createMenu('Акции').addItem('Проверить акции WB','checkWbActions')
    .addItem('Проверить акции Ozon','checkOzonActions')
    .addItem('Управлять акциями автоматически','manageActions')
    .addItem('Открыть лист «Акции»','openActionsSheet').addToUi();

  ui.createMenu('Закупки').addItem('Открыть прогноз закупок','openForecastSheet')
    .addItem('Обновить прогноз','refreshForecast')
    .addItem('Создать заказ поставщику','createSupplierOrder')
    .addItem('Создать заказ из выбранных товаров','createSupplierOrderFromSelected')
    .addItem('Принять поставку','acceptSupplierDelivery')
    .addItem('Показать только активные','showActiveSupplierOrders')
    .addItem('Открыть лист «Заказы поставщикам»','openSupplierOrdersSheet').addToUi();

  ui.createMenu('Карточки').addItem('Загрузить категории WB','loadWbSubjects')
    .addItem('Загрузить типы Ozon','loadOzonTypes')
    .addItem('Загрузить обязательные характеристики','loadRequiredCardAttributes')
    .addSeparator().addItem('Сгенерировать штрихкоды','generateBarcodes')
    .addItem('Проверить отмеченные карточки','validateSelectedCards')
    .addItem('Создать отмеченные карточки','createSelectedCards')
    .addSeparator().addItem('Повторить ошибочные WB','retryFailedWbCards')
    .addItem('Повторить ошибочные Ozon','retryFailedOzonCards').addToUi();

  ui.createMenu('Дашборды').addItem('Обновить дашборды','refreshDashboard')
    .addItem('Открыть лист «Дашборд»','openDashboardSheet').addToUi();

  ui.createMenu('Регламенты').addItem('Проверить заказы WB','manualOrdersWb')
    .addItem('Проверить заказы Ozon','manualOrdersOzon')
    .addItem('Синхронизировать остатки','manualStocksSync')
    .addItem('Пересчитать и отправить цены','manualPricesSync')
    .addItem('Проверить и обновить акции','manualActionsSync')
    .addItem('Обновить дашборды','manualDashboardRefresh')
    .addItem('Обновить прогноз закупок','manualForecastRefresh')
    .addSeparator().addItem('Обновить всё','manualRunAll')
    .addItem('Открыть лист «Регламенты»','openRegulationsSheet').addToUi();

  ui.createMenu('Уведомления и журнал').addItem('Отправить тестовое email-уведомление','sendTestNotification')
    .addItem('Открыть лист «Уведомления»','openNotificationsSheet')
    .addItem('Открыть лист «Журнал»','openLogSheet').addToUi();

  ui.createMenu('Настройки').addItem('Открыть лист «Настройки»','openSettingsSheet')
    .addItem('Сохранить API-ключи','saveApiCredentials')
    .addItem('Обновить список складов','refreshWarehouseSettings')
    .addItem('Проверить систему','checkSystemReadiness')
    .addItem('Повторно выполнить первичную настройку','installProject')
    .addItem('Сбросить только служебные настройки','resetServiceState').addToUi();
}

function activate_(name){ ss_().setActiveSheet(sheet_(name)); }
function openStartSheet(){activate_(APP.SHEETS.START)} function openMarginsSheet(){activate_(APP.SHEETS.MARGINS)}
function openPricesSheet(){activate_(APP.SHEETS.PRICES)} function openActionsSheet(){activate_(APP.SHEETS.ACTIONS)}
function openForecastSheet(){activate_(APP.SHEETS.FORECAST)} function openSupplierOrdersSheet(){activate_(APP.SHEETS.SUPPLIER_ORDERS)}
function openDashboardSheet(){activate_(APP.SHEETS.DASHBOARD)} function openRegulationsSheet(){activate_(APP.SHEETS.REGULATIONS)}
function openNotificationsSheet(){activate_(APP.SHEETS.NOTIFICATIONS)} function openLogSheet(){activate_(APP.SHEETS.LOG)} function openSettingsSheet(){activate_(APP.SHEETS.SETTINGS)}
/* ===== Readiness.gs ===== */
function checkSystemReadiness(){
  const issues=[]; const useWb=boolText_(getSetting_('Использовать WB','Нет')), useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon) issues.push('Не выбран ни один маркетплейс.');
  if(useWb&&!hasWbCredentials_()) issues.push('Не сохранён WB API Token.');
  if(useOzon&&!hasOzonCredentials_()) issues.push('Не сохранены Ozon Client ID / API Key.');
  if(useWb && getSetting_('Статус WB','')!=='Подключено') issues.push('WB не прошёл проверку подключения.');
  if(useOzon && getSetting_('Статус Ozon','')!=='Подключено') issues.push('Ozon не прошёл проверку подключения.');
  if(useWb && !asText_(getSetting_('WB склад для остатков',''))) issues.push('Не выбран WB склад для остатков.');
  if(useOzon && !asText_(getSetting_('Ozon склад для остатков',''))) issues.push('Не выбран Ozon склад для остатков.');
  const stock=sheet_(APP.SHEETS.STOCK); if(stock.getLastRow()<=1) issues.push('Склад пуст — каталог ещё не импортирован.');
  if(issues.length){ setSetting_('Статус системы','Требует настройки'); setSetting_('Последняя проверка системы',formatDateTime_(now_())); notify_({level:'Предупреждение',type:'Проверка системы',message:issues.join('\n'),email:false}); SpreadsheetApp.getUi().alert('Система требует настройки','• '+issues.join('\n• '),SpreadsheetApp.getUi().ButtonSet.OK); return false; }
  setSetting_('Статус системы','Готова'); setSetting_('Последняя проверка системы',formatDateTime_(now_())); toast_('Система готова. Защитные переключатели можно включать вручную.'); return true;
}
function assertGuard_(name){ if(!boolText_(getSetting_(name,'Нет'))) throw new Error('Операция заблокирована защитой. Включите «'+name+'» после проверки системы.'); }
/* ===== Catalog.gs ===== */
/**
 * Импорт каталогов WB/Ozon и построение единого склада.
 * Источник истины по фактическому остатку — лист «Склад».
 */
function importCatalogs() {
  const useWb = boolText_(getSetting_('Использовать WB','Нет'));
  const useOzon = boolText_(getSetting_('Использовать Ozon','Нет'));
  if (!useWb && !useOzon) throw new Error('В настройках не выбран ни один маркетплейс.');

  const started = Date.now();
  const wb = useWb ? wbFetchCatalog_() : [];
  const ozon = useOzon ? ozonFetchCatalog_() : [];
  const result = rebuildMatchingAndStock_(wb, ozon, {useWb:useWb, useOzon:useOzon});
  logEvent_({regulation:'Импорт каталогов',runType:'Ручной',result:'Успешно',processed:result.processed,success:result.processed,errors:0,duration:Math.round((Date.now()-started)/1000),info:'WB: '+wb.length+', Ozon: '+ozon.length});
  toast_('Каталог обновлён. WB: '+wb.length+', Ozon: '+ozon.length+'.');
  return result;
}

function updateWbCatalog() {
  if (!boolText_(getSetting_('Использовать WB','Нет'))) throw new Error('WB выключен в настройках.');
  const wb = wbFetchCatalog_();
  const ozon = boolText_(getSetting_('Использовать Ozon','Нет')) ? readCatalogSideFromMatching_('Ozon') : [];
  const r = rebuildMatchingAndStock_(wb, ozon, {useWb:true,useOzon:boolText_(getSetting_('Использовать Ozon','Нет'))});
  toast_('Каталог WB обновлён: '+wb.length+' товаров.');
  return r;
}

function updateOzonCatalog() {
  if (!boolText_(getSetting_('Использовать Ozon','Нет'))) throw new Error('Ozon выключен в настройках.');
  const ozon = ozonFetchCatalog_();
  const wb = boolText_(getSetting_('Использовать WB','Нет')) ? readCatalogSideFromMatching_('WB') : [];
  const r = rebuildMatchingAndStock_(wb, ozon, {useWb:boolText_(getSetting_('Использовать WB','Нет')),useOzon:true});
  toast_('Каталог Ozon обновлён: '+ozon.length+' товаров.');
  return r;
}

function wbFetchCatalog_() {
  const all=[];
  let cursor=null;
  let safety=0;
  do {
    const body={settings:{cursor:{limit:100},filter:{withPhoto:-1}}};
    if (cursor && cursor.updatedAt && cursor.nmID) {
      body.settings.cursor.updatedAt=cursor.updatedAt;
      body.settings.cursor.nmID=cursor.nmID;
    }
    const resp=wbContentRequest_('/content/v2/get/cards/list','post',body,'Импорт каталога WB').json || {};
    const data=resp.data || resp;
    const cards=Array.isArray(data.cards) ? data.cards : [];
    cards.forEach(c=>all.push(normalizeWbCard_(c)));
    const next=data.cursor || {};
    if (!cards.length || !next.updatedAt || !next.nmID) break;
    if (cursor && String(next.updatedAt)===String(cursor.updatedAt) && String(next.nmID)===String(cursor.nmID)) break;
    cursor={updatedAt:next.updatedAt,nmID:next.nmID};
    safety++;
  } while (safety<10000);
  return dedupeCatalog_(all,'id');
}

function normalizeWbCard_(c) {
  const barcodes=[], chrtIds=[];
  (c.sizes||[]).forEach(s=>{ const cid=asText_(s.chrtID||s.chrtId); if(cid&&chrtIds.indexOf(cid)<0)chrtIds.push(cid); (s.skus||[]).forEach(x=>{ if(asText_(x)) barcodes.push(asText_(x)); }); });
  const chrtId=chrtIds.length===1?chrtIds[0]:'';
  return {
    marketplace:'WB',
    id:asText_(c.nmID),
    offer:asText_(c.vendorCode),
    name:asText_(c.title),
    barcode:barcodes[0]||'',
    barcodes:Array.from(new Set(barcodes)),
    subject:asText_(c.subjectName),
    subjectId:asText_(c.subjectID||c.subjectId),
    dimensions:{
      length:toNumber_(c.dimensions&&c.dimensions.length),
      width:toNumber_(c.dimensions&&c.dimensions.width),
      height:toNumber_(c.dimensions&&c.dimensions.height)
    },
    chrtId:chrtId,
    sizeCount:chrtIds.length,
    raw:c
  };
}

function ozonFetchCatalog_() {
  const list=[];
  let lastId='';
  let safety=0;
  do {
    const body={filter:{visibility:'ALL'},last_id:lastId,limit:1000};
    const resp=ozonRequest_('/v3/product/list',body,'Импорт каталога Ozon').json || {};
    const result=resp.result || resp;
    const items=Array.isArray(result.items) ? result.items : [];
    items.forEach(x=>list.push({
      marketplace:'Ozon', id:asText_(x.product_id||x.id), offer:asText_(x.offer_id), sku:asText_(x.sku), name:'', barcode:'', barcodes:[], raw:x
    }));
    const next=asText_(result.last_id||resp.last_id);
    if (!items.length || !next || next===lastId) break;
    lastId=next;
    safety++;
  } while (safety<10000);

  const unique=dedupeCatalog_(list,'id');
  const byId={}; unique.forEach(x=>{ if(x.id) byId[x.id]=x; });
  const ids=unique.map(x=>x.id).filter(Boolean);
  for (let i=0;i<ids.length;i+=1000) {
    const batch=ids.slice(i,i+1000);
    const resp=ozonRequest_('/v3/products/info/attributes',{filter:{product_id:batch},limit:1000},'Атрибуты товаров Ozon').json || {};
    const attrs=Array.isArray(resp.result) ? resp.result : (resp.result && Array.isArray(resp.result.items) ? resp.result.items : []);
    attrs.forEach(a=>{
      const id=asText_(a.id||a.product_id);
      const row=byId[id]; if(!row) return;
      row.name=asText_(a.name)||row.name;
      const bc=[];
      if(asText_(a.barcode)) bc.push(asText_(a.barcode));
      (a.barcodes||[]).forEach(x=>{ const v=typeof x==='object' ? asText_(x.barcode||x.value) : asText_(x); if(v) bc.push(v); });
      row.barcodes=Array.from(new Set(bc)); row.barcode=row.barcodes[0]||'';
      row.descriptionCategoryId=asText_(a.description_category_id);
      row.typeId=asText_(a.type_id);
      row.rawAttributes=a;
    });
  }
  return unique;
}

function dedupeCatalog_(arr,key) {
  const seen={}; const out=[];
  arr.forEach(x=>{ const k=asText_(x[key]); if(!k || seen[k]) return; seen[k]=true; out.push(x); });
  return out;
}

function readCatalogSideFromMatching_(side) {
  const sh=sheet_(APP.SHEETS.MATCHING); if(sh.getLastRow()<=1) return [];
  const h=findHeaderMap_(sh); const rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  const out=[]; const seen={};
  rows.forEach(r=>{
    if(side==='WB') {
      const id=asText_(r[h['WB NMID']-1]); if(!id || seen[id]) return; seen[id]=1;
      out.push({marketplace:'WB',id:id,offer:asText_(r[h['WB артикул']-1]),name:asText_(r[h['WB наименование']-1]),barcode:asText_(r[h['WB штрихкод']-1]),barcodes:[asText_(r[h['WB штрихкод']-1])].filter(Boolean)});
    } else {
      const id=asText_(r[h['Ozon Product ID']-1]); if(!id || seen[id]) return; seen[id]=1;
      out.push({marketplace:'Ozon',id:id,offer:asText_(r[h['Ozon Offer ID']-1]),name:asText_(r[h['Ozon наименование']-1]),barcode:asText_(r[h['Ozon штрихкод']-1]),barcodes:[asText_(r[h['Ozon штрихкод']-1])].filter(Boolean)});
    }
  });
  return out;
}
/* ===== Matching.gs ===== */
/** Автосопоставление: артикул -> штрихкод -> название. */
function runMatching() {
  const wb=readCatalogSideFromMatching_('WB');
  const ozon=readCatalogSideFromMatching_('Ozon');
  const r=rebuildMatchingAndStock_(wb,ozon,{useWb:boolText_(getSetting_('Использовать WB','Нет')),useOzon:boolText_(getSetting_('Использовать Ozon','Нет'))});
  toast_('Сопоставление обновлено.');
  return r;
}

function rebuildMatchingAndStock_(wb,ozon,opts) {
  const existing=readExistingMatchingState_();
  const matches=matchCatalogs_(wb||[],ozon||[],existing);
  writeMatching_(matches);
  writeStockFromMatches_(matches,existing.stockByInternalId||{});
  return {processed:matches.length,success:matches.filter(x=>x.status!=='Требует проверки').length,errors:matches.filter(x=>x.status==='Требует проверки').length};
}

function matchCatalogs_(wb,ozon,existing) {
  const usedOzon={}; const result=[];
  const ozByOffer=uniqueIndex_(ozon,x=>normKey_(x.offer));
  const ozByBarcode=multiIndex_(ozon,x=>(x.barcodes&&x.barcodes.length?x.barcodes:[x.barcode]).map(normBarcode_).filter(Boolean));
  const ozByName=uniqueIndex_(ozon,x=>normName_(x.name));

  wb.forEach(w=>{
    let o=null, foundBy='', ambiguous=false;
    const preserved=existing.manualByWbId[w.id];
    if(preserved && preserved.ozonId) {
      o=ozon.find(x=>x.id===preserved.ozonId)||null;
      if(o && !usedOzon[o.id]) foundBy='Ручное подтверждение'; else o=null;
    }
    if(!o && w.offer) {
      const cand=ozByOffer[normKey_(w.offer)];
      if(cand && !usedOzon[cand.id]) {o=cand;foundBy='Артикул';}
    }
    if(!o) {
      const ids={};
      (w.barcodes&&w.barcodes.length?w.barcodes:[w.barcode]).map(normBarcode_).filter(Boolean).forEach(b=>(ozByBarcode[b]||[]).forEach(c=>{if(!usedOzon[c.id]) ids[c.id]=c;}));
      const vals=Object.keys(ids).map(k=>ids[k]);
      if(vals.length===1){o=vals[0];foundBy='Штрихкод';}
      else if(vals.length>1) ambiguous=true;
    }
    if(!o && !ambiguous && w.name) {
      const cand=ozByName[normName_(w.name)];
      if(cand && !usedOzon[cand.id]) {o=cand;foundBy='Название';}
    }
    if(o) usedOzon[o.id]=true;
    const prevId=findExistingInternalId_(existing,w,o);
    result.push(makeMatch_(prevId||uuid_(),w,o,ambiguous?'Требует проверки':(o?'Сопоставлен':'Только WB'),foundBy,!!(preserved&&o&&preserved.ozonId===o.id)));
  });

  ozon.forEach(o=>{
    if(usedOzon[o.id]) return;
    const prevId=findExistingInternalId_(existing,null,o);
    result.push(makeMatch_(prevId||uuid_(),null,o,'Только Ozon','',false));
  });
  return result;
}

function makeMatch_(internalId,w,o,status,foundBy,manual) {
  return {internalId:internalId,wb:w||null,ozon:o||null,status:status,foundBy:foundBy||'',manual:manual||false,confidence:foundBy==='Артикул'?'Высокая':foundBy==='Штрихкод'?'Высокая':foundBy==='Название'?'Средняя':foundBy==='Ручное подтверждение'?'Подтверждено':''};
}

function uniqueIndex_(arr,keyFn){ const temp={}; arr.forEach(x=>{const k=keyFn(x);if(!k)return;if(!temp[k])temp[k]=[];temp[k].push(x);}); const out={}; Object.keys(temp).forEach(k=>{if(temp[k].length===1)out[k]=temp[k][0];}); return out; }
function multiIndex_(arr,keysFn){ const out={}; arr.forEach(x=>{const keys=keysFn(x)||[]; keys.forEach(k=>{if(!out[k])out[k]=[];out[k].push(x);});}); return out; }
function normKey_(s){return asText_(s).toLowerCase().replace(/\s+/g,'');}
function normBarcode_(s){return asText_(s).replace(/\s+/g,'');}
function normName_(s){return asText_(s).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').replace(/\s+/g,' ').trim();}

function readExistingMatchingState_(){
  const out={internalByWbId:{},internalByOzonId:{},manualByWbId:{},stockByInternalId:{}};
  const m=sheet_(APP.SHEETS.MATCHING); if(m.getLastRow()>1){const h=findHeaderMap_(m);m.getRange(2,1,m.getLastRow()-1,m.getLastColumn()).getValues().forEach(r=>{const iid=asText_(r[h['Внутренний ID']-1]),wid=asText_(r[h['WB NMID']-1]),oid=asText_(r[h['Ozon Product ID']-1]);if(wid)out.internalByWbId[wid]=iid;if(oid)out.internalByOzonId[oid]=iid;if(wid&&r[h['Подтверждено вручную']-1]===true)out.manualByWbId[wid]={internalId:iid,ozonId:oid};});}
  const s=sheet_(APP.SHEETS.STOCK); if(s.getLastRow()>1){const h=findHeaderMap_(s);s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues().forEach(r=>{const iid=asText_(r[h['Внутренний ID']-1]);if(!iid)return;const o={};Object.keys(h).forEach(k=>o[k]=r[h[k]-1]);out.stockByInternalId[iid]=o;});}
  return out;
}
function findExistingInternalId_(existing,w,o){return (w&&existing.internalByWbId[w.id])||(o&&existing.internalByOzonId[o.id])||'';}

function writeMatching_(matches){
  const sh=sheet_(APP.SHEETS.MATCHING), headers=SHEET_SCHEMAS[APP.SHEETS.MATCHING];
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  const rows=matches.map(m=>[m.internalId,m.wb?m.wb.id:'',m.wb?m.wb.offer:'',m.wb?m.wb.name:'',m.wb?m.wb.barcode:'',m.ozon?m.ozon.id:'',m.ozon?m.ozon.offer:'',m.ozon?m.ozon.name:'',m.ozon?m.ozon.barcode:'',m.foundBy,m.confidence,m.status,m.manual,'']);
  if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}

function writeStockFromMatches_(matches,old){
  const sh=sheet_(APP.SHEETS.STOCK), headers=SHEET_SCHEMAS[APP.SHEETS.STOCK];
  const rows=matches.map(m=>{
    const hasPrev=Object.prototype.hasOwnProperty.call(old,m.internalId); const prev=old[m.internalId]||{}; const w=m.wb,o=m.ozon; const name=w&&w.name?w.name:(o&&o.name?o.name:''); const source=w&&w.name?'WB':(o&&o.name?'Ozon':'');
    const stockValue=hasPrev ? prev['Фактический остаток'] : '';
    const wbCodes=w ? ((w.barcodes&&w.barcodes.length)?w.barcodes.join(', '):(prev['WB SKU / barcode']||w.barcode||'')) : '';
    const ozSku=o ? (o.sku||prev['Ozon SKU']||'') : '';
    const dims=w&&w.dimensions||{};
    return [m.internalId,name,prev['Категория']||'',w&&w.offer?w.offer:(o&&o.offer?o.offer:''),w&&w.barcode?w.barcode:(o&&o.barcode?o.barcode:''),prev['Себестоимость']||'',stockValue,prev['Срок поставки, дней']||'',prev['Запас, дней']||'',prev['Маржинальность товара, %']||'',prev['Используемая маржинальность, %']||'',!!w,w?w.id:'',w?w.offer:'',wbCodes,!!o,o?o.id:'',o?o.offer:'',ozSku,m.status,source,prev['Последнее движение']||'',now_(),w?(w.chrtId||prev['WB chrtId (служебно)']||''):(prev['WB chrtId (служебно)']||''),w?(w.subjectId||prev['WB Subject ID (служебно)']||''):(prev['WB Subject ID (служебно)']||''),w?(dims.length||prev['WB Длина, см (служебно)']||''):(prev['WB Длина, см (служебно)']||''),w?(dims.width||prev['WB Ширина, см (служебно)']||''):(prev['WB Ширина, см (служебно)']||''),w?(dims.height||prev['WB Высота, см (служебно)']||''):(prev['WB Высота, см (служебно)']||'')];
  });
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}
/* ===== Orders.gs ===== */
function processWbOrders(){
  if(!boolText_(getSetting_('Использовать WB','Нет'))) return {processed:0,success:0,errors:0};
  const lock=LockService.getScriptLock(); if(!lock.tryLock(5000)) throw new Error('Склад занят другим регламентом.');
  let changed=0,errors=0,processed=0;
  try{
    const selected=selectedWarehouse_('WB');
    const r=wbMarketplaceRequest_('/api/v3/orders/new','get',undefined,'Заказы WB').json||{};
    const orders=Array.isArray(r.orders)?r.orders:[];
    const ledger=orderLedgerState_();
    orders.forEach(o=>{
      if(asText_(o.warehouseId)!==selected.id) return;
      const key=ledgerKey_('WB',o.id,o.id), existing=ledger.byKey[key]; if(existing&&existing.deducted) return;
      processed++;
      try{
        const stock=findStockForWbOrder_(o); if(!stock) throw new Error('Товар WB не найден на общем складе: nmId '+asText_(o.nmId)+', артикул '+asText_(o.article));
        changePhysicalStock_(stock.row,-1,'Заказ WB '+asText_(o.id));
        writeOrderLedger_(existing&&existing.row,{marketplace:'WB',orderId:asText_(o.id),itemId:asText_(o.id),internalId:stock.internalId,article:stock.article,qty:1,date:o.createdAt||now_(),status:'new|waiting',deducted:true,deductedAt:now_(),cancelled:false,returned:0,lastCheck:now_(),error:''});
        changed++;
      }catch(e){errors++; writeOrderLedger_(existing&&existing.row,{marketplace:'WB',orderId:asText_(o.id),itemId:asText_(o.id),internalId:'',article:asText_(o.article),qty:1,date:o.createdAt||now_(),status:'Ошибка',deducted:false,cancelled:false,returned:0,lastCheck:now_(),error:e.message}); notify_({level:'Критическая ошибка',type:'Не удалось списать заказ WB',marketplace:'WB',object:asText_(o.id),message:e.message});}
    });
    changed+=refreshWbTrackedStatuses_();
  } finally { lock.releaseLock(); }
  if(changed) maybeAutoSyncStocks_();
  return {processed:processed,success:Math.max(0,processed-errors),errors:errors};
}

function refreshWbTrackedStatuses_(){
  const sh=sheet_(APP.SHEETS.ORDER_LOG); if(sh.getLastRow()<=1) return 0;
  const h=findHeaderMap_(sh), rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  const targets=[];
  rows.forEach((r,i)=>{ if(asText_(r[h['Маркетплейс']-1])!=='WB')return; if(r[h['Списано со склада']-1]!==true)return; if(Number(r[h['Количество возвращено']-1]||0)>0)return; const st=asText_(r[h['Текущий статус']-1]); if(wbStatusIsFinal_(st))return; targets.push({row:i+2,id:asText_(r[h['ID заказа']-1]),qty:Number(r[h['Количество']-1]||1),internalId:asText_(r[h['Внутренний ID товара']-1]),prevStatus:st}); });
  let changed=0;
  for(let i=0;i<targets.length;i+=1000){
    const batch=targets.slice(i,i+1000); if(!batch.length)continue;
    const ids=batch.map(x=>Number(x.id)); if(ids.some(x=>!Number.isSafeInteger(x))) throw new Error('WB: ID заказа не помещается в безопасное число JavaScript.');
    const r=wbMarketplaceRequest_('/api/v3/orders/status','post',{orders:ids},'Статусы заказов WB').json||{};
    const statuses={}; (r.orders||[]).forEach(x=>statuses[asText_(x.id)]=x);
    batch.forEach(t=>{ const s=statuses[t.id]; if(!s)return; const status=asText_(s.supplierStatus)+'|'+asText_(s.wbStatus); sh.getRange(t.row,h['Текущий статус']).setValue(status); sh.getRange(t.row,h['Последняя проверка']).setValue(now_()); if(wbStatusCancelled_(s) && !wbStatusWasShipped_(t.prevStatus)){ const stock=findStockByInternalId_(t.internalId); if(stock){changePhysicalStock_(stock.row,t.qty,'Отмена WB '+t.id); sh.getRange(t.row,h['Отменён до отправки']).setValue(true); sh.getRange(t.row,h['Количество возвращено']).setValue(t.qty); sh.getRange(t.row,h['Дата возврата']).setValue(now_()); changed+=t.qty;} } });
  }
  return changed;
}
function wbStatusCancelled_(s){return ['cancel','cancel_carrier'].indexOf(asText_(s.supplierStatus))>=0||['canceled','canceled_by_client','declined_by_client','defect','canceled_by_carrier'].indexOf(asText_(s.wbStatus))>=0;}
function wbStatusWasShipped_(st){const p=String(st||'').split('|');return p[0]==='complete'||['sorted','sold','ready_for_pickup','postponed_delivery','accepted_by_carrier','sent_to_carrier'].indexOf(p[1])>=0;}
function wbStatusIsFinal_(st){const p=String(st||'').split('|');return ['sold','canceled','canceled_by_client','declined_by_client','defect','canceled_by_carrier'].indexOf(p[1])>=0;}

function processOzonOrders(){
  if(!boolText_(getSetting_('Использовать Ozon','Нет'))) return {processed:0,success:0,errors:0};
  const lock=LockService.getScriptLock(); if(!lock.tryLock(5000)) throw new Error('Склад занят другим регламентом.');
  let changed=0,processed=0,errors=0;
  try{
    const selected=selectedWarehouse_('Ozon');
    const postings=ozonRecentFbsPostings_(selected.id);
    const ledger=orderLedgerState_();
    const currentByPosting={}; postings.forEach(p=>currentByPosting[asText_(p.posting_number)]=p);
    postings.filter(p=>asText_(p.status)==='awaiting_packaging').forEach(p=>{
      (p.products||[]).forEach((prod,idx)=>{
        const itemId=asText_(prod.offer_id)||asText_(prod.sku)||String(idx); const key=ledgerKey_('Ozon',p.posting_number,itemId), existing=ledger.byKey[key]; if(existing&&existing.deducted) return;
        processed++; const qty=Math.max(1,Number(prod.quantity||1));
        try{ const stock=findStockForOzonProduct_(prod); if(!stock)throw new Error('Товар Ozon не найден на общем складе: '+itemId); changePhysicalStock_(stock.row,-qty,'Заказ Ozon '+asText_(p.posting_number)); writeOrderLedger_(existing&&existing.row,{marketplace:'Ozon',orderId:asText_(p.posting_number),itemId:itemId,internalId:stock.internalId,article:stock.article,qty:qty,date:p.in_process_at||p.created_at||now_(),status:'awaiting_packaging',deducted:true,deductedAt:now_(),cancelled:false,returned:0,lastCheck:now_(),error:''}); changed+=qty; }
        catch(e){errors++;writeOrderLedger_(existing&&existing.row,{marketplace:'Ozon',orderId:asText_(p.posting_number),itemId:itemId,internalId:'',article:asText_(prod.offer_id),qty:qty,date:p.in_process_at||p.created_at||now_(),status:'Ошибка',deducted:false,cancelled:false,returned:0,lastCheck:now_(),error:e.message});notify_({level:'Критическая ошибка',type:'Не удалось списать заказ Ozon',marketplace:'Ozon',object:asText_(p.posting_number),message:e.message});}
      });
    });
    changed+=refreshOzonTrackedStatuses_(currentByPosting);
  } finally { lock.releaseLock(); }
  if(changed) maybeAutoSyncStocks_();
  return {processed:processed,success:Math.max(0,processed-errors),errors:errors};
}

function ozonRecentFbsPostings_(warehouseId){
  const since=new Date(Date.now()-30*86400000).toISOString(), to=new Date(Date.now()+86400000).toISOString(); const all=[]; let offset=0;
  for(let page=0;page<100;page++){
    const filter={since:since,to:to}; if(warehouseId) filter.warehouse_id=[Number(warehouseId)];
    const r=ozonRequest_('/v3/posting/fbs/list',{dir:'ASC',filter:filter,with:{analytics_data:true},limit:500,offset:offset},'Заказы Ozon').json||{};
    const result=r.result||r, posts=Array.isArray(result.postings)?result.postings:[]; all.push.apply(all,posts); if(posts.length<500)break; offset+=posts.length;
  }
  return all;
}

function refreshOzonTrackedStatuses_(byPosting){
  const sh=sheet_(APP.SHEETS.ORDER_LOG); if(sh.getLastRow()<=1)return 0; const h=findHeaderMap_(sh), rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(); let changed=0;
  rows.forEach((r,i)=>{ if(asText_(r[h['Маркетплейс']-1])!=='Ozon'||r[h['Списано со склада']-1]!==true||Number(r[h['Количество возвращено']-1]||0)>0)return; const posting=byPosting[asText_(r[h['ID заказа']-1])]; if(!posting)return; const status=asText_(posting.status), prev=asText_(r[h['Текущий статус']-1]); sh.getRange(i+2,h['Текущий статус']).setValue(status); sh.getRange(i+2,h['Последняя проверка']).setValue(now_()); if(status==='cancelled' && ['awaiting_packaging','awaiting_deliver'].indexOf(prev)>=0){ const stock=findStockByInternalId_(asText_(r[h['Внутренний ID товара']-1])); const qty=Number(r[h['Количество']-1]||0); if(stock&&qty>0){changePhysicalStock_(stock.row,qty,'Отмена Ozon '+asText_(r[h['ID заказа']-1])); sh.getRange(i+2,h['Отменён до отправки']).setValue(true); sh.getRange(i+2,h['Количество возвращено']).setValue(qty); sh.getRange(i+2,h['Дата возврата']).setValue(now_()); changed+=qty;} } });
  return changed;
}

function orderLedgerState_(){ const sh=sheet_(APP.SHEETS.ORDER_LOG), out={byKey:{}}; if(sh.getLastRow()<=1)return out; const h=findHeaderMap_(sh); sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{out.byKey[ledgerKey_(r[h['Маркетплейс']-1],r[h['ID заказа']-1],r[h['ID позиции заказа']-1])]={row:i+2,deducted:r[h['Списано со склада']-1]===true};}); return out; }
function ledgerKey_(m,o,i){return asText_(m)+'|'+asText_(o)+'|'+asText_(i);}
function writeOrderLedger_(row,x){ const sh=sheet_(APP.SHEETS.ORDER_LOG), values=[x.marketplace,x.orderId,x.itemId,x.internalId,x.article,x.qty,x.date,x.status,!!x.deducted,x.deductedAt||'',!!x.cancelled,x.returned||0,x.returnedAt||'',x.lastCheck||now_(),x.error||'']; if(row)sh.getRange(row,1,1,values.length).setValues([values]);else sh.appendRow(values); }

function stockIndex_(){ const sh=sheet_(APP.SHEETS.STOCK), out={rows:{},wbNm:{},wbArticle:{},wbBarcode:{},ozOffer:{},ozSku:{}}; if(sh.getLastRow()<=1)return out; const h=findHeaderMap_(sh); sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{const row=i+2, iid=asText_(r[h['Внутренний ID']-1]); const o={row:row,internalId:iid,article:asText_(r[h['Артикул основной']-1])}; if(iid){out.rows[iid]=o;} const nm=asText_(r[h['WB NMID']-1]);if(nm)out.wbNm[nm]=o;const a=asText_(r[h['WB артикул']-1]);if(a)out.wbArticle[normKey_(a)]=o; asText_(r[h['WB SKU / barcode']-1]).split(',').map(normBarcode_).filter(Boolean).forEach(b=>out.wbBarcode[b]=o); const off=asText_(r[h['Ozon Offer ID']-1]);if(off)out.ozOffer[normKey_(off)]=o;const sku=asText_(r[h['Ozon SKU']-1]);if(sku)out.ozSku[sku]=o;}); return out; }
function findStockByInternalId_(id){return stockIndex_().rows[asText_(id)]||null;}
function findStockForWbOrder_(o){const x=stockIndex_();return x.wbNm[asText_(o.nmId)]||x.wbArticle[normKey_(o.article)]||((o.skus||[]).map(normBarcode_).map(b=>x.wbBarcode[b]).find(Boolean))||null;}
function findStockForOzonProduct_(p){const x=stockIndex_();return x.ozOffer[normKey_(p.offer_id)]||x.ozSku[asText_(p.sku)]||null;}
function changePhysicalStock_(row,delta,reason){ const sh=sheet_(APP.SHEETS.STOCK), h=findHeaderMap_(sh), c=h['Фактический остаток']; const cell=sh.getRange(row,c), raw=cell.getValue(); if(raw===''||raw===null)throw new Error('Не заполнен фактический остаток для строки '+row+'.'); const old=Number(raw); if(!Number.isFinite(old))throw new Error('Некорректный фактический остаток в строке '+row+'.'); const next=old+Number(delta); cell.setValue(next); sh.getRange(row,h['Последнее движение']).setValue(now_()); if(next<0)notify_({level:'Критическая ошибка',type:'Отрицательный остаток',object:asText_(sh.getRange(row,h['Наименование']).getValue()),message:reason+': остаток стал '+next}); return next; }
function maybeAutoSyncStocks_(){ if(boolText_(getSetting_('Автоматическая отправка остатков','Выкл'))&&boolText_(getSetting_(APP.SAFE_GUARDS.SEND_STOCKS,'Нет'))) syncStocks(); }
/* ===== Stocks.gs ===== */
function syncStocks(){
  assertGuard_(APP.SAFE_GUARDS.SEND_STOCKS);
  const useWb=boolText_(getSetting_('Использовать WB','Нет')), useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  const sh=sheet_(APP.SHEETS.STOCK), h=findHeaderMap_(sh); if(sh.getLastRow()<=1)return {processed:0,success:0,errors:0};
  const rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(); let processed=0,success=0,errors=0;
  if(useWb){ const wh=selectedWarehouse_('WB'), payload=[]; let missingChrt=0; rows.forEach((r,i)=>{if(!r[h['WB подключён']-1])return;const fact=r[h['Фактический остаток']-1], chrt=asText_(r[h['WB chrtId (служебно)']-1]);if(fact==='')return;if(!chrt){missingChrt++;return;}payload.push({chrtId:Number(chrt),amount:Math.max(0,Math.floor(Number(fact))),row:i+2});}); if(missingChrt){errors+=missingChrt;notify_({level:'Предупреждение',type:'Не отправлены остатки WB',marketplace:'WB',message:'У '+missingChrt+' товаров нет однозначного chrtId (например, карточка содержит несколько размеров). Остатки по ним не отправлены.'});} for(let i=0;i<payload.length;i+=1000){const b=payload.slice(i,i+1000);try{wbMarketplaceRequest_('/api/v3/stocks/'+encodeURIComponent(wh.id),'put',{stocks:b.map(x=>({chrtId:x.chrtId,amount:x.amount}))},'Остатки WB');processed+=b.length;success+=b.length;}catch(e){processed+=b.length;errors+=b.length;notify_({level:'Критическая ошибка',type:'Ошибка отправки остатков',marketplace:'WB',message:e.message});}} }
  if(useOzon){ const wh=selectedWarehouse_('Ozon'), payload=[]; rows.forEach((r,i)=>{if(!r[h['Ozon подключён']-1])return;const fact=r[h['Фактический остаток']-1], offer=asText_(r[h['Ozon Offer ID']-1]);if(fact===''||!offer)return;payload.push({offer_id:offer,stock:Math.max(0,Math.floor(Number(fact))),warehouse_id:Number(wh.id),row:i+2});}); for(let i=0;i<payload.length;i+=100){const b=payload.slice(i,i+100);try{const resp=ozonRequest_('/v2/products/stocks',{stocks:b.map(x=>({offer_id:x.offer_id,stock:x.stock,warehouse_id:x.warehouse_id}))},'Остатки Ozon').json||{};processed+=b.length; const results=resp.result||resp.stocks||[]; if(Array.isArray(results)&&results.length){results.forEach(x=>{if(x.updated===false||x.errors&&x.errors.length)errors++;else success++;});}else success+=b.length;}catch(e){processed+=b.length;errors+=b.length;notify_({level:'Критическая ошибка',type:'Ошибка отправки остатков',marketplace:'Ozon',message:e.message});}} }
  setSetting_('Последняя синхронизация',formatDateTime_(now_())); if(h['Последняя синхронизация']&&rows.length)sh.getRange(2,h['Последняя синхронизация'],rows.length,1).setValues(rows.map(()=>[now_()]));
  return {processed:processed,success:success,errors:errors};
}
/* ===== Prices.gs ===== */
/**
 * Цены и маржинальность.
 * Приоритет маржи: товар -> категория -> значение по умолчанию.
 * Ручной режим задаётся отдельно для WB и Ozon.
 */
function calculatePrices(){
  const started=Date.now(), stock=priceStockRows_(), old=readExistingPriceRows_();
  const useWb=boolText_(getSetting_('Использовать WB','Нет')), useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  const marginCtx=priceMarginContext_();
  let wbPrices={}, wbEconomics={commissions:{},tariffs:[]}, ozPrices={};

  if(useWb){
    const nmIds=stock.filter(x=>x.wbNm).map(x=>Number(x.wbNm)).filter(Number.isFinite);
    wbPrices=wbFetchCurrentPrices_(nmIds);
    wbEconomics=wbFetchEconomics_();
  }
  if(useOzon){
    const offers=stock.filter(x=>x.ozOffer).map(x=>x.ozOffer);
    ozPrices=ozonFetchCurrentPrices_(offers);
  }

  const defaultMode=asText_(getSetting_('Режим цены по умолчанию','Авто'))||'Авто';
  const now=now_(), rows=[];
  stock.forEach(item=>{
    const saved=old[item.internalId]||{};
    const margin=resolveMargin_(item,marginCtx);
    const cost=toNumber_(item.cost);
    const requiredNet=cost>0 ? cost*(1+margin) : 0;

    let wbCurrent='',wbCalc='',wbMin='',wbStatus=useWb&&item.wbNm?'ГОТОВО':'НЕ ПОДКЛЮЧЕН';
    let ozCurrent='',ozCalc='',ozMin='',ozStatus=useOzon&&item.ozOffer?'ГОТОВО':'НЕ ПОДКЛЮЧЕН';

    if(useWb&&item.wbNm){
      const p=wbPrices[item.wbNm]||{}; wbCurrent=wbCurrentSellerPrice_(p)||'';
      const econ=wbEconomicsForItem_(item,wbEconomics);
      if(cost<=0){ wbStatus='НЕТ СЕБЕСТОИМОСТИ'; }
      else if(!econ.ok){ wbStatus=econ.error; }
      else {
        wbCalc=requiredPrice_(requiredNet,econ.commissionRate,econ.logistics); wbMin=wbCalc;
        wbStatus='ГОТОВО — комиссия '+Math.round(econ.commissionRate*1000)/10+'%, логистика ~'+Math.round(econ.logistics)+' ₽';
      }
    }

    if(useOzon&&item.ozOffer){
      const p=ozPrices[item.ozOffer]||{}; ozCurrent=ozExtractCurrentPrice_(p)||'';
      const econ=ozExtractPriceExpenses_(p);
      if(cost<=0){ ozStatus='НЕТ СЕБЕСТОИМОСТИ'; }
      else if(!econ.hasCommission){ ozStatus='НЕТ ДАННЫХ КОМИССИИ OZON'; }
      else {
        ozCalc=requiredPrice_(requiredNet,econ.commissionRate,econ.logistics); ozMin=ozCalc;
        ozStatus='ГОТОВО — комиссия '+Math.round(econ.commissionRate*1000)/10+'%, логистика ~'+Math.round(econ.logistics)+' ₽';
      }
    }

    const wbMode=normalizePriceMode_(saved['WB режим']||defaultMode), ozMode=normalizePriceMode_(saved['Ozon режим']||defaultMode);
    const wbManual=Math.max(0,toNumber_(saved['WB ручная цена'])), ozManual=Math.max(0,toNumber_(saved['Ozon ручная цена']));
    const wbToSend=wbMode==='Ручной' ? (wbManual||'') : (wbCalc||'');
    const ozToSend=ozMode==='Ручной' ? (ozManual||'') : (ozCalc||'');
    if(wbMode==='Ручной'&&!wbManual&&item.wbNm) wbStatus='РУЧНОЙ РЕЖИМ — НЕ ЗАДАНА ЦЕНА';
    if(ozMode==='Ручной'&&!ozManual&&item.ozOffer) ozStatus='РУЧНОЙ РЕЖИМ — НЕ ЗАДАНА ЦЕНА';

    writeUsedMarginToStock_(item.row,margin);
    rows.push([
      item.internalId,item.name,item.category,item.cost||'',Math.round(margin*10000)/100,
      wbCurrent,wbCalc,wbMin,wbMode,wbManual||'',wbToSend,wbStatus,
      ozCurrent,ozCalc,ozMin,ozMode,ozManual||'',ozToSend,ozStatus,
      now,saved['Последняя отправка']||'',priceErrorText_(wbStatus,ozStatus)
    ]);
  });

  const sh=sheet_(APP.SHEETS.PRICES), headers=SHEET_SCHEMAS[APP.SHEETS.PRICES];
  if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent().clearDataValidations();
  if(rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
  applyPriceSheetValidation_();
  logEvent_({regulation:'Расчёт цен',runType:'Ручной',result:'Успешно',processed:rows.length,success:rows.length,errors:rows.filter(r=>r[21]).length,duration:Math.round((Date.now()-started)/1000)});
  toast_('Цены рассчитаны: '+rows.length+' товаров.');
  return {processed:rows.length,success:rows.length-rows.filter(r=>r[21]).length,errors:rows.filter(r=>r[21]).length};
}

function syncPrices(automatic){
  if(automatic===true && !boolText_(getSetting_('Автоматическая установка цен','Выкл'))) return {processed:0,success:0,errors:0};
  calculatePrices();
  let p=0,s=0,e=0;
  if(boolText_(getSetting_('Использовать WB','Нет'))){const r=sendWbPrices();p+=r.processed||0;s+=r.success||0;e+=r.errors||0;}
  if(boolText_(getSetting_('Использовать Ozon','Нет'))){const r=sendOzonPrices();p+=r.processed||0;s+=r.success||0;e+=r.errors||0;}
  return {processed:p,success:s,errors:e};
}

function sendWbPrices(){
  assertGuard_(APP.SAFE_GUARDS.SEND_PRICES);
  const sh=sheet_(APP.SHEETS.PRICES), rows=priceRowsForSend_('WB');
  if(!rows.length){toast_('WB: нет цен, требующих отправки.');return {processed:0,success:0,errors:0};}
  protectMassPriceChange_('WB',rows);
  const current=wbFetchCurrentPrices_(rows.map(x=>Number(x.marketId)).filter(Number.isFinite));
  const general=[], sizes=[], accepted=[]; let errors=0;
  rows.forEach(x=>{
    try{
      const p=current[x.marketId]||{};
      if(Math.abs(toNumber_(x.target)-wbCurrentSellerPrice_(p))<1){ markPriceSendResult_(x.row,'WB','БЕЗ ИЗМЕНЕНИЙ',''); return; }
      if(p.editableSizePrice===true){
        const sizeRows=wbFetchSizes_(x.marketId); if(!sizeRows.length) throw new Error('WB не вернул размеры для поразмерной цены.');
        sizeRows.forEach(sz=>sizes.push({nmID:Number(x.marketId),sizeID:Number(sz.sizeID),price:Math.round(x.target)}));
        general.push({nmID:Number(x.marketId),discount:0});
      } else general.push({nmID:Number(x.marketId),price:Math.round(x.target),discount:0});
      accepted.push(x);
    }catch(err){errors++;markPriceSendResult_(x.row,'WB','ОШИБКА',err.message);}
  });
  chunkArray_(sizes,1000).forEach(part=>{ if(part.length) wbPricesRequest_('/api/v2/upload/task/size','post',{data:part},'Цены WB'); });
  chunkArray_(general,1000).forEach(part=>{ if(part.length) wbPricesRequest_('/api/v2/upload/task','post',{data:part},'Цены WB'); });
  accepted.forEach(x=>markPriceSendResult_(x.row,'WB','ОТПРАВЛЕНО',''));
  return {processed:rows.length,success:rows.length-errors,errors:errors};
}

function sendOzonPrices(){
  assertGuard_(APP.SAFE_GUARDS.SEND_PRICES);
  const rows=priceRowsForSend_('Ozon');
  if(!rows.length){toast_('Ozon: нет цен, требующих отправки.');return {processed:0,success:0,errors:0};}
  protectMassPriceChange_('Ozon',rows);
  let success=0,errors=0;
  chunkArray_(rows,100).forEach(part=>{
    const body={prices:part.map(x=>{
      const item={offer_id:x.marketId,price:String(Math.round(x.target)),currency_code:'RUB'};
      const safeMin=Math.max(0,Math.min(Math.round(x.minimum||0),Math.round(x.target)-1));
      if(safeMin>0) item.min_price=String(safeMin);
      return item;
    })};
    try{
      const resp=ozonRequest_('/v1/product/import/prices',body,'Цены Ozon').json||{};
      const result=Array.isArray(resp.result)?resp.result:(Array.isArray(resp.items)?resp.items:[]),by={};
      result.forEach(z=>by[asText_(z.offer_id)]=z);
      part.forEach(x=>{
        const z=by[x.marketId]; const errs=z&&(z.errors||z.error)||[];
        const text=Array.isArray(errs)?errs.map(a=>asText_(a.message||a.code||a)).filter(Boolean).join('; '):asText_(errs);
        if(!z || z.updated===false || text){errors++;markPriceSendResult_(x.row,'Ozon','ОШИБКА',text||'Ozon не подтвердил обновление цены.');}
        else {success++;markPriceSendResult_(x.row,'Ozon','ОТПРАВЛЕНО','');}
      });
    }catch(err){part.forEach(x=>markPriceSendResult_(x.row,'Ozon','ОШИБКА',err.message));errors+=part.length;}
  });
  return {processed:rows.length,success:success,errors:errors};
}

function priceStockRows_(){
  const sh=sheet_(APP.SHEETS.STOCK), h=findHeaderMap_(sh); if(sh.getLastRow()<=1)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map((r,i)=>({
    row:i+2,internalId:asText_(r[h['Внутренний ID']-1]),name:asText_(r[h['Наименование']-1]),category:asText_(r[h['Категория']-1]),cost:r[h['Себестоимость']-1],itemMargin:r[h['Маржинальность товара, %']-1],
    wbNm:asText_(r[h['WB NMID']-1]),ozOffer:asText_(r[h['Ozon Offer ID']-1]),subjectId:h['WB Subject ID (служебно)']?asText_(r[h['WB Subject ID (служебно)']-1]):'',
    length:h['WB Длина, см (служебно)']?toNumber_(r[h['WB Длина, см (служебно)']-1]):0,width:h['WB Ширина, см (служебно)']?toNumber_(r[h['WB Ширина, см (служебно)']-1]):0,height:h['WB Высота, см (служебно)']?toNumber_(r[h['WB Высота, см (служебно)']-1]):0
  })).filter(x=>x.internalId);
}
function readExistingPriceRows_(){const sh=sheet_(APP.SHEETS.PRICES),out={};if(sh.getLastRow()<=1)return out;const h=findHeaderMap_(sh);sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{const id=asText_(r[h['Внутренний ID']-1]);if(!id)return;const o={};Object.keys(h).forEach(k=>o[k]=r[h[k]-1]);out[id]=o;});return out;}
function priceMarginContext_(){
  const def=marginFraction_(getSetting_('Маржинальность по умолчанию, %','100')), cats={}; const sh=sheet_(APP.SHEETS.MARGINS);
  if(sh.getLastRow()>1){const h=findHeaderMap_(sh);sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{const c=asText_(r[h['Категория']-1]);if(!c)return;const active=h['Активна']?r[h['Активна']-1]===true:true;if(active)cats[normName_(c)]=marginFraction_(r[h['Маржинальность по умолчанию, %']-1]);});}
  return {defaultMargin:def,categories:cats};
}
function resolveMargin_(item,ctx){const own=asText_(item.itemMargin);if(own!=='')return marginFraction_(item.itemMargin);const cat=ctx.categories[normName_(item.category)];return cat===undefined?ctx.defaultMargin:cat;}
function marginFraction_(v){const n=toNumber_(v);if(!Number.isFinite(n))return 0;return Math.abs(n)>3?n/100:n;}
function writeUsedMarginToStock_(row,margin){const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(h['Используемая маржинальность, %'])sh.getRange(row,h['Используемая маржинальность, %']).setValue(Math.round(margin*10000)/100);}
function normalizePriceMode_(v){return String(v).toLowerCase().indexOf('руч')>=0?'Ручной':'Авто';}
function toNumber_(v){if(typeof v==='number')return Number.isFinite(v)?v:0;const n=Number(String(v==null?'':v).replace(/\s/g,'').replace('%','').replace(',','.'));return Number.isFinite(n)?n:0;}
function requiredPrice_(requiredNet,rate,fixed){const r=1-Math.max(0,rate||0);return requiredNet>0&&r>0.05?Math.ceil((requiredNet+Math.max(0,fixed||0))/r):0;}
function priceErrorText_(wb,oz){const bad=[];[wb,oz].forEach(x=>{if(x&&x!=='НЕ ПОДКЛЮЧЕН'&&x.indexOf('ГОТОВО')!==0)bad.push(x);});return bad.join(' | ');}

function wbFetchCurrentPrices_(nmIds){
  const out={}; chunkArray_(Array.from(new Set(nmIds.map(Number).filter(Number.isFinite))),1000).forEach(part=>{if(!part.length)return;const r=wbPricesRequest_('/api/v2/list/goods/filter','post',{nmList:part},'Текущие цены WB').json||{};const rows=r.data&&r.data.listGoods||r.listGoods||[];rows.forEach(x=>out[asText_(x.nmID)]=x);});return out;
}
function wbCurrentSellerPrice_(x){const d=toNumber_(x&&x.discountedPrice);return d>0?d:toNumber_(x&&x.price);}
function wbFetchSizes_(nmId){const r=wbPricesRequest_('/api/v2/list/goods/size/nm?limit=1000&offset=0&nmID='+encodeURIComponent(nmId),'get',undefined,'Размеры цен WB').json||{};return r.data&&r.data.listGoods||r.listGoods||[];}
function wbFetchEconomics_(){
  const cr=wbRequest_('/api/v1/tariffs/commission?locale=ru','get',undefined,'Комиссии WB').json||{}, commissions={}; (cr.report||cr.data||[]).forEach(x=>{const id=asText_(x.subjectID||x.subjectId);if(id)commissions[id]=x;});
  let tariffs=[]; try{const date=Utilities.formatDate(now_(),ss_().getSpreadsheetTimeZone(),'yyyy-MM-dd');const tr=wbRequest_('/api/v1/tariffs/box?date='+date,'get',undefined,'Логистика WB').json||{};tariffs=tr.response&&tr.response.data&&tr.response.data.warehouseList||tr.data&&tr.data.warehouseList||tr.warehouseList||[];}catch(e){logEvent_({regulation:'Цены WB',result:'Предупреждение',error:'Не получены тарифы логистики WB: '+e.message});}
  return {commissions:commissions,tariffs:tariffs};
}
function wbEconomicsForItem_(item,ctx){const c=ctx.commissions[item.subjectId];if(!item.subjectId)return {ok:false,error:'НЕТ SUBJECT ID WB — ОБНОВИТЕ КАТАЛОГ'};if(!c)return {ok:false,error:'НЕТ КОМИССИИ WB ДЛЯ ПРЕДМЕТА'};const rate=marginFraction_(c.kgvpMarketplace);if(rate<=0||rate>=0.95)return {ok:false,error:'НЕКОРРЕКТНАЯ КОМИССИЯ WB'};const volume=Math.max(1,(item.length||0)*(item.width||0)*(item.height||0)/1000||1),logistics=estimateWbDelivery_(ctx.tariffs,volume);return {ok:true,commissionRate:rate,logistics:logistics};}
function estimateWbDelivery_(rows,volume){const vals=(rows||[]).map(r=>{const base=toNumber_(r.boxDeliveryBase),liter=toNumber_(r.boxDeliveryLiter),coef=tariffMultiplier_(r.boxDeliveryAndStorageExpr);return (base+Math.max(0,volume-1)*liter)*coef;}).filter(x=>x>0).sort((a,b)=>a-b);if(!vals.length)return 0;const m=Math.floor(vals.length/2);return vals.length%2?vals[m]:(vals[m-1]+vals[m])/2;}
function tariffMultiplier_(v){const text=asText_(v),n=toNumber_(v);if(!text)return 1;return text.indexOf('%')>=0||n>10?n/100:(n||1);}

function ozonFetchCurrentPrices_(offers){const out={};chunkArray_(Array.from(new Set(offers.filter(Boolean))),100).forEach(part=>{const r=ozonRequest_('/v5/product/info/prices',{filter:{offer_id:part,visibility:'ALL'},limit:100},'Текущие цены Ozon').json||{};const raw=r.result||r,items=Array.isArray(raw)?raw:(raw.items||r.items||[]);items.forEach(x=>out[asText_(x.offer_id||x.offerId)]=x);});return out;}
function ozExtractCurrentPrice_(x){const p=x&&x.price||{};return toNumber_(p.marketing_seller_price||p.retail_price||p.marketing_price||x&&x.marketing_seller_price||x&&x.price||0);}
function ozExtractPriceExpenses_(x){
  const blocks=[x&&x.commissions,x&&x.comissions,x&&x.price&&x.price.commissions,x&&x.price&&x.price.comissions].filter(v=>v&&typeof v==='object');let commissionRate=0,logistics=0,hasCommission=false,hasLogistics=false;
  blocks.forEach(raw=>{
    if(!Array.isArray(raw)){const rate=ozPercent_(raw.sales_percent_fbs||raw.sales_percent_rfbs||raw.sales_percent||raw.sales_percent_fbo||raw.percent||raw.commission_percent);if(rate>0){commissionRate=Math.max(commissionRate,rate);hasCommission=true;}const first=Math.max(toNumber_(raw.fbs_first_mile_max_amount),toNumber_(raw.fbs_first_mile_min_amount)),direct=Math.max(toNumber_(raw.fbs_direct_flow_trans_max_amount),toNumber_(raw.fbs_direct_flow_trans_min_amount)),last=toNumber_(raw.fbs_deliv_to_customer_amount),components=first+direct+last,generic=Math.max(toNumber_(raw.delivery_amount),toNumber_(raw.delivery_forward)),total=components>0?components:generic;if(total>0){logistics=Math.max(logistics,total);hasLogistics=true;}}
    const all=ozCommissionRows_(raw),fbs=all.filter(c=>/FBS|REAL_FBS/i.test(asText_(c.sale_schema||c.schema))),candidates=fbs.length?fbs:all;candidates.forEach(c=>{const rate=ozPercent_(c.sales_percent_fbs||c.sales_percent_rfbs||c.sales_percent||c.percent||c.commission_percent);if(rate>0){commissionRate=Math.max(commissionRate,rate);hasCommission=true;}const first=Math.max(toNumber_(c.fbs_first_mile_max_amount),toNumber_(c.fbs_first_mile_min_amount)),direct=Math.max(toNumber_(c.fbs_direct_flow_trans_max_amount),toNumber_(c.fbs_direct_flow_trans_min_amount)),last=toNumber_(c.fbs_deliv_to_customer_amount),components=first+direct+last,generic=Math.max(toNumber_(c.delivery_amount),toNumber_(c.delivery_forward)),total=components>0?components:generic;if(total>0){logistics=Math.max(logistics,total);hasLogistics=true;}});
  });return {commissionRate:commissionRate,logistics:logistics,hasCommission:hasCommission,hasLogistics:hasLogistics};
}
function ozCommissionRows_(raw){if(Array.isArray(raw))return raw.filter(x=>x&&typeof x==='object');if(!raw||typeof raw!=='object')return [];const rows=[];Object.keys(raw).forEach(k=>{const v=raw[k];if(Array.isArray(v))v.forEach(x=>{if(x&&typeof x==='object')rows.push(x);});});return rows;}
function ozPercent_(v){const n=toNumber_(v);return n>1?n/100:n;}

function priceRowsForSend_(market){const sh=sheet_(APP.SHEETS.PRICES),h=findHeaderMap_(sh);if(sh.getLastRow()<=1)return [];return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map((r,i)=>({row:i+2,internalId:asText_(r[h['Внутренний ID']-1]),marketId:market==='WB'?stockMarketIdByInternal_(asText_(r[h['Внутренний ID']-1]),'WB'):stockMarketIdByInternal_(asText_(r[h['Внутренний ID']-1]),'Ozon'),current:toNumber_(r[h[market+' текущая цена']-1]),target:toNumber_(r[h[market+' цена к отправке']-1]),minimum:toNumber_(r[h[market+' минимально допустимая цена']-1]),status:asText_(r[h[market+' статус']-1])})).filter(x=>x.marketId&&x.target>0&&Math.abs(x.target-x.current)>=1);}
function stockMarketIdByInternal_(id,market){const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<=1)return '';const vals=sh.getRange(2,1,sh.getLastRow()-1,Math.max(h['Внутренний ID'],market==='WB'?h['WB NMID']:h['Ozon Offer ID'])).getValues();for(let i=0;i<vals.length;i++)if(asText_(vals[i][h['Внутренний ID']-1])===id)return asText_(vals[i][(market==='WB'?h['WB NMID']:h['Ozon Offer ID'])-1]);return '';}
function markPriceSendResult_(row,market,status,error){const sh=sheet_(APP.SHEETS.PRICES),h=findHeaderMap_(sh);const full=error?(status+' — '+error):status;sh.getRange(row,h[market+' статус']).setValue(full);sh.getRange(row,h['Последняя отправка']).setValue(now_());const wb=asText_(sh.getRange(row,h['WB статус']).getValue()),oz=asText_(sh.getRange(row,h['Ozon статус']).getValue());sh.getRange(row,h['Ошибка']).setValue(priceErrorText_(wb,oz));}
function applyPriceSheetValidation_(){const sh=sheet_(APP.SHEETS.PRICES),h=findHeaderMap_(sh),n=Math.max(1,sh.getMaxRows()-1),dv=SpreadsheetApp.newDataValidation().requireValueInList(['Авто','Ручной'],true).setAllowInvalid(false).build();if(h['WB режим'])sh.getRange(2,h['WB режим'],n,1).setDataValidation(dv);if(h['Ozon режим'])sh.getRange(2,h['Ozon режим'],n,1).setDataValidation(dv);}
function chunkArray_(arr,size){const out=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out;}

function protectMassPriceChange_(market,rows){const changed=rows.filter(x=>x.current>0&&Math.abs(x.target-x.current)/x.current>0.40);if(rows.length>=10&&changed.length/rows.length>=0.50){const examples=changed.slice(0,5).map(x=>x.marketId+': '+Math.round(x.current)+'→'+Math.round(x.target)).join(', ');const e=new Error('Защита остановила отправку цен '+market+': у '+changed.length+' из '+rows.length+' товаров изменение больше 40%. Примеры: '+examples);e.protectionStop=true;throw e;}}
/* ===== ActionsHelpers.gs ===== */
function ensurePricesForActions_(force){
  const sh=sheet_(APP.SHEETS.PRICES);
  if(force===true||sh.getLastRow()<=1) calculatePrices();
}

function actionPriceContext_(){
  const sh=sheet_(APP.SHEETS.PRICES),out={byInternal:{}}; if(sh.getLastRow()<=1)return out;
  const h=findHeaderMap_(sh);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{
    const id=asText_(r[h['Внутренний ID']-1]);if(!id)return;
    out.byInternal[id]={
      wbCurrent:toNumber_(r[h['WB текущая цена']-1]),wbMinimum:toNumber_(r[h['WB минимально допустимая цена']-1]),wbCalculated:toNumber_(r[h['WB расчётная цена']-1]),wbMode:asText_(r[h['WB режим']-1]),
      ozCurrent:toNumber_(r[h['Ozon текущая цена']-1]),ozMinimum:toNumber_(r[h['Ozon минимально допустимая цена']-1]),ozCalculated:toNumber_(r[h['Ozon расчётная цена']-1]),ozMode:asText_(r[h['Ozon режим']-1])
    };
  });
  return out;
}

function actionStockIndex_(){
  const sh=sheet_(APP.SHEETS.STOCK),out={byInternal:{},byWbNm:{},byOzonProductId:{},byOzonOffer:{}}; if(sh.getLastRow()<=1)return out;
  const h=findHeaderMap_(sh);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{
    const x={row:i+2,internalId:asText_(r[h['Внутренний ID']-1]),name:asText_(r[h['Наименование']-1]),cost:toNumber_(r[h['Себестоимость']-1]),wbNm:asText_(r[h['WB NMID']-1]),ozProductId:asText_(r[h['Ozon Product ID']-1]),ozOffer:asText_(r[h['Ozon Offer ID']-1]),subjectId:h['WB Subject ID (служебно)']?asText_(r[h['WB Subject ID (служебно)']-1]):'',length:h['WB Длина, см (служебно)']?toNumber_(r[h['WB Длина, см (служебно)']-1]):0,width:h['WB Ширина, см (служебно)']?toNumber_(r[h['WB Ширина, см (служебно)']-1]):0,height:h['WB Высота, см (служебно)']?toNumber_(r[h['WB Высота, см (служебно)']-1]):0};
    if(x.internalId)out.byInternal[x.internalId]=x;if(x.wbNm)out.byWbNm[x.wbNm]=x;if(x.ozProductId)out.byOzonProductId[x.ozProductId]=x;if(x.ozOffer)out.byOzonOffer[x.ozOffer]=x;
  });
  return out;
}

function wbFetchPromotions_(){
  const from=new Date(Date.now()-86400000),to=new Date(Date.now()+365*86400000),out=[]; const limit=1000;
  for(let offset=0;offset<100000;offset+=limit){
    const q='startDateTime='+encodeURIComponent(from.toISOString())+'&endDateTime='+encodeURIComponent(to.toISOString())+'&limit='+limit+'&offset='+offset;
    const r=wbPromotionRequest_('/api/v1/calendar/promotions?'+q,'get',undefined,'Список акций WB').json||{};
    const part=r.data&&Array.isArray(r.data.promotions)?r.data.promotions:(Array.isArray(r.promotions)?r.promotions:[]);
    part.forEach(x=>{if(!actionEnded_(x.endDateTime||x.endDate||x.end))out.push({id:x.id||x.promotionID,name:asText_(x.name||x.title),start:x.startDateTime||x.startDate||'',end:x.endDateTime||x.endDate||'',type:asText_(x.type)});});
    if(part.length<limit)break;
  }
  return out;
}
function wbPromotionIsAuto_(p){return /auto|авто/i.test(asText_(p.type));}
function wbFetchPromotionItems_(promotionId,inAction){const out=[],limit=1000;for(let offset=0;offset<1000000;offset+=limit){const q='promotionID='+encodeURIComponent(promotionId)+'&inAction='+(inAction?'true':'false')+'&limit='+limit+'&offset='+offset;const r=wbPromotionRequest_('/api/v1/calendar/promotions/nomenclatures?'+q,'get',undefined,'Товары акции WB').json||{};const part=r.data&&Array.isArray(r.data.nomenclatures)?r.data.nomenclatures:(Array.isArray(r.nomenclatures)?r.nomenclatures:[]);out.push.apply(out,part);if(part.length<limit)break;Utilities.sleep(650);}return out;}
function wbPromoPrice_(x){return toNumber_(x&&x.planPrice)||toNumber_(x&&x.price);}

function ozonFetchActions_(){
  const r=ozonGet_('/v1/actions','Список акций Ozon').json||{}, raw=Array.isArray(r.result)?r.result:(r.result&&Array.isArray(r.result.actions)?r.result.actions:(Array.isArray(r.actions)?r.actions:[]));
  return raw.filter(x=>!actionEnded_(x.date_end||x.end_date||x.end)).map(x=>({id:x.id||x.action_id,name:asText_(x.title||x.name),start:x.date_start||x.start_date||'',end:x.date_end||x.end_date||'',type:asText_(x.action_type||x.type),isVoucher:!!(x.is_voucher_action||x.isVoucherAction)}));
}
function ozonFetchActionItems_(path,actionId){const out=[];let last='';for(let page=0;page<10000;page++){const body={action_id:Number(actionId),limit:100};if(last)body.last_id=last;const r=ozonRequest_(path,body,'Товары акции Ozon').json||{},raw=r.result||r,part=Array.isArray(raw.products)?raw.products:(Array.isArray(r.products)?r.products:[]);out.push.apply(out,part);const next=asText_(raw.last_id||r.last_id);if(part.length<100||!next||next===last)break;last=next;}return out;}
function ozonActionProductId_(x){return asText_(x&&x.id||x&&x.product_id);}
function ozonPromoActionPrice_(x){return ozonActionMoney_(x&&x.action_price)||ozonActionMoney_(x&&x.max_action_price)||toNumber_(x&&x.action_price)||toNumber_(x&&x.max_action_price)||toNumber_(x&&x.price);}
function ozonPromoCurrentPrice_(x){return ozonActionMoney_(x&&x.marketplace_seller_price)||ozonActionMoney_(x&&x.price)||toNumber_(x&&x.marketplace_seller_price)||toNumber_(x&&x.price);}
function ozonActionMoney_(v){if(v&&typeof v==='object'){const cur=asText_(v.currency||v.currency_code);if(cur&&cur!=='RUB')return 0;return toNumber_(v.amount||v.value);}return toNumber_(v);}
function ozonAcceptedActionIds_(r){const out={},lists=[r.active_product_ids,r.deactivated_product_ids,r.product_ids,r.result&&r.result.product_ids,r.result&&r.result.active_product_ids,r.result&&r.result.deactivated_product_ids];lists.forEach(a=>(a||[]).forEach(id=>out[asText_(id)]=true));return out;}
function ozonRejectedActionIds_(r){const out={};(r.rejected||r.result&&r.result.rejected||[]).forEach(x=>out[asText_(x.product_id||x.id)]=asText_(x.reason||x.message||x.error||'Ozon отклонил товар'));return out;}

function actionRow_(market,promo,internalId,name,current,actionPrice,minimum,margin,fits,participates,action,result,error){return [market,asText_(promo.id),promo.name||'',promo.start||'',promo.end||'',internalId||'',name||'',current||'',actionPrice||'',minimum||'',margin===''?'':margin,!!fits,!!participates,action||'Ничего',result||'',now_(),error||''];}
function promoMarginPercent_(cost,price,econ){cost=toNumber_(cost);price=toNumber_(price);if(cost<=0||price<=0||!econ)return '';const net=Math.max(0,price*(1-toNumber_(econ.commissionRate))-toNumber_(econ.logistics));return Math.round(((net-cost)/cost)*10000)/100;}
function actionEnded_(v){if(!v)return false;const d=new Date(v);return Number.isFinite(d.getTime())&&d.getTime()<Date.now();}

function writeActionRowsForMarket_(market,rows){
  const sh=sheet_(APP.SHEETS.ACTIONS),headers=SHEET_SCHEMAS[APP.SHEETS.ACTIONS],oldResult={};
  if(sh.getLastRow()>1){const h=findHeaderMap_(sh),old=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();old.forEach(r=>{const key=asText_(r[h['Маркетплейс']-1])+'|'+asText_(r[h['ID акции']-1])+'|'+asText_(r[h['Внутренний ID товара']-1]);if(r[h['Результат действия']-1])oldResult[key]=r[h['Результат действия']-1];});const keep=old.filter(r=>asText_(r[h['Маркетплейс']-1])!==market);rows.forEach(r=>{const key=market+'|'+asText_(r[1])+'|'+asText_(r[5]);if(!r[14]&&oldResult[key])r[14]=oldResult[key];});const all=keep.concat(rows);sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();if(all.length)sh.getRange(2,1,all.length,headers.length).setValues(all);return;}
  if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}

function readActionDecisions_(){
  const sh=sheet_(APP.SHEETS.ACTIONS),out=[];if(sh.getLastRow()<=1)return out;const h=findHeaderMap_(sh),stock=actionStockIndex_(),price=actionPriceContext_();
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{
    const action=asText_(r[h['Требуемое действие']-1]);if(action!=='Вступить'&&action!=='Выйти')return;
    const internalId=asText_(r[h['Внутренний ID товара']-1]),s=stock.byInternal[internalId],p=price.byInternal[internalId]||{};if(!s)return;
    out.push({row:i+2,marketplace:asText_(r[h['Маркетплейс']-1]),promotionId:asText_(r[h['ID акции']-1]),internalId:internalId,action:action,current:toNumber_(r[h['Текущая цена']-1]),actionPrice:toNumber_(r[h['Цена по акции']-1]),minimum:toNumber_(r[h['Минимально допустимая цена']-1]),wbNm:s.wbNm,ozProductId:s.ozProductId,wbMode:p.wbMode||'',wbCalculated:p.wbCalculated||0});
  });
  return out;
}
function groupActionsByPromotion_(rows){const out={};rows.forEach(x=>{if(!out[x.promotionId])out[x.promotionId]=[];out[x.promotionId].push(x);});return out;}
function markActionResult_(row,result,error){const sh=sheet_(APP.SHEETS.ACTIONS),h=findHeaderMap_(sh);sh.getRange(row,h['Результат действия']).setValue(result||'');sh.getRange(row,h['Последняя проверка']).setValue(now_());sh.getRange(row,h['Ошибка']).setValue(error||'');}

function protectMassActionChange_(rows){
  const exits=rows.filter(x=>x.action==='Выйти'),changes=rows.length;
  if(exits.length>=10&&exits.length/Math.max(1,changes)>=0.50){const e=new Error('Защита остановила управление акциями: требуется массовый выход '+exits.length+' из '+changes+' изменений. Проверьте комиссии, себестоимость и маржинальность.');e.protectionStop=true;throw e;}
  if(changes>=20){const sh=sheet_(APP.SHEETS.ACTIONS),h=findHeaderMap_(sh),total=Math.max(1,sh.getLastRow()-1);if(changes/total>=0.70){const e=new Error('Защита остановила управление акциями: изменения требуются для '+changes+' из '+total+' строк ('+Math.round(changes/total*100)+'%). Проверьте расчёт перед массовой отправкой.');e.protectionStop=true;throw e;}}
}

function wbUploadActionBasePrices_(items){
  const current=wbFetchCurrentPrices_(items.map(x=>x.nmId)),general=[],sizes=[];
  items.forEach(x=>{const p=current[asText_(x.nmId)]||{};if(p.editableSizePrice===true){const sr=wbFetchSizes_(x.nmId);if(!sr.length)throw new Error('WB не вернул размеры для nmID '+x.nmId);sr.forEach(sz=>sizes.push({nmID:x.nmId,sizeID:Number(sz.sizeID),price:x.target}));general.push({nmID:x.nmId,discount:0});}else general.push({nmID:x.nmId,price:x.target,discount:0});});
  chunkArray_(sizes,1000).forEach(p=>{if(p.length)wbPricesRequest_('/api/v2/upload/task/size','post',{data:p},'Выход из акции WB');});
  chunkArray_(general,1000).forEach(p=>{if(p.length)wbPricesRequest_('/api/v2/upload/task','post',{data:p},'Выход из акции WB');});
}
/* ===== ActionsCheck.gs ===== */
/**
 * Автоматическое управление акциями WB/Ozon.
 * Решение строится только по целевой маржинальности из общего модуля цен.
 * Приоритет маржи: товар -> категория -> настройка по умолчанию.
 */

function checkWbActions(skipPriceRefresh){
  if(!boolText_(getSetting_('Использовать WB','Нет'))) return {processed:0,success:0,errors:0};
  if(skipPriceRefresh!==true) ensurePricesForActions_();
  const started=Date.now(), priceCtx=actionPriceContext_(), stock=actionStockIndex_();
  const economics=wbFetchEconomics_(), promos=wbFetchPromotions_(), rows=[];
  let errors=0;

  promos.forEach(promo=>{
    if(wbPromotionIsAuto_(promo)){
      logEvent_({regulation:'Акции WB',marketplace:'WB',result:'Предупреждение',info:'Автоакция '+asText_(promo.id)+': WB API не отдаёт список кандидатов через календарь акций'});
      return;
    }
    let candidates=[],participants=[];
    try{
      candidates=wbFetchPromotionItems_(promo.id,false);
      Utilities.sleep(650);
      participants=wbFetchPromotionItems_(promo.id,true);
    }catch(e){
      errors++;
      logEvent_({regulation:'Акции WB',marketplace:'WB',result:'Ошибка',errors:1,error:'Акция '+asText_(promo.id)+': '+e.message});
      return;
    }
    const map={};
    candidates.forEach(x=>{const id=asText_(x.id);if(id)map[id]={item:x,participates:false};});
    participants.forEach(x=>{const id=asText_(x.id);if(id)map[id]={item:x,participates:true};});

    Object.keys(map).forEach(nm=>{
      const entry=map[nm], s=stock.byWbNm[nm], item=entry.item;
      if(!s){
        rows.push(actionRow_('WB',promo,'','WB nmID '+nm,toNumber_(item.price),wbPromoPrice_(item),'','',false,entry.participates,'Ничего','', 'Товар отсутствует на листе «Склад»'));
        errors++; return;
      }
      const price=priceCtx.byInternal[s.internalId]||{}, minimum=toNumber_(price.wbMinimum);
      const actionPrice=wbPromoPrice_(item), current=toNumber_(item.price)||toNumber_(price.wbCurrent);
      const econ=wbEconomicsForItem_(s,economics);
      const margin=promoMarginPercent_(s.cost,actionPrice,econ.ok?econ:null);
      const fits=minimum>0&&actionPrice>=minimum;
      let action='Ничего', error='';
      if(!minimum) error='Не рассчитана минимально допустимая цена WB';
      else if(!actionPrice) error='WB не вернул цену участия в акции';
      else if(entry.participates&&!fits) action='Выйти';
      else if(!entry.participates&&fits) action='Вступить';
      rows.push(actionRow_('WB',promo,s.internalId,s.name,current,actionPrice,minimum,margin,fits,entry.participates,action,'',error));
    });
    Utilities.sleep(650);
  });

  writeActionRowsForMarket_('WB',rows);
  const result={processed:rows.length,success:Math.max(0,rows.length-errors),errors:errors};
  logEvent_({regulation:'Акции WB',runType:'Ручной',marketplace:'WB',result:'Успешно',processed:result.processed,success:result.success,errors:result.errors,duration:Math.round((Date.now()-started)/1000)});
  toast_('Акции WB проверены: '+rows.length+' строк.');
  return result;
}

function checkOzonActions(skipPriceRefresh){
  if(!boolText_(getSetting_('Использовать Ozon','Нет'))) return {processed:0,success:0,errors:0};
  if(skipPriceRefresh!==true) ensurePricesForActions_();
  const started=Date.now(), priceCtx=actionPriceContext_(), stock=actionStockIndex_();
  const allOffers=Object.keys(stock.byOzonOffer), prices=ozonFetchCurrentPrices_(allOffers);
  const promos=ozonFetchActions_(), rows=[];
  let errors=0;

  promos.forEach(promo=>{
    let candidates=[],participants=[];
    try{
      candidates=ozonFetchActionItems_('/v2/actions/candidates',promo.id);
      participants=ozonFetchActionItems_('/v2/actions/products',promo.id);
    }catch(e){
      errors++;
      logEvent_({regulation:'Акции Ozon',marketplace:'Ozon',result:'Ошибка',errors:1,error:'Акция '+asText_(promo.id)+': '+e.message});
      return;
    }
    const map={};
    candidates.forEach(x=>{const id=ozonActionProductId_(x);if(id)map[id]={item:x,participates:false};});
    participants.forEach(x=>{const id=ozonActionProductId_(x);if(id)map[id]={item:x,participates:true};});

    Object.keys(map).forEach(pid=>{
      const entry=map[pid], s=stock.byOzonProductId[pid], item=entry.item;
      if(!s){
        rows.push(actionRow_('Ozon',promo,'','Ozon product_id '+pid,ozonPromoCurrentPrice_(item),ozonPromoActionPrice_(item),'','',false,entry.participates,'Ничего','', 'Товар отсутствует на листе «Склад»'));
        errors++; return;
      }
      const price=priceCtx.byInternal[s.internalId]||{}, minimum=toNumber_(price.ozMinimum);
      const actionPrice=ozonPromoActionPrice_(item), current=ozonPromoCurrentPrice_(item)||toNumber_(price.ozCurrent);
      const econ=ozExtractPriceExpenses_(prices[s.ozOffer]||{});
      const margin=promoMarginPercent_(s.cost,actionPrice,econ.hasCommission?{commissionRate:econ.commissionRate,logistics:econ.logistics}:null);
      const fits=minimum>0&&actionPrice>=minimum;
      let action='Ничего', error='';
      if(!minimum) error='Не рассчитана минимально допустимая цена Ozon';
      else if(!actionPrice) error='Ozon не вернул допустимую цену акции';
      else if(entry.participates&&!fits) action='Выйти';
      else if(!entry.participates&&fits) action='Вступить';
      rows.push(actionRow_('Ozon',promo,s.internalId,s.name,current,actionPrice,minimum,margin,fits,entry.participates,action,'',error));
    });
  });

  writeActionRowsForMarket_('Ozon',rows);
  const result={processed:rows.length,success:Math.max(0,rows.length-errors),errors:errors};
  logEvent_({regulation:'Акции Ozon',runType:'Ручной',marketplace:'Ozon',result:'Успешно',processed:result.processed,success:result.success,errors:result.errors,duration:Math.round((Date.now()-started)/1000)});
  toast_('Акции Ozon проверены: '+rows.length+' строк.');
  return result;
}
/* ===== ActionsApply.gs ===== */
function manageActions(automatic){
  if(automatic===true && !boolText_(getSetting_('Автоматическое управление акциями','Выкл'))) return {processed:0,success:0,errors:0};
  assertGuard_(APP.SAFE_GUARDS.MANAGE_ACTIONS);
  ensurePricesForActions_(true);
  if(boolText_(getSetting_('Использовать WB','Нет'))) checkWbActions(true);
  if(boolText_(getSetting_('Использовать Ozon','Нет'))) checkOzonActions(true);

  const actions=readActionDecisions_();
  protectMassActionChange_(actions);
  let processed=0,success=0,errors=0;
  if(boolText_(getSetting_('Использовать WB','Нет'))){const r=applyWbActionDecisions_(actions.filter(x=>x.marketplace==='WB'));processed+=r.processed;success+=r.success;errors+=r.errors;}
  if(boolText_(getSetting_('Использовать Ozon','Нет'))){const r=applyOzonActionDecisions_(actions.filter(x=>x.marketplace==='Ozon'));processed+=r.processed;success+=r.success;errors+=r.errors;}
  return {processed:processed,success:success,errors:errors};
}

function applyWbActionDecisions_(rows){
  const enter=rows.filter(x=>x.action==='Вступить'), exit=rows.filter(x=>x.action==='Выйти');
  let success=0,errors=0,processed=enter.length+exit.length;
  const enterGroups=groupActionsByPromotion_(enter);
  Object.keys(enterGroups).forEach(id=>{
    const items=enterGroups[id];
    chunkArray_(items,1000).forEach(part=>{
      try{
        wbPromotionRequest_('/api/v1/calendar/promotions/upload','post',{data:{promotionID:Number(id),uploadNow:true,nomenclatures:part.map(x=>Number(x.wbNm))}},'Вход в акцию WB');
        part.forEach(x=>{markActionResult_(x.row,'ВСТУПЛЕНИЕ ОТПРАВЛЕНО','');success++;});
      }catch(e){part.forEach(x=>markActionResult_(x.row,'ОШИБКА',e.message));errors+=part.length;}
      Utilities.sleep(650);
    });
  });

  // У WB нет отдельного метода удаления товара из обычной календарной акции.
  // Для автоматической цены поднимаем базовую цену до уровня, при котором
  // акционная цена не должна быть ниже минимально допустимой. Ручную цену не трогаем.
  const autoExit=[];
  exit.forEach(x=>{
    if(x.wbMode==='Ручной'){
      markActionResult_(x.row,'ТРЕБУЕТ РУЧНОГО ВЫХОДА','WB не даёт API удаления из обычной акции; ручную базовую цену система не изменяет.');
      errors++; return;
    }
    const ratio=x.current>0&&x.actionPrice>0?Math.min(1,x.actionPrice/x.current):1;
    const target=Math.ceil(Math.max(x.wbCalculated||x.minimum, ratio>0.05?x.minimum/ratio:x.minimum));
    if(!x.wbNm||!target){markActionResult_(x.row,'ОШИБКА','Не удалось рассчитать безопасную базовую цену WB.');errors++;return;}
    autoExit.push({row:x.row,nmId:Number(x.wbNm),target:target});
  });
  if(autoExit.length){
    try{
      wbUploadActionBasePrices_(autoExit);
      autoExit.forEach(x=>{markActionResult_(x.row,'БАЗОВАЯ ЦЕНА ПОВЫШЕНА ДЛЯ ВЫХОДА','WB подтвердит фактическое участие при следующей проверке.');success++;});
    }catch(e){autoExit.forEach(x=>markActionResult_(x.row,'ОШИБКА',e.message));errors+=autoExit.length;}
  }
  return {processed:processed,success:success,errors:errors};
}

function applyOzonActionDecisions_(rows){
  // Ozon с октября 2026 использует единую предельную цену для цен и акций.
  // Передаём тот же безопасный предел, что рассчитан модулем цен, чтобы два регламента не перезаписывали друг друга.
  const promos=ozonFetchActions_(), meta={};promos.forEach(p=>meta[asText_(p.id)]=p);
  const enter=groupActionsByPromotion_(rows.filter(x=>x.action==='Вступить'));
  const exit=groupActionsByPromotion_(rows.filter(x=>x.action==='Выйти'));
  let processed=0,success=0,errors=0;

  Object.keys(enter).forEach(id=>{
    chunkArray_(enter[id],1000).forEach(part=>{
      processed+=part.length;
      const body={action_id:Number(id),products:part.map(x=>({product_id:Number(x.ozProductId),action_price:{amount:String(Math.round(x.minimum)),currency:'RUB'}}))};
      try{
        const r=ozonRequest_('/v1/actions/products/update',body,'Вход в акцию Ozon').json||{};
        const rejected=ozonRejectedActionIds_(r), accepted=ozonAcceptedActionIds_(r);
        part.forEach(x=>{if(rejected[asText_(x.ozProductId)]){errors++;markActionResult_(x.row,'ОШИБКА',rejected[asText_(x.ozProductId)]);}else{success++;markActionResult_(x.row,accepted[asText_(x.ozProductId)]?'ВСТУПИЛ':'ВСТУПЛЕНИЕ ОТПРАВЛЕНО','');}});
      }catch(e){part.forEach(x=>markActionResult_(x.row,'ОШИБКА',e.message));errors+=part.length;}
    });
  });

  Object.keys(exit).forEach(id=>{
    chunkArray_(exit[id],1000).forEach(part=>{
      processed+=part.length;
      const isVoucher=!!(meta[id]&&meta[id].isVoucher), path=isVoucher?'/v2/actions/products/deactivate':'/v1/actions/products/deactivate';
      try{
        const r=ozonRequest_(path,{action_id:Number(id),product_ids:part.map(x=>Number(x.ozProductId))},'Выход из акции Ozon').json||{};
        const rejected=ozonRejectedActionIds_(r);
        part.forEach(x=>{const err=rejected[asText_(x.ozProductId)];if(err){errors++;markActionResult_(x.row,'ОШИБКА',err);}else{success++;markActionResult_(x.row,'ВЫХОД ОТПРАВЛЕН','');}});
      }catch(e){part.forEach(x=>markActionResult_(x.row,'ОШИБКА',e.message));errors+=part.length;}
    });
  });
  return {processed:processed,success:success,errors:errors};
}
/* ===== DashboardCore.gs ===== */
/**
 * Единый финансовый дашборд WB / Ozon / Общий.
 * В продажи попадают только финансово реализованные операции маркетплейсов.
 * Заказы из «Журнала заказов» здесь не используются.
 */
function refreshDashboard(automatic){
  const started=Date.now(), period=dashboardPeriod_();
  const useWb=boolText_(getSetting_('Использовать WB','Нет'));
  const useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon) throw new Error('В настройках не выбран ни один маркетплейс.');

  const stock=dashboardStockContext_();
  let wb=emptyDashboardMarket_('WB'), oz=emptyDashboardMarket_('Ozon');
  const errors=[];
  if(useWb){
    try{wb=loadWbDashboardFinance_(period,stock);}catch(e){wb.failed=true;errors.push('WB: '+e.message);notify_({level:'Критическая ошибка',type:'Ошибка дашборда',marketplace:'WB',regulation:'Дашборд',message:e.message});}
  }
  if(useOzon){
    try{oz=loadOzonDashboardFinance_(period,stock);}catch(e){oz.failed=true;errors.push('Ozon: '+e.message);notify_({level:'Критическая ошибка',type:'Ошибка дашборда',marketplace:'Ozon',regulation:'Дашборд',message:e.message});}
  }
  if((useWb&&wb.failed)&&(useOzon&&oz.failed)) throw new Error(errors.join(' | ')||'Не удалось загрузить финансовые данные.');

  const total=mergeDashboardMarkets_(wb,oz,'Общий');
  writeDashboard_(period,wb,oz,total,stock,errors);
  const processed=(wb.rawCount||0)+(oz.rawCount||0), duration=Math.round((Date.now()-started)/1000);
  logEvent_({regulation:'Дашборд',runType:automatic===true?'Автоматический':'Ручной',result:errors.length?'С предупреждениями':'Успешно',processed:processed,success:processed,errors:errors.length,duration:duration,info:'Период '+dashboardDateKey_(period.from)+' — '+dashboardDateKey_(period.to)});
  toast_('Дашборд обновлён'+(errors.length?' с предупреждениями':'')+'.');
  return {processed:processed,success:processed,errors:errors.length};
}

function dashboardPeriod_(){
  const sh=sheet_(APP.SHEETS.DASHBOARD), today=dashboardDateOnly_(new Date());
  let from=dashboardParseDate_(sh.getRange('B4').getValue()), to=dashboardParseDate_(sh.getRange('B5').getValue());
  if(!to) to=today;
  if(!from) from=new Date(to.getFullYear(),to.getMonth(),1);
  from=dashboardDateOnly_(from);to=dashboardDateOnly_(to);
  if(from.getTime()>to.getTime()) throw new Error('Дата начала дашборда больше даты окончания.');
  sh.getRange('B4').setValue(from).setNumberFormat('dd.mm.yyyy');
  sh.getRange('B5').setValue(to).setNumberFormat('dd.mm.yyyy');
  return {from:from,to:to,days:Math.floor((to-from)/86400000)+1};
}
function dashboardParseDate_(v){if(v instanceof Date&&!isNaN(v))return new Date(v);if(!v)return null;const d=new Date(v);return isNaN(d)?null:d;}
function dashboardDateOnly_(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function dashboardDateKey_(d){return Utilities.formatDate(d,ss_().getSpreadsheetTimeZone(),'yyyy-MM-dd');}
function dashboardMonthKey_(d){return Utilities.formatDate(d,ss_().getSpreadsheetTimeZone(),'yyyy-MM');}
function dashboardMoney_(v){if(v&&typeof v==='object'&&Object.prototype.hasOwnProperty.call(v,'amount'))return toNumber_(v.amount);return toNumber_(v);}

function emptyDashboardMarket_(name){return {name:name,revenue:0,qty:0,cogs:0,commission:0,logistics:0,other:0,profit:0,returns:0,products:{},series:{},checks:{},rawCount:0,failed:false,warning:''};}
function dashboardProduct_(market,key,name,internalId){
  const k=asText_(key)||('unknown:'+asText_(name));
  if(!market.products[k])market.products[k]={marketplace:market.name,key:k,name:asText_(name)||k,internalId:internalId||'',revenue:0,qty:0,cogs:0,commission:0,logistics:0,other:0,profit:0,returns:0};
  return market.products[k];
}
function dashboardSeries_(market,date){const k=dashboardDateKey_(date);if(!market.series[k])market.series[k]={date:date,revenue:0,profit:0,qty:0,cogs:0};return market.series[k];}

function dashboardStockContext_(){
  const sh=sheet_(APP.SHEETS.STOCK), out={byInternal:{},byWbNm:{},byWbArticle:{},byOzonSku:{},byOzonProduct:{},byOzonOffer:{},inventoryUnits:0,inventoryCost:0,rows:[]};
  if(sh.getLastRow()<=1)return out;
  const h=findHeaderMap_(sh);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{
    const x={internalId:asText_(r[h['Внутренний ID']-1]),name:asText_(r[h['Наименование']-1]),article:asText_(r[h['Артикул основной']-1]),cost:toNumber_(r[h['Себестоимость']-1]),stock:Math.max(0,toNumber_(r[h['Фактический остаток']-1])),wbNm:asText_(r[h['WB NMID']-1]),wbArticle:asText_(r[h['WB артикул']-1]),ozProduct:asText_(r[h['Ozon Product ID']-1]),ozOffer:asText_(r[h['Ozon Offer ID']-1]),ozSku:asText_(r[h['Ozon SKU']-1])};
    if(!x.internalId)return;out.rows.push(x);out.byInternal[x.internalId]=x;
    if(x.wbNm)out.byWbNm[x.wbNm]=x;if(x.wbArticle)out.byWbArticle[normKey_(x.wbArticle)]=x;
    if(x.ozSku)out.byOzonSku[x.ozSku]=x;if(x.ozProduct)out.byOzonProduct[x.ozProduct]=x;if(x.ozOffer)out.byOzonOffer[normKey_(x.ozOffer)]=x;
    out.inventoryUnits+=x.stock;out.inventoryCost+=x.stock*x.cost;
  });
  return out;
}

function mergeDashboardMarkets_(a,b,name){
  const out=emptyDashboardMarket_(name);['revenue','qty','cogs','commission','logistics','other','profit','returns','rawCount'].forEach(k=>out[k]=(a[k]||0)+(b[k]||0));
  [a,b].forEach(m=>{Object.keys(m.checks||{}).forEach(k=>out.checks[m.name+'|'+k]=true);Object.keys(m.series||{}).forEach(k=>{const x=m.series[k],d=out.series[k]||(out.series[k]={date:x.date,revenue:0,profit:0,qty:0,cogs:0});d.revenue+=x.revenue||0;d.profit+=x.profit||0;d.qty+=x.qty||0;d.cogs+=x.cogs||0;});Object.keys(m.products||{}).forEach(k=>{const p=m.products[k],key=m.name+'|'+k;out.products[key]=Object.assign({},p);});});return out;
}

function dashboardMetrics_(market,stock){
  const checks=Object.keys(market.checks||{}).length, avg=checks?market.revenue/checks:0, margin=market.cogs?market.profit/market.cogs:0;
  return [market.revenue,market.qty,market.cogs,market.commission,market.logistics,market.other,market.profit,margin,avg,market.returns,stock.inventoryCost,stock.inventoryUnits];
}
/* ===== DashboardWB.gs ===== */
/** WB: актуальный Finance API с пагинацией rrdId. */
function loadWbDashboardFinance_(period,stock){
  const market=emptyDashboardMarket_('WB'), rows=wbFetchFinanceRows_(period);market.rawCount=rows.length;
  rows.forEach(x=>{
    const doc=asText_(x.docTypeName||x.doc_type_name), oper=asText_(x.sellerOperName||x.supplier_oper_name), text=(doc+' '+oper).toLowerCase();
    const isReturn=/возврат|return/.test(text), isSale=/продаж|sale|возврат|return/.test(doc.toLowerCase());
    const qtyRaw=toNumber_(x.quantity), qty=isSale?(isReturn?-Math.abs(qtyRaw):Math.abs(qtyRaw)):0;
    const gross=dashboardSigned_(dashboardMoney_(x.retailAmount!==undefined?x.retailAmount:x.retail_amount),isReturn,isSale);
    const forPay=dashboardSigned_(dashboardMoney_(x.forPay!==undefined?x.forPay:x.ppvz_for_pay),isReturn,isSale);
    const delivery=dashboardMoney_(x.deliveryService!==undefined?x.deliveryService:x.delivery_rub);
    const storage=dashboardMoney_(x.paidStorage!==undefined?x.paidStorage:x.storage_fee);
    const acceptance=dashboardMoney_(x.paidAcceptance!==undefined?x.paidAcceptance:x.acceptance);
    const penalty=dashboardMoney_(x.penalty), deduction=dashboardMoney_(x.deduction);
    const additional=dashboardMoney_(x.additionalPayment!==undefined?x.additionalPayment:x.additional_payment)+dashboardMoney_(x.cashbackDiscount!==undefined?x.cashbackDiscount:x.cashback_discount);
    const otherRaw=dashboardMoney_(x.rebillLogisticCost!==undefined?x.rebillLogisticCost:x.rebill_logistic_cost)+dashboardMoney_(x.cashbackAmount!==undefined?x.cashbackAmount:x.cashback_amount)+dashboardMoney_(x.cashbackCommissionChange!==undefined?x.cashbackCommissionChange:x.cashback_commission_change)+dashboardMoney_(x.paymentSchedule!==undefined?x.paymentSchedule:x.payment_schedule);
    const nm=asText_(x.nmId!==undefined?x.nmId:x.nm_id), article=asText_(x.vendorCode!==undefined?x.vendorCode:x.sa_name);
    const s=stock.byWbNm[nm]||stock.byWbArticle[normKey_(article)]||null, cost=s?s.cost:0;
    const cogs=qty*cost, commission=isSale?gross-forPay:0;
    const other=storage+acceptance+penalty+deduction+otherRaw-additional;
    const sellerNet=forPay-delivery-other;
    const profit=sellerNet-cogs;
    const date=dashboardWbRowDate_(x,period.from);
    if(qty>0){const checkId=asText_(x.srid||x.saleId||x.sale_id||x.rrdId||x.rrd_id);if(checkId)market.checks[checkId]=true;}
    const p=dashboardProduct_(market,nm||article,s?s.name:(asText_(x.title)||article||('WB '+nm)),s?s.internalId:'');
    p.revenue+=gross;p.qty+=qty;p.cogs+=cogs;p.commission+=commission;p.logistics+=delivery;p.other+=other;p.profit+=profit;if(qty<0)p.returns+=Math.abs(qty);
    market.revenue+=gross;market.qty+=qty;market.cogs+=cogs;market.commission+=commission;market.logistics+=delivery;market.other+=other;market.profit+=profit;if(qty<0)market.returns+=Math.abs(qty);
    const d=dashboardSeries_(market,date);d.revenue+=gross;d.profit+=profit;d.qty+=qty;d.cogs+=cogs;
  });
  return market;
}
function dashboardSigned_(amount,isReturn,isSale){if(!isSale)return amount;return isReturn?-Math.abs(amount):Math.abs(amount);}
function dashboardWbRowDate_(x,fallback){const v=x.rrDate||x.rr_dt||x.saleDt||x.sale_dt||x.createDate||x.create_dt;const d=dashboardParseDate_(v);return d||fallback;}
function wbFetchFinanceRows_(period){
  const all=[],seen={},limit=100000;let rrdId=0;
  for(let page=0;page<20;page++){
    const body={dateFrom:dashboardDateKey_(period.from)+'T00:00:00+03:00',dateTo:dashboardDateKey_(period.to)+'T23:59:59+03:00',rrdId:rrdId,limit:limit};
    const resp=wbFinanceRequest_('/api/finance/v1/sales-reports/detailed','post',body,'Дашборд WB');
    if(resp.code===204||!resp.text)return all;
    const json=resp.json, batch=Array.isArray(json)?json:(Array.isArray(json&&json.data)?json.data:[]);
    batch.forEach(x=>{const id=asText_(x.rrdId!==undefined?x.rrdId:x.rrd_id);if(id&&seen[id])return;if(id)seen[id]=1;all.push(x);});
    if(!batch.length)return all;
    const last=batch[batch.length-1],next=toNumber_(last.rrdId!==undefined?last.rrdId:last.rrd_id);
    if(!next||next===rrdId)throw new Error('WB вернул неполный финансовый отчёт без корректного rrdId.');
    rrdId=next;
  }
  throw new Error('WB: превышен защитный лимит 20 страниц финансового отчёта.');
}
/* ===== DashboardOzon.gs ===== */
/** Ozon: актуальные начисления /v1/finance/accrual/by-day + детализация по отправлениям. */
function loadOzonDashboardFinance_(period,stock){
  const market=emptyDashboardMarket_('Ozon'), types=ozonAccrualTypes_(), postingNumbers={}, accruals=[];
  for(let d=new Date(period.from);d<=period.to;d.setDate(d.getDate()+1)){
    const date=dashboardDateKey_(d), day=ozonAccrualDay_(date);market.rawCount+=day.length;
    day.forEach(a=>{a.__date=new Date(d);accruals.push(a);if(asText_(a.accrued_category).toUpperCase()==='POSTING'&&asText_(a.unit_number))postingNumbers[asText_(a.unit_number)]=true;});
    Utilities.sleep(120);
  }

  // total_amount — финансовый нетто-результат строки начисления Ozon.
  // Используем его как контрольную сумму периода: так учитываются ITEM/NON_ITEM,
  // компенсации, эквайринг и новые типы начислений, даже если Ozon добавит тип в справочник.
  let netAccrued=0, commissionSigned=0, logisticsSigned=0;
  accruals.forEach(a=>{
    netAccrued+=dashboardMoney_(a.total_amount);
    const date=a.__date||period.from, posting=a.posting||{};
    (posting.products||[]).forEach(prod=>{
      const sku=asText_(prod.sku), s=stock.byOzonSku[sku]||null, p=dashboardProduct_(market,sku,s?s.name:('Ozon SKU '+sku),s?s.internalId:'');
      const c=prod.commission||{}, revenue=dashboardMoney_(c.seller_price), saleCommissionSigned=dashboardMoney_(c.sale_commission);
      p._commissionSigned=(p._commissionSigned||0)+saleCommissionSigned;commissionSigned+=saleCommissionSigned;
      ((prod.delivery||{}).services||[]).forEach(f=>{
        const val=dashboardMoney_(f.accrued),bucket=ozonAccrualBucket_(f.type_id,types);
        if(bucket==='logistics'){p._logisticsSigned=(p._logisticsSigned||0)+val;logisticsSigned+=val;}
        else if(bucket==='commission'){p._commissionSigned=(p._commissionSigned||0)+val;commissionSigned+=val;}
        else p._otherSigned=(p._otherSigned||0)+val;
      });
      p.revenue+=revenue;market.revenue+=revenue;
      if(revenue>0&&asText_(a.unit_number))market.checks[asText_(a.unit_number)]=true;
      dashboardSeries_(market,date).revenue+=revenue;
    });
    (((a.item_fees||{}).fees)||[]).forEach(grp=>{
      const sku=asText_(grp.sku), s=stock.byOzonSku[sku]||null, p=dashboardProduct_(market,sku,s?s.name:('Ozon SKU '+sku),s?s.internalId:'');
      (grp.fees||[]).forEach(f=>{
        const val=dashboardMoney_(f.accrued),bucket=ozonAccrualBucket_(f.type_id,types);
        if(bucket==='logistics'){p._logisticsSigned=(p._logisticsSigned||0)+val;logisticsSigned+=val;}
        else if(bucket==='commission'){p._commissionSigned=(p._commissionSigned||0)+val;commissionSigned+=val;}
        else p._otherSigned=(p._otherSigned||0)+val;
      });
    });
  });

  // Количество реализованных/возвращённых товаров берём только из финансовой детализации начислений,
  // а не из FBS/FBO заказов. SaleCommission при продаже обычно отрицателен (удержание),
  // при сторно/возврате — положителен (возврат комиссии).
  const details=ozonAccrualPostings_(Object.keys(postingNumbers));
  details.forEach(pa=>{
    (pa.accruals||[]).forEach(a=>{
      const type=types[String(a.type_id)]||{}, name=(asText_(type.name)+' '+asText_(type.description)).toLowerCase();
      const isSale=Number(a.type_id)===69||/salecommission|комисс(?:ия|ии)?\s+за\s+продаж/.test(name);
      if(!isSale)return;
      const sku=asText_(a.sku), s=stock.byOzonSku[sku]||null, p=dashboardProduct_(market,sku,s?s.name:('Ozon SKU '+sku),s?s.internalId:'');
      const q=Math.max(0,toNumber_(a.quantity)), accrued=dashboardMoney_(a.accrued);
      const sign=accrued>0?-1:1, signedQty=sign*q, signedCogs=signedQty*(s?s.cost:0);
      p.qty+=signedQty;p.cogs+=signedCogs;if(signedQty<0)p.returns+=Math.abs(signedQty);
      market.qty+=signedQty;market.cogs+=signedCogs;if(signedQty<0)market.returns+=Math.abs(signedQty);
      const d=dashboardParseDate_(a.accrual_date)||period.from,ser=dashboardSeries_(market,d);ser.qty+=signedQty;ser.cogs+=signedCogs;
    });
  });

  // Всё, что не относится к выделенной комиссии/логистике, считаем прочими удержаниями нетто.
  // Баланс строится от total_amount, поэтому итог всегда включает новые/неизвестные типы начислений.
  const otherSigned=netAccrued-market.revenue-commissionSigned-logisticsSigned;
  const products=Object.values(market.products), directOtherSigned=products.reduce((sum,p)=>sum+(p._otherSigned||0),0), unallocatedOtherSigned=otherSigned-directOtherSigned;
  const positiveRevenue=products.reduce((sum,p)=>sum+Math.max(0,p.revenue),0);
  if(unallocatedOtherSigned!==0&&products.length){
    products.forEach(p=>{const share=positiveRevenue>0?Math.max(0,p.revenue)/positiveRevenue:1/products.length;p._otherSigned=(p._otherSigned||0)+unallocatedOtherSigned*share;});
  }
  products.forEach(p=>{p.commission=-(p._commissionSigned||0);p.logistics=-(p._logisticsSigned||0);p.other=-(p._otherSigned||0);p.profit=p.revenue+(p._commissionSigned||0)+(p._logisticsSigned||0)+(p._otherSigned||0)-p.cogs;});
  market.commission=-commissionSigned;market.logistics=-logisticsSigned;market.other=-otherSigned;market.profit=netAccrued-market.cogs;
  rebuildOzonSeriesProfit_(market,accruals);
  return market;
}

function ozonAccrualTypes_(){
  const r=ozonRequest_('/v1/finance/accrual/types',{},'Дашборд Ozon: типы начислений').json||{},out={};
  (r.accrual_types||[]).forEach(x=>out[String(x.id)]={name:asText_(x.name),description:asText_(x.description)});return out;
}
function ozonAccrualDay_(date){
  const out=[];let last='';
  for(let page=0;page<200;page++){
    const body={date:date,last_id:last},r=ozonRequest_('/v1/finance/accrual/by-day',body,'Дашборд Ozon: начисления').json||{},rows=r.accruals||[];
    out.push.apply(out,rows);const next=asText_(r.last_id);if(!next||!rows.length||next===last)return out;last=next;Utilities.sleep(120);
  }
  throw new Error('Ozon: превышен защитный лимит страниц начислений за '+date+'.');
}
function ozonAccrualPostings_(numbers){
  const out=[];chunkArray_(numbers,200).forEach(part=>{if(!part.length)return;const r=ozonRequest_('/v1/finance/accrual/postings',{posting_numbers:part},'Дашборд Ozon: детализация продаж').json||{};(r.posting_accruals||[]).forEach(x=>out.push(x));Utilities.sleep(150);});return out;
}
function ozonAccrualBucket_(typeId,types){
  const id=Number(typeId), t=types[String(typeId)]||{}, text=(asText_(t.name)+' '+asText_(t.description)).toLowerCase();
  if([32,29,98].indexOf(id)>=0||/logistic|lastmile|достав|логист/.test(text))return 'logistics';
  if(/commission|комисси/.test(text))return 'commission';
  return 'other';
}
function rebuildOzonSeriesProfit_(market,accruals){
  // Дневная прибыль также строится от total_amount, а затем уменьшается на себестоимость
  // финансово реализованных единиц за этот день.
  const netByDate={};accruals.forEach(a=>{const k=dashboardDateKey_(a.__date);netByDate[k]=(netByDate[k]||0)+dashboardMoney_(a.total_amount);if(!market.series[k])market.series[k]={date:a.__date,revenue:0,profit:0,qty:0,cogs:0};});
  Object.keys(market.series).forEach(k=>{const s=market.series[k];s.profit=(netByDate[k]||0)-(s.cogs||0);});
}
/* ===== DashboardUI.gs ===== */
function writeDashboard_(period,wb,oz,total,stock,errors){
  const sh=sheet_(APP.SHEETS.DASHBOARD);ensureDashboardLayout_();
  sh.getRange('B4').setValue(period.from).setNumberFormat('dd.mm.yyyy');sh.getRange('B5').setValue(period.to).setNumberFormat('dd.mm.yyyy');
  sh.getRange('D3').setValue('Последнее обновление');sh.getRange('D4').setValue(now_()).setNumberFormat('dd.mm.yyyy hh:mm');sh.getRange('D5').setValue(errors.length?errors.join(' | '):'Данные загружены успешно');
  const wm=dashboardMetrics_(wb,stock),om=dashboardMetrics_(oz,stock),tm=dashboardMetrics_(total,stock),data=[];for(let i=0;i<12;i++)data.push([wm[i],om[i],tm[i]]);
  sh.getRange(8,2,12,3).setValues(data);sh.getRange('B8:D8').setNumberFormat('#,##0.00');sh.getRange('B9:D9').setNumberFormat('#,##0');sh.getRange('B10:D14').setNumberFormat('#,##0.00');sh.getRange('B15:D15').setNumberFormat('0.0%');sh.getRange('B16:D16').setNumberFormat('#,##0.00');sh.getRange('B17:D17').setNumberFormat('#,##0');sh.getRange('B18:D18').setNumberFormat('#,##0.00');sh.getRange('B19:D19').setNumberFormat('#,##0');
  const seriesCount=writeDashboardSeries_(sh,period,wb,oz,total), productStart=Math.max(40,25+seriesCount);writeDashboardProducts_(sh,wb,oz,total,stock,productStart);buildDashboardCharts_(sh,seriesCount);
}
function ensureDashboardLayout_(){
  const sh=sheet_(APP.SHEETS.DASHBOARD);
  sh.getRange('A1:D1').breakApart().merge().setValue('Дашборд WB / Ozon / Общий').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.COLORS.HEADER);
  sh.getRange('A3:B5').setValues([['Период','Значение'],['Дата начала',sh.getRange('B4').getValue()],['Дата окончания',sh.getRange('B5').getValue()]]);styleHeaderAt_(sh,3,2);
  sh.getRange('A7:D7').setValues([['Показатель','WB','Ozon','Общий']]);styleHeaderAt_(sh,7,4);
  const metrics=['Выручка','Реализовано, шт.','Себестоимость','Комиссии','Логистика','Прочие удержания','Чистая прибыль','Маржинальность к себестоимости, %','Средний чек','Возвраты, шт.','Стоимость текущего склада','Остаток, шт.'];
  sh.getRange(8,1,metrics.length,1).setValues(metrics.map(x=>[x]));
  sh.getRange('A22:I500').breakApart().clearContent();
}
function writeDashboardSeries_(sh,period,wb,oz,total){
  const monthly=period.days>=31, keys={};[wb,oz,total].forEach(m=>Object.keys(m.series).forEach(k=>{const d=m.series[k].date,group=monthly?dashboardMonthKey_(d):dashboardDateKey_(d);keys[group]=true;}));
  const groups=Object.keys(keys).sort(),agg={WB:{},Ozon:{},'Общий':{}};
  [[wb,'WB'],[oz,'Ozon'],[total,'Общий']].forEach(pair=>{Object.keys(pair[0].series).forEach(k=>{const x=pair[0].series[k],g=monthly?dashboardMonthKey_(x.date):dashboardDateKey_(x.date),a=agg[pair[1]][g]||(agg[pair[1]][g]={revenue:0,profit:0,qty:0,cogs:0});a.revenue+=x.revenue||0;a.profit+=x.profit||0;a.qty+=x.qty||0;a.cogs+=x.cogs||0;});});
  sh.getRange(22,1,1,9).setValues([[monthly?'Месяц':'Дата','Выручка WB','Выручка Ozon','Прибыль WB','Прибыль Ozon','Реализовано WB','Реализовано Ozon','Маржинальность WB','Маржинальность Ozon']]);styleHeaderAt_(sh,22,9);
  const rows=groups.map(g=>{const w=agg.WB[g]||{},o=agg.Ozon[g]||{};return [monthly?g:new Date(g+'T00:00:00'),w.revenue||0,o.revenue||0,w.profit||0,o.profit||0,w.qty||0,o.qty||0,(w.cogs?((w.profit||0)/Math.abs(w.cogs)):0),(o.cogs?((o.profit||0)/Math.abs(o.cogs)):0)];});
  if(rows.length)sh.getRange(23,1,rows.length,9).setValues(rows);if(!monthly&&rows.length)sh.getRange(23,1,rows.length,1).setNumberFormat('dd.mm.yyyy');sh.getRange(23,2,Math.max(1,rows.length),4).setNumberFormat('#,##0.00');sh.getRange(23,8,Math.max(1,rows.length),2).setNumberFormat('0.0%');return rows.length;
}
function dashboardProductRows_(market){return Object.values(market.products||{}).map(p=>[p.marketplace,p.name,p.revenue,p.qty,p.cogs,p.profit,p.cogs?p.profit/p.cogs:0]);}
function writeDashboardProducts_(sh,wb,oz,total,stock,startRow){
  const all=dashboardProductRows_(total), byRevenue=all.slice().sort((a,b)=>b[2]-a[2]).slice(0,10), byProfit=all.slice().sort((a,b)=>b[5]-a[5]).slice(0,10), byQty=all.slice().sort((a,b)=>b[3]-a[3]).slice(0,10), low=all.filter(r=>r[4]>0).sort((a,b)=>a[6]-b[6]).slice(0,10);
  const r1=startRow||40,r2=r1+13,r3=r2+13,r4=r3+13,r5=r4+13;writeDashboardProductBlock_(sh,r1,'ТОП-10 по выручке',byRevenue);writeDashboardProductBlock_(sh,r2,'ТОП-10 по чистой прибыли',byProfit);writeDashboardProductBlock_(sh,r3,'ТОП-10 по реализованному количеству',byQty);writeDashboardProductBlock_(sh,r4,'Низкая маржинальность',low);
  const sold={};Object.values(total.products).forEach(p=>{if(p.internalId&&(Math.abs(p.qty)>0||Math.abs(p.revenue)>0))sold[p.internalId]=true;});const noSales=stock.rows.filter(x=>!sold[x.internalId]).slice(0,30).map(x=>[(x.wbNm&&x.ozOffer)?'WB + Ozon':(x.wbNm?'WB':'Ozon'),x.name,0,0,0,0,0]);writeDashboardProductBlock_(sh,r5,'Нет продаж за выбранный период',noSales);
}
function writeDashboardProductBlock_(sh,row,title,rows){sh.getRange(row,1,1,7).merge().setValue(title).setFontWeight('bold').setBackground(APP.COLORS.SECTION);sh.getRange(row+1,1,1,7).setValues([['Маркетплейс','Товар','Выручка','Количество','Себестоимость','Прибыль','Маржинальность']]);styleHeaderAt_(sh,row+1,7);if(rows.length)sh.getRange(row+2,1,rows.length,7).setValues(rows);sh.getRange(row+2,3,Math.max(1,rows.length),4).setNumberFormat('#,##0.00');sh.getRange(row+2,7,Math.max(1,rows.length),1).setNumberFormat('0.0%');}
function buildDashboardCharts_(sh,seriesCount){
  sh.getCharts().forEach(c=>sh.removeChart(c));if(!seriesCount)return;
  const n=seriesCount+1;
  const chart1=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,3)).setPosition(3,10,0,0).setOption('title','Выручка WB / Ozon').setOption('legend',{position:'bottom'}).build();
  const chart2=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,1)).addRange(sh.getRange(22,4,n,2)).setPosition(19,10,0,0).setOption('title','Чистая прибыль WB / Ozon').setOption('legend',{position:'bottom'}).build();
  const chart3=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,1)).addRange(sh.getRange(22,6,n,2)).setPosition(35,10,0,0).setOption('title','Реализовано, шт.').setOption('legend',{position:'bottom'}).build();
  const chart4=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,1)).addRange(sh.getRange(22,8,n,2)).setPosition(51,10,0,0).setOption('title','Маржинальность').setOption('legend',{position:'bottom'}).build();
  [chart1,chart2,chart3,chart4].forEach(c=>sh.insertChart(c));
}
/* ===== Procurement.gs ===== */
/**
 * Прогноз закупок по финансово реализованным продажам WB/Ozon.
 * Запас, дней — только закупочный буфер; он не резервирует остаток маркетплейсов.
 */
function refreshForecast(automatic){
  const started=Date.now(), settings=forecastSettings_(), today=dashboardDateOnly_(new Date());
  const end=new Date(today); end.setDate(end.getDate()-1);
  const from=new Date(end); from.setDate(from.getDate()-settings.analysisDays+1);
  const period={from:from,to:end,days:settings.analysisDays};
  const useWb=boolText_(getSetting_('Использовать WB','Нет')), useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon) throw new Error('В настройках не выбран ни один маркетплейс.');

  const stockCtx=dashboardStockContext_(), items=forecastStockRows_(), selected=forecastSelectedIndex_(), orderCtx=forecastSupplierOrderContext_();
  let wbData={byInternal:{},rawCount:0,failed:false}, ozData={byInternal:{},rawCount:0,failed:false};
  const warnings=[];
  if(useWb){try{wbData=forecastLoadWbSales_(period,stockCtx);}catch(e){wbData.failed=true;warnings.push('WB: '+e.message);notify_({level:'Предупреждение',type:'Ошибка прогноза закупок',marketplace:'WB',regulation:'Прогноз закупок',message:e.message});}}
  if(useOzon){try{ozData=forecastLoadOzonSales_(period,stockCtx);}catch(e){ozData.failed=true;warnings.push('Ozon: '+e.message);notify_({level:'Предупреждение',type:'Ошибка прогноза закупок',marketplace:'Ozon',regulation:'Прогноз закупок',message:e.message});}}
  if((useWb&&wbData.failed)&&(useOzon&&ozData.failed)) throw new Error(warnings.join(' | ')||'Не удалось загрузить данные продаж для прогноза.');

  const wbIdx=wbData.byInternal||{}, ozIdx=ozData.byInternal||{}, rows=[];
  items.forEach(item=>{
    const ws=wbIdx[item.internalId]||forecastEmptySales_(), os=ozIdx[item.internalId]||forecastEmptySales_();
    const wbSold=Math.max(0,ws.qty), ozSold=Math.max(0,os.qty), totalSold=wbSold+ozSold;
    const wbAvg=wbSold/settings.analysisDays, ozAvg=ozSold/settings.analysisDays, avg=totalSold/settings.analysisDays;
    const shareWb=useWb&&!useOzon?1:(!useWb&&useOzon?0:(totalSold>0?wbSold/totalSold:0)), shareOz=useOzon&&!useWb?1:(!useOzon&&useWb?0:(totalSold>0?ozSold/totalSold:0));
    const combinedSeries=forecastMergeSeries_(ws.series,os.series);
    const seasonWb=forecastSeasonality_(ws.series,period,settings.horizonDays,settings.useSeasonality,today);
    const seasonOz=forecastSeasonality_(os.series,period,settings.horizonDays,settings.useSeasonality,today);
    const seasonAll=forecastSeasonality_(combinedSeries,period,settings.horizonDays,settings.useSeasonality,today);
    const ordered=orderCtx.byInternal[item.internalId]||{active:0,inTransit:0};
    const stockDays=avg>0?item.stock/avg:'';
    const shortage=avg>0?forecastAddDays_(today,Math.floor(item.stock/avg)):'';
    const demand=avg>0?Math.ceil(avg*settings.horizonDays*seasonAll.ks):0;
    const recommended=Math.max(0,Math.ceil(demand-item.stock-ordered.active));
    const status=forecastStatus_(totalSold,recommended,stockDays,item.leadDays,item.bufferDays,ordered.active);
    const note=forecastSeasonalityNote_(seasonWb,seasonOz,seasonAll);
    rows.push([
      selected[item.internalId]===true,item.internalId,item.name,item.article,item.stock,ordered.inTransit,
      settings.analysisDays,settings.horizonDays,wbSold,wbAvg,ozSold,ozAvg,totalSold,avg,shareWb,shareOz,
      seasonWb.ks,seasonOz.ks,seasonAll.ks,note,item.leadDays,item.bufferDays,stockDays,shortage,demand,ordered.active,recommended,status
    ]);
  });

  const sh=sheet_(APP.SHEETS.FORECAST), headers=SHEET_SCHEMAS[APP.SHEETS.FORECAST];
  if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent().clearFormat().clearDataValidations();
  if(rows.length){
    sh.getRange(2,1,rows.length,headers.length).setValues(rows);
    sh.getRange(2,1,rows.length,1).insertCheckboxes();
    sh.getRange(2,10,rows.length,1).setNumberFormat('0.000');
    sh.getRange(2,12,rows.length,1).setNumberFormat('0.000');
    sh.getRange(2,14,rows.length,1).setNumberFormat('0.000');
    sh.getRange(2,15,rows.length,2).setNumberFormat('0.0%');
    sh.getRange(2,17,rows.length,3).setNumberFormat('0.00');
    sh.getRange(2,23,rows.length,1).setNumberFormat('0.0');
    sh.getRange(2,24,rows.length,1).setNumberFormat('dd.mm.yyyy');
    rows.forEach((r,i)=>{if(r[27]==='В выбранном периоде нет продаж')sh.getRange(i+2,1,1,headers.length).setBackground(APP.COLORS.ERROR);});
  }
  setSetting_('Последний расчёт прогноза',formatDateTime_(now_()));
  const duration=Math.round((Date.now()-started)/1000), errors=warnings.length;
  logEvent_({regulation:'Прогноз закупок',runType:automatic===true?'Автоматический':'Ручной',result:errors?'С предупреждениями':'Успешно',processed:rows.length,success:rows.length,errors:errors,duration:duration,info:'Анализ '+settings.analysisDays+' дн.; горизонт '+settings.horizonDays+' дн.'+(warnings.length?' | '+warnings.join(' | '):'')});
  toast_('Прогноз закупок обновлён: '+rows.length+' товаров'+(warnings.length?' (есть предупреждения)':'')+'.');
  return {processed:rows.length,success:rows.length,errors:errors};
}

function forecastSettings_(){
  const analysis=forecastDaysSetting_('Период анализа','Пользовательский период анализа, дней',30);
  const horizon=forecastDaysSetting_('Горизонт планирования','Пользовательский горизонт, дней',30);
  return {analysisDays:analysis,horizonDays:horizon,useSeasonality:boolText_(getSetting_('Использовать сезонность','Да'))};
}
function forecastDaysSetting_(name,customName,fallback){
  const raw=asText_(getSetting_(name,String(fallback)));
  const n=raw==='Свое значение'?toNumber_(getSetting_(customName,'')):toNumber_(raw);
  if(!Number.isFinite(n)||n<1) throw new Error('Некорректная настройка «'+name+'».');
  if(n>1460) throw new Error('Период больше 1460 дней не поддерживается защитным лимитом Apps Script.');
  return Math.floor(n);
}
function forecastStockRows_(){
  const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<=1)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(r=>({
    internalId:asText_(r[h['Внутренний ID']-1]),name:asText_(r[h['Наименование']-1]),article:asText_(r[h['Артикул основной']-1]),stock:Math.max(0,toNumber_(r[h['Фактический остаток']-1])),
    leadDays:Math.max(0,Math.floor(toNumber_(r[h['Срок поставки, дней']-1]))),bufferDays:Math.max(0,Math.floor(toNumber_(r[h['Запас, дней']-1])))
  })).filter(x=>x.internalId);
}
function forecastSelectedIndex_(){
  const sh=sheet_(APP.SHEETS.FORECAST),out={};if(sh.getLastRow()<=1)return out;const h=findHeaderMap_(sh);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{const id=asText_(r[h['Внутренний ID']-1]);if(id)out[id]=r[h['В заказ']-1]===true;});return out;
}
function forecastSupplierOrderContext_(){
  const sh=sheet_(APP.SHEETS.SUPPLIER_ORDERS),out={byInternal:{}};if(sh.getLastRow()<=1)return out;const h=findHeaderMap_(sh);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{
    const id=asText_(r[h['Внутренний ID товара']-1]),status=asText_(r[h['Статус']-1]);if(!id||status==='Отменён'||status==='Получен')return;
    const ordered=Math.max(0,toNumber_(r[h['Количество заказано']-1])),received=Math.max(0,toNumber_(r[h['Получено']-1]));
    const rem=Math.max(0,ordered-received);if(!out.byInternal[id])out.byInternal[id]={active:0,inTransit:0};out.byInternal[id].active+=rem;
    if(status==='В пути'||status==='Частично получен')out.byInternal[id].inTransit+=rem;
  });return out;
}
function forecastEmptySales_(){return {qty:0,series:{}};}
function forecastLoadWbSales_(period,stock){
  const out={byInternal:{},rawCount:0,failed:false},rows=wbFetchFinanceRows_(period);out.rawCount=rows.length;
  rows.forEach(x=>{
    const doc=asText_(x.docTypeName||x.doc_type_name),oper=asText_(x.sellerOperName||x.supplier_oper_name),text=(doc+' '+oper).toLowerCase();
    const isReturn=/возврат|return/.test(text),isSale=/продаж|sale|возврат|return/.test(doc.toLowerCase());if(!isSale)return;
    const qtyRaw=Math.max(0,toNumber_(x.quantity)),qty=isReturn?-qtyRaw:qtyRaw;if(!qty)return;
    const nm=asText_(x.nmId!==undefined?x.nmId:x.nm_id),article=asText_(x.vendorCode!==undefined?x.vendorCode:x.sa_name),item=stock.byWbNm[nm]||stock.byWbArticle[normKey_(article)]||null;if(!item)return;
    const rec=forecastEnsureSales_(out.byInternal,item.internalId),date=dashboardWbRowDate_(x,period.from),key=dashboardDateKey_(date);rec.qty+=qty;rec.series[key]=(rec.series[key]||0)+qty;
  });return out;
}
function forecastLoadOzonSales_(period,stock){
  const out={byInternal:{},rawCount:0,failed:false},types=ozonAccrualTypes_(),postingNumbers={};
  for(let d=new Date(period.from);d<=period.to;d.setDate(d.getDate()+1)){
    const day=ozonAccrualDay_(dashboardDateKey_(d));out.rawCount+=day.length;
    day.forEach(a=>{if(asText_(a.accrued_category).toUpperCase()==='POSTING'&&asText_(a.unit_number))postingNumbers[asText_(a.unit_number)]=true;});
    Utilities.sleep(80);
  }
  const details=ozonAccrualPostings_(Object.keys(postingNumbers));
  details.forEach(pa=>(pa.accruals||[]).forEach(a=>{
    const type=types[String(a.type_id)]||{},name=(asText_(type.name)+' '+asText_(type.description)).toLowerCase();
    const isSale=Number(a.type_id)===69||/salecommission|комисс(?:ия|ии)?\s+за\s+продаж/.test(name);if(!isSale)return;
    const sku=asText_(a.sku),item=stock.byOzonSku[sku]||null;if(!item)return;
    const q=Math.max(0,toNumber_(a.quantity)),accrued=dashboardMoney_(a.accrued),qty=(accrued>0?-1:1)*q;if(!qty)return;
    const rec=forecastEnsureSales_(out.byInternal,item.internalId),date=dashboardParseDate_(a.accrual_date)||period.from,key=dashboardDateKey_(date);rec.qty+=qty;rec.series[key]=(rec.series[key]||0)+qty;
  }));return out;
}
function forecastEnsureSales_(map,id){if(!map[id])map[id]={qty:0,series:{}};return map[id];}

function forecastMergeSeries_(a,b){const out={};[a||{},b||{}].forEach(src=>Object.keys(src).forEach(k=>out[k]=(out[k]||0)+toNumber_(src[k]&&src[k].qty!==undefined?src[k].qty:src[k])));return out;}

function forecastSeasonality_(series,period,horizonDays,enabled,today){
  if(!enabled)return {ks:1,note:'Сезонность отключена'};
  if(period.days<90)return {ks:1,note:'Недостаточно данных для сезонности'};
  const byMonth={};Object.keys(series||{}).forEach(k=>{const d=dashboardParseDate_(k);if(!d)return;const mk=dashboardMonthKey_(d);byMonth[mk]=(byMonth[mk]||0)+Math.max(0,toNumber_(series[k]&&series[k].qty!==undefined?series[k].qty:series[k]));});
  const complete=[];let cursor=new Date(period.from.getFullYear(),period.from.getMonth(),1);
  while(cursor<=period.to){const first=new Date(cursor),last=new Date(cursor.getFullYear(),cursor.getMonth()+1,0);if(first>=period.from&&last<=period.to)complete.push(dashboardMonthKey_(cursor));cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);}
  if(complete.length<3)return {ks:1,note:'Недостаточно данных для сезонности'};
  const avg=complete.reduce((sum,k)=>sum+Math.max(0,byMonth[k]||0),0)/complete.length;if(avg<=0)return {ks:1,note:'Недостаточно данных для сезонности'};
  const byMonthNum={};complete.forEach(k=>{const m=Number(k.slice(5,7));if(!byMonthNum[m])byMonthNum[m]=[];byMonthNum[m].push(Math.max(0,byMonth[k]||0));});
  const coeff={};Object.keys(byMonthNum).forEach(m=>{const arr=byMonthNum[m],v=arr.reduce((sum,x)=>sum+x,0)/arr.length;coeff[Number(m)]=v/avg;});
  let weighted=0,weight=0;const notes={},d=new Date(today);
  for(let i=0;i<horizonDays;i++){const m=d.getMonth()+1,c=coeff[m]===undefined?1:coeff[m];weighted+=c;weight++;notes[m]=c;d.setDate(d.getDate()+1);}
  const parts=Object.keys(notes).sort((a,b)=>Number(a)-Number(b)).map(m=>coeff[Number(m)]===undefined?forecastMonthName_(Number(m))+': нет истории':forecastMonthName_(Number(m))+': '+forecastPercentDelta_(notes[m]));
  return {ks:weight?weighted/weight:1,note:parts.join(', ')||'Недостаточно данных для сезонности'};
}
function forecastDaysInMonthKey_(key){const y=Number(key.slice(0,4)),m=Number(key.slice(5,7));return new Date(y,m,0).getDate();}
function forecastMonthName_(m){return ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][m-1]||String(m);}
function forecastPercentDelta_(ks){const pct=Math.round((ks-1)*100);return (pct>0?'+':'')+pct+'% к среднему';}
function forecastSeasonalityNote_(wb,oz,total){return 'WB: '+wb.note+'; Ozon: '+oz.note+'; Общий: '+total.note;}
function forecastAddDays_(d,n){const x=new Date(d);x.setDate(x.getDate()+Math.max(0,n));return x;}
function forecastStatus_(sold,recommended,stockDays,lead,buffer,ordered){
  if(sold<=0)return 'В выбранном периоде нет продаж';
  const trigger=(toNumber_(stockDays)<=lead+buffer);
  if(recommended>0&&trigger)return 'ЗАКАЗАТЬ СЕЙЧАС — риск дефицита до поставки';
  if(recommended>0)return 'ЗАКАЗАТЬ';
  if(trigger&&ordered>0)return 'Поставка в пути закрывает потребность';
  if(trigger)return 'Контроль: запас ниже срока поставки + буфер';
  return 'Запаса достаточно';
}
/* ===== SupplierOrders.gs ===== */
/** Заказы поставщикам и приёмка. */
function createSupplierOrder(){openSupplierOrderDialog_('manual');}
function createSupplierOrderFromSelected(){
  const selected=supplierSelectedForecastLines_();
  if(!selected.length){SpreadsheetApp.getUi().alert('Отметьте товары флажком «В заказ» на листе «Прогноз закупок».');return;}
  openSupplierOrderDialog_('forecast',selected);
}
function openSupplierOrderDialog_(mode,selected){
  const data={mode:mode,products:supplierProductDirectory_(),lines:selected||[],today:supplierIsoDate_(new Date())};
  const out=HtmlService.createHtmlOutput(prostayaRenderHtml_(PROSTAYA_SUPPLIER_ORDER_HTML_,data)).setWidth(760).setHeight(mode==='forecast'?620:520);
  SpreadsheetApp.getUi().showModalDialog(out,mode==='forecast'?'Создать заказ из прогноза':'Создать заказ поставщику');
}
function supplierProductDirectory_(){
  const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<=1)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(r=>({
    internalId:asText_(r[h['Внутренний ID']-1]),article:asText_(r[h['Артикул основной']-1]),name:asText_(r[h['Наименование']-1]),cost:toNumber_(r[h['Себестоимость']-1]),leadDays:toNumber_(r[h['Срок поставки, дней']-1]),
    wbNm:asText_(r[h['WB NMID']-1]),wbArticle:asText_(r[h['WB артикул']-1]),ozOffer:asText_(r[h['Ozon Offer ID']-1]),ozSku:asText_(r[h['Ozon SKU']-1])
  })).filter(x=>x.internalId).sort((a,b)=>(a.article+' '+a.name).localeCompare(b.article+' '+b.name,'ru'));
}
function supplierSelectedForecastLines_(){
  const sh=sheet_(APP.SHEETS.FORECAST),out=[];if(sh.getLastRow()<=1)return out;const h=findHeaderMap_(sh),dir={};supplierProductDirectory_().forEach(x=>dir[x.internalId]=x);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{if(r[h['В заказ']-1]!==true)return;const id=asText_(r[h['Внутренний ID']-1]),p=dir[id];if(!p)return;out.push({internalId:id,article:p.article,name:p.name,qty:Math.max(0,Math.ceil(toNumber_(r[h['Рекомендуется заказать']-1]))),cost:p.cost,leadDays:p.leadDays});});
  return out.filter(x=>x.qty>0);
}
function submitSupplierOrderDialog(payload){
  payload=payload||{};const supplier=asText_(payload.supplier),orderDate=supplierParseDate_(payload.orderDate)||new Date(),expected=supplierParseDate_(payload.expectedDate),comment=asText_(payload.comment);
  if(!supplier)throw new Error('Укажите поставщика.');
  const lines=Array.isArray(payload.lines)?payload.lines:[];if(!lines.length)throw new Error('В заказе нет товаров.');
  const dir={};supplierProductDirectory_().forEach(x=>dir[x.internalId]=x);const orderId=supplierOrderId_(),rows=[];
  lines.forEach(line=>{
    const p=dir[asText_(line.internalId)];if(!p)throw new Error('Не найден товар: '+asText_(line.internalId));const qty=Math.max(0,Math.floor(toNumber_(line.qty))),cost=Math.max(0,toNumber_(line.cost));if(!qty)return;
    rows.push([orderId,supplier,orderDate,expected||forecastAddDays_(orderDate,Math.max(0,Math.floor(p.leadDays||0))),p.internalId,p.name,p.article,supplierJoinIds_(p.wbArticle,p.wbNm),supplierJoinIds_(p.ozOffer,p.ozSku),qty,0,qty,cost,qty*cost,'','Заказан',comment]);
  });
  if(!rows.length)throw new Error('Количество к заказу должно быть больше нуля.');
  const sh=sheet_(APP.SHEETS.SUPPLIER_ORDERS);sh.getRange(sh.getLastRow()+1,1,rows.length,SHEET_SCHEMAS[APP.SHEETS.SUPPLIER_ORDERS].length).setValues(rows);
  if(asText_(payload.mode)==='forecast')supplierClearForecastSelections_(lines.map(x=>asText_(x.internalId)));
  logEvent_({regulation:'Заказы поставщикам',runType:'Ручной',result:'Успешно',processed:rows.length,success:rows.length,errors:0,info:'Создан заказ '+orderId+'; поставщик: '+supplier});
  try{refreshForecast(false);}catch(e){notify_({level:'Предупреждение',type:'Прогноз после заказа',regulation:'Заказы поставщикам',message:e.message,email:false});}
  return {orderId:orderId,lines:rows.length};
}

function acceptSupplierDelivery(){
  const lines=supplierActiveOrderLines_();if(!lines.length){SpreadsheetApp.getUi().alert('Нет активных строк заказов для приёмки.');return;}
  const data={lines:lines,today:supplierIsoDate_(new Date())};
  const out=HtmlService.createHtmlOutput(prostayaRenderHtml_(PROSTAYA_RECEIVE_DELIVERY_HTML_,data)).setWidth(680).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(out,'Принять поставку');
}
function supplierActiveOrderLines_(){
  const sh=sheet_(APP.SHEETS.SUPPLIER_ORDERS),out=[];if(sh.getLastRow()<=1)return out;const h=findHeaderMap_(sh);
  sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{const status=asText_(r[h['Статус']-1]);if(status==='Получен'||status==='Отменён')return;const ordered=toNumber_(r[h['Количество заказано']-1]),received=toNumber_(r[h['Получено']-1]),remaining=Math.max(0,ordered-received);if(!remaining)return;out.push({row:i+2,orderId:asText_(r[h['ID заказа']-1]),supplier:asText_(r[h['Поставщик']-1]),internalId:asText_(r[h['Внутренний ID товара']-1]),article:asText_(r[h['Артикул основной']-1]),name:asText_(r[h['Наименование']-1]),ordered:ordered,received:received,remaining:remaining,orderCost:toNumber_(r[h['Себестоимость по заказу']-1])});});return out;
}
function submitSupplierReceipt(payload){
  payload=payload||{};const row=Math.floor(toNumber_(payload.row)),qty=Math.max(0,Math.floor(toNumber_(payload.qty))),date=supplierParseDate_(payload.date)||new Date(),rule=asText_(payload.costRule)||'Не обновлять';
  if(row<2||qty<=0)throw new Error('Укажите строку заказа и количество к приёмке.');
  const orders=sheet_(APP.SHEETS.SUPPLIER_ORDERS),h=findHeaderMap_(orders);if(row>orders.getLastRow())throw new Error('Строка заказа не найдена.');
  const r=orders.getRange(row,1,1,orders.getLastColumn()).getValues()[0],ordered=Math.max(0,toNumber_(r[h['Количество заказано']-1])),received=Math.max(0,toNumber_(r[h['Получено']-1])),remaining=Math.max(0,ordered-received);
  if(qty>remaining)throw new Error('Нельзя принять '+qty+' шт.: осталось получить '+remaining+' шт.');
  const internalId=asText_(r[h['Внутренний ID товара']-1]),orderCost=Math.max(0,toNumber_(r[h['Себестоимость по заказу']-1])),incomingCost=Math.max(0,toNumber_(payload.newCost))||orderCost;
  const stock=sheet_(APP.SHEETS.STOCK),sh=findHeaderMap_(stock),stockRow=supplierFindStockRow_(internalId);if(!stockRow)throw new Error('Товар заказа не найден на листе «Склад».');
  const oldStock=Math.max(0,toNumber_(stock.getRange(stockRow,sh['Фактический остаток']).getValue())),oldCost=Math.max(0,toNumber_(stock.getRange(stockRow,sh['Себестоимость']).getValue()));
  if((rule==='Заменить текущую'||rule==='Средневзвешенная')&&incomingCost<=0)throw new Error('Для выбранного способа обновления себестоимости укажите закупочную цену.');
  stock.getRange(stockRow,sh['Фактический остаток']).setValue(oldStock+qty);if(sh['Последнее движение'])stock.getRange(stockRow,sh['Последнее движение']).setValue(date);
  if(rule==='Заменить текущую'){
    stock.getRange(stockRow,sh['Себестоимость']).setValue(incomingCost);
  }else if(rule==='Средневзвешенная'){
    const newCost=(oldStock+qty)>0?(oldStock*oldCost+qty*incomingCost)/(oldStock+qty):incomingCost;stock.getRange(stockRow,sh['Себестоимость']).setValue(Math.round(newCost*100)/100);
  }
  const newReceived=received+qty,newRemaining=Math.max(0,ordered-newReceived);orders.getRange(row,h['Получено']).setValue(newReceived);orders.getRange(row,h['Осталось получить']).setValue(newRemaining);orders.getRange(row,h['Дата последней приёмки']).setValue(date);orders.getRange(row,h['Статус']).setValue(newRemaining>0?'Частично получен':'Получен');
  if(toNumber_(payload.newCost)>0){orders.getRange(row,h['Себестоимость по заказу']).setValue(toNumber_(payload.newCost));orders.getRange(row,h['Общая сумма']).setValue(ordered*toNumber_(payload.newCost));}
  logEvent_({regulation:'Приёмка поставки',runType:'Ручной',result:'Успешно',processed:1,success:1,errors:0,info:'Заказ '+asText_(r[h['ID заказа']-1])+', '+qty+' шт., товар '+internalId});
  try{if(boolText_(getSetting_('Автоматическая отправка остатков','Выкл'))&&boolText_(getSetting_(APP.SAFE_GUARDS.SEND_STOCKS,'Нет')))syncStocks();}catch(e){notify_({level:'Предупреждение',type:'Остатки после приёмки',regulation:'Приёмка поставки',message:e.message});}
  try{refreshForecast(false);}catch(e){notify_({level:'Предупреждение',type:'Прогноз после приёмки',regulation:'Приёмка поставки',message:e.message,email:false});}
  return {received:qty,remaining:newRemaining};
}
function supplierFindStockRow_(internalId){const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<=1)return 0;const vals=sh.getRange(2,h['Внутренний ID'],sh.getLastRow()-1,1).getValues().flat().map(asText_);const i=vals.indexOf(asText_(internalId));return i<0?0:i+2;}
function supplierClearForecastSelections_(ids){const wanted={};ids.forEach(x=>{if(x)wanted[x]=true;});const sh=sheet_(APP.SHEETS.FORECAST);if(sh.getLastRow()<=1)return;const h=findHeaderMap_(sh),vals=sh.getRange(2,h['Внутренний ID'],sh.getLastRow()-1,1).getValues();vals.forEach((r,i)=>{if(wanted[asText_(r[0])])sh.getRange(i+2,h['В заказ']).setValue(false);});}
function showActiveSupplierOrders(){const sh=sheet_(APP.SHEETS.SUPPLIER_ORDERS);if(sh.getFilter())sh.getFilter().remove();if(sh.getLastRow()>1){const f=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).createFilter(),h=findHeaderMap_(sh);f.setColumnFilterCriteria(h['Статус'],SpreadsheetApp.newFilterCriteria().setHiddenValues(['Получен','Отменён']).build());}}
function supplierOrderId_(){return 'PO-'+Utilities.formatDate(new Date(),ss_().getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,4).toUpperCase();}
function supplierJoinIds_(a,b){return [asText_(a),asText_(b)].filter(Boolean).join(' / ');}
function supplierIsoDate_(d){return Utilities.formatDate(d,ss_().getSpreadsheetTimeZone(),'yyyy-MM-dd');}
function supplierParseDate_(v){if(!v)return null;if(v instanceof Date&&!isNaN(v))return v;const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));const d=new Date(v);return isNaN(d)?null:d;}
/* ===== CardsCore.gs ===== */
/** Основной цикл создания карточек WB/Ozon из листа «Новые карточки». */
function generateBarcodes(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true),used=cardUsedBarcodes_();
  let count=0;
  targets.forEach(t=>{const cell=sh.getRange(t.row,h['Штрихкод']);if(asText_(cell.getValue()))return;const code=cardGenerateEan13_(used);cell.setValue(code);used[code]=true;count++;});
  toast_('Сгенерировано штрихкодов: '+count+'.');
  return {processed:targets.length,success:count,errors:0};
}
function cardUsedBarcodes_(){
  const out={};
  [APP.SHEETS.STOCK,APP.SHEETS.NEW_CARDS].forEach(name=>{const sh=sheet_(name),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return;const key='Штрихкод';if(!h[key])return;sh.getRange(2,h[key],sh.getLastRow()-1,1).getValues().forEach(r=>{const b=normBarcode_(r[0]);if(b)out[b]=true;});});
  return out;
}
function cardGenerateEan13_(used){let barcode='';do{let base='29';for(let i=0;i<10;i++)base+=Math.floor(Math.random()*10);barcode=base+ean13CheckDigit_(base);}while(used[barcode]);return barcode;}
function ean13CheckDigit_(base12){const s=String(base12);if(!/^\d{12}$/.test(s))throw new Error('Для EAN-13 требуется 12 цифр без контрольной.');let sum=0;for(let i=0;i<12;i++)sum+=Number(s[i])*(i%2===0?1:3);return String((10-(sum%10))%10);}

function validateSelectedCards(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h0=findHeaderMap_(sh),targets0=cardTargetRows_(sh,h0,true);if(!targets0.length)throw new Error('Нет карточек для проверки. Отметьте «Создать».');
  cardEnsureIdentifiers_(sh,h0,targets0);
  applyCategoryMappingsToCards_();
  loadRequiredCardAttributes();
  const h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true),useWb=boolText_(getSetting_('Использовать WB','Нет')),useOz=boolText_(getSetting_('Использовать Ozon','Нет'));
  const duplicateIndex=cardArticleDuplicateIndex_();let success=0,errors=0;
  targets.forEach(t=>{
    const data=cardReadRow_(sh,t.row,h);let wbErr='',ozErr='';
    try{cardValidateCommon_(data,sh,t.row,h,duplicateIndex);}catch(e){wbErr=e.message;ozErr=e.message;}
    if(!wbErr&&useWb){try{cardValidateWb_(data,sh,t.row,h);}catch(e){wbErr=e.message;}}
    if(!ozErr&&useOz){try{cardValidateOzon_(data,sh,t.row,h);}catch(e){ozErr=e.message;}}
    cardWriteCheck_(sh,t.row,h,'WB',useWb?(wbErr?'ОШИБКА: '+wbErr:'ГОТОВО'):'НЕ ИСПОЛЬЗУЕТСЯ');
    cardWriteCheck_(sh,t.row,h,'Ozon',useOz?(ozErr?'ОШИБКА: '+ozErr:'ГОТОВО'):'НЕ ИСПОЛЬЗУЕТСЯ');
    if(useWb)sh.getRange(t.row,h['Ошибка WB']).setValue(wbErr);
    if(useOz)sh.getRange(t.row,h['Ошибка Ozon']).setValue(ozErr);
    if((!useWb||!wbErr)&&(!useOz||!ozErr))success++;else errors++;
  });
  toast_('Проверено карточек: '+targets.length+'. Готово: '+success+', с ошибками: '+errors+'.');
  return {processed:targets.length,success:success,errors:errors};
}

function createSelectedCards(){
  validateSelectedCards();
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true),useWb=boolText_(getSetting_('Использовать WB','Нет')),useOz=boolText_(getSetting_('Использовать Ozon','Нет'));
  let processed=0,success=0,errors=0;
  targets.forEach(t=>{
    const data=cardReadRow_(sh,t.row,h);let touched=false;
    if(useWb&&cardCheckIsReady_(sh,t.row,h,'WB')&&!cardSideCreated_(data,'WB')){touched=true;processed++;try{const r=wbCreateOrFinalizeCard_(sh,t.row,h,data,false);if(r.created)success++;else if(r.error)errors++;}catch(e){errors++;cardSetSideError_(sh,t.row,h,'WB',e.message);}}
    if(useOz&&cardCheckIsReady_(sh,t.row,h,'Ozon')&&!cardSideCreated_(cardReadRow_(sh,t.row,h),'Ozon')){touched=true;processed++;try{const r=ozonCreateOrFinalizeCard_(sh,t.row,h,cardReadRow_(sh,t.row,h),false);if(r.created)success++;else if(r.error)errors++;}catch(e){errors++;cardSetSideError_(sh,t.row,h,'Ozon',e.message);}}
    if(touched)cardSyncWarehouseAndMatching_(sh,t.row,h);
  });
  toast_('Создание карточек: операций '+processed+', завершено '+success+', ошибок '+errors+'. Ожидающие ID будут продолжены повторным запуском.');
  return {processed:processed,success:success,errors:errors};
}
function retryFailedWbCards(){return cardRetryFailedSide_('WB');}
function retryFailedOzonCards(){return cardRetryFailedSide_('Ozon');}
function cardRetryFailedSide_(market){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return {processed:0,success:0,errors:0};
  const enabled=boolText_(getSetting_(market==='WB'?'Использовать WB':'Использовать Ozon','Нет'));if(!enabled)throw new Error(market+' выключен в настройках.');
  let p=0,s=0,e=0;const rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  rows.forEach((r,i)=>{const row=i+2,data=cardReadRow_(sh,row,h),status=asText_(r[h['Статус '+market]-1]),photoRetry=market==='WB'&&/ОШИБКА ФОТО/i.test(status);if((cardSideCreated_(data,market)&&!photoRetry)||status.indexOf('ОШИБ')<0)return;
    p++;try{cardEnsureIdentifiers_(sh,h,[{row:row,values:r}]);const fresh=cardReadRow_(sh,row,h);if(market==='WB')cardValidateWb_(fresh,sh,row,h);else cardValidateOzon_(fresh,sh,row,h);cardClearPending_(market,fresh.internalId);const x=market==='WB'?wbCreateOrFinalizeCard_(sh,row,h,fresh,true):ozonCreateOrFinalizeCard_(sh,row,h,fresh,true);if(x.created)s++;else if(x.error)e++;cardSyncWarehouseAndMatching_(sh,row,h);}catch(err){e++;cardSetSideError_(sh,row,h,market,err.message);}});
  toast_(market+': повторено '+p+', завершено '+s+', ошибок '+e+'.');return {processed:p,success:s,errors:e};
}
function cardEnsureIdentifiers_(sh,h,targets){const used=cardUsedBarcodes_(),auto=boolText_(getSetting_('Генерировать штрихкод автоматически','Да'));targets.forEach(t=>{let id=asText_(sh.getRange(t.row,h['Внутренний ID']).getValue());if(!id){id=uuid_();sh.getRange(t.row,h['Внутренний ID']).setValue(id);}let b=normBarcode_(sh.getRange(t.row,h['Штрихкод']).getValue());if(!b&&auto){b=cardGenerateEan13_(used);sh.getRange(t.row,h['Штрихкод']).setValue(b);used[b]=true;}});}
function cardArticleDuplicateIndex_(){const out={articles:{},barcodes:{}},sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);if(sh.getLastRow()>1){sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{const a=normKey_(r[h['Артикул продавца']-1]),b=normBarcode_(r[h['Штрихкод']-1]);if(a){if(!out.articles[a])out.articles[a]=[];out.articles[a].push(i+2);}if(b){if(!out.barcodes[b])out.barcodes[b]=[];out.barcodes[b].push(i+2);}});}return out;}
function cardReadRow_(sh,row,h){const v=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],ctx=cardRowContext_(v,h),brand=asText_(v[h['Бренд']-1])||asText_(getSetting_('Бренд по умолчанию',''));return {row:row,internalId:asText_(v[h['Внутренний ID']-1]),article:asText_(v[h['Артикул продавца']-1]),barcode:normBarcode_(v[h['Штрихкод']-1]),name:asText_(v[h['Название']-1]),description:asText_(v[h['Описание']-1]),brand:brand,category:asText_(v[h['Наша категория']-1]),wbSubjectName:asText_(v[h['Предмет WB']-1]),ozTypeName:asText_(v[h['Тип товара Ozon']-1]),price:toNumber_(v[h['Цена']-1]),length:toNumber_(v[h['Длина упаковки, см']-1]),width:toNumber_(v[h['Ширина упаковки, см']-1]),height:toNumber_(v[h['Высота упаковки, см']-1]),weightG:toNumber_(v[h['Вес с упаковкой, г']-1]),wbNm:asText_(v[h['WB NMID']-1]),ozProductId:asText_(v[h['Ozon Product ID']-1]),ozSku:asText_(v[h['Ozon SKU']-1]),wbStatus:asText_(v[h['Статус WB']-1]),ozStatus:asText_(v[h['Статус Ozon']-1]),ctx:ctx};}
function cardValidateCommon_(d,sh,row,h,dups){if(!d.internalId)throw new Error('Не сформирован внутренний ID.');if(!d.article)throw new Error('Не заполнен артикул продавца.');if((dups.articles[normKey_(d.article)]||[]).filter(x=>x!==row).length)throw new Error('Артикул продавца повторяется на листе «Новые карточки».');if(!d.name)throw new Error('Не заполнено название.');if(!d.description)throw new Error('Не заполнено описание.');if(!(d.price>0))throw new Error('Цена должна быть больше 0.');if(!(d.length>0&&d.width>0&&d.height>0))throw new Error('Заполните все габариты упаковки.');if(!(d.weightG>0))throw new Error('Вес с упаковкой должен быть больше 0.');if(!d.barcode)throw new Error('Не заполнен штрихкод.');if(!/^\d{8,14}$/.test(d.barcode))throw new Error('Штрихкод должен содержать 8–14 цифр.');if((dups.barcodes[d.barcode]||[]).filter(x=>x!==row).length)throw new Error('Штрихкод повторяется на листе «Новые карточки».');cardAssertNotExistingDuplicate_(d);if(!cardHasMainImage_(sh,row,h))throw new Error('Вставьте изображение непосредственно в ячейку «Фото 1».');}
function cardAssertNotExistingDuplicate_(d){const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return;sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{const iid=asText_(r[h['Внутренний ID']-1]);if(iid===d.internalId)return;const a=normKey_(r[h['Артикул основной']-1]),b=normBarcode_(r[h['Штрихкод']-1]);if(a&&a===normKey_(d.article))throw new Error('Артикул уже существует на листе «Склад».');if(b&&b===d.barcode)throw new Error('Штрихкод уже существует на листе «Склад».');});}
function cardValidateWb_(d,sh,row,h){if(!d.ctx.wb||!d.ctx.wb.id)throw new Error('WB: выберите предмет WB из справочника.');const attrs=wbRequiredAttributes_(d.ctx.wb.id),brandReq=attrs.some(a=>a.existNamedField&&/бренд/.test(normName_(a.name)));if(brandReq&&!d.brand)throw new Error('WB: для предмета обязателен бренд.');wbBuildDynamicCharacteristics_(sh,row,d.ctx);return true;}
function cardValidateOzon_(d,sh,row,h){if(!d.ctx.oz||!d.ctx.oz.categoryId||!d.ctx.oz.typeId)throw new Error('Ozon: выберите тип товара Ozon из справочника.');const attrs=ozonAllAttributes_(d.ctx.oz.categoryId,d.ctx.oz.typeId),brandAttr=ozonFindCoreAttribute_(attrs,'brand');if(brandAttr&&brandAttr.required&&!d.brand)throw new Error('Ozon: для категории обязателен бренд.');ozonBuildDynamicAttributes_(sh,row,d.ctx);return true;}
function cardWriteCheck_(sh,row,h,market,text){const col=h['Проверка '+market];if(!col)return;const cell=sh.getRange(row,col).setValue(text);setStatusColor_(cell,text);}
function cardCheckIsReady_(sh,row,h,market){return asText_(sh.getRange(row,h['Проверка '+market]).getValue()).indexOf('ГОТОВО')===0;}
function cardSideCreated_(d,market){return market==='WB'?!!d.wbNm:!!d.ozProductId;}
function cardSetSideError_(sh,row,h,market,message){sh.getRange(row,h['Статус '+market]).setValue('ОШИБКА');sh.getRange(row,h['Ошибка '+market]).setValue(message);setStatusColor_(sh.getRange(row,h['Статус '+market]),'Ошибка');}
function cardSetSideStatus_(sh,row,h,market,status,error){sh.getRange(row,h['Статус '+market]).setValue(status);if(h['Ошибка '+market])sh.getRange(row,h['Ошибка '+market]).setValue(error||'');setStatusColor_(sh.getRange(row,h['Статус '+market]),status);}
function cardPendingKey_(market,internalId){return 'CARD_PENDING_'+market.toUpperCase()+'_'+internalId;}
function cardPending_(market,internalId){const raw=PropertiesService.getScriptProperties().getProperty(cardPendingKey_(market,internalId));if(!raw)return null;try{return JSON.parse(raw);}catch(_){return {value:raw};}}
function cardSavePending_(market,internalId,obj){PropertiesService.getScriptProperties().setProperty(cardPendingKey_(market,internalId),JSON.stringify(obj||{}));}
function cardClearPending_(market,internalId){PropertiesService.getScriptProperties().deleteProperty(cardPendingKey_(market,internalId));}
function cardSyncWarehouseAndMatching_(sh,row,h){const d=cardReadRow_(sh,row,h);if(!d.internalId||(!d.wbNm&&!d.ozProductId))return;const wbCard=d.wbNm?wbFindCardByVendor_(d.article):null,ozInfo=d.ozProductId?ozonFindProductByOffer_(d.article):null;const stock=sheet_(APP.SHEETS.STOCK),shh=findHeaderMap_(stock),headers=SHEET_SCHEMAS[APP.SHEETS.STOCK];let srow=0;if(stock.getLastRow()>1)stock.getRange(2,1,stock.getLastRow()-1,1).getValues().forEach((r,i)=>{if(asText_(r[0])===d.internalId)srow=i+2;});if(!srow){srow=stock.getLastRow()+1;stock.getRange(srow,1,1,headers.length).setValues([new Array(headers.length).fill('')]);stock.getRange(srow,shh['Фактический остаток']).setValue(0);}const set=(name,val)=>{if(shh[name]&&val!==undefined)stock.getRange(srow,shh[name]).setValue(val);};set('Внутренний ID',d.internalId);set('Наименование',d.name);set('Категория',d.category);set('Артикул основной',d.article);set('Штрихкод',d.barcode);set('WB подключён',!!d.wbNm);set('WB NMID',d.wbNm||'');set('WB артикул',d.wbNm?d.article:'');set('WB SKU / barcode',d.wbNm?d.barcode:'');set('Ozon подключён',!!d.ozProductId);set('Ozon Product ID',d.ozProductId||'');set('Ozon Offer ID',d.ozProductId?d.article:'');set('Ozon SKU',d.ozSku||(ozInfo&&ozInfo.sku)||'');set('Статус сопоставления',d.wbNm&&d.ozProductId?'Сопоставлен':(d.wbNm?'Только WB':'Только Ozon'));set('Источник названия',d.wbNm?'WB':'Ozon');set('Последняя синхронизация',now_());if(wbCard){set('WB chrtId (служебно)',wbCard.chrtId||'');set('WB Subject ID (служебно)',wbCard.subjectId||d.ctx.wb.id);set('WB Длина, см (служебно)',wbCard.dimensions&&wbCard.dimensions.length||d.length);set('WB Ширина, см (служебно)',wbCard.dimensions&&wbCard.dimensions.width||d.width);set('WB Высота, см (служебно)',wbCard.dimensions&&wbCard.dimensions.height||d.height);}const m=sheet_(APP.SHEETS.MATCHING),mh=findHeaderMap_(m),mheaders=SHEET_SCHEMAS[APP.SHEETS.MATCHING];let mrow=0;if(m.getLastRow()>1)m.getRange(2,1,m.getLastRow()-1,1).getValues().forEach((r,i)=>{if(asText_(r[0])===d.internalId)mrow=i+2;});if(!mrow){mrow=m.getLastRow()+1;m.getRange(mrow,1,1,mheaders.length).setValues([new Array(mheaders.length).fill('')]);}const ms=(name,val)=>{if(mh[name])m.getRange(mrow,mh[name]).setValue(val);};ms('Внутренний ID',d.internalId);ms('WB NMID',d.wbNm||'');ms('WB артикул',d.wbNm?d.article:'');ms('WB наименование',d.wbNm?d.name:'');ms('WB штрихкод',d.wbNm?d.barcode:'');ms('Ozon Product ID',d.ozProductId||'');ms('Ozon Offer ID',d.ozProductId?d.article:'');ms('Ozon наименование',d.ozProductId?d.name:'');ms('Ozon штрихкод',d.ozProductId?d.barcode:'');ms('Найдено по','Создание карточки');ms('Уверенность совпадения','Подтверждено');ms('Статус',d.wbNm&&d.ozProductId?'Сопоставлен':(d.wbNm?'Только WB':'Только Ozon'));ms('Подтверждено вручную',!!(d.wbNm&&d.ozProductId));if(!sh.getRange(row,h['Дата создания']).getValue())sh.getRange(row,h['Дата создания']).setValue(now_()).setNumberFormat('dd.MM.yyyy HH:mm:ss');}
/* ===== CardsImages.gs ===== */
/**
 * Фото новых карточек.
 * Пользователь хранит изображения непосредственно в ячейках Google Sheets.
 *
 * Ozon принимает URL изображений при /v3/product/import — для него используем
 * краткоживущий Google-hosted URL CellImage.getContentUrl() непосредственно
 * перед отправкой запроса.
 *
 * WB для /content/v3/media/save требует прямые публичные ссылки с именем файла.
 * Поэтому для WB изображение из ячейки сначала скачивается как Blob, после чего
 * загружается бинарно через /content/v3/media/file.
 */
function cardImageUrls_(sh,row,h){
  const urls=[];
  for(let i=1;i<=10;i++){
    const col=h['Фото '+i];if(!col)continue;
    const v=sh.getRange(row,col).getValue(),url=cardImageContentUrl_(v);
    if(url)urls.push(url);
  }
  return urls;
}
function cardImageContentUrl_(value){
  if(value&&typeof value.getContentUrl==='function'){
    try{return asText_(value.getContentUrl());}
    catch(e){throw new Error('Не удалось получить изображение из ячейки: '+e.message);}
  }
  return ''; // По ТЗ принимаем только изображение, вставленное непосредственно в ячейку.
}
function cardHasMainImage_(sh,row,h){
  const col=h['Фото 1'];if(!col)return false;
  return !!cardImageContentUrl_(sh.getRange(row,col).getValue());
}
function cardImageValues_(sh,row,h){
  const out=[];
  for(let i=1;i<=10;i++){
    const col=h['Фото '+i];if(!col)continue;
    const value=sh.getRange(row,col).getValue(),url=cardImageContentUrl_(value);
    if(url)out.push({number:i,value:value,url:url});
  }
  return out;
}
function cardImageBlob_(image,index){
  const url=image&&image.url?image.url:cardImageContentUrl_(image&&image.value!==undefined?image.value:image);
  if(!url)throw new Error('Фото '+index+': изображение отсутствует.');
  const resp=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true}),code=resp.getResponseCode();
  if(code<200||code>=300)throw new Error('Фото '+index+': Google вернул HTTP '+code+'.');
  let blob=resp.getBlob(),ct=asText_(blob.getContentType()).toLowerCase(),ext='jpg';
  if(ct.indexOf('png')>=0)ext='png';else if(ct.indexOf('webp')>=0)ext='webp';else if(ct.indexOf('gif')>=0)ext='gif';else if(ct.indexOf('bmp')>=0)ext='bmp';
  return blob.setName('card_photo_'+index+'.'+ext);
}
function wbUploadCardMediaFromCells_(nmId,sh,row,h){
  const images=cardImageValues_(sh,row,h);if(!nmId||!images.length)return {processed:0,success:0,errors:0};
  const token=secret_(APP.SECRET_KEYS.WB_TOKEN);if(!token)throw new Error('WB API Token не сохранён.');let success=0;
  images.forEach((img,pos)=>{
    const blob=cardImageBlob_(img,pos+1),resp=UrlFetchApp.fetch('https://content-api.wildberries.ru/content/v3/media/file',{method:'post',headers:{Authorization:token,'X-Nm-Id':String(nmId),'X-Photo-Number':String(pos+1)},payload:{uploadfile:blob},muteHttpExceptions:true,followRedirects:true}),code=resp.getResponseCode(),text=resp.getContentText();
    if(code<200||code>=300)throw new Error('WB: не удалось загрузить фото '+(pos+1)+'. HTTP '+code+': '+text.substring(0,500));
    const json=safeJson_(text);if(json&&json.error===true)throw new Error('WB: фото '+(pos+1)+': '+asText_(json.errorText||json.additionalErrors||text));success++;Utilities.sleep(650);
  });
  return {processed:images.length,success:success,errors:0};
}
function ozonCardImagePayload_(sh,row,h){const urls=cardImageUrls_(sh,row,h);if(!urls.length)return {primary_image:'',images:[]};return {primary_image:urls[0],images:urls.slice(1,10)};}
/* ===== CardsCategories.gs ===== */
/**
 * Справочники категорий для создания новых карточек.
 * Пользователь видит только человекочитаемые названия. Технические ID
 * хранятся в скрытых служебных колонках листа «Категории».
 */
const CARD_CATEGORY_SERVICE = Object.freeze({
  WB_NAME:10, WB_ID:11, WB_PARENT:12,
  OZ_NAME:14, OZ_CATEGORY_ID:15, OZ_TYPE_ID:16, OZ_PATH:17
});

function loadWbSubjects(){
  if(!boolText_(getSetting_('Использовать WB','Нет'))) throw new Error('WB выключен в настройках.');
  const all=[]; let offset=0;
  for(let page=0;page<100;page++){
    const path='/content/v2/object/all?limit=1000&offset='+offset+'&locale=ru';
    const r=wbContentRequest_(path,'get',undefined,'Категории WB').json||{};
    const rows=Array.isArray(r.data)?r.data:[];
    rows.forEach(x=>all.push({name:asText_(x.subjectName),id:Number(x.subjectID),parent:asText_(x.parentName)}));
    if(rows.length<1000)break;
    offset+=rows.length; Utilities.sleep(650);
  }
  all.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  const sh=sheet_(APP.SHEETS.CATEGORIES);
  ensureCardCategoryServiceColumns_(sh);
  const max=Math.max(1,sh.getMaxRows()-1);
  sh.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,max,3).clearContent();
  if(all.length) sh.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,all.length,3).setValues(all.map(x=>[x.name,x.id,x.parent]));
  syncCategoryMappingIds_();
  applyCardCategoryValidations_();
  toast_('Загружено предметов WB: '+all.length+'.');
  return {processed:all.length,success:all.length,errors:0};
}

function loadOzonTypes(){
  if(!boolText_(getSetting_('Использовать Ozon','Нет'))) throw new Error('Ozon выключен в настройках.');
  const r=ozonRequest_('/v1/description-category/tree',{language:'DEFAULT'},'Категории Ozon').json||{};
  const raw=[]; ozonFlattenCategoryTree_(r.result||[],[],0,raw);
  const active=raw.filter(x=>x.typeId>0&&x.categoryId>0&&!x.disabled);
  const counts={};active.forEach(x=>counts[normName_(x.typeName)]=(counts[normName_(x.typeName)]||0)+1);
  active.forEach(x=>x.display=counts[normName_(x.typeName)]>1?x.typeName+' — '+x.categoryName:x.typeName);
  active.sort((a,b)=>a.display.localeCompare(b.display,'ru'));
  const sh=sheet_(APP.SHEETS.CATEGORIES);
  ensureCardCategoryServiceColumns_(sh);
  const max=Math.max(1,sh.getMaxRows()-1);
  sh.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,max,4).clearContent();
  if(active.length) sh.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,active.length,4).setValues(active.map(x=>[x.display,x.categoryId,x.typeId,x.path]));
  syncCategoryMappingIds_();
  applyCardCategoryValidations_();
  toast_('Загружено типов товаров Ozon: '+active.length+'.');
  return {processed:active.length,success:active.length,errors:0};
}

function ozonFlattenCategoryTree_(nodes,path,categoryId,out){
  (nodes||[]).forEach(n=>{
    const name=asText_(n.category_name||n.type_name), nextPath=name?path.concat([name]):path;
    const nextCategory=Number(n.description_category_id)||categoryId||0;
    const typeId=Number(n.type_id)||0;
    if(typeId){
      out.push({typeName:asText_(n.type_name)||name,categoryName:path.length?path[path.length-1]:(name||''),categoryId:nextCategory,typeId:typeId,path:nextPath.join(' / '),disabled:n.disabled===true});
    }
    if(Array.isArray(n.children)&&n.children.length)ozonFlattenCategoryTree_(n.children,nextPath,nextCategory,out);
  });
}

function ensureCardCategoryServiceColumns_(sh){
  if(sh.getMaxColumns()<CARD_CATEGORY_SERVICE.OZ_PATH)sh.insertColumnsAfter(sh.getMaxColumns(),CARD_CATEGORY_SERVICE.OZ_PATH-sh.getMaxColumns());
  const headers={10:'WB справочник: предмет',11:'WB Subject ID (справочник)',12:'WB родительская категория (справочник)',14:'Ozon справочник: тип товара',15:'Ozon Description Category ID (справочник)',16:'Ozon Type ID (справочник)',17:'Ozon путь категории (справочник)'};
  Object.keys(headers).forEach(k=>sh.getRange(1,Number(k)).setValue(headers[k]));
  // Пользователь видит только 4 утверждённых колонки. Все справочники и ID служебные.
  if(sh.getMaxColumns()>=17) sh.hideColumns(5,13);
}

function cardWbSubjectDirectory_(){
  const sh=sheet_(APP.SHEETS.CATEGORIES);ensureCardCategoryServiceColumns_(sh);const out={byName:{},list:[]};
  if(sh.getLastRow()<2)return out;
  sh.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,sh.getLastRow()-1,3).getValues().forEach(r=>{const name=asText_(r[0]),id=Number(r[1]);if(!name||!id)return;const x={name:name,id:id,parent:asText_(r[2])};out.list.push(x);out.byName[normName_(name)]=x;});
  return out;
}
function cardOzonTypeDirectory_(){
  const sh=sheet_(APP.SHEETS.CATEGORIES);ensureCardCategoryServiceColumns_(sh);const out={byName:{},list:[]};
  if(sh.getLastRow()<2)return out;
  sh.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,sh.getLastRow()-1,4).getValues().forEach(r=>{const name=asText_(r[0]),cat=Number(r[1]),type=Number(r[2]);if(!name||!cat||!type)return;const x={name:name,categoryId:cat,typeId:type,path:asText_(r[3])};out.list.push(x);out.byName[normName_(name)]=x;});
  return out;
}

function syncCategoryMappingIds_(){
  const sh=sheet_(APP.SHEETS.CATEGORIES);if(sh.getLastRow()<2)return;
  ensureCardCategoryServiceColumns_(sh);
  const wb=cardWbSubjectDirectory_(),oz=cardOzonTypeDirectory_(),h=findHeaderMap_(sh);
  const n=sh.getLastRow()-1,vals=sh.getRange(2,1,n,8).getValues();
  vals.forEach((r,i)=>{
    const w=wb.byName[normName_(r[1])],o=oz.byName[normName_(r[2])];
    if(w)r[4]=w.id;
    if(o){r[5]=o.categoryId;r[6]=o.typeId;r[7]=o.path;}
  });
  sh.getRange(2,1,n,8).setValues(vals);
}

function applyCardCategoryValidations_(){
  const cat=sheet_(APP.SHEETS.CATEGORIES);ensureCardCategoryServiceColumns_(cat);
  const wbLast=cardDirectoryLastRow_(cat,CARD_CATEGORY_SERVICE.WB_NAME),ozLast=cardDirectoryLastRow_(cat,CARD_CATEGORY_SERVICE.OZ_NAME);
  const wbRule=wbLast>=2?SpreadsheetApp.newDataValidation().requireValueInRange(cat.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,wbLast-1,1),true).setAllowInvalid(true).build():null;
  const ozRule=ozLast>=2?SpreadsheetApp.newDataValidation().requireValueInRange(cat.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,ozLast-1,1),true).setAllowInvalid(true).build():null;
  const rows=Math.max(1,cat.getMaxRows()-1);
  if(wbRule)cat.getRange(2,2,rows,1).setDataValidation(wbRule);
  if(ozRule)cat.getRange(2,3,rows,1).setDataValidation(ozRule);
  const cards=sheet_(APP.SHEETS.NEW_CARDS),ch=findHeaderMap_(cards),cr=Math.max(1,cards.getMaxRows()-1);
  if(wbRule&&ch['Предмет WB'])cards.getRange(2,ch['Предмет WB'],cr,1).setDataValidation(wbRule);
  if(ozRule&&ch['Тип товара Ozon'])cards.getRange(2,ch['Тип товара Ozon'],cr,1).setDataValidation(ozRule);
  const catNames=activeInternalCategoryNames_();
  if(catNames.length&&ch['Наша категория'])cards.getRange(2,ch['Наша категория'],cr,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(catNames,true).setAllowInvalid(true).build());
}
function cardDirectoryLastRow_(sh,col){let last=1;const n=sh.getLastRow()-1;if(n<=0)return last;sh.getRange(2,col,n,1).getValues().forEach((r,i)=>{if(asText_(r[0]))last=i+2;});return last;}
function activeInternalCategoryNames_(){const sh=sheet_(APP.SHEETS.CATEGORIES),out=[];if(sh.getLastRow()<2)return out;sh.getRange(2,1,sh.getLastRow()-1,4).getValues().forEach(r=>{const n=asText_(r[0]);if(n&&(r[3]===true||asText_(r[3])===''))out.push(n);});return Array.from(new Set(out));}

function categoryMappingIndex_(){
  syncCategoryMappingIds_();
  const sh=sheet_(APP.SHEETS.CATEGORIES),out={};if(sh.getLastRow()<2)return out;
  sh.getRange(2,1,sh.getLastRow()-1,8).getValues().forEach(r=>{const name=asText_(r[0]);if(!name||r[3]===false)return;out[normName_(name)]={name:name,wbName:asText_(r[1]),ozName:asText_(r[2]),wbSubjectId:Number(r[4])||0,ozCategoryId:Number(r[5])||0,ozTypeId:Number(r[6])||0,ozPath:asText_(r[7])};});return out;
}

function applyCategoryMappingsToCards_(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return;
  const map=categoryMappingIndex_(),n=sh.getLastRow()-1;
  const cats=sh.getRange(2,h['Наша категория'],n,1).getValues();
  const wbVals=sh.getRange(2,h['Предмет WB'],n,1).getValues();
  const ozVals=sh.getRange(2,h['Тип товара Ozon'],n,1).getValues();
  for(let i=0;i<n;i++){
    const cat=map[normName_(cats[i][0])];if(!cat)continue;
    if(!asText_(wbVals[i][0])&&cat.wbName)wbVals[i][0]=cat.wbName;
    if(!asText_(ozVals[i][0])&&cat.ozName)ozVals[i][0]=cat.ozName;
  }
  // Пишем только три текстовые колонки. Фото в ячейках не считываем и не перезаписываем.
  sh.getRange(2,h['Предмет WB'],n,1).setValues(wbVals);
  sh.getRange(2,h['Тип товара Ozon'],n,1).setValues(ozVals);
  rememberManualCategoryMappings_();
}

function rememberManualCategoryMappings_(){
  const cards=sheet_(APP.SHEETS.NEW_CARDS),ch=findHeaderMap_(cards),cat=sheet_(APP.SHEETS.CATEGORIES);if(cards.getLastRow()<2)return;
  const rows=cards.getRange(2,1,cards.getLastRow()-1,cards.getLastColumn()).getValues(),existing={};
  if(cat.getLastRow()>1)cat.getRange(2,1,cat.getLastRow()-1,8).getValues().forEach((r,i)=>{if(asText_(r[0]))existing[normName_(r[0])]={row:i+2,values:r};});
  rows.forEach(r=>{const name=asText_(r[ch['Наша категория']-1]);if(!name)return;const wb=asText_(r[ch['Предмет WB']-1]),oz=asText_(r[ch['Тип товара Ozon']-1]);let e=existing[normName_(name)];if(!e){cat.appendRow([name,wb,oz,true,'','','','']);existing[normName_(name)]={row:cat.getLastRow(),values:[name,wb,oz,true,'','','','']};return;}if(!asText_(e.values[1])&&wb){cat.getRange(e.row,2).setValue(wb);e.values[1]=wb;}if(!asText_(e.values[2])&&oz){cat.getRange(e.row,3).setValue(oz);e.values[2]=oz;}});
  syncCategoryMappingIds_();applyCardCategoryValidations_();
}
/* ===== CardsAttributes.gs ===== */
/** Динамические обязательные характеристики новых карточек. */
const CARD_ATTR_NOTE_PREFIX='CARD_ATTR_META|';

function loadRequiredCardAttributes(){
  const useWb=boolText_(getSetting_('Использовать WB','Нет')),useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon)throw new Error('В настройках не выбран ни один маркетплейс.');
  if(useWb&&!cardWbSubjectDirectory_().list.length)loadWbSubjects();
  if(useOzon&&!cardOzonTypeDirectory_().list.length)loadOzonTypes();
  applyCategoryMappingsToCards_();
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true);
  if(!targets.length)throw new Error('Нет строк для подготовки характеристик. Отметьте «Создать» или заполните артикул товара.');
  const wbDir=cardWbSubjectDirectory_(),ozDir=cardOzonTypeDirectory_(),defs={},wbCache={},ozCache={};let errors=0;
  targets.forEach(t=>{
    if(useWb){const name=asText_(t.values[h['Предмет WB']-1]),subject=wbDir.byName[normName_(name)];if(subject){let attrs=wbCache[subject.id];if(!attrs){attrs=wbRequiredAttributes_(subject.id);wbCache[subject.id]=attrs;Utilities.sleep(650);}attrs.filter(a=>!a.existNamedField).forEach(a=>mergeDynamicAttrDef_(defs,'WB',a.name,String(subject.id),{id:a.id,charcType:a.charcType,maxCount:a.maxCount,unitName:a.unitName,required:true}));}else if(name)errors++;}
    if(useOzon){const name=asText_(t.values[h['Тип товара Ozon']-1]),type=ozDir.byName[normName_(name)];if(type){const key=type.categoryId+':'+type.typeId;let attrs=ozCache[key];if(!attrs){attrs=ozonRequiredAttributes_(type.categoryId,type.typeId);ozCache[key]=attrs;}attrs.forEach(a=>{if(ozonIsCoreCardAttribute_(a))return;mergeDynamicAttrDef_(defs,'Ozon',a.name,key,{id:a.id,dictionaryId:a.dictionaryId,complexId:a.complexId,type:a.type,maxCount:a.maxCount,required:true});});}else if(name)errors++;}
  });
  ensureDynamicCardColumns_(sh,defs);styleDynamicCardCells_(sh);toast_('Обязательные характеристики обновлены: '+Object.keys(defs).length+' полей.');return {processed:Object.keys(defs).length,success:Object.keys(defs).length,errors:errors};
}
function wbRequiredAttributes_(subjectId){const r=wbContentRequest_('/content/v2/object/charcs/'+encodeURIComponent(subjectId)+'?locale=ru','get',undefined,'Характеристики WB').json||{};return (r.data||[]).filter(x=>x.required===true||Number(x.required)===1).map(x=>({id:Number(x.charcID||x.charcId||x.id),name:asText_(x.name)||('Характеристика '+asText_(x.charcID||x.id)),charcType:Number(x.charcType)||1,maxCount:Number(x.maxCount)||0,unitName:asText_(x.unitName),existNamedField:x.existNamedField===true})).filter(x=>x.id);}
function ozonRequiredAttributes_(categoryId,typeId){return ozonAllAttributes_(categoryId,typeId).filter(x=>x.required);}
function ozonAllAttributes_(categoryId,typeId){const r=ozonRequest_('/v1/description-category/attribute',{description_category_id:Number(categoryId),type_id:Number(typeId),language:'DEFAULT'},'Характеристики Ozon').json||{},rows=Array.isArray(r.result)?r.result:(r.result&&Array.isArray(r.result.attributes)?r.result.attributes:[]);return rows.map(x=>({id:Number(x.id),name:asText_(x.name)||('Характеристика '+asText_(x.id)),dictionaryId:Number(x.dictionary_id)||0,complexId:Number(x.attribute_complex_id||x.complex_id)||0,type:asText_(x.type),maxCount:Number(x.max_value_count)||0,required:x.is_required===true||Number(x.is_required)===1})).filter(x=>x.id);}
function ozonIsCoreCardAttribute_(a){const name=normName_(a&&a.name);return Number(a&&a.id)===8229||Number(a&&a.id)===4191||/(^| )бренд($| )/.test(name)||/(^| )(аннотация|описание)($| )/.test(name);}
function ozonFindCoreAttribute_(attrs,kind){return (attrs||[]).find(a=>{const n=normName_(a.name);if(kind==='brand')return /(^| )бренд($| )/.test(n);if(kind==='description')return Number(a.id)===4191||/(^| )(аннотация|описание)($| )/.test(n);return false;})||null;}
function mergeDynamicAttrDef_(defs,market,name,contextKey,meta){const display=market+' | '+name,key=market+'|'+normName_(name);if(!defs[key])defs[key]={header:display,market:market,name:name,contexts:{}};defs[key].contexts[contextKey]=meta;}
function ensureDynamicCardColumns_(sh,defs){const existing=dynamicCardColumns_(sh),base=SHEET_SCHEMAS[APP.SHEETS.NEW_CARDS].length;Object.keys(defs).forEach(key=>{const def=defs[key],found=existing.byKey[key];let col;if(found)col=found.col;else{col=Math.max(base+1,sh.getLastColumn()+1);if(col>sh.getMaxColumns())sh.insertColumnAfter(sh.getMaxColumns());sh.getRange(1,col).setValue(def.header);}const old=found&&found.meta||{market:def.market,name:def.name,contexts:{}};old.market=def.market;old.name=def.name;old.contexts=Object.assign({},old.contexts||{},def.contexts||{});sh.getRange(1,col).setNote(CARD_ATTR_NOTE_PREFIX+JSON.stringify(old)).setFontWeight('bold').setBackground(APP.COLORS.SECTION).setWrap(true);});}
function dynamicCardColumns_(sh){const out={list:[],byKey:{}},base=SHEET_SCHEMAS[APP.SHEETS.NEW_CARDS].length,last=sh.getLastColumn();for(let c=base+1;c<=last;c++){const header=asText_(sh.getRange(1,c).getValue()),note=asText_(sh.getRange(1,c).getNote());if(!header||note.indexOf(CARD_ATTR_NOTE_PREFIX)!==0)continue;let meta={};try{meta=JSON.parse(note.substring(CARD_ATTR_NOTE_PREFIX.length));}catch(e){continue;}const key=asText_(meta.market)+'|'+normName_(meta.name||header.replace(/^\w+\s*\|\s*/,'')),x={col:c,header:header,meta:meta,key:key};out.list.push(x);out.byKey[key]=x;}return out;}
function styleDynamicCardCells_(sh){if(sh.getLastRow()<2)return;const h=findHeaderMap_(sh),dyn=dynamicCardColumns_(sh),wb=cardWbSubjectDirectory_(),oz=cardOzonTypeDirectory_(),rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();rows.forEach((r,i)=>{const subject=wb.byName[normName_(r[h['Предмет WB']-1])],type=oz.byName[normName_(r[h['Тип товара Ozon']-1])];dyn.list.forEach(d=>{const ctx=d.meta.contexts||{},key=d.meta.market==='WB'?(subject?String(subject.id):''):(type?(type.categoryId+':'+type.typeId):'');sh.getRange(i+2,d.col).setBackground(key&&ctx[key]?APP.COLORS.WARN:APP.COLORS.MUTED);});});}
function cardTargetRows_(sh,h,preferSelected){if(sh.getLastRow()<2)return[];const vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),selected=[];vals.forEach((r,i)=>{if(r[h['Создать']-1]===true)selected.push({row:i+2,values:r});});if(preferSelected&&selected.length)return selected;const out=[];vals.forEach((r,i)=>{if(asText_(r[h['Артикул продавца']-1])||asText_(r[h['Название']-1]))out.push({row:i+2,values:r});});return out;}
function cardRowContext_(rowValues,h){const wb=cardWbSubjectDirectory_().byName[normName_(rowValues[h['Предмет WB']-1])]||null,oz=cardOzonTypeDirectory_().byName[normName_(rowValues[h['Тип товара Ozon']-1])]||null;return {wb:wb,oz:oz};}
function cardDynamicValue_(sh,row,dynCol){return sh.getRange(row,dynCol.col).getValue();}
function cardDynamicAttributesForRow_(sh,row,ctx,market){const dyn=dynamicCardColumns_(sh),out=[],key=market==='WB'?(ctx.wb?String(ctx.wb.id):''):(ctx.oz?(ctx.oz.categoryId+':'+ctx.oz.typeId):'');dyn.list.forEach(d=>{if(d.meta.market!==market)return;const meta=(d.meta.contexts||{})[key];if(!meta)return;out.push({column:d.col,header:d.header,meta:meta,value:cardDynamicValue_(sh,row,d)});});return out;}
function ozonResolveDictionaryValue_(categoryId,typeId,attr,value){const text=asText_(value);if(!text)throw new Error('Не заполнено «'+attr.name+'».');const props=PropertiesService.getScriptProperties(),cacheKey='OZ_ATTR_VAL_'+categoryId+'_'+typeId+'_'+attr.id+'_'+Utilities.base64EncodeWebSafe(text).substring(0,60),cached=props.getProperty(cacheKey);if(cached){try{return JSON.parse(cached);}catch(_){}}const body={attribute_id:Number(attr.id),description_category_id:Number(categoryId),type_id:Number(typeId),limit:100,value:text.length>=2?text:text+' '},r=ozonRequest_('/v1/description-category/attribute/values/search',body,'Справочник характеристики Ozon').json||{},items=Array.isArray(r.result)?r.result:(r.result&&Array.isArray(r.result.values)?r.result.values:[]);let found=items.find(x=>normName_(x.value)===normName_(text));if(!found&&items.length===1)found=items[0];if(!found)throw new Error('Ozon: значение «'+text+'» не найдено в справочнике «'+attr.name+'».');const result={dictionary_value_id:Number(found.id),value:asText_(found.value)||text};try{props.setProperty(cacheKey,JSON.stringify(result));}catch(_){}return result;}
function cardSplitValues_(value,maxCount){const raw=asText_(value);if(!raw)return [];let vals=raw.split(/[;\n]+/).map(x=>asText_(x)).filter(Boolean);if(maxCount>0)vals=vals.slice(0,maxCount);return vals;}
function wbBuildDynamicCharacteristics_(sh,row,ctx){return cardDynamicAttributesForRow_(sh,row,ctx,'WB').map(a=>{const vals=cardSplitValues_(a.value,a.meta.maxCount||0);if(!vals.length)throw new Error('WB: не заполнено «'+a.header+'».');let value;if(Number(a.meta.charcType)===4){const nums=vals.map(v=>toNumber_(v));if(nums.some(v=>!Number.isFinite(v)))throw new Error('WB: «'+a.header+'» должно быть числом.');value=(a.meta.maxCount===1||nums.length===1)?nums[0]:nums;}else value=(a.meta.maxCount===1&&vals.length===1)?vals[0]:vals;return {id:Number(a.meta.id),value:value};});}
function ozonAttributeValues_(categoryId,typeId,meta,value){const vals=cardSplitValues_(value,meta.maxCount||0);if(!vals.length)throw new Error('Ozon: не заполнено «'+(meta.name||meta.id)+'».');return vals.map(v=>meta.dictionaryId?ozonResolveDictionaryValue_(categoryId,typeId,meta,v):{value:v});}
function ozonBuildDynamicAttributes_(sh,row,ctx){const simple=[],complex={};cardDynamicAttributesForRow_(sh,row,ctx,'Ozon').forEach(a=>{const meta=Object.assign({name:a.header.replace(/^Ozon\s*\|\s*/, '')},a.meta),item={id:Number(meta.id),complex_id:Number(meta.complexId)||0,values:ozonAttributeValues_(ctx.oz.categoryId,ctx.oz.typeId,meta,a.value)};if(item.complex_id){if(!complex[item.complex_id])complex[item.complex_id]=[];complex[item.complex_id].push(item);}else simple.push(item);});return {attributes:simple,complex_attributes:Object.keys(complex).map(k=>({attributes:complex[k]}))};}
function ozonBuildCoreAttribute_(categoryId,typeId,attr,value){if(!attr||!asText_(value))return null;const meta={id:attr.id,name:attr.name,dictionaryId:attr.dictionaryId,complexId:attr.complexId,maxCount:attr.maxCount};return {id:Number(attr.id),complex_id:Number(attr.complexId)||0,values:ozonAttributeValues_(categoryId,typeId,meta,value)};}
/* ===== CardsWB.gs ===== */
/** Создание новых карточек Wildberries. */
function wbFindCardByVendor_(vendorCode){
  const vendor=asText_(vendorCode);if(!vendor)return null;
  const body={settings:{cursor:{limit:100},filter:{withPhoto:-1,textSearch:vendor}}};
  const r=wbContentRequest_('/content/v2/get/cards/list','post',body,'Поиск новой карточки WB').json||{},data=r.data||r,cards=Array.isArray(data.cards)?data.cards:[];
  const found=cards.find(c=>normKey_(c.vendorCode)===normKey_(vendor));return found?normalizeWbCard_(found):null;
}
function wbBuildNewCardPayload_(sh,row,h,d){
  const characteristics=wbBuildDynamicCharacteristics_(sh,row,d.ctx);
  const variant={vendorCode:d.article,kizMarked:false,wholesale:{enabled:false,quantum:1},dimensions:{length:Math.round(d.length),width:Math.round(d.width),height:Math.round(d.height),weightBrutto:Math.round((d.weightG/1000)*1000)/1000},characteristics:characteristics,sizes:[{price:Math.round(d.price),skus:[d.barcode]}]};
  if(d.name)variant.title=d.name;if(d.description)variant.description=d.description;if(d.brand)variant.brand=d.brand;
  return [{subjectID:Number(d.ctx.wb.id),variants:[variant]}];
}
function wbCreateOrFinalizeCard_(sh,row,h,d,forceRetry){
  if(d.wbNm){
    if(forceRetry&&/ОШИБКА ФОТО/i.test(d.wbStatus)){wbUploadCardMediaFromCells_(d.wbNm,sh,row,h);cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО','');cardSyncWarehouseAndMatching_(sh,row,h);return {created:true};}
    cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО','');return {created:true};
  }
  let existing=wbFindCardByVendor_(d.article);if(existing)return wbFinalizeNewCard_(sh,row,h,d,existing);
  const pending=cardPending_('WB',d.internalId);
  if(pending&&!forceRetry){const age=Date.now()-Number(pending.sentAt||0);if(age<40*60*1000){cardSetSideStatus_(sh,row,h,'WB','ОТПРАВЛЕНО — ОЖИДАЕТ NMID','');return {pending:true};}cardClearPending_('WB',d.internalId);cardSetSideError_(sh,row,h,'WB','WB не создал карточку за 40 минут. Проверьте черновики/ошибки WB и после исправления используйте «Повторить ошибочные WB».');return {error:true};}
  const payload=wbBuildNewCardPayload_(sh,row,h,d),resp=wbContentRequest_('/content/v2/cards/upload','post',payload,'Создание карточки WB'),json=resp.json||{};
  if(json.error===true)throw new Error(asText_(json.errorText||json.additionalErrors||resp.text)||'WB отклонил создание карточки.');
  cardSavePending_('WB',d.internalId,{sentAt:Date.now(),article:d.article});cardSetSideStatus_(sh,row,h,'WB','ОТПРАВЛЕНО — ОЖИДАЕТ NMID','');
  for(let i=0;i<3;i++){Utilities.sleep(1200);existing=wbFindCardByVendor_(d.article);if(existing)return wbFinalizeNewCard_(sh,row,h,d,existing);}
  return {pending:true};
}
function wbFinalizeNewCard_(sh,row,h,d,card){
  if(!card||!card.id)throw new Error('WB: карточка найдена, но nmID отсутствует.');sh.getRange(row,h['WB NMID']).setValue(card.id);
  try{wbUploadCardMediaFromCells_(card.id,sh,row,h);}catch(e){cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО — ОШИБКА ФОТО',e.message);cardClearPending_('WB',d.internalId);cardSyncWarehouseAndMatching_(sh,row,h);return {created:true,error:true};}
  cardClearPending_('WB',d.internalId);cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО','');cardSyncWarehouseAndMatching_(sh,row,h);return {created:true};
}
/* ===== CardsOzon.gs ===== */
/** Создание новых карточек Ozon. */
function ozonFindProductByOffer_(offerId){
  const offer=asText_(offerId);if(!offer)return null;
  const r=ozonRequest_('/v3/product/list',{filter:{offer_id:[offer],visibility:'ALL'},limit:100},'Поиск новой карточки Ozon').json||{},result=r.result||r,items=Array.isArray(result.items)?result.items:[];
  let x=items.find(a=>normKey_(a.offer_id)===normKey_(offer))||null;if(!x)return null;
  const out={productId:asText_(x.product_id||x.id),offer:asText_(x.offer_id)||offer,sku:asText_(x.sku),name:asText_(x.name)};
  try{const info=ozonRequest_('/v3/product/info/list',{offer_id:[offer]},'Информация новой карточки Ozon').json||{},rows=Array.isArray(info.items)?info.items:(info.result&&Array.isArray(info.result.items)?info.result.items:(Array.isArray(info.result)?info.result:[])),z=rows[0];if(z){out.productId=asText_(z.id||z.product_id)||out.productId;out.sku=asText_(z.sku||z.fbo_sku||z.fbs_sku)||out.sku;out.name=asText_(z.name)||out.name;}}catch(_){}
  return out;
}
function ozonBuildNewCardItem_(sh,row,h,d){
  const allAttrs=ozonAllAttributes_(d.ctx.oz.categoryId,d.ctx.oz.typeId),dyn=ozonBuildDynamicAttributes_(sh,row,d.ctx),brandAttr=ozonFindCoreAttribute_(allAttrs,'brand'),descAttr=ozonFindCoreAttribute_(allAttrs,'description');
  const simple=dyn.attributes.slice(),complexGroups=dyn.complex_attributes.slice(),complexMap={};
  simple.push({id:8229,complex_id:0,values:[{dictionary_value_id:Number(d.ctx.oz.typeId),value:asText_(d.ctx.oz.name).split(' — ')[0]}]});
  complexGroups.forEach(g=>{(g.attributes||[]).forEach(a=>{const cid=Number(a.complex_id)||0;if(cid)complexMap[cid]=g;});});
  [ozonBuildCoreAttribute_(d.ctx.oz.categoryId,d.ctx.oz.typeId,brandAttr,d.brand),ozonBuildCoreAttribute_(d.ctx.oz.categoryId,d.ctx.oz.typeId,descAttr,d.description)].forEach(a=>{if(!a)return;if(a.complex_id){if(!complexMap[a.complex_id]){complexMap[a.complex_id]={attributes:[]};complexGroups.push(complexMap[a.complex_id]);}complexMap[a.complex_id].attributes.push(a);}else simple.push(a);});
  const imgs=ozonCardImagePayload_(sh,row,h),item={attributes:simple,barcode:d.barcode,description_category_id:Number(d.ctx.oz.categoryId),type_id:Number(d.ctx.oz.typeId),currency_code:'RUB',depth:Math.max(1,Math.round(d.length*10)),width:Math.max(1,Math.round(d.width*10)),height:Math.max(1,Math.round(d.height*10)),dimension_unit:'mm',weight:Math.max(1,Math.round(d.weightG)),weight_unit:'g',name:d.name,offer_id:d.article,price:String(Math.round(d.price)),vat:cardOzonVat_(),primary_image:imgs.primary_image,images:imgs.images};
  if(complexGroups.length)item.complex_attributes=complexGroups;return item;
}
function ozonCreateOrFinalizeCard_(sh,row,h,d,forceRetry){
  if(d.ozProductId){cardSetSideStatus_(sh,row,h,'Ozon','СОЗДАНО','');return {created:true};}
  let existing=ozonFindProductByOffer_(d.article);if(existing&&existing.productId)return ozonFinalizeNewCard_(sh,row,h,d,existing,'');
  const pending=cardPending_('Ozon',d.internalId);
  if(pending&&!forceRetry){const state=ozonPollCardTask_(pending.taskId,d.article);if(state.failed){cardClearPending_('Ozon',d.internalId);cardSetSideError_(sh,row,h,'Ozon',state.error||'Ozon отклонил карточку.');return {error:true};}if(state.imported){existing=ozonFindProductByOffer_(d.article);const productId=asText_(state.productId)||(existing&&existing.productId)||'';if(productId)return ozonFinalizeNewCard_(sh,row,h,d,existing||{productId:productId,offer:d.article,sku:state.sku||''},state.warning||'');}cardSetSideStatus_(sh,row,h,'Ozon','ОТПРАВЛЕНО — ОЖИДАЕТ PRODUCT ID','');return {pending:true};}
  const item=ozonBuildNewCardItem_(sh,row,h,d),resp=ozonRequest_('/v3/product/import',{items:[item]},'Создание карточки Ozon').json||{},taskId=asText_((resp.result&&resp.result.task_id)||resp.task_id);if(!taskId)throw new Error('Ozon не вернул task_id: '+JSON.stringify(resp).substring(0,700));
  cardSavePending_('Ozon',d.internalId,{taskId:taskId,sentAt:Date.now(),article:d.article});cardSetSideStatus_(sh,row,h,'Ozon','ОТПРАВЛЕНО — ОЖИДАЕТ PRODUCT ID','');
  for(let i=0;i<3;i++){Utilities.sleep(1200);const state=ozonPollCardTask_(taskId,d.article);if(state.failed){cardClearPending_('Ozon',d.internalId);cardSetSideError_(sh,row,h,'Ozon',state.error||'Ozon отклонил карточку.');return {error:true};}if(state.imported){existing=ozonFindProductByOffer_(d.article);const productId=asText_(state.productId)||(existing&&existing.productId)||'';if(productId)return ozonFinalizeNewCard_(sh,row,h,d,existing||{productId:productId,offer:d.article,sku:state.sku||''},state.warning||'');}}
  return {pending:true};
}
function ozonPollCardTask_(taskId,offer){if(!taskId)return {pending:true};const r=ozonRequest_('/v1/product/import/info',{task_id:Number(taskId)||taskId},'Статус создания карточки Ozon').json||{},items=Array.isArray(r.items)?r.items:(r.result&&Array.isArray(r.result.items)?r.result.items:[]),x=items.find(a=>!offer||normKey_(a.offer_id)===normKey_(offer))||items[0];if(!x)return {pending:true};const status=asText_(x.status).toLowerCase(),errors=ozonCardErrorsText_(x.errors||[]),productId=asText_(x.product_id),sku=asText_(x.sku);if(status==='failed'||status==='error')return {failed:true,error:errors||'Ozon: импорт завершился ошибкой.'};if(status==='imported'||status==='success')return {imported:true,productId:productId,sku:sku,warning:errors};return {pending:true,status:status,error:errors};}
function ozonCardErrorsText_(errors){return (errors||[]).map(e=>{if(typeof e==='string')return e;return [e.code,e.field,e.attribute_id,e.description||e.message||e.state].filter(x=>asText_(x)).join(' / ');}).filter(Boolean).join('; ');}
function ozonFinalizeNewCard_(sh,row,h,d,info,warning){if(!info||!info.productId)throw new Error('Ozon: товар импортирован, но Product ID пока не получен. Повторите создание позже.');sh.getRange(row,h['Ozon Product ID']).setValue(info.productId);if(h['Ozon SKU']&&info.sku)sh.getRange(row,h['Ozon SKU']).setValue(info.sku);cardClearPending_('Ozon',d.internalId);const status=warning?'СОЗДАНО С ЗАМЕЧАНИЯМИ':(info.sku?'СОЗДАНО':'СОЗДАНО — ОЖИДАЕТ SKU');cardSetSideStatus_(sh,row,h,'Ozon',status,warning||'');cardSyncWarehouseAndMatching_(sh,row,h);return {created:true};}
function cardOzonVat_(){const props=PropertiesService.getScriptProperties(),cached=props.getProperty('CARD_OZON_VAT');if(cached!==null)return cached;let vat='0';try{const list=ozonRequest_('/v3/product/list',{filter:{visibility:'ALL'},limit:10},'Определение ставки НДС Ozon').json||{},items=(list.result&&list.result.items)||[],offers=items.map(x=>asText_(x.offer_id)).filter(Boolean).slice(0,10);if(offers.length){const info=ozonRequest_('/v3/product/info/list',{offer_id:offers},'Определение ставки НДС Ozon').json||{},rows=Array.isArray(info.items)?info.items:(info.result&&Array.isArray(info.result.items)?info.result.items:[]),found=rows.map(x=>asText_(x.vat)).find(Boolean);if(found)vat=found;}}catch(_){}try{props.setProperty('CARD_OZON_VAT',vat);}catch(_){}return vat;}
/* ===== Scheduler.gs ===== */
function installMasterTrigger(){
  const exists=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='masterScheduler');
  if(!exists) ScriptApp.newTrigger('masterScheduler').timeBased().everyMinutes(5).create();
}
function periodMinutes_(s){ const m={'5 минут':5,'10 минут':10,'15 минут':15,'30 минут':30,'1 час':60,'3 часа':180,'6 часов':360,'12 часов':720,'1 день':1440}; return m[String(s)]||null; }
function masterScheduler(){
  const sh=sheet_(APP.SHEETS.REGULATIONS), n=sh.getLastRow()-1; if(n<=0)return;
  const rows=sh.getRange(2,1,n,12).getValues(); const now=Date.now();
  rows.forEach((r,i)=>{ if(!r[2]) return; const mins=periodMinutes_(r[3]); if(!mins)return; const last=r[4]?new Date(r[4]).getTime():0; if(!last || now-last>=mins*60000-30000) runRegulationById_(r[0],'Автоматический',i+2); });
}
function runRegulationById_(id,runType,row){
  const map={orders_wb:()=>processWbOrders(),orders_ozon:()=>processOzonOrders(),stocks_sync:()=>syncStocks(),prices_sync:()=>syncPrices(runType==='Автоматический'),actions_sync:()=>manageActions(runType==='Автоматический'),dashboard_refresh:()=>refreshDashboard(runType==='Автоматический'),forecast_refresh:()=>refreshForecast(runType==='Автоматический')};
  if(!map[id]) return;
  const sh=sheet_(APP.SHEETS.REGULATIONS), started=Date.now();
  try{ if(row) sh.getRange(row,7).setValue('Выполняется'); const result=map[id]()||{}; const duration=Math.round((Date.now()-started)/1000);
    if(row){sh.getRange(row,5).setValue(now_()); const mins=periodMinutes_(sh.getRange(row,4).getValue()); sh.getRange(row,6).setValue(new Date(Date.now()+mins*60000)); sh.getRange(row,7).setValue('Работает'); sh.getRange(row,8).setValue(''); sh.getRange(row,9).setValue(result.processed||0); sh.getRange(row,10).setValue(result.errors||0); sh.getRange(row,11).setValue(duration); sh.getRange(row,12).setValue('Успешно');}
    logEvent_({regulation:id,runType:runType,result:'Успешно',processed:result.processed||0,success:result.success||0,errors:result.errors||0,duration:duration});
  }catch(e){ const duration=Math.round((Date.now()-started)/1000); if(row){sh.getRange(row,7).setValue(e.protectionStop?'Остановлен защитой':'Ошибка'); sh.getRange(row,8).setValue(e.message); sh.getRange(row,11).setValue(duration); sh.getRange(row,12).setValue('Ошибка');}
    logEvent_({regulation:id,runType:runType,result:'Ошибка',errors:1,error:e.message,duration:duration}); notify_({level:'Критическая ошибка',type:e.protectionStop?'Остановлен защитой':'Ошибка регламента',regulation:id,message:e.message}); }
}
function manualRun_(id){ const sh=sheet_(APP.SHEETS.REGULATIONS); const vals=sh.getRange(2,1,Math.max(1,sh.getLastRow()-1),1).getValues().flat(); const idx=vals.indexOf(id); runRegulationById_(id,'Ручной',idx>=0?idx+2:null); }
function manualOrdersWb(){manualRun_('orders_wb')} function manualOrdersOzon(){manualRun_('orders_ozon')} function manualStocksSync(){manualRun_('stocks_sync')} function manualPricesSync(){manualRun_('prices_sync')} function manualActionsSync(){manualRun_('actions_sync')} function manualDashboardRefresh(){manualRun_('dashboard_refresh')} function manualForecastRefresh(){manualRun_('forecast_refresh')}
function manualRunAll(){['orders_wb','orders_ozon','stocks_sync','prices_sync','actions_sync','dashboard_refresh','forecast_refresh'].forEach(manualRun_);}
/* ===== Placeholders.gs ===== */
// Все функциональные модули утверждённого v1 реализованы.
// Файл оставлен для совместимости с установкой и будущих расширений.
