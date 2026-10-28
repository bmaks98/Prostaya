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
