/** Основной цикл создания карточек WB/Ozon из листа «Новые карточки». */
function generateBarcodes(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true),used=cardUsedBarcodes_();
  let count=0;
  targets.forEach(t=>{const cell=sh.getRange(t.row,h['Штрихкод']);if(asText_(cell.getValue()))return;const code=cardGenerateEan13_(used);cell.setValue(code);used[code]=true;count++;});
  toast_('Сгенерировано штрихкодов: '+count+'.');
  return {processed:targets.length,success:count,errors:0};
}
function cardUsedBarcodes_(){
  const out={};
  [APP.SHEETS.STOCK,APP.SHEETS.NEW_CARDS].forEach(name=>{const sh=sheet_(name),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return;const key='Штрихкод';if(!h[key])return;sh.getRange(2,h[key],sh.getLastRow()-1,1).getValues().forEach(r=>{const b=normBarcode_(r[0]);if(b)out[b]=true;});});
  return out;
}
function cardGenerateEan13_(used){let barcode='';do{let base='29';for(let i=0;i<10;i++)base+=Math.floor(Math.random()*10);barcode=base+ean13CheckDigit_(base);}while(used[barcode]);return barcode;}
function ean13CheckDigit_(base12){const s=String(base12);if(!/^\d{12}$/.test(s))throw new Error('Для EAN-13 требуется 12 цифр без контрольной.');let sum=0;for(let i=0;i<12;i++)sum+=Number(s[i])*(i%2===0?1:3);return String((10-(sum%10))%10);}

function validateSelectedCards(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h0=findHeaderMap_(sh),targets0=cardTargetRows_(sh,h0,true);if(!targets0.length)throw new Error('Нет карточек для проверки. Отметьте «Создать».');
  cardEnsureIdentifiers_(sh,h0,targets0);
  applyCategoryMappingsToCards_();
  loadRequiredCardAttributes();
  const h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true),useWb=boolText_(getSetting_('Использовать WB','Нет')),useOz=boolText_(getSetting_('Использовать Ozon','Нет'));
  const duplicateIndex=cardArticleDuplicateIndex_();let success=0,errors=0;
  targets.forEach(t=>{
    const data=cardReadRow_(sh,t.row,h);let wbErr='',ozErr='';
    try{cardValidateCommon_(data,sh,t.row,h,duplicateIndex);}catch(e){wbErr=e.message;ozErr=e.message;}
    if(!wbErr&&useWb){try{cardValidateWb_(data,sh,t.row,h);}catch(e){wbErr=e.message;}}
    if(!ozErr&&useOz){try{cardValidateOzon_(data,sh,t.row,h);}catch(e){ozErr=e.message;}}
    cardWriteCheck_(sh,t.row,h,'WB',useWb?(wbErr?'ОШИБКА: '+wbErr:'ГОТОВО'):'НЕ ИСПОЛЬЗУЕТСЯ');
    cardWriteCheck_(sh,t.row,h,'Ozon',useOz?(ozErr?'ОШИБКА: '+ozErr:'ГОТОВО'):'НЕ ИСПОЛЬЗУЕТСЯ');
    if(useWb)sh.getRange(t.row,h['Ошибка WB']).setValue(wbErr);
    if(useOz)sh.getRange(t.row,h['Ошибка Ozon']).setValue(ozErr);
    if((!useWb||!wbErr)&&(!useOz||!ozErr))success++;else errors++;
  });
  toast_('Проверено карточек: '+targets.length+'. Готово: '+success+', с ошибками: '+errors+'.');
  return {processed:targets.length,success:success,errors:errors};
}

function createSelectedCards(){
  validateSelectedCards();
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true),useWb=boolText_(getSetting_('Использовать WB','Нет')),useOz=boolText_(getSetting_('Использовать Ozon','Нет'));
  let processed=0,success=0,errors=0;
  targets.forEach(t=>{
    const data=cardReadRow_(sh,t.row,h);let touched=false;
    if(useWb&&cardCheckIsReady_(sh,t.row,h,'WB')&&!cardSideCreated_(data,'WB')){touched=true;processed++;try{const r=wbCreateOrFinalizeCard_(sh,t.row,h,data,false);if(r.created)success++;else if(r.error)errors++;}catch(e){errors++;cardSetSideError_(sh,t.row,h,'WB',e.message);}}
    if(useOz&&cardCheckIsReady_(sh,t.row,h,'Ozon')&&!cardSideCreated_(cardReadRow_(sh,t.row,h),'Ozon')){touched=true;processed++;try{const r=ozonCreateOrFinalizeCard_(sh,t.row,h,cardReadRow_(sh,t.row,h),false);if(r.created)success++;else if(r.error)errors++;}catch(e){errors++;cardSetSideError_(sh,t.row,h,'Ozon',e.message);}}
    if(touched)cardSyncWarehouseAndMatching_(sh,t.row,h);
  });
  toast_('Создание карточек: операций '+processed+', завершено '+success+', ошибок '+errors+'. Ожидающие ID будут продолжены повторным запуском.');
  return {processed:processed,success:success,errors:errors};
}
function retryFailedWbCards(){return cardRetryFailedSide_('WB');}
function retryFailedOzonCards(){return cardRetryFailedSide_('Ozon');}
function cardRetryFailedSide_(market){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return {processed:0,success:0,errors:0};
  const enabled=boolText_(getSetting_(market==='WB'?'Использовать WB':'Использовать Ozon','Нет'));if(!enabled)throw new Error(market+' выключен в настройках.');
  let p=0,s=0,e=0;const rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  rows.forEach((r,i)=>{const row=i+2,data=cardReadRow_(sh,row,h),status=asText_(r[h['Статус '+market]-1]),photoRetry=market==='WB'&&/ОШИБКА ФОТО/i.test(status);if((cardSideCreated_(data,market)&&!photoRetry)||status.indexOf('ОШИБ')<0)return;
    p++;try{cardEnsureIdentifiers_(sh,h,[{row:row,values:r}]);const fresh=cardReadRow_(sh,row,h);if(market==='WB')cardValidateWb_(fresh,sh,row,h);else cardValidateOzon_(fresh,sh,row,h);cardClearPending_(market,fresh.internalId);const x=market==='WB'?wbCreateOrFinalizeCard_(sh,row,h,fresh,true):ozonCreateOrFinalizeCard_(sh,row,h,fresh,true);if(x.created)s++;else if(x.error)e++;cardSyncWarehouseAndMatching_(sh,row,h);}catch(err){e++;cardSetSideError_(sh,row,h,market,err.message);}});
  toast_(market+': повторено '+p+', завершено '+s+', ошибок '+e+'.');return {processed:p,success:s,errors:e};
}
function cardEnsureIdentifiers_(sh,h,targets){const used=cardUsedBarcodes_(),auto=boolText_(getSetting_('Генерировать штрихкод автоматически','Да'));targets.forEach(t=>{let id=asText_(sh.getRange(t.row,h['Внутренний ID']).getValue());if(!id){id=uuid_();sh.getRange(t.row,h['Внутренний ID']).setValue(id);}let b=normBarcode_(sh.getRange(t.row,h['Штрихкод']).getValue());if(!b&&auto){b=cardGenerateEan13_(used);sh.getRange(t.row,h['Штрихкод']).setValue(b);used[b]=true;}});}
function cardArticleDuplicateIndex_(){const out={articles:{},barcodes:{}},sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);if(sh.getLastRow()>1){sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{const a=normKey_(r[h['Артикул продавца']-1]),b=normBarcode_(r[h['Штрихкод']-1]);if(a){if(!out.articles[a])out.articles[a]=[];out.articles[a].push(i+2);}if(b){if(!out.barcodes[b])out.barcodes[b]=[];out.barcodes[b].push(i+2);}});}return out;}
function cardReadRow_(sh,row,h){const v=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0],ctx=cardRowContext_(v,h),brand=asText_(v[h['Бренд']-1])||asText_(getSetting_('Бренд по умолчанию',''));return {row:row,internalId:asText_(v[h['Внутренний ID']-1]),article:asText_(v[h['Артикул продавца']-1]),barcode:normBarcode_(v[h['Штрихкод']-1]),name:asText_(v[h['Название']-1]),description:asText_(v[h['Описание']-1]),brand:brand,category:asText_(v[h['Наша категория']-1]),wbSubjectName:asText_(v[h['Предмет WB']-1]),ozTypeName:asText_(v[h['Тип товара Ozon']-1]),price:toNumber_(v[h['Цена']-1]),length:toNumber_(v[h['Длина упаковки, см']-1]),width:toNumber_(v[h['Ширина упаковки, см']-1]),height:toNumber_(v[h['Высота упаковки, см']-1]),weightG:toNumber_(v[h['Вес с упаковкой, г']-1]),wbNm:asText_(v[h['WB NMID']-1]),ozProductId:asText_(v[h['Ozon Product ID']-1]),ozSku:asText_(v[h['Ozon SKU']-1]),wbStatus:asText_(v[h['Статус WB']-1]),ozStatus:asText_(v[h['Статус Ozon']-1]),ctx:ctx};}
function cardValidateCommon_(d,sh,row,h,dups){if(!d.internalId)throw new Error('Не сформирован внутренний ID.');if(!d.article)throw new Error('Не заполнен артикул продавца.');if((dups.articles[normKey_(d.article)]||[]).filter(x=>x!==row).length)throw new Error('Артикул продавца повторяется на листе «Новые карточки».');if(!d.name)throw new Error('Не заполнено название.');if(!d.description)throw new Error('Не заполнено описание.');if(!(d.price>0))throw new Error('Цена должна быть больше 0.');if(!(d.length>0&&d.width>0&&d.height>0))throw new Error('Заполните все габариты упаковки.');if(!(d.weightG>0))throw new Error('Вес с упаковкой должен быть больше 0.');if(!d.barcode)throw new Error('Не заполнен штрихкод.');if(!/^\d{8,14}$/.test(d.barcode))throw new Error('Штрихкод должен содержать 8–14 цифр.');if((dups.barcodes[d.barcode]||[]).filter(x=>x!==row).length)throw new Error('Штрихкод повторяется на листе «Новые карточки».');cardAssertNotExistingDuplicate_(d);if(!cardHasMainImage_(sh,row,h))throw new Error('Вставьте изображение непосредственно в ячейку «Фото 1».');}
function cardAssertNotExistingDuplicate_(d){const sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return;sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{const iid=asText_(r[h['Внутренний ID']-1]);if(iid===d.internalId)return;const a=normKey_(r[h['Артикул основной']-1]),b=normBarcode_(r[h['Штрихкод']-1]);if(a&&a===normKey_(d.article))throw new Error('Артикул уже существует на листе «Склад».');if(b&&b===d.barcode)throw new Error('Штрихкод уже существует на листе «Склад».');});}
function cardValidateWb_(d,sh,row,h){if(!d.ctx.wb||!d.ctx.wb.id)throw new Error('WB: выберите предмет WB из справочника.');const attrs=wbRequiredAttributes_(d.ctx.wb.id),brandReq=attrs.some(a=>a.existNamedField&&/бренд/.test(normName_(a.name)));if(brandReq&&!d.brand)throw new Error('WB: для предмета обязателен бренд.');wbBuildDynamicCharacteristics_(sh,row,d.ctx);return true;}
function cardValidateOzon_(d,sh,row,h){if(!d.ctx.oz||!d.ctx.oz.categoryId||!d.ctx.oz.typeId)throw new Error('Ozon: выберите тип товара Ozon из справочника.');ozonBuildDynamicAttributes_(sh,row,d.ctx);return true;}
function cardWriteCheck_(sh,row,h,market,text){const col=h['Проверка '+market];if(!col)return;const cell=sh.getRange(row,col).setValue(text);setStatusColor_(cell,text);}
function cardCheckIsReady_(sh,row,h,market){return asText_(sh.getRange(row,h['Проверка '+market]).getValue()).indexOf('ГОТОВО')===0;}
function cardSideCreated_(d,market){return market==='WB'?!!d.wbNm:!!d.ozProductId;}
function cardSetSideError_(sh,row,h,market,message){sh.getRange(row,h['Статус '+market]).setValue('ОШИБКА');sh.getRange(row,h['Ошибка '+market]).setValue(message);setStatusColor_(sh.getRange(row,h['Статус '+market]),'Ошибка');}
function cardSetSideStatus_(sh,row,h,market,status,error){sh.getRange(row,h['Статус '+market]).setValue(status);if(h['Ошибка '+market])sh.getRange(row,h['Ошибка '+market]).setValue(error||'');setStatusColor_(sh.getRange(row,h['Статус '+market]),status);}
function cardPendingKey_(market,internalId){return 'CARD_PENDING_'+market.toUpperCase()+'_'+internalId;}
function cardPending_(market,internalId){const raw=PropertiesService.getScriptProperties().getProperty(cardPendingKey_(market,internalId));if(!raw)return null;try{return JSON.parse(raw);}catch(_){return {value:raw};}}
function cardSavePending_(market,internalId,obj){PropertiesService.getScriptProperties().setProperty(cardPendingKey_(market,internalId),JSON.stringify(obj||{}));}
function cardClearPending_(market,internalId){PropertiesService.getScriptProperties().deleteProperty(cardPendingKey_(market,internalId));}
function cardSyncWarehouseAndMatching_(sh,row,h){const d=cardReadRow_(sh,row,h);if(!d.internalId||(!d.wbNm&&!d.ozProductId))return;const wbCard=d.wbNm?wbFindCardByVendor_(d.article):null,ozInfo=d.ozProductId?ozonFindProductByOffer_(d.article):null;const stock=sheet_(APP.SHEETS.STOCK),shh=findHeaderMap_(stock),headers=SHEET_SCHEMAS[APP.SHEETS.STOCK];let srow=0;if(stock.getLastRow()>1)stock.getRange(2,1,stock.getLastRow()-1,1).getValues().forEach((r,i)=>{if(asText_(r[0])===d.internalId)srow=i+2;});if(!srow){srow=stock.getLastRow()+1;stock.getRange(srow,1,1,headers.length).setValues([new Array(headers.length).fill('')]);stock.getRange(srow,shh['Фактический остаток']).setValue(0);}const set=(name,val)=>{if(shh[name]&&val!==undefined)stock.getRange(srow,shh[name]).setValue(val);};set('Внутренний ID',d.internalId);set('Наименование',d.name);set('Категория',d.category);set('Артикул основной',d.article);set('Штрихкод',d.barcode);set('WB подключён',!!d.wbNm);set('WB NMID',d.wbNm||'');set('WB артикул',d.wbNm?d.article:'');set('WB SKU / barcode',d.wbNm?d.barcode:'');set('Ozon подключён',!!d.ozProductId);set('Ozon Product ID',d.ozProductId||'');set('Ozon Offer ID',d.ozProductId?d.article:'');set('Ozon SKU',d.ozSku||(ozInfo&&ozInfo.sku)||'');set('Статус сопоставления',d.wbNm&&d.ozProductId?'Сопоставлен':(d.wbNm?'Только WB':'Только Ozon'));set('Источник названия',d.wbNm?'WB':'Ozon');set('Последняя синхронизация',now_());if(wbCard){set('WB chrtId (служебно)',wbCard.chrtId||'');set('WB Subject ID (служебно)',wbCard.subjectId||d.ctx.wb.id);set('WB Длина, см (служебно)',wbCard.dimensions&&wbCard.dimensions.length||d.length);set('WB Ширина, см (служебно)',wbCard.dimensions&&wbCard.dimensions.width||d.width);set('WB Высота, см (служебно)',wbCard.dimensions&&wbCard.dimensions.height||d.height);}const m=sheet_(APP.SHEETS.MATCHING),mh=findHeaderMap_(m),mheaders=SHEET_SCHEMAS[APP.SHEETS.MATCHING];let mrow=0;if(m.getLastRow()>1)m.getRange(2,1,m.getLastRow()-1,1).getValues().forEach((r,i)=>{if(asText_(r[0])===d.internalId)mrow=i+2;});if(!mrow){mrow=m.getLastRow()+1;m.getRange(mrow,1,1,mheaders.length).setValues([new Array(mheaders.length).fill('')]);}const ms=(name,val)=>{if(mh[name])m.getRange(mrow,mh[name]).setValue(val);};ms('Внутренний ID',d.internalId);ms('WB NMID',d.wbNm||'');ms('WB артикул',d.wbNm?d.article:'');ms('WB наименование',d.wbNm?d.name:'');ms('WB штрихкод',d.wbNm?d.barcode:'');ms('Ozon Product ID',d.ozProductId||'');ms('Ozon Offer ID',d.ozProductId?d.article:'');ms('Ozon наименование',d.ozProductId?d.name:'');ms('Ozon штрихкод',d.ozProductId?d.barcode:'');ms('Найдено по','Создание карточки');ms('Уверенность совпадения','Подтверждено');ms('Статус',d.wbNm&&d.ozProductId?'Сопоставлен':(d.wbNm?'Только WB':'Только Ozon'));ms('Подтверждено вручную',!!(d.wbNm&&d.ozProductId));if(!sh.getRange(row,h['Дата создания']).getValue())sh.getRange(row,h['Дата создания']).setValue(now_()).setNumberFormat('dd.MM.yyyy HH:mm:ss');}
