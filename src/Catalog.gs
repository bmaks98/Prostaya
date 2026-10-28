/**
 * Импорт каталогов WB/Ozon и построение единого склада.
 * Источник истины по фактическому остатку — лист «Склад».
 */
function importCatalogs() {
  const useWb = boolText_(getSetting_('Использовать WB','Нет'));
  const useOzon = boolText_(getSetting_('Использовать Ozon','Нет'));
  if (!useWb && !useOzon) throw new Error('В настройках не выбран ни один маркетплейс.');

  const started = Date.now();
  const wb = useWb ? wbFetchCatalog_() : [];
  const ozon = useOzon ? ozonFetchCatalog_() : [];
  const result = rebuildMatchingAndStock_(wb, ozon, {useWb:useWb, useOzon:useOzon});
  logEvent_({regulation:'Импорт каталогов',runType:'Ручной',result:'Успешно',processed:result.processed,success:result.processed,errors:0,duration:Math.round((Date.now()-started)/1000),info:'WB: '+wb.length+', Ozon: '+ozon.length});
  toast_('Каталог обновлён. WB: '+wb.length+', Ozon: '+ozon.length+'.');
  return result;
}

function updateWbCatalog() {
  if (!boolText_(getSetting_('Использовать WB','Нет'))) throw new Error('WB выключен в настройках.');
  const wb = wbFetchCatalog_();
  const ozon = boolText_(getSetting_('Использовать Ozon','Нет')) ? readCatalogSideFromMatching_('Ozon') : [];
  const r = rebuildMatchingAndStock_(wb, ozon, {useWb:true,useOzon:boolText_(getSetting_('Использовать Ozon','Нет'))});
  toast_('Каталог WB обновлён: '+wb.length+' товаров.');
  return r;
}

function updateOzonCatalog() {
  if (!boolText_(getSetting_('Использовать Ozon','Нет'))) throw new Error('Ozon выключен в настройках.');
  const ozon = ozonFetchCatalog_();
  const wb = boolText_(getSetting_('Использовать WB','Нет')) ? readCatalogSideFromMatching_('WB') : [];
  const r = rebuildMatchingAndStock_(wb, ozon, {useWb:boolText_(getSetting_('Использовать WB','Нет')),useOzon:true});
  toast_('Каталог Ozon обновлён: '+ozon.length+' товаров.');
  return r;
}

function wbFetchCatalog_() {
  const all=[];
  let cursor=null;
  let safety=0;
  do {
    const body={settings:{cursor:{limit:100},filter:{withPhoto:-1}}};
    if (cursor && cursor.updatedAt && cursor.nmID) {
      body.settings.cursor.updatedAt=cursor.updatedAt;
      body.settings.cursor.nmID=cursor.nmID;
    }
    const resp=wbContentRequest_('/content/v2/get/cards/list','post',body,'Импорт каталога WB').json || {};
    const data=resp.data || resp;
    const cards=Array.isArray(data.cards) ? data.cards : [];
    cards.forEach(c=>all.push(normalizeWbCard_(c)));
    const next=data.cursor || {};
    if (!cards.length || !next.updatedAt || !next.nmID) break;
    if (cursor && String(next.updatedAt)===String(cursor.updatedAt) && String(next.nmID)===String(cursor.nmID)) break;
    cursor={updatedAt:next.updatedAt,nmID:next.nmID};
    safety++;
  } while (safety<10000);
  return dedupeCatalog_(all,'id');
}

function normalizeWbCard_(c) {
  const barcodes=[], chrtIds=[];
  (c.sizes||[]).forEach(s=>{ const cid=asText_(s.chrtID||s.chrtId); if(cid&&chrtIds.indexOf(cid)<0)chrtIds.push(cid); (s.skus||[]).forEach(x=>{ if(asText_(x)) barcodes.push(asText_(x)); }); });
  const chrtId=chrtIds.length===1?chrtIds[0]:'';
  return {
    marketplace:'WB',
    id:asText_(c.nmID),
    offer:asText_(c.vendorCode),
    name:asText_(c.title),
    barcode:barcodes[0]||'',
    barcodes:Array.from(new Set(barcodes)),
    subject:asText_(c.subjectName),
    chrtId:chrtId,
    sizeCount:chrtIds.length,
    raw:c
  };
}

function ozonFetchCatalog_() {
  const list=[];
  let lastId='';
  let safety=0;
  do {
    const body={filter:{visibility:'ALL'},last_id:lastId,limit:1000};
    const resp=ozonRequest_('/v3/product/list',body,'Импорт каталога Ozon').json || {};
    const result=resp.result || resp;
    const items=Array.isArray(result.items) ? result.items : [];
    items.forEach(x=>list.push({
      marketplace:'Ozon', id:asText_(x.product_id||x.id), offer:asText_(x.offer_id), sku:asText_(x.sku), name:'', barcode:'', barcodes:[], raw:x
    }));
    const next=asText_(result.last_id||resp.last_id);
    if (!items.length || !next || next===lastId) break;
    lastId=next;
    safety++;
  } while (safety<10000);

  const unique=dedupeCatalog_(list,'id');
  const byId={}; unique.forEach(x=>{ if(x.id) byId[x.id]=x; });
  const ids=unique.map(x=>x.id).filter(Boolean);
  for (let i=0;i<ids.length;i+=1000) {
    const batch=ids.slice(i,i+1000);
    const resp=ozonRequest_('/v3/products/info/attributes',{filter:{product_id:batch},limit:1000},'Атрибуты товаров Ozon').json || {};
    const attrs=Array.isArray(resp.result) ? resp.result : (resp.result && Array.isArray(resp.result.items) ? resp.result.items : []);
    attrs.forEach(a=>{
      const id=asText_(a.id||a.product_id);
      const row=byId[id]; if(!row) return;
      row.name=asText_(a.name)||row.name;
      const bc=[];
      if(asText_(a.barcode)) bc.push(asText_(a.barcode));
      (a.barcodes||[]).forEach(x=>{ const v=typeof x==='object' ? asText_(x.barcode||x.value) : asText_(x); if(v) bc.push(v); });
      row.barcodes=Array.from(new Set(bc)); row.barcode=row.barcodes[0]||'';
      row.descriptionCategoryId=asText_(a.description_category_id);
      row.typeId=asText_(a.type_id);
      row.rawAttributes=a;
    });
  }
  return unique;
}

function dedupeCatalog_(arr,key) {
  const seen={}; const out=[];
  arr.forEach(x=>{ const k=asText_(x[key]); if(!k || seen[k]) return; seen[k]=true; out.push(x); });
  return out;
}

function readCatalogSideFromMatching_(side) {
  const sh=sheet_(APP.SHEETS.MATCHING); if(sh.getLastRow()<=1) return [];
  const h=findHeaderMap_(sh); const rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  const out=[]; const seen={};
  rows.forEach(r=>{
    if(side==='WB') {
      const id=asText_(r[h['WB NMID']-1]); if(!id || seen[id]) return; seen[id]=1;
      out.push({marketplace:'WB',id:id,offer:asText_(r[h['WB артикул']-1]),name:asText_(r[h['WB наименование']-1]),barcode:asText_(r[h['WB штрихкод']-1]),barcodes:[asText_(r[h['WB штрихкод']-1])].filter(Boolean)});
    } else {
      const id=asText_(r[h['Ozon Product ID']-1]); if(!id || seen[id]) return; seen[id]=1;
      out.push({marketplace:'Ozon',id:id,offer:asText_(r[h['Ozon Offer ID']-1]),name:asText_(r[h['Ozon наименование']-1]),barcode:asText_(r[h['Ozon штрихкод']-1]),barcodes:[asText_(r[h['Ozon штрихкод']-1])].filter(Boolean)});
    }
  });
  return out;
}
