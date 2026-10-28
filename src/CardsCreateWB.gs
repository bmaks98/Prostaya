/** Создание карточек WB и общий запуск создания. */
function createSelectedCards(){
  const vr=validateSelectedCards();if(vr.errors)toast_('Есть ошибки проверки. Корректные площадки будут созданы, ошибочные — пропущены.');
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardSelectedRows_(sh,h);
  const useWb=boolText_(getSetting_('Использовать WB','Нет')),useOz=boolText_(getSetting_('Использовать Ozon','Нет'));
  let processed=0,success=0,errors=0;
  // Сначала пытаемся дозавершить уже отправленные задания, чтобы повторный запуск не создавал дублей.
  if(useWb){const r=createWbCards_(sh,h,targets,false);processed+=r.processed;success+=r.success;errors+=r.errors;}
  if(useOz){const r=createOzonCards_(sh,h,targets,false);processed+=r.processed;success+=r.success;errors+=r.errors;}
  targets.forEach(t=>finalizeCardDateAndStock_(sh,t.row,h));
  toast_('Создание карточек: успешно '+success+', ошибок '+errors+'.');return {processed:processed,success:success,errors:errors};
}
function retryFailedWbCards(){const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,false).filter(t=>!asText_(t.values[h['WB NMID']-1])&&/(ОШИБКА|ОЖИДАЕТ ID)/i.test(asText_(t.values[h['Статус WB']-1])));const r=createWbCards_(sh,h,targets,true);targets.forEach(t=>finalizeCardDateAndStock_(sh,t.row,h));return r;}
function retryFailedOzonCards(){const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,false).filter(t=>!asText_(t.values[h['Ozon Product ID']-1])&&/(ОШИБКА|ОЖИДАЕТ ОБРАБОТКИ)/i.test(asText_(t.values[h['Статус Ozon']-1])));const r=createOzonCards_(sh,h,targets,true);targets.forEach(t=>finalizeCardDateAndStock_(sh,t.row,h));return r;}

function createWbCards_(sh,h,targets,retry){
  const catalog=wbFetchCatalog_(),byOffer={};catalog.forEach(x=>byOffer[normKey_(x.offer)]=x);let processed=0,success=0,errors=0;const pending=[];
  targets.forEach(t=>{const r=sh.getRange(t.row,1,1,sh.getLastColumn()).getValues()[0],offer=asText_(r[h['Артикул продавца']-1]),exists=byOffer[normKey_(offer)];
    if(exists){try{finalizeWbCard_(sh,t.row,h,exists);success++;}catch(e){errors++;setCardMarketResult_(sh,t.row,h,'WB','ОШИБКА',e.message);}return;}
    if(asText_(r[h['Проверка WB']-1])!=='ГОТОВО'){errors++;return;}
    if(/ОЖИДАЕТ ID/i.test(asText_(r[h['Статус WB']-1]))){pending.push({row:t.row,offer:offer,submitted:true});return;}
    // Повторно отправляем только явную ошибку/новую строку. Статус ожидания никогда не дублируем.
    pending.push({row:t.row,offer:offer,submitted:false});
  });
  const send=pending.filter(x=>!x.submitted);for(let i=0;i<send.length;i+=100){const part=send.slice(i,i+100),groups={},built=[];
    part.forEach(x=>{try{const r=sh.getRange(x.row,1,1,sh.getLastColumn()).getValues()[0],ctx=cardRowContext_(r,h),variant=buildWbVariant_(sh,x.row,r,h,ctx);if(!groups[ctx.wb.id])groups[ctx.wb.id]=[];groups[ctx.wb.id].push(variant);built.push(x);}catch(e){errors++;setCardMarketResult_(sh,x.row,h,'WB','ОШИБКА',e.message);}});
    const payload=Object.keys(groups).map(id=>({subjectID:Number(id),variants:groups[id]}));if(!payload.length)continue;
    try{wbContentRequest_('/content/v2/cards/upload','post',payload,'Создание карточек WB');built.forEach(x=>{processed++;setCardMarketResult_(sh,x.row,h,'WB','ОТПРАВЛЕНО — ОЖИДАЕТ ID','');});}catch(e){built.forEach(x=>{processed++;errors++;setCardMarketResult_(sh,x.row,h,'WB','ОШИБКА',e.message);});}Utilities.sleep(6500);
  }
  // После отправки один раз перечитываем каталог и завершаем появившиеся карточки.
  const fresh=wbFetchCatalog_(),freshBy={};fresh.forEach(x=>freshBy[normKey_(x.offer)]=x);pending.forEach(x=>{const card=freshBy[normKey_(x.offer)];if(!card)return;try{finalizeWbCard_(sh,x.row,h,card);success++;}catch(e){errors++;setCardMarketResult_(sh,x.row,h,'WB','ОШИБКА',e.message);}});
  applyWbDraftErrorsToRows_(sh,h,pending.filter(x=>!freshBy[normKey_(x.offer)]));return {processed:processed,success:success,errors:errors};
}
function buildWbVariant_(sh,row,r,h,ctx){if(!ctx.wb)throw new Error('Не выбран предмет WB');const brand=asText_(r[h['Бренд']-1])||asText_(getSetting_('Бренд по умолчанию',''));
  const chars=cardDynamicAttributesForRow_(sh,row,ctx,'WB').map(x=>({id:Number(x.meta.id),value:wbCharacteristicValues_(x.value,x.meta)}));
  const v={vendorCode:asText_(r[h['Артикул продавца']-1]),kizMarked:false,wholesale:{enabled:false,quantum:1},dimensions:{length:Math.round(toNumber_(r[h['Длина упаковки, см']-1])),width:Math.round(toNumber_(r[h['Ширина упаковки, см']-1])),height:Math.round(toNumber_(r[h['Высота упаковки, см']-1])),weightBrutto:Math.round(toNumber_(r[h['Вес с упаковкой, г']-1]))/1000},characteristics:chars,sizes:[{price:Math.round(toNumber_(r[h['Цена']-1])),skus:[asText_(r[h['Штрихкод']-1])]}],title:asText_(r[h['Название']-1]),description:asText_(r[h['Описание']-1])};if(brand)v.brand=brand;return v;
}
function wbCharacteristicValues_(value,meta){const text=asText_(value),parts=meta.maxCount>1?text.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean):[text];return parts.map(x=>meta.charcType===4?Number(String(x).replace(',','.')):x);}
function finalizeWbCard_(sh,row,h,card){sh.getRange(row,h['WB NMID']).setValue(card.id);setCardMarketResult_(sh,row,h,'WB','СОЗДАНО','');const urls=cardImageUrls_(sh,row,h);if(urls.length)wbUploadCardMedia_(card.id,urls);upsertNewCardStock_(sh,row,h,{wb:card});}
function applyWbDraftErrorsToRows_(sh,h,items){if(!items.length)return;let batches=[];try{const r=wbContentRequest_('/content/v2/cards/error/list','post',{},'Ошибки карточек WB').json||{};batches=(r.data&&r.data.errors)||r.errors||r.data||[];}catch(_){return;}
  const errorsByOffer={};JSON.stringify(batches);(Array.isArray(batches)?batches:[]).forEach(b=>{(b.errors||b.cards||[]).forEach(e=>{const offer=asText_(e.vendorCode||e.vendor_code),msg=asText_(e.errorText||e.message||e.error);if(offer&&msg)errorsByOffer[normKey_(offer)]=msg;});});items.forEach(x=>{const msg=errorsByOffer[normKey_(x.offer)];if(msg)setCardMarketResult_(sh,x.row,h,'WB','ОШИБКА',msg);});}
