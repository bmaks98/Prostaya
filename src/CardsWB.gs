/** Создание новых карточек Wildberries. */
function wbFindCardByVendor_(vendorCode){
  const vendor=asText_(vendorCode);if(!vendor)return null;
  const body={settings:{cursor:{limit:100},filter:{withPhoto:-1,textSearch:vendor}}};
  const r=wbContentRequest_('/content/v2/get/cards/list','post',body,'Поиск новой карточки WB').json||{},data=r.data||r,cards=Array.isArray(data.cards)?data.cards:[];
  const found=cards.find(c=>normKey_(c.vendorCode)===normKey_(vendor));return found?normalizeWbCard_(found):null;
}
function wbBuildNewCardPayload_(sh,row,h,d){
  const characteristics=wbBuildDynamicCharacteristics_(sh,row,d.ctx);
  const variant={vendorCode:d.article,kizMarked:false,wholesale:{enabled:false,quantum:1},dimensions:{length:Math.round(d.length),width:Math.round(d.width),height:Math.round(d.height),weightBrutto:Math.round((d.weightG/1000)*1000)/1000},characteristics:characteristics,sizes:[{price:Math.round(d.price),skus:[d.barcode]}]};
  if(d.name)variant.title=d.name;if(d.description)variant.description=d.description;if(d.brand)variant.brand=d.brand;
  return [{subjectID:Number(d.ctx.wb.id),variants:[variant]}];
}
function wbCreateOrFinalizeCard_(sh,row,h,d,forceRetry){
  if(d.wbNm){
    if(forceRetry&&/ОШИБКА ФОТО/i.test(d.wbStatus)){wbUploadCardMediaFromCells_(d.wbNm,sh,row,h);cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО','');cardSyncWarehouseAndMatching_(sh,row,h);return {created:true};}
    cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО','');return {created:true};
  }
  let existing=wbFindCardByVendor_(d.article);if(existing)return wbFinalizeNewCard_(sh,row,h,d,existing);
  const pending=cardPending_('WB',d.internalId);
  if(pending&&!forceRetry){const age=Date.now()-Number(pending.sentAt||0);if(age<40*60*1000){cardSetSideStatus_(sh,row,h,'WB','ОТПРАВЛЕНО — ОЖИДАЕТ NMID','');return {pending:true};}cardClearPending_('WB',d.internalId);cardSetSideError_(sh,row,h,'WB','WB не создал карточку за 40 минут. Проверьте черновики/ошибки WB и после исправления используйте «Повторить ошибочные WB».');return {error:true};}
  const payload=wbBuildNewCardPayload_(sh,row,h,d),resp=wbContentRequest_('/content/v2/cards/upload','post',payload,'Создание карточки WB'),json=resp.json||{};
  if(json.error===true)throw new Error(asText_(json.errorText||json.additionalErrors||resp.text)||'WB отклонил создание карточки.');
  cardSavePending_('WB',d.internalId,{sentAt:Date.now(),article:d.article});cardSetSideStatus_(sh,row,h,'WB','ОТПРАВЛЕНО — ОЖИДАЕТ NMID','');
  for(let i=0;i<3;i++){Utilities.sleep(1200);existing=wbFindCardByVendor_(d.article);if(existing)return wbFinalizeNewCard_(sh,row,h,d,existing);}
  return {pending:true};
}
function wbFinalizeNewCard_(sh,row,h,d,card){
  if(!card||!card.id)throw new Error('WB: карточка найдена, но nmID отсутствует.');sh.getRange(row,h['WB NMID']).setValue(card.id);
  try{wbUploadCardMediaFromCells_(card.id,sh,row,h);}catch(e){cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО — ОШИБКА ФОТО',e.message);cardClearPending_('WB',d.internalId);cardSyncWarehouseAndMatching_(sh,row,h);return {created:true,error:true};}
  cardClearPending_('WB',d.internalId);cardSetSideStatus_(sh,row,h,'WB','СОЗДАНО','');cardSyncWarehouseAndMatching_(sh,row,h);return {created:true};
}
