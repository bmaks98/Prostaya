/**
 * Справочники категорий для создания новых карточек.
 * Пользователь видит только человекочитаемые названия. Технические ID
 * хранятся в скрытых служебных колонках листа «Категории».
 */
const CARD_CATEGORY_SERVICE = Object.freeze({
  WB_NAME:10, WB_ID:11, WB_PARENT:12,
  OZ_NAME:14, OZ_CATEGORY_ID:15, OZ_TYPE_ID:16, OZ_PATH:17
});

function loadWbSubjects(){
  if(!boolText_(getSetting_('Использовать WB','Нет'))) throw new Error('WB выключен в настройках.');
  const all=[]; let offset=0;
  for(let page=0;page<100;page++){
    const path='/content/v2/object/all?limit=1000&offset='+offset+'&locale=ru';
    const r=wbContentRequest_(path,'get',undefined,'Категории WB').json||{};
    const rows=Array.isArray(r.data)?r.data:[];
    rows.forEach(x=>all.push({name:asText_(x.subjectName),id:Number(x.subjectID),parent:asText_(x.parentName)}));
    if(rows.length<1000)break;
    offset+=rows.length; Utilities.sleep(650);
  }
  all.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  const sh=sheet_(APP.SHEETS.CATEGORIES);
  ensureCardCategoryServiceColumns_(sh);
  const max=Math.max(1,sh.getMaxRows()-1);
  sh.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,max,3).clearContent();
  if(all.length) sh.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,all.length,3).setValues(all.map(x=>[x.name,x.id,x.parent]));
  syncCategoryMappingIds_();
  applyCardCategoryValidations_();
  toast_('Загружено предметов WB: '+all.length+'.');
  return {processed:all.length,success:all.length,errors:0};
}

function loadOzonTypes(){
  if(!boolText_(getSetting_('Использовать Ozon','Нет'))) throw new Error('Ozon выключен в настройках.');
  const r=ozonRequest_('/v1/description-category/tree',{language:'DEFAULT'},'Категории Ozon').json||{};
  const raw=[]; ozonFlattenCategoryTree_(r.result||[],[],0,raw);
  const active=raw.filter(x=>x.typeId>0&&x.categoryId>0&&!x.disabled);
  const counts={};active.forEach(x=>counts[normName_(x.typeName)]=(counts[normName_(x.typeName)]||0)+1);
  active.forEach(x=>x.display=counts[normName_(x.typeName)]>1?x.typeName+' — '+x.categoryName:x.typeName);
  active.sort((a,b)=>a.display.localeCompare(b.display,'ru'));
  const sh=sheet_(APP.SHEETS.CATEGORIES);
  ensureCardCategoryServiceColumns_(sh);
  const max=Math.max(1,sh.getMaxRows()-1);
  sh.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,max,4).clearContent();
  if(active.length) sh.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,active.length,4).setValues(active.map(x=>[x.display,x.categoryId,x.typeId,x.path]));
  syncCategoryMappingIds_();
  applyCardCategoryValidations_();
  toast_('Загружено типов товаров Ozon: '+active.length+'.');
  return {processed:active.length,success:active.length,errors:0};
}

function ozonFlattenCategoryTree_(nodes,path,categoryId,out){
  (nodes||[]).forEach(n=>{
    const name=asText_(n.category_name||n.type_name), nextPath=name?path.concat([name]):path;
    const nextCategory=Number(n.description_category_id)||categoryId||0;
    const typeId=Number(n.type_id)||0;
    if(typeId){
      out.push({typeName:asText_(n.type_name)||name,categoryName:path.length?path[path.length-1]:(name||''),categoryId:nextCategory,typeId:typeId,path:nextPath.join(' / '),disabled:n.disabled===true});
    }
    if(Array.isArray(n.children)&&n.children.length)ozonFlattenCategoryTree_(n.children,nextPath,nextCategory,out);
  });
}

function ensureCardCategoryServiceColumns_(sh){
  if(sh.getMaxColumns()<CARD_CATEGORY_SERVICE.OZ_PATH)sh.insertColumnsAfter(sh.getMaxColumns(),CARD_CATEGORY_SERVICE.OZ_PATH-sh.getMaxColumns());
  const headers={10:'WB справочник: предмет',11:'WB Subject ID (справочник)',12:'WB родительская категория (справочник)',14:'Ozon справочник: тип товара',15:'Ozon Description Category ID (справочник)',16:'Ozon Type ID (справочник)',17:'Ozon путь категории (справочник)'};
  Object.keys(headers).forEach(k=>sh.getRange(1,Number(k)).setValue(headers[k]));
  // Пользователь видит только 4 утверждённых колонки. Все справочники и ID служебные.
  if(sh.getMaxColumns()>=17) sh.hideColumns(5,13);
}

function cardWbSubjectDirectory_(){
  const sh=sheet_(APP.SHEETS.CATEGORIES);ensureCardCategoryServiceColumns_(sh);const out={byName:{},list:[]};
  if(sh.getLastRow()<2)return out;
  sh.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,sh.getLastRow()-1,3).getValues().forEach(r=>{const name=asText_(r[0]),id=Number(r[1]);if(!name||!id)return;const x={name:name,id:id,parent:asText_(r[2])};out.list.push(x);out.byName[normName_(name)]=x;});
  return out;
}
function cardOzonTypeDirectory_(){
  const sh=sheet_(APP.SHEETS.CATEGORIES);ensureCardCategoryServiceColumns_(sh);const out={byName:{},list:[]};
  if(sh.getLastRow()<2)return out;
  sh.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,sh.getLastRow()-1,4).getValues().forEach(r=>{const name=asText_(r[0]),cat=Number(r[1]),type=Number(r[2]);if(!name||!cat||!type)return;const x={name:name,categoryId:cat,typeId:type,path:asText_(r[3])};out.list.push(x);out.byName[normName_(name)]=x;});
  return out;
}

function syncCategoryMappingIds_(){
  const sh=sheet_(APP.SHEETS.CATEGORIES);if(sh.getLastRow()<2)return;
  ensureCardCategoryServiceColumns_(sh);
  const wb=cardWbSubjectDirectory_(),oz=cardOzonTypeDirectory_(),h=findHeaderMap_(sh);
  const n=sh.getLastRow()-1,vals=sh.getRange(2,1,n,8).getValues();
  vals.forEach((r,i)=>{
    const w=wb.byName[normName_(r[1])],o=oz.byName[normName_(r[2])];
    if(w)r[4]=w.id;
    if(o){r[5]=o.categoryId;r[6]=o.typeId;r[7]=o.path;}
  });
  sh.getRange(2,1,n,8).setValues(vals);
}

function applyCardCategoryValidations_(){
  const cat=sheet_(APP.SHEETS.CATEGORIES);ensureCardCategoryServiceColumns_(cat);
  const wbLast=cardDirectoryLastRow_(cat,CARD_CATEGORY_SERVICE.WB_NAME),ozLast=cardDirectoryLastRow_(cat,CARD_CATEGORY_SERVICE.OZ_NAME);
  const wbRule=wbLast>=2?SpreadsheetApp.newDataValidation().requireValueInRange(cat.getRange(2,CARD_CATEGORY_SERVICE.WB_NAME,wbLast-1,1),true).setAllowInvalid(true).build():null;
  const ozRule=ozLast>=2?SpreadsheetApp.newDataValidation().requireValueInRange(cat.getRange(2,CARD_CATEGORY_SERVICE.OZ_NAME,ozLast-1,1),true).setAllowInvalid(true).build():null;
  const rows=Math.max(1,cat.getMaxRows()-1);
  if(wbRule)cat.getRange(2,2,rows,1).setDataValidation(wbRule);
  if(ozRule)cat.getRange(2,3,rows,1).setDataValidation(ozRule);
  const cards=sheet_(APP.SHEETS.NEW_CARDS),ch=findHeaderMap_(cards),cr=Math.max(1,cards.getMaxRows()-1);
  if(wbRule&&ch['Предмет WB'])cards.getRange(2,ch['Предмет WB'],cr,1).setDataValidation(wbRule);
  if(ozRule&&ch['Тип товара Ozon'])cards.getRange(2,ch['Тип товара Ozon'],cr,1).setDataValidation(ozRule);
  const catNames=activeInternalCategoryNames_();
  if(catNames.length&&ch['Наша категория'])cards.getRange(2,ch['Наша категория'],cr,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(catNames,true).setAllowInvalid(true).build());
}
function cardDirectoryLastRow_(sh,col){let last=1;const n=sh.getLastRow()-1;if(n<=0)return last;sh.getRange(2,col,n,1).getValues().forEach((r,i)=>{if(asText_(r[0]))last=i+2;});return last;}
function activeInternalCategoryNames_(){const sh=sheet_(APP.SHEETS.CATEGORIES),out=[];if(sh.getLastRow()<2)return out;sh.getRange(2,1,sh.getLastRow()-1,4).getValues().forEach(r=>{const n=asText_(r[0]);if(n&&(r[3]===true||asText_(r[3])===''))out.push(n);});return Array.from(new Set(out));}

function categoryMappingIndex_(){
  syncCategoryMappingIds_();
  const sh=sheet_(APP.SHEETS.CATEGORIES),out={};if(sh.getLastRow()<2)return out;
  sh.getRange(2,1,sh.getLastRow()-1,8).getValues().forEach(r=>{const name=asText_(r[0]);if(!name||r[3]===false)return;out[normName_(name)]={name:name,wbName:asText_(r[1]),ozName:asText_(r[2]),wbSubjectId:Number(r[4])||0,ozCategoryId:Number(r[5])||0,ozTypeId:Number(r[6])||0,ozPath:asText_(r[7])};});return out;
}

function applyCategoryMappingsToCards_(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);if(sh.getLastRow()<2)return;
  const map=categoryMappingIndex_(),n=sh.getLastRow()-1;
  const cats=sh.getRange(2,h['Наша категория'],n,1).getValues();
  const wbVals=sh.getRange(2,h['Предмет WB'],n,1).getValues();
  const ozVals=sh.getRange(2,h['Тип товара Ozon'],n,1).getValues();
  for(let i=0;i<n;i++){
    const cat=map[normName_(cats[i][0])];if(!cat)continue;
    if(!asText_(wbVals[i][0])&&cat.wbName)wbVals[i][0]=cat.wbName;
    if(!asText_(ozVals[i][0])&&cat.ozName)ozVals[i][0]=cat.ozName;
  }
  // Пишем только три текстовые колонки. Фото в ячейках не считываем и не перезаписываем.
  sh.getRange(2,h['Предмет WB'],n,1).setValues(wbVals);
  sh.getRange(2,h['Тип товара Ozon'],n,1).setValues(ozVals);
  rememberManualCategoryMappings_();
}

function rememberManualCategoryMappings_(){
  const cards=sheet_(APP.SHEETS.NEW_CARDS),ch=findHeaderMap_(cards),cat=sheet_(APP.SHEETS.CATEGORIES);if(cards.getLastRow()<2)return;
  const rows=cards.getRange(2,1,cards.getLastRow()-1,cards.getLastColumn()).getValues(),existing={};
  if(cat.getLastRow()>1)cat.getRange(2,1,cat.getLastRow()-1,8).getValues().forEach((r,i)=>{if(asText_(r[0]))existing[normName_(r[0])]={row:i+2,values:r};});
  rows.forEach(r=>{const name=asText_(r[ch['Наша категория']-1]);if(!name)return;const wb=asText_(r[ch['Предмет WB']-1]),oz=asText_(r[ch['Тип товара Ozon']-1]);let e=existing[normName_(name)];if(!e){cat.appendRow([name,wb,oz,true,'','','','']);existing[normName_(name)]={row:cat.getLastRow(),values:[name,wb,oz,true,'','','','']};return;}if(!asText_(e.values[1])&&wb){cat.getRange(e.row,2).setValue(wb);e.values[1]=wb;}if(!asText_(e.values[2])&&oz){cat.getRange(e.row,3).setValue(oz);e.values[2]=oz;}});
  syncCategoryMappingIds_();applyCardCategoryValidations_();
}
