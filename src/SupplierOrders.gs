/** Заказы поставщикам и приёмка. */
function createSupplierOrder(){openSupplierOrderDialog_('manual');}
function createSupplierOrderFromSelected(){
  const selected=supplierSelectedForecastLines_();
  if(!selected.length){SpreadsheetApp.getUi().alert('Отметьте товары флажком «В заказ» на листе «Прогноз закупок».');return;}
  openSupplierOrderDialog_('forecast',selected);
}
function openSupplierOrderDialog_(mode,selected){
  const tpl=HtmlService.createTemplateFromFile('SupplierOrderDialog');
  tpl.data={mode:mode,products:supplierProductDirectory_(),lines:selected||[],today:supplierIsoDate_(new Date())};
  SpreadsheetApp.getUi().showModalDialog(tpl.evaluate().setWidth(760).setHeight(mode==='forecast'?620:520),mode==='forecast'?'Создать заказ из прогноза':'Создать заказ поставщику');
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
  const tpl=HtmlService.createTemplateFromFile('ReceiveDeliveryDialog');tpl.data={lines:lines,today:supplierIsoDate_(new Date())};
  SpreadsheetApp.getUi().showModalDialog(tpl.evaluate().setWidth(680).setHeight(560),'Принять поставку');
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
