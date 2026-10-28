/** Автосопоставление: артикул -> штрихкод -> название. */
function runMatching() {
  const wb=readCatalogSideFromMatching_('WB');
  const ozon=readCatalogSideFromMatching_('Ozon');
  const r=rebuildMatchingAndStock_(wb,ozon,{useWb:boolText_(getSetting_('Использовать WB','Нет')),useOzon:boolText_(getSetting_('Использовать Ozon','Нет'))});
  toast_('Сопоставление обновлено.');
  return r;
}

function rebuildMatchingAndStock_(wb,ozon,opts) {
  const existing=readExistingMatchingState_();
  const matches=matchCatalogs_(wb||[],ozon||[],existing);
  writeMatching_(matches);
  writeStockFromMatches_(matches,existing.stockByInternalId||{});
  return {processed:matches.length,success:matches.filter(x=>x.status!=='Требует проверки').length,errors:matches.filter(x=>x.status==='Требует проверки').length};
}

function matchCatalogs_(wb,ozon,existing) {
  const usedOzon={}; const result=[];
  const ozByOffer=uniqueIndex_(ozon,x=>normKey_(x.offer));
  const ozByBarcode=multiIndex_(ozon,x=>(x.barcodes&&x.barcodes.length?x.barcodes:[x.barcode]).map(normBarcode_).filter(Boolean));
  const ozByName=uniqueIndex_(ozon,x=>normName_(x.name));

  wb.forEach(w=>{
    let o=null, foundBy='', ambiguous=false;
    const preserved=existing.manualByWbId[w.id];
    if(preserved && preserved.ozonId) {
      o=ozon.find(x=>x.id===preserved.ozonId)||null;
      if(o && !usedOzon[o.id]) foundBy='Ручное подтверждение'; else o=null;
    }
    if(!o && w.offer) {
      const cand=ozByOffer[normKey_(w.offer)];
      if(cand && !usedOzon[cand.id]) {o=cand;foundBy='Артикул';}
    }
    if(!o) {
      const ids={};
      (w.barcodes&&w.barcodes.length?w.barcodes:[w.barcode]).map(normBarcode_).filter(Boolean).forEach(b=>(ozByBarcode[b]||[]).forEach(c=>{if(!usedOzon[c.id]) ids[c.id]=c;}));
      const vals=Object.keys(ids).map(k=>ids[k]);
      if(vals.length===1){o=vals[0];foundBy='Штрихкод';}
      else if(vals.length>1) ambiguous=true;
    }
    if(!o && !ambiguous && w.name) {
      const cand=ozByName[normName_(w.name)];
      if(cand && !usedOzon[cand.id]) {o=cand;foundBy='Название';}
    }
    if(o) usedOzon[o.id]=true;
    const prevId=findExistingInternalId_(existing,w,o);
    result.push(makeMatch_(prevId||uuid_(),w,o,ambiguous?'Требует проверки':(o?'Сопоставлен':'Только WB'),foundBy,!!(preserved&&o&&preserved.ozonId===o.id)));
  });

  ozon.forEach(o=>{
    if(usedOzon[o.id]) return;
    const prevId=findExistingInternalId_(existing,null,o);
    result.push(makeMatch_(prevId||uuid_(),null,o,'Только Ozon','',false));
  });
  return result;
}

function makeMatch_(internalId,w,o,status,foundBy,manual) {
  return {internalId:internalId,wb:w||null,ozon:o||null,status:status,foundBy:foundBy||'',manual:manual||false,confidence:foundBy==='Артикул'?'Высокая':foundBy==='Штрихкод'?'Высокая':foundBy==='Название'?'Средняя':foundBy==='Ручное подтверждение'?'Подтверждено':''};
}

function uniqueIndex_(arr,keyFn){ const temp={}; arr.forEach(x=>{const k=keyFn(x);if(!k)return;if(!temp[k])temp[k]=[];temp[k].push(x);}); const out={}; Object.keys(temp).forEach(k=>{if(temp[k].length===1)out[k]=temp[k][0];}); return out; }
function multiIndex_(arr,keysFn){ const out={}; arr.forEach(x=>{const keys=keysFn(x)||[]; keys.forEach(k=>{if(!out[k])out[k]=[];out[k].push(x);});}); return out; }
function normKey_(s){return asText_(s).toLowerCase().replace(/\s+/g,'');}
function normBarcode_(s){return asText_(s).replace(/\s+/g,'');}
function normName_(s){return asText_(s).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').replace(/\s+/g,' ').trim();}

function readExistingMatchingState_(){
  const out={internalByWbId:{},internalByOzonId:{},manualByWbId:{},stockByInternalId:{}};
  const m=sheet_(APP.SHEETS.MATCHING); if(m.getLastRow()>1){const h=findHeaderMap_(m);m.getRange(2,1,m.getLastRow()-1,m.getLastColumn()).getValues().forEach(r=>{const iid=asText_(r[h['Внутренний ID']-1]),wid=asText_(r[h['WB NMID']-1]),oid=asText_(r[h['Ozon Product ID']-1]);if(wid)out.internalByWbId[wid]=iid;if(oid)out.internalByOzonId[oid]=iid;if(wid&&r[h['Подтверждено вручную']-1]===true)out.manualByWbId[wid]={internalId:iid,ozonId:oid};});}
  const s=sheet_(APP.SHEETS.STOCK); if(s.getLastRow()>1){const h=findHeaderMap_(s);s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues().forEach(r=>{const iid=asText_(r[h['Внутренний ID']-1]);if(!iid)return;const o={};Object.keys(h).forEach(k=>o[k]=r[h[k]-1]);out.stockByInternalId[iid]=o;});}
  return out;
}
function findExistingInternalId_(existing,w,o){return (w&&existing.internalByWbId[w.id])||(o&&existing.internalByOzonId[o.id])||'';}

function writeMatching_(matches){
  const sh=sheet_(APP.SHEETS.MATCHING), headers=SHEET_SCHEMAS[APP.SHEETS.MATCHING];
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  const rows=matches.map(m=>[m.internalId,m.wb?m.wb.id:'',m.wb?m.wb.offer:'',m.wb?m.wb.name:'',m.wb?m.wb.barcode:'',m.ozon?m.ozon.id:'',m.ozon?m.ozon.offer:'',m.ozon?m.ozon.name:'',m.ozon?m.ozon.barcode:'',m.foundBy,m.confidence,m.status,m.manual,'']);
  if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}

function writeStockFromMatches_(matches,old){
  const sh=sheet_(APP.SHEETS.STOCK), headers=SHEET_SCHEMAS[APP.SHEETS.STOCK];
  const rows=matches.map(m=>{
    const hasPrev=Object.prototype.hasOwnProperty.call(old,m.internalId); const prev=old[m.internalId]||{}; const w=m.wb,o=m.ozon; const name=w&&w.name?w.name:(o&&o.name?o.name:''); const source=w&&w.name?'WB':(o&&o.name?'Ozon':'');
    const stockValue=hasPrev ? prev['Фактический остаток'] : '';
    const wbCodes=w ? ((w.barcodes&&w.barcodes.length)?w.barcodes.join(', '):(prev['WB SKU / barcode']||w.barcode||'')) : '';
    const ozSku=o ? (o.sku||prev['Ozon SKU']||'') : '';
    return [m.internalId,name,prev['Категория']||'',w&&w.offer?w.offer:(o&&o.offer?o.offer:''),w&&w.barcode?w.barcode:(o&&o.barcode?o.barcode:''),prev['Себестоимость']||'',stockValue,prev['Срок поставки, дней']||'',prev['Запас, дней']||'',prev['Маржинальность товара, %']||'',prev['Используемая маржинальность, %']||'',!!w,w?w.id:'',w?w.offer:'',wbCodes,!!o,o?o.id:'',o?o.offer:'',ozSku,m.status,source,prev['Последнее движение']||'',now_(),w?(w.chrtId||prev['WB chrtId (служебно)']||''):(prev['WB chrtId (служебно)']||'')];
  });
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}
