function processWbOrders(){
  if(!boolText_(getSetting_('Использовать WB','Нет'))) return {processed:0,success:0,errors:0};
  const lock=LockService.getScriptLock(); if(!lock.tryLock(5000)) throw new Error('Склад занят другим регламентом.');
  let changed=0,errors=0,processed=0;
  try{
    const selected=selectedWarehouse_('WB');
    const r=wbMarketplaceRequest_('/api/v3/orders/new','get',undefined,'Заказы WB').json||{};
    const orders=Array.isArray(r.orders)?r.orders:[];
    const ledger=orderLedgerState_();
    orders.forEach(o=>{
      if(asText_(o.warehouseId)!==selected.id) return;
      const key=ledgerKey_('WB',o.id,o.id), existing=ledger.byKey[key]; if(existing&&existing.deducted) return;
      processed++;
      try{
        const stock=findStockForWbOrder_(o); if(!stock) throw new Error('Товар WB не найден на общем складе: nmId '+asText_(o.nmId)+', артикул '+asText_(o.article));
        changePhysicalStock_(stock.row,-1,'Заказ WB '+asText_(o.id));
        writeOrderLedger_(existing&&existing.row,{marketplace:'WB',orderId:asText_(o.id),itemId:asText_(o.id),internalId:stock.internalId,article:stock.article,qty:1,date:o.createdAt||now_(),status:'new|waiting',deducted:true,deductedAt:now_(),cancelled:false,returned:0,lastCheck:now_(),error:''});
        changed++;
      }catch(e){errors++; writeOrderLedger_(existing&&existing.row,{marketplace:'WB',orderId:asText_(o.id),itemId:asText_(o.id),internalId:'',article:asText_(o.article),qty:1,date:o.createdAt||now_(),status:'Ошибка',deducted:false,cancelled:false,returned:0,lastCheck:now_(),error:e.message}); notify_({level:'Критическая ошибка',type:'Не удалось списать заказ WB',marketplace:'WB',object:asText_(o.id),message:e.message});}
    });
    changed+=refreshWbTrackedStatuses_();
  } finally { lock.releaseLock(); }
  if(changed) maybeAutoSyncStocks_();
  return {processed:processed,success:Math.max(0,processed-errors),errors:errors};
}

function refreshWbTrackedStatuses_(){
  const sh=sheet_(APP.SHEETS.ORDER_LOG); if(sh.getLastRow()<=1) return 0;
  const h=findHeaderMap_(sh), rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  const targets=[];
  rows.forEach((r,i)=>{ if(asText_(r[h['Маркетплейс']-1])!=='WB')return; if(r[h['Списано со склада']-1]!==true)return; if(Number(r[h['Количество возвращено']-1]||0)>0)return; const st=asText_(r[h['Текущий статус']-1]); if(wbStatusIsFinal_(st))return; targets.push({row:i+2,id:asText_(r[h['ID заказа']-1]),qty:Number(r[h['Количество']-1]||1),internalId:asText_(r[h['Внутренний ID товара']-1]),prevStatus:st}); });
  let changed=0;
  for(let i=0;i<targets.length;i+=1000){
    const batch=targets.slice(i,i+1000); if(!batch.length)continue;
    const ids=batch.map(x=>Number(x.id)); if(ids.some(x=>!Number.isSafeInteger(x))) throw new Error('WB: ID заказа не помещается в безопасное число JavaScript.');
    const r=wbMarketplaceRequest_('/api/v3/orders/status','post',{orders:ids},'Статусы заказов WB').json||{};
    const statuses={}; (r.orders||[]).forEach(x=>statuses[asText_(x.id)]=x);
    batch.forEach(t=>{ const s=statuses[t.id]; if(!s)return; const status=asText_(s.supplierStatus)+'|'+asText_(s.wbStatus); sh.getRange(t.row,h['Текущий статус']).setValue(status); sh.getRange(t.row,h['Последняя проверка']).setValue(now_()); if(wbStatusCancelled_(s) && !wbStatusWasShipped_(t.prevStatus)){ const stock=findStockByInternalId_(t.internalId); if(stock){changePhysicalStock_(stock.row,t.qty,'Отмена WB '+t.id); sh.getRange(t.row,h['Отменён до отправки']).setValue(true); sh.getRange(t.row,h['Количество возвращено']).setValue(t.qty); sh.getRange(t.row,h['Дата возврата']).setValue(now_()); changed+=t.qty;} } });
  }
  return changed;
}
function wbStatusCancelled_(s){return ['cancel','cancel_carrier'].indexOf(asText_(s.supplierStatus))>=0||['canceled','canceled_by_client','declined_by_client','defect','canceled_by_carrier'].indexOf(asText_(s.wbStatus))>=0;}
function wbStatusWasShipped_(st){const p=String(st||'').split('|');return p[0]==='complete'||['sorted','sold','ready_for_pickup','postponed_delivery','accepted_by_carrier','sent_to_carrier'].indexOf(p[1])>=0;}
function wbStatusIsFinal_(st){const p=String(st||'').split('|');return ['sold','canceled','canceled_by_client','declined_by_client','defect','canceled_by_carrier'].indexOf(p[1])>=0;}

function processOzonOrders(){
  if(!boolText_(getSetting_('Использовать Ozon','Нет'))) return {processed:0,success:0,errors:0};
  const lock=LockService.getScriptLock(); if(!lock.tryLock(5000)) throw new Error('Склад занят другим регламентом.');
  let changed=0,processed=0,errors=0;
  try{
    const selected=selectedWarehouse_('Ozon');
    const postings=ozonRecentFbsPostings_(selected.id);
    const ledger=orderLedgerState_();
    const currentByPosting={}; postings.forEach(p=>currentByPosting[asText_(p.posting_number)]=p);
    postings.filter(p=>asText_(p.status)==='awaiting_packaging').forEach(p=>{
      (p.products||[]).forEach((prod,idx)=>{
        const itemId=asText_(prod.offer_id)||asText_(prod.sku)||String(idx); const key=ledgerKey_('Ozon',p.posting_number,itemId), existing=ledger.byKey[key]; if(existing&&existing.deducted) return;
        processed++; const qty=Math.max(1,Number(prod.quantity||1));
        try{ const stock=findStockForOzonProduct_(prod); if(!stock)throw new Error('Товар Ozon не найден на общем складе: '+itemId); changePhysicalStock_(stock.row,-qty,'Заказ Ozon '+asText_(p.posting_number)); writeOrderLedger_(existing&&existing.row,{marketplace:'Ozon',orderId:asText_(p.posting_number),itemId:itemId,internalId:stock.internalId,article:stock.article,qty:qty,date:p.in_process_at||p.created_at||now_(),status:'awaiting_packaging',deducted:true,deductedAt:now_(),cancelled:false,returned:0,lastCheck:now_(),error:''}); changed+=qty; }
        catch(e){errors++;writeOrderLedger_(existing&&existing.row,{marketplace:'Ozon',orderId:asText_(p.posting_number),itemId:itemId,internalId:'',article:asText_(prod.offer_id),qty:qty,date:p.in_process_at||p.created_at||now_(),status:'Ошибка',deducted:false,cancelled:false,returned:0,lastCheck:now_(),error:e.message});notify_({level:'Критическая ошибка',type:'Не удалось списать заказ Ozon',marketplace:'Ozon',object:asText_(p.posting_number),message:e.message});}
      });
    });
    changed+=refreshOzonTrackedStatuses_(currentByPosting);
  } finally { lock.releaseLock(); }
  if(changed) maybeAutoSyncStocks_();
  return {processed:processed,success:Math.max(0,processed-errors),errors:errors};
}

function ozonRecentFbsPostings_(warehouseId){
  const since=new Date(Date.now()-30*86400000).toISOString(), to=new Date(Date.now()+86400000).toISOString(); const all=[]; let offset=0;
  for(let page=0;page<100;page++){
    const filter={since:since,to:to}; if(warehouseId) filter.warehouse_id=[Number(warehouseId)];
    const r=ozonRequest_('/v3/posting/fbs/list',{dir:'ASC',filter:filter,with:{analytics_data:true},limit:500,offset:offset},'Заказы Ozon').json||{};
    const result=r.result||r, posts=Array.isArray(result.postings)?result.postings:[]; all.push.apply(all,posts); if(posts.length<500)break; offset+=posts.length;
  }
  return all;
}

function refreshOzonTrackedStatuses_(byPosting){
  const sh=sheet_(APP.SHEETS.ORDER_LOG); if(sh.getLastRow()<=1)return 0; const h=findHeaderMap_(sh), rows=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(); let changed=0;
  rows.forEach((r,i)=>{ if(asText_(r[h['Маркетплейс']-1])!=='Ozon'||r[h['Списано со склада']-1]!==true||Number(r[h['Количество возвращено']-1]||0)>0)return; const posting=byPosting[asText_(r[h['ID заказа']-1])]; if(!posting)return; const status=asText_(posting.status), prev=asText_(r[h['Текущий статус']-1]); sh.getRange(i+2,h['Текущий статус']).setValue(status); sh.getRange(i+2,h['Последняя проверка']).setValue(now_()); if(status==='cancelled' && ['awaiting_packaging','awaiting_deliver'].indexOf(prev)>=0){ const stock=findStockByInternalId_(asText_(r[h['Внутренний ID товара']-1])); const qty=Number(r[h['Количество']-1]||0); if(stock&&qty>0){changePhysicalStock_(stock.row,qty,'Отмена Ozon '+asText_(r[h['ID заказа']-1])); sh.getRange(i+2,h['Отменён до отправки']).setValue(true); sh.getRange(i+2,h['Количество возвращено']).setValue(qty); sh.getRange(i+2,h['Дата возврата']).setValue(now_()); changed+=qty;} } });
  return changed;
}

function orderLedgerState_(){ const sh=sheet_(APP.SHEETS.ORDER_LOG), out={byKey:{}}; if(sh.getLastRow()<=1)return out; const h=findHeaderMap_(sh); sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{out.byKey[ledgerKey_(r[h['Маркетплейс']-1],r[h['ID заказа']-1],r[h['ID позиции заказа']-1])]={row:i+2,deducted:r[h['Списано со склада']-1]===true};}); return out; }
function ledgerKey_(m,o,i){return asText_(m)+'|'+asText_(o)+'|'+asText_(i);}
function writeOrderLedger_(row,x){ const sh=sheet_(APP.SHEETS.ORDER_LOG), values=[x.marketplace,x.orderId,x.itemId,x.internalId,x.article,x.qty,x.date,x.status,!!x.deducted,x.deductedAt||'',!!x.cancelled,x.returned||0,x.returnedAt||'',x.lastCheck||now_(),x.error||'']; if(row)sh.getRange(row,1,1,values.length).setValues([values]);else sh.appendRow(values); }

function stockIndex_(){ const sh=sheet_(APP.SHEETS.STOCK), out={rows:{},wbNm:{},wbArticle:{},wbBarcode:{},ozOffer:{},ozSku:{}}; if(sh.getLastRow()<=1)return out; const h=findHeaderMap_(sh); sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().forEach((r,i)=>{const row=i+2, iid=asText_(r[h['Внутренний ID']-1]); const o={row:row,internalId:iid,article:asText_(r[h['Артикул основной']-1])}; if(iid){out.rows[iid]=o;} const nm=asText_(r[h['WB NMID']-1]);if(nm)out.wbNm[nm]=o;const a=asText_(r[h['WB артикул']-1]);if(a)out.wbArticle[normKey_(a)]=o; asText_(r[h['WB SKU / barcode']-1]).split(',').map(normBarcode_).filter(Boolean).forEach(b=>out.wbBarcode[b]=o); const off=asText_(r[h['Ozon Offer ID']-1]);if(off)out.ozOffer[normKey_(off)]=o;const sku=asText_(r[h['Ozon SKU']-1]);if(sku)out.ozSku[sku]=o;}); return out; }
function findStockByInternalId_(id){return stockIndex_().rows[asText_(id)]||null;}
function findStockForWbOrder_(o){const x=stockIndex_();return x.wbNm[asText_(o.nmId)]||x.wbArticle[normKey_(o.article)]||((o.skus||[]).map(normBarcode_).map(b=>x.wbBarcode[b]).find(Boolean))||null;}
function findStockForOzonProduct_(p){const x=stockIndex_();return x.ozOffer[normKey_(p.offer_id)]||x.ozSku[asText_(p.sku)]||null;}
function changePhysicalStock_(row,delta,reason){ const sh=sheet_(APP.SHEETS.STOCK), h=findHeaderMap_(sh), c=h['Фактический остаток']; const cell=sh.getRange(row,c), raw=cell.getValue(); if(raw===''||raw===null)throw new Error('Не заполнен фактический остаток для строки '+row+'.'); const old=Number(raw); if(!Number.isFinite(old))throw new Error('Некорректный фактический остаток в строке '+row+'.'); const next=old+Number(delta); cell.setValue(next); sh.getRange(row,h['Последнее движение']).setValue(now_()); if(next<0)notify_({level:'Критическая ошибка',type:'Отрицательный остаток',object:asText_(sh.getRange(row,h['Наименование']).getValue()),message:reason+': остаток стал '+next}); return next; }
function maybeAutoSyncStocks_(){ if(boolText_(getSetting_('Автоматическая отправка остатков','Выкл'))&&boolText_(getSetting_(APP.SAFE_GUARDS.SEND_STOCKS,'Нет'))) syncStocks(); }
