/** Ozon: актуальные начисления /v1/finance/accrual/by-day + детализация по отправлениям. */
function loadOzonDashboardFinance_(period,stock){
  const market=emptyDashboardMarket_('Ozon'), types=ozonAccrualTypes_(), postingNumbers={}, accruals=[];
  for(let d=new Date(period.from);d<=period.to;d.setDate(d.getDate()+1)){
    const date=dashboardDateKey_(d), day=ozonAccrualDay_(date);market.rawCount+=day.length;
    day.forEach(a=>{a.__date=new Date(d);accruals.push(a);if(asText_(a.accrued_category).toUpperCase()==='POSTING'&&asText_(a.unit_number))postingNumbers[asText_(a.unit_number)]=true;});
    Utilities.sleep(120);
  }

  // total_amount — финансовый нетто-результат строки начисления Ozon.
  // Используем его как контрольную сумму периода: так учитываются ITEM/NON_ITEM,
  // компенсации, эквайринг и новые типы начислений, даже если Ozon добавит тип в справочник.
  let netAccrued=0, commissionSigned=0, logisticsSigned=0;
  accruals.forEach(a=>{
    netAccrued+=dashboardMoney_(a.total_amount);
    const date=a.__date||period.from, posting=a.posting||{};
    (posting.products||[]).forEach(prod=>{
      const sku=asText_(prod.sku), s=stock.byOzonSku[sku]||null, p=dashboardProduct_(market,sku,s?s.name:('Ozon SKU '+sku),s?s.internalId:'');
      const c=prod.commission||{}, revenue=dashboardMoney_(c.seller_price), saleCommissionSigned=dashboardMoney_(c.sale_commission);
      p._commissionSigned=(p._commissionSigned||0)+saleCommissionSigned;commissionSigned+=saleCommissionSigned;
      ((prod.delivery||{}).services||[]).forEach(f=>{
        const val=dashboardMoney_(f.accrued),bucket=ozonAccrualBucket_(f.type_id,types);
        if(bucket==='logistics'){p._logisticsSigned=(p._logisticsSigned||0)+val;logisticsSigned+=val;}
        else if(bucket==='commission'){p._commissionSigned=(p._commissionSigned||0)+val;commissionSigned+=val;}
        else p._otherSigned=(p._otherSigned||0)+val;
      });
      p.revenue+=revenue;market.revenue+=revenue;
      if(revenue>0&&asText_(a.unit_number))market.checks[asText_(a.unit_number)]=true;
      dashboardSeries_(market,date).revenue+=revenue;
    });
    (((a.item_fees||{}).fees)||[]).forEach(grp=>{
      const sku=asText_(grp.sku), s=stock.byOzonSku[sku]||null, p=dashboardProduct_(market,sku,s?s.name:('Ozon SKU '+sku),s?s.internalId:'');
      (grp.fees||[]).forEach(f=>{
        const val=dashboardMoney_(f.accrued),bucket=ozonAccrualBucket_(f.type_id,types);
        if(bucket==='logistics'){p._logisticsSigned=(p._logisticsSigned||0)+val;logisticsSigned+=val;}
        else if(bucket==='commission'){p._commissionSigned=(p._commissionSigned||0)+val;commissionSigned+=val;}
        else p._otherSigned=(p._otherSigned||0)+val;
      });
    });
  });

  // Количество реализованных/возвращённых товаров берём только из финансовой детализации начислений,
  // а не из FBS/FBO заказов. SaleCommission при продаже обычно отрицателен (удержание),
  // при сторно/возврате — положителен (возврат комиссии).
  const details=ozonAccrualPostings_(Object.keys(postingNumbers));
  details.forEach(pa=>{
    (pa.accruals||[]).forEach(a=>{
      const type=types[String(a.type_id)]||{}, name=(asText_(type.name)+' '+asText_(type.description)).toLowerCase();
      const isSale=Number(a.type_id)===69||/salecommission|комисс(?:ия|ии)?\s+за\s+продаж/.test(name);
      if(!isSale)return;
      const sku=asText_(a.sku), s=stock.byOzonSku[sku]||null, p=dashboardProduct_(market,sku,s?s.name:('Ozon SKU '+sku),s?s.internalId:'');
      const q=Math.max(0,toNumber_(a.quantity)), accrued=dashboardMoney_(a.accrued);
      const sign=accrued>0?-1:1, signedQty=sign*q, signedCogs=signedQty*(s?s.cost:0);
      p.qty+=signedQty;p.cogs+=signedCogs;if(signedQty<0)p.returns+=Math.abs(signedQty);
      market.qty+=signedQty;market.cogs+=signedCogs;if(signedQty<0)market.returns+=Math.abs(signedQty);
      const d=dashboardParseDate_(a.accrual_date)||period.from,ser=dashboardSeries_(market,d);ser.qty+=signedQty;ser.cogs+=signedCogs;
    });
  });

  // Всё, что не относится к выделенной комиссии/логистике, считаем прочими удержаниями нетто.
  // Баланс строится от total_amount, поэтому итог всегда включает новые/неизвестные типы начислений.
  const otherSigned=netAccrued-market.revenue-commissionSigned-logisticsSigned;
  const products=Object.values(market.products), directOtherSigned=products.reduce((sum,p)=>sum+(p._otherSigned||0),0), unallocatedOtherSigned=otherSigned-directOtherSigned;
  const positiveRevenue=products.reduce((sum,p)=>sum+Math.max(0,p.revenue),0);
  if(unallocatedOtherSigned!==0&&products.length){
    products.forEach(p=>{const share=positiveRevenue>0?Math.max(0,p.revenue)/positiveRevenue:1/products.length;p._otherSigned=(p._otherSigned||0)+unallocatedOtherSigned*share;});
  }
  products.forEach(p=>{p.commission=-(p._commissionSigned||0);p.logistics=-(p._logisticsSigned||0);p.other=-(p._otherSigned||0);p.profit=p.revenue+(p._commissionSigned||0)+(p._logisticsSigned||0)+(p._otherSigned||0)-p.cogs;});
  market.commission=-commissionSigned;market.logistics=-logisticsSigned;market.other=-otherSigned;market.profit=netAccrued-market.cogs;
  rebuildOzonSeriesProfit_(market,accruals);
  return market;
}

function ozonAccrualTypes_(){
  const r=ozonRequest_('/v1/finance/accrual/types',{},'Дашборд Ozon: типы начислений').json||{},out={};
  (r.accrual_types||[]).forEach(x=>out[String(x.id)]={name:asText_(x.name),description:asText_(x.description)});return out;
}
function ozonAccrualDay_(date){
  const out=[];let last='';
  for(let page=0;page<200;page++){
    const body={date:date,last_id:last},r=ozonRequest_('/v1/finance/accrual/by-day',body,'Дашборд Ozon: начисления').json||{},rows=r.accruals||[];
    out.push.apply(out,rows);const next=asText_(r.last_id);if(!next||!rows.length||next===last)return out;last=next;Utilities.sleep(120);
  }
  throw new Error('Ozon: превышен защитный лимит страниц начислений за '+date+'.');
}
function ozonAccrualPostings_(numbers){
  const out=[];chunkArray_(numbers,200).forEach(part=>{if(!part.length)return;const r=ozonRequest_('/v1/finance/accrual/postings',{posting_numbers:part},'Дашборд Ozon: детализация продаж').json||{};(r.posting_accruals||[]).forEach(x=>out.push(x));Utilities.sleep(150);});return out;
}
function ozonAccrualBucket_(typeId,types){
  const id=Number(typeId), t=types[String(typeId)]||{}, text=(asText_(t.name)+' '+asText_(t.description)).toLowerCase();
  if([32,29,98].indexOf(id)>=0||/logistic|lastmile|достав|логист/.test(text))return 'logistics';
  if(/commission|комисси/.test(text))return 'commission';
  return 'other';
}
function rebuildOzonSeriesProfit_(market,accruals){
  // Дневная прибыль также строится от total_amount, а затем уменьшается на себестоимость
  // финансово реализованных единиц за этот день.
  const netByDate={};accruals.forEach(a=>{const k=dashboardDateKey_(a.__date);netByDate[k]=(netByDate[k]||0)+dashboardMoney_(a.total_amount);if(!market.series[k])market.series[k]={date:a.__date,revenue:0,profit:0,qty:0,cogs:0};});
  Object.keys(market.series).forEach(k=>{const s=market.series[k];s.profit=(netByDate[k]||0)-(s.cogs||0);});
}
