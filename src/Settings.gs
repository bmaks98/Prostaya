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
