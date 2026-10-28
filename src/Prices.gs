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
