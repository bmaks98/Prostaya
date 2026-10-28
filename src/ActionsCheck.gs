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
