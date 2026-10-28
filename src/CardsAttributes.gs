/** Динамические обязательные характеристики новых карточек. */
const CARD_ATTR_NOTE_PREFIX='CARD_ATTR_META|';

function loadRequiredCardAttributes(){
  const useWb=boolText_(getSetting_('Использовать WB','Нет')),useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon)throw new Error('В настройках не выбран ни один маркетплейс.');
  if(useWb&&!cardWbSubjectDirectory_().list.length)loadWbSubjects();
  if(useOzon&&!cardOzonTypeDirectory_().list.length)loadOzonTypes();
  applyCategoryMappingsToCards_();

  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),targets=cardTargetRows_(sh,h,true);
  if(!targets.length)throw new Error('Нет строк для подготовки характеристик. Отметьте «Создать» или заполните артикул товара.');
  const wbDir=cardWbSubjectDirectory_(),ozDir=cardOzonTypeDirectory_(),defs={};
  const wbCache={},ozCache={};let errors=0;

  targets.forEach(t=>{
    if(useWb){
      const name=asText_(t.values[h['Предмет WB']-1]),subject=wbDir.byName[normName_(name)];
      if(subject){
        let attrs=wbCache[subject.id];if(!attrs){attrs=wbRequiredAttributes_(subject.id);wbCache[subject.id]=attrs;Utilities.sleep(650);}
        attrs.filter(a=>!a.existNamedField).forEach(a=>mergeDynamicAttrDef_(defs,'WB',a.name,String(subject.id),{id:a.id,charcType:a.charcType,maxCount:a.maxCount,unitName:a.unitName,required:true}));
      }else if(name)errors++;
    }
    if(useOzon){
      const name=asText_(t.values[h['Тип товара Ozon']-1]),type=ozDir.byName[normName_(name)];
      if(type){
        const key=type.categoryId+':'+type.typeId;let attrs=ozCache[key];if(!attrs){attrs=ozonRequiredAttributes_(type.categoryId,type.typeId);ozCache[key]=attrs;}
        attrs.forEach(a=>{
          if(a.id===8229||a.id===85||a.id===4191)return;
          mergeDynamicAttrDef_(defs,'Ozon',a.name,key,{id:a.id,dictionaryId:a.dictionaryId,complexId:a.complexId,type:a.type,maxCount:a.maxCount,required:true});
        });
      }else if(name)errors++;
    }
  });

  ensureDynamicCardColumns_(sh,defs);
  styleDynamicCardCells_(sh);
  toast_('Обязательные характеристики обновлены: '+Object.keys(defs).length+' полей.');
  return {processed:Object.keys(defs).length,success:Object.keys(defs).length,errors:errors};
}

function wbRequiredAttributes_(subjectId){
  const r=wbContentRequest_('/content/v2/object/charcs/'+encodeURIComponent(subjectId)+'?locale=ru','get',undefined,'Характеристики WB').json||{};
  return (r.data||[]).filter(x=>x.required===true||Number(x.required)===1).map(x=>({
    id:Number(x.charcID||x.charcId||x.id),name:asText_(x.name)||('Характеристика '+asText_(x.charcID||x.id)),charcType:Number(x.charcType)||1,maxCount:Number(x.maxCount)||0,unitName:asText_(x.unitName),existNamedField:x.existNamedField===true
  })).filter(x=>x.id);
}
function ozonRequiredAttributes_(categoryId,typeId){
  const r=ozonRequest_('/v1/description-category/attribute',{description_category_id:Number(categoryId),type_id:Number(typeId),language:'DEFAULT'},'Характеристики Ozon').json||{};
  return (r.result||[]).filter(x=>x.is_required===true||Number(x.is_required)===1).map(x=>({
    id:Number(x.id),name:asText_(x.name)||('Характеристика '+asText_(x.id)),dictionaryId:Number(x.dictionary_id)||0,complexId:Number(x.attribute_complex_id||x.complex_id)||0,type:asText_(x.type),maxCount:Number(x.max_value_count)||0
  })).filter(x=>x.id);
}
function mergeDynamicAttrDef_(defs,market,name,contextKey,meta){
  const display=market+' | '+name,key=market+'|'+normName_(name);
  if(!defs[key])defs[key]={header:display,market:market,name:name,contexts:{}};
  defs[key].contexts[contextKey]=meta;
}

function ensureDynamicCardColumns_(sh,defs){
  const existing=dynamicCardColumns_(sh),base=SHEET_SCHEMAS[APP.SHEETS.NEW_CARDS].length;
  Object.keys(defs).forEach(key=>{
    const def=defs[key],found=existing.byKey[key];let col;
    if(found)col=found.col;
    else {col=Math.max(base+1,sh.getLastColumn()+1);if(col>sh.getMaxColumns())sh.insertColumnAfter(sh.getMaxColumns());sh.getRange(1,col).setValue(def.header);}
    const old=found&&found.meta||{market:def.market,name:def.name,contexts:{}};
    old.market=def.market;old.name=def.name;old.contexts=Object.assign({},old.contexts||{},def.contexts||{});
    sh.getRange(1,col).setNote(CARD_ATTR_NOTE_PREFIX+JSON.stringify(old)).setFontWeight('bold').setBackground(APP.COLORS.SECTION).setWrap(true);
  });
}
function dynamicCardColumns_(sh){
  const out={list:[],byKey:{}};const base=SHEET_SCHEMAS[APP.SHEETS.NEW_CARDS].length,last=sh.getLastColumn();
  for(let c=base+1;c<=last;c++){
    const header=asText_(sh.getRange(1,c).getValue()),note=asText_(sh.getRange(1,c).getNote());if(!header||note.indexOf(CARD_ATTR_NOTE_PREFIX)!==0)continue;
    let meta={};try{meta=JSON.parse(note.substring(CARD_ATTR_NOTE_PREFIX.length));}catch(e){continue;}
    const key=asText_(meta.market)+'|'+normName_(meta.name||header.replace(/^\w+\s*\|\s*/,''));const x={col:c,header:header,meta:meta,key:key};out.list.push(x);out.byKey[key]=x;
  }return out;
}
function styleDynamicCardCells_(sh){
  if(sh.getLastRow()<2)return;const h=findHeaderMap_(sh),dyn=dynamicCardColumns_(sh),wb=cardWbSubjectDirectory_(),oz=cardOzonTypeDirectory_();
  const rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  rows.forEach((r,i)=>{
    const subject=wb.byName[normName_(r[h['Предмет WB']-1])],type=oz.byName[normName_(r[h['Тип товара Ozon']-1])];
    dyn.list.forEach(d=>{const ctx=d.meta.contexts||{},key=d.meta.market==='WB'?(subject?String(subject.id):''):(type?(type.categoryId+':'+type.typeId):'');const cell=sh.getRange(i+2,d.col);cell.setBackground(key&&ctx[key]?APP.COLORS.WARN:APP.COLORS.MUTED);});
  });
}

function cardTargetRows_(sh,h,preferSelected){
  if(sh.getLastRow()<2)return[];const vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),selected=[];vals.forEach((r,i)=>{if(r[h['Создать']-1]===true)selected.push({row:i+2,values:r});});
  if(preferSelected&&selected.length)return selected;
  const out=[];vals.forEach((r,i)=>{if(asText_(r[h['Артикул продавца']-1])||asText_(r[h['Название']-1]))out.push({row:i+2,values:r});});return out;
}

function cardRowContext_(rowValues,h){
  const wb=cardWbSubjectDirectory_().byName[normName_(rowValues[h['Предмет WB']-1])]||null;
  const oz=cardOzonTypeDirectory_().byName[normName_(rowValues[h['Тип товара Ozon']-1])]||null;
  return {wb:wb,oz:oz};
}
function cardDynamicValue_(sh,row,dynCol){return sh.getRange(row,dynCol.col).getValue();}
function cardDynamicAttributesForRow_(sh,row,ctx,market){
  const dyn=dynamicCardColumns_(sh),out=[];const key=market==='WB'?(ctx.wb?String(ctx.wb.id):''):(ctx.oz?(ctx.oz.categoryId+':'+ctx.oz.typeId):'');
  dyn.list.forEach(d=>{if(d.meta.market!==market)return;const meta=(d.meta.contexts||{})[key];if(!meta)return;out.push({column:d.col,header:d.header,meta:meta,value:cardDynamicValue_(sh,row,d)});});return out;
}

function ozonResolveDictionaryValue_(categoryId,typeId,attr,value){
  const text=asText_(value);if(!text)throw new Error('Не заполнено «'+attr.name+'».');
  const props=PropertiesService.getScriptProperties(),cacheKey='OZ_ATTR_VAL_'+categoryId+'_'+typeId+'_'+attr.id+'_'+Utilities.base64EncodeWebSafe(text).substring(0,60),cached=props.getProperty(cacheKey);
  if(cached){try{return JSON.parse(cached);}catch(_) {}}
  const body={attribute_id:Number(attr.id),description_category_id:Number(categoryId),type_id:Number(typeId),limit:100,value:text.length>=2?text:text+' '};
  const r=ozonRequest_('/v1/description-category/attribute/values/search',body,'Справочник характеристики Ozon').json||{},items=r.result||[];
  let found=items.find(x=>normName_(x.value)===normName_(text));if(!found&&items.length===1)found=items[0];
  if(!found)throw new Error('Ozon: значение «'+text+'» не найдено в справочнике «'+attr.name+'».');
  const result={dictionary_value_id:Number(found.id),value:asText_(found.value)||text};
  try{props.setProperty(cacheKey,JSON.stringify(result));}catch(_){}
  return result;
}
