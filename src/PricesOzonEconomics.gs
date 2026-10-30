/**
 * Актуальная экономика Ozon FBS для расчёта цены.
 * Не используем публичные фиксированные ставки: Seller API возвращает
 * фактический процент по конкретному товару/магазину и диапазон логистики.
 */
function ozExtractPriceExpenses_(x){
  const blocks=[x&&x.commissions,x&&x.comissions,x&&x.price&&x.price.commissions,x&&x.price&&x.price.comissions].filter(v=>v&&typeof v==='object');
  let commissionRate=0,logisticsMin=0,logisticsMax=0,hasCommission=false,hasLogistics=false;

  function absorb_(c){
    if(!c||typeof c!=='object')return;
    const rate=ozPercent_(c.sales_percent_fbs||c.sales_percent_rfbs||c.sales_percent||c.percent||c.commission_percent);
    if(rate>0&&rate<0.95){commissionRate=Math.max(commissionRate,rate);hasCommission=true;}

    const firstMin=Math.max(0,toNumber_(c.fbs_first_mile_min_amount));
    const firstMax=Math.max(firstMin,toNumber_(c.fbs_first_mile_max_amount));
    const directMin=Math.max(0,toNumber_(c.fbs_direct_flow_trans_min_amount));
    const directMax=Math.max(directMin,toNumber_(c.fbs_direct_flow_trans_max_amount));
    const last=Math.max(0,toNumber_(c.fbs_deliv_to_customer_amount));
    const generic=Math.max(0,toNumber_(c.delivery_amount),toNumber_(c.delivery_forward));

    let min=firstMin+directMin+last;
    let max=firstMax+directMax+last;
    if(min<=0&&max<=0&&generic>0){min=generic;max=generic;}
    if(max>0){
      logisticsMin=Math.max(logisticsMin,min);
      logisticsMax=Math.max(logisticsMax,max);
      hasLogistics=true;
    }
  }

  blocks.forEach(raw=>{
    if(Array.isArray(raw)){
      const fbs=raw.filter(c=>/FBS|REAL_FBS/i.test(asText_(c&&c.sale_schema||c&&c.schema)));
      (fbs.length?fbs:raw).forEach(absorb_);
      return;
    }
    absorb_(raw);
    const all=ozCommissionRows_(raw),fbs=all.filter(c=>/FBS|REAL_FBS/i.test(asText_(c.sale_schema||c.schema)));
    (fbs.length?fbs:all).forEach(absorb_);
  });

  return {
    commissionRate:commissionRate,
    logistics:logisticsMax,
    logisticsMin:logisticsMin,
    logisticsMax:logisticsMax,
    hasCommission:hasCommission,
    hasLogistics:hasLogistics
  };
}

function ozonTieredPrice_(requiredNet,econ){
  const rate=Math.max(0,toNumber_(econ&&econ.commissionRate));
  if(!(econ&&econ.hasCommission)||rate<=0||rate>=0.95){
    return {ok:false,error:'НЕТ ФАКТИЧЕСКОЙ КОМИССИИ OZON FBS ИЗ API'};
  }
  const logistics=Math.max(0,toNumber_(econ&&econ.logisticsMax!==undefined?econ.logisticsMax:econ&&econ.logistics));
  const price=requiredPrice_(requiredNet,rate,logistics);
  if(!price)return {ok:false,error:'НЕ УДАЛОСЬ РАССЧИТАТЬ ЦЕНУ OZON ПО ФАКТИЧЕСКИМ ТАРИФАМ API'};
  return {
    ok:true,
    price:price,
    commissionRate:rate,
    band:'по фактическому тарифу Ozon API'
  };
}
