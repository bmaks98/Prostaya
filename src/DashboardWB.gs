/** WB: актуальный Finance API с пагинацией rrdId. */
function loadWbDashboardFinance_(period,stock){
  const market=emptyDashboardMarket_('WB'), rows=wbFetchFinanceRows_(period);market.rawCount=rows.length;
  rows.forEach(x=>{
    const doc=asText_(x.docTypeName||x.doc_type_name), oper=asText_(x.sellerOperName||x.supplier_oper_name), text=(doc+' '+oper).toLowerCase();
    const isReturn=/возврат|return/.test(text), isSale=/продаж|sale|возврат|return/.test(doc.toLowerCase());
    const qtyRaw=toNumber_(x.quantity), qty=isSale?(isReturn?-Math.abs(qtyRaw):Math.abs(qtyRaw)):0;
    const gross=dashboardSigned_(dashboardMoney_(x.retailAmount!==undefined?x.retailAmount:x.retail_amount),isReturn,isSale);
    const forPay=dashboardSigned_(dashboardMoney_(x.forPay!==undefined?x.forPay:x.ppvz_for_pay),isReturn,isSale);
    const delivery=dashboardMoney_(x.deliveryService!==undefined?x.deliveryService:x.delivery_rub);
    const storage=dashboardMoney_(x.paidStorage!==undefined?x.paidStorage:x.storage_fee);
    const acceptance=dashboardMoney_(x.paidAcceptance!==undefined?x.paidAcceptance:x.acceptance);
    const penalty=dashboardMoney_(x.penalty), deduction=dashboardMoney_(x.deduction);
    const additional=dashboardMoney_(x.additionalPayment!==undefined?x.additionalPayment:x.additional_payment)+dashboardMoney_(x.cashbackDiscount!==undefined?x.cashbackDiscount:x.cashback_discount);
    const otherRaw=dashboardMoney_(x.rebillLogisticCost!==undefined?x.rebillLogisticCost:x.rebill_logistic_cost)+dashboardMoney_(x.cashbackAmount!==undefined?x.cashbackAmount:x.cashback_amount)+dashboardMoney_(x.cashbackCommissionChange!==undefined?x.cashbackCommissionChange:x.cashback_commission_change)+dashboardMoney_(x.paymentSchedule!==undefined?x.paymentSchedule:x.payment_schedule);
    const nm=asText_(x.nmId!==undefined?x.nmId:x.nm_id), article=asText_(x.vendorCode!==undefined?x.vendorCode:x.sa_name);
    const s=stock.byWbNm[nm]||stock.byWbArticle[normKey_(article)]||null, cost=s?s.cost:0;
    const cogs=qty*cost, commission=isSale?gross-forPay:0;
    const other=storage+acceptance+penalty+deduction+otherRaw-additional;
    const sellerNet=forPay-delivery-other;
    const profit=sellerNet-cogs;
    const date=dashboardWbRowDate_(x,period.from);
    if(qty>0){const checkId=asText_(x.srid||x.saleId||x.sale_id||x.rrdId||x.rrd_id);if(checkId)market.checks[checkId]=true;}
    const p=dashboardProduct_(market,nm||article,s?s.name:(asText_(x.title)||article||('WB '+nm)),s?s.internalId:'');
    p.revenue+=gross;p.qty+=qty;p.cogs+=cogs;p.commission+=commission;p.logistics+=delivery;p.other+=other;p.profit+=profit;if(qty<0)p.returns+=Math.abs(qty);
    market.revenue+=gross;market.qty+=qty;market.cogs+=cogs;market.commission+=commission;market.logistics+=delivery;market.other+=other;market.profit+=profit;if(qty<0)market.returns+=Math.abs(qty);
    const d=dashboardSeries_(market,date);d.revenue+=gross;d.profit+=profit;d.qty+=qty;d.cogs+=cogs;
  });
  return market;
}
function dashboardSigned_(amount,isReturn,isSale){if(!isSale)return amount;return isReturn?-Math.abs(amount):Math.abs(amount);}
function dashboardWbRowDate_(x,fallback){const v=x.rrDate||x.rr_dt||x.saleDt||x.sale_dt||x.createDate||x.create_dt;const d=dashboardParseDate_(v);return d||fallback;}
function wbFetchFinanceRows_(period){
  const all=[],seen={},limit=100000;let rrdId=0;
  for(let page=0;page<20;page++){
    const body={dateFrom:dashboardDateKey_(period.from),dateTo:dashboardDateKey_(period.to),rrdId:rrdId,limit:limit};
    const resp=wbFinanceRequest_('/api/finance/v1/sales-reports/detailed','post',body,'Дашборд WB');
    if(resp.code===204||!resp.text)return all;
    const json=resp.json, batch=Array.isArray(json)?json:(Array.isArray(json&&json.data)?json.data:[]);
    batch.forEach(x=>{const id=asText_(x.rrdId!==undefined?x.rrdId:x.rrd_id);if(id&&seen[id])return;if(id)seen[id]=1;all.push(x);});
    if(batch.length<limit)return all;
    const last=batch[batch.length-1],next=toNumber_(last.rrdId!==undefined?last.rrdId:last.rrd_id);
    if(!next||next===rrdId)throw new Error('WB вернул неполный финансовый отчёт без корректного rrdId.');
    rrdId=next;
  }
  throw new Error('WB: превышен защитный лимит 20 страниц финансового отчёта.');
}
