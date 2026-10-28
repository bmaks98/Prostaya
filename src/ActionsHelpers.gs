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
