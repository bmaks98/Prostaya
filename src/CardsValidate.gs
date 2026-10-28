/** Создание новых карточек WB/Ozon из листа «Новые карточки». */
const CARD_OZ_TASK_PREFIX='CARD_OZ_TASK_';

function generateBarcodes(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true);
  const used=cardUsedBarcodes_();let changed=0;
  targets.forEach(t=>{
    if(!asText_(t.values[h['Внутренний ID']-1]))sh.getRange(t.row,h['Внутренний ID']).setValue(uuid_());
    if(asText_(t.values[h['Штрихкод']-1]))return;
    const bc=generateUniqueEan13_(used);used[bc]=true;sh.getRange(t.row,h['Штрихкод']).setValue(bc);changed++;
  });
  toast_('Сгенерировано штрихкодов: '+changed+'.');return {processed:targets.length,success:changed,errors:0};
}
function generateUniqueEan13_(used){
  for(let i=0;i<10000;i++){
    const base='20'+String(Date.now()).slice(-7)+String(Math.floor(Math.random()*1000)).padStart(3,'0');
    const code=base+ean13CheckDigit_(base);if(!used[code])return code;
  }
  throw new Error('Не удалось сгенерировать уникальный штрихкод.');
}
function ean13CheckDigit_(base){let sum=0;String(base).split('').forEach((d,i)=>sum+=Number(d)*(i%2===0?1:3));return String((10-(sum%10))%10);}
function cardSelectedRows_(sh,h){if(sh.getLastRow()<2)return[];const vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),out=[];vals.forEach((r,i)=>{if(r[h['Создать']-1]===true)out.push({row:i+2,values:r});});return out;}
function ensureSelectedCardIds_(sh,h){cardSelectedRows_(sh,h).forEach(t=>{if(!asText_(t.values[h['Внутренний ID']-1]))sh.getRange(t.row,h['Внутренний ID']).setValue(uuid_());});}
function cardUsedBarcodes_(){const out={};
  const cards=sheet_(APP.SHEETS.NEW_CARDS),ch=findHeaderMap_(cards);if(cards.getLastRow()>1)cards.getRange(2,ch['Штрихкод'],cards.getLastRow()-1,1).getValues().forEach(r=>{const x=normBarcode_(r[0]);if(x)out[x]=true;});
  const st=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(st);if(st.getLastRow()>1)st.getRange(2,h['Штрихкод'],st.getLastRow()-1,1).getValues().forEach(r=>{const x=normBarcode_(r[0]);if(x)out[x]=true;});return out;
}

function validateSelectedCards(){
  applyCategoryMappingsToCards_();
  const preSh=sheet_(APP.SHEETS.NEW_CARDS),preH=findHeaderMap_(preSh);if(!cardSelectedRows_(preSh,preH).length)throw new Error('Отметьте карточки флажком «Создать».');
  ensureSelectedCardIds_(preSh,preH);
  if(boolText_(getSetting_('Генерировать штрихкод автоматически','Да')))generateBarcodes();
  loadRequiredCardAttributes();
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardSelectedRows_(sh,h);
  const useWb=boolText_(getSetting_('Использовать WB','Нет')),useOz=boolText_(getSetting_('Использовать Ozon','Нет'));
  const brandDefault=asText_(getSetting_('Бренд по умолчанию',''));
  const stockDup=cardExistingKeys_(),rowDup=cardRowDuplicateKeys_(targets,h);
  let ok=0,errors=0;
  targets.forEach(t=>{
    const r=t.values,baseErr=cardBaseValidationErrors_(sh,t.row,r,h,stockDup,rowDup),ctx=cardRowContext_(r,h);
    let wbErr=[],ozErr=[];
    if(useWb)wbErr=baseErr.concat(validateWbCardRow_(sh,t.row,r,h,ctx,brandDefault));
    if(useOz)ozErr=baseErr.concat(validateOzonCardRow_(sh,t.row,r,h,ctx,brandDefault));
    writeCardCheck_(sh,t.row,h,'WB',useWb,wbErr);writeCardCheck_(sh,t.row,h,'Ozon',useOz,ozErr);
    if((!useWb||!wbErr.length)&&(!useOz||!ozErr.length))ok++;else errors++;
  });
  toast_('Проверено карточек: '+targets.length+'. Готово: '+ok+', с ошибками: '+errors+'.');
  return {processed:targets.length,success:ok,errors:errors};
}
function cardBaseValidationErrors_(sh,row,r,h,stockDup,rowDup){const e=[],article=asText_(r[h['Артикул продавца']-1]),barcode=normBarcode_(r[h['Штрихкод']-1]),iid=asText_(r[h['Внутренний ID']-1]);
  if(!iid)e.push('Не заполнен внутренний ID');if(!article)e.push('Не заполнен артикул');if(!barcode)e.push('Не заполнен штрихкод');
  if(!asText_(r[h['Название']-1]))e.push('Не заполнено название');if(!asText_(r[h['Описание']-1]))e.push('Не заполнено описание');
  if(toNumber_(r[h['Цена']-1])<=0)e.push('Цена должна быть больше 0');
  ['Длина упаковки, см','Ширина упаковки, см','Высота упаковки, см','Вес с упаковкой, г'].forEach(k=>{if(toNumber_(r[h[k]-1])<=0)e.push('Некорректно: '+k);});
  if(!cardHasMainImage_(sh,row,h))e.push('Не заполнено Фото 1');
  if(article&&(stockDup.articles[normKey_(article)]&&stockDup.articles[normKey_(article)]!==iid))e.push('Артикул уже есть на складе');
  if(barcode&&(stockDup.barcodes[barcode]&&stockDup.barcodes[barcode]!==iid))e.push('Штрихкод уже есть на складе');
  if(article&&rowDup.articles[normKey_(article)]>1)e.push('Артикул повторяется в новых карточках');
  if(barcode&&rowDup.barcodes[barcode]>1)e.push('Штрихкод повторяется в новых карточках');return e;
}
function cardExistingKeys_(){const out={articles:{},barcodes:{}},sh=sheet_(APP.SHEETS.STOCK),h=findHeaderMap_(sh);if(sh.getLastRow()<=1)return out;sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach(r=>{const id=asText_(r[h['Внутренний ID']-1]),a=normKey_(r[h['Артикул основной']-1]),b=normBarcode_(r[h['Штрихкод']-1]);if(a)out.articles[a]=id;if(b)out.barcodes[b]=id;});return out;}
function cardRowDuplicateKeys_(targets,h){const out={articles:{},barcodes:{}};targets.forEach(t=>{const a=normKey_(t.values[h['Артикул продавца']-1]),b=normBarcode_(t.values[h['Штрихкод']-1]);if(a)out.articles[a]=(out.articles[a]||0)+1;if(b)out.barcodes[b]=(out.barcodes[b]||0)+1;});return out;}

function validateWbCardRow_(sh,row,r,h,ctx,brandDefault){const e=[];if(!ctx.wb){e.push('Не выбран корректный предмет WB');return e;}
  let required=[];try{required=wbRequiredAttributes_(ctx.wb.id);}catch(err){e.push('Не удалось получить характеристики WB: '+err.message);return e;}
  const brand=asText_(r[h['Бренд']-1])||brandDefault;
  if(required.some(a=>a.existNamedField&&/бренд/i.test(a.name))&&!brand)e.push('Для WB обязателен бренд');
  cardDynamicAttributesForRow_(sh,row,ctx,'WB').forEach(a=>{if(!asText_(a.value))e.push('Не заполнено '+a.header);else if(a.meta.charcType===4&&!Number.isFinite(Number(String(a.value).replace(',','.'))))e.push(a.header+': требуется число');});
  return e;
}
function validateOzonCardRow_(sh,row,r,h,ctx,brandDefault){const e=[];if(!ctx.oz){e.push('Не выбран корректный тип товара Ozon');return e;}
  let required=[];try{required=ozonRequiredAttributes_(ctx.oz.categoryId,ctx.oz.typeId);}catch(err){e.push('Не удалось получить характеристики Ozon: '+err.message);return e;}
  const brand=asText_(r[h['Бренд']-1])||brandDefault;
  required.forEach(a=>{try{
    if(a.id===8229)return;
    if(a.id===85){if(!brand)throw new Error('Для Ozon обязателен бренд');if(a.dictionaryId)ozonResolveDictionaryValue_(ctx.oz.categoryId,ctx.oz.typeId,{id:a.id,name:a.name},brand);return;}
    if(a.id===4191){if(!asText_(r[h['Описание']-1]))throw new Error('Для Ozon обязательно описание');return;}
    const x=cardDynamicAttributesForRow_(sh,row,ctx,'Ozon').find(v=>Number(v.meta.id)===Number(a.id));if(!x||!asText_(x.value))throw new Error('Не заполнено Ozon | '+a.name);
    if(a.dictionaryId)ozonResolveDictionaryValue_(ctx.oz.categoryId,ctx.oz.typeId,{id:a.id,name:a.name},x.value);
  }catch(err){e.push(err.message);}});
  return e;
}
function writeCardCheck_(sh,row,h,market,enabled,errs){const check=h['Проверка '+market],err=h['Ошибка '+market];if(!enabled){sh.getRange(row,check).setValue('НЕ ИСПОЛЬЗУЕТСЯ');sh.getRange(row,err).setValue('');return;}sh.getRange(row,check).setValue(errs.length?'ОШИБКА':'ГОТОВО');sh.getRange(row,err).setValue(errs.join(' | '));}
