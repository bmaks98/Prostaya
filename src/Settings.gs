function settingsMap_() {
  const sh=sheet_(APP.SHEETS.SETTINGS); const n=sh.getLastRow()-1; const out={}; if(n<=0)return out;
  sh.getRange(2,1,n,5).getValues().forEach((r,i)=>{ out[String(r[1])]={row:i+2,group:r[0],value:r[2],description:r[3],status:r[4]}; }); return out;
}
function getSetting_(name, fallback) { const m=settingsMap_(); return m[name] ? m[name].value : fallback; }
function setSetting_(name, value, status) { const m=settingsMap_(); if(!m[name]) throw new Error('Неизвестная настройка: '+name); const sh=sheet_(APP.SHEETS.SETTINGS); sh.getRange(m[name].row,3).setValue(value); if(status!==undefined) sh.getRange(m[name].row,5).setValue(status); }

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
