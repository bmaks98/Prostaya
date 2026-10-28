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
  const promos=ozonFetchActions_(), meta={};promos.forEach(p=>meta[asText_(p.id)]=p);
  const enter=groupActionsByPromotion_(rows.filter(x=>x.action==='Вступить'));
  const exit=groupActionsByPromotion_(rows.filter(x=>x.action==='Выйти'));
  let processed=0,success=0,errors=0;

  Object.keys(enter).forEach(id=>{
    chunkArray_(enter[id],1000).forEach(part=>{
      processed+=part.length;
      const body={action_id:Number(id),products:part.map(x=>({product_id:Number(x.ozProductId),action_price:{amount:String(Math.round(x.actionPrice)),currency:'RUB'}}))};
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
