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
