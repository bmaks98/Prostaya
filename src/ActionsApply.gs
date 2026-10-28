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
  // Ozon с октября 2026 использует единую предельную цену для цен и акций.
  // Передаём тот же безопасный предел, что рассчитан модулем цен, чтобы два регламента не перезаписывали друг друга.
  const promos=ozonFetchActions_(), meta={};promos.forEach(p=>meta[asText_(p.id)]=p);
  const enter=groupActionsByPromotion_(rows.filter(x=>x.action==='Вступить'));
  const exit=groupActionsByPromotion_(rows.filter(x=>x.action==='Выйти'));
  let processed=0,success=0,errors=0;

  Object.keys(enter).forEach(id=>{
    chunkArray_(enter[id],1000).forEach(part=>{
      processed+=part.length;
      const body={action_id:Number(id),products:part.map(x=>({product_id:Number(x.ozProductId),action_price:{amount:String(Math.round(x.minimum)),currency:'RUB'}}))};
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
