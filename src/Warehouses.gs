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
