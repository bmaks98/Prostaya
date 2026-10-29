function writeDashboard_(period,wb,oz,total,stock,errors){
  const sh=sheet_(APP.SHEETS.DASHBOARD);ensureDashboardLayout_();
  sh.getRange('B4').setValue(period.from).setNumberFormat('dd.mm.yyyy');sh.getRange('B5').setValue(period.to).setNumberFormat('dd.mm.yyyy');
  let statusText='Данные загружены успешно';
  if(errors.length) statusText=errors.join(' | ');
  else {
    const notes=[];
    if(boolText_(getSetting_('Использовать WB','Нет')) && (wb.rawCount||0)===0) notes.push('WB: финансовых данных за период не найдено');
    if(boolText_(getSetting_('Использовать Ozon','Нет')) && (oz.rawCount||0)===0) notes.push('Ozon: финансовых начислений за период не найдено');
    if(notes.length) statusText=notes.join(' | ');
  }
  sh.getRange('D3').setValue('Последнее обновление');sh.getRange('D4').setValue(now_()).setNumberFormat('dd.mm.yyyy hh:mm');sh.getRange('D5').setValue(statusText);
  const wm=dashboardMetrics_(wb,stock),om=dashboardMetrics_(oz,stock),tm=dashboardMetrics_(total,stock),data=[];for(let i=0;i<12;i++)data.push([wm[i],om[i],tm[i]]);
  sh.getRange(8,2,12,3).setValues(data);sh.getRange('B8:D8').setNumberFormat('#,##0.00');sh.getRange('B9:D9').setNumberFormat('#,##0');sh.getRange('B10:D14').setNumberFormat('#,##0.00');sh.getRange('B15:D15').setNumberFormat('0.0%');sh.getRange('B16:D16').setNumberFormat('#,##0.00');sh.getRange('B17:D17').setNumberFormat('#,##0');sh.getRange('B18:D18').setNumberFormat('#,##0.00');sh.getRange('B19:D19').setNumberFormat('#,##0');
  const seriesCount=writeDashboardSeries_(sh,period,wb,oz,total), productStart=Math.max(40,25+seriesCount);writeDashboardProducts_(sh,wb,oz,total,stock,productStart);buildDashboardCharts_(sh,seriesCount);
}
function ensureDashboardLayout_(){
  const sh=sheet_(APP.SHEETS.DASHBOARD);
  sh.getRange('A1:D1').breakApart().merge().setValue('Дашборд WB / Ozon / Общий').setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center').setBackground(APP.COLORS.HEADER);
  sh.getRange('A3:B5').setValues([['Период','Значение'],['Дата начала',sh.getRange('B4').getValue()],['Дата окончания',sh.getRange('B5').getValue()]]);styleHeaderAt_(sh,3,2);
  sh.getRange('A7:D7').setValues([['Показатель','WB','Ozon','Общий']]);styleHeaderAt_(sh,7,4);
  const metrics=['Выручка','Реализовано, шт.','Себестоимость','Комиссии','Логистика','Прочие удержания','Чистая прибыль','Маржинальность к себестоимости, %','Средний чек','Возвраты, шт.','Стоимость текущего склада','Остаток, шт.'];
  sh.getRange(8,1,metrics.length,1).setValues(metrics.map(x=>[x]));
  sh.getRange('A22:I500').breakApart().clearContent();
}
function writeDashboardSeries_(sh,period,wb,oz,total){
  const monthly=period.days>=31, keys={};[wb,oz,total].forEach(m=>Object.keys(m.series).forEach(k=>{const d=m.series[k].date,group=monthly?dashboardMonthKey_(d):dashboardDateKey_(d);keys[group]=true;}));
  const groups=Object.keys(keys).sort(),agg={WB:{},Ozon:{},'Общий':{}};
  [[wb,'WB'],[oz,'Ozon'],[total,'Общий']].forEach(pair=>{Object.keys(pair[0].series).forEach(k=>{const x=pair[0].series[k],g=monthly?dashboardMonthKey_(x.date):dashboardDateKey_(x.date),a=agg[pair[1]][g]||(agg[pair[1]][g]={revenue:0,profit:0,qty:0,cogs:0});a.revenue+=x.revenue||0;a.profit+=x.profit||0;a.qty+=x.qty||0;a.cogs+=x.cogs||0;});});
  sh.getRange(22,1,1,9).setValues([[monthly?'Месяц':'Дата','Выручка WB','Выручка Ozon','Прибыль WB','Прибыль Ozon','Реализовано WB','Реализовано Ozon','Маржинальность WB','Маржинальность Ozon']]);styleHeaderAt_(sh,22,9);
  const rows=groups.map(g=>{const w=agg.WB[g]||{},o=agg.Ozon[g]||{};return [monthly?g:new Date(g+'T00:00:00'),w.revenue||0,o.revenue||0,w.profit||0,o.profit||0,w.qty||0,o.qty||0,(w.cogs?((w.profit||0)/Math.abs(w.cogs)):0),(o.cogs?((o.profit||0)/Math.abs(o.cogs)):0)];});
  if(rows.length)sh.getRange(23,1,rows.length,9).setValues(rows);if(!monthly&&rows.length)sh.getRange(23,1,rows.length,1).setNumberFormat('dd.mm.yyyy');sh.getRange(23,2,Math.max(1,rows.length),4).setNumberFormat('#,##0.00');sh.getRange(23,8,Math.max(1,rows.length),2).setNumberFormat('0.0%');return rows.length;
}
function dashboardProductRows_(market){return Object.values(market.products||{}).map(p=>[p.marketplace,p.name,p.revenue,p.qty,p.cogs,p.profit,p.cogs?p.profit/p.cogs:0]);}
function writeDashboardProducts_(sh,wb,oz,total,stock,startRow){
  const all=dashboardProductRows_(total), byRevenue=all.slice().sort((a,b)=>b[2]-a[2]).slice(0,10), byProfit=all.slice().sort((a,b)=>b[5]-a[5]).slice(0,10), byQty=all.slice().sort((a,b)=>b[3]-a[3]).slice(0,10), low=all.filter(r=>r[4]>0).sort((a,b)=>a[6]-b[6]).slice(0,10);
  const r1=startRow||40,r2=r1+13,r3=r2+13,r4=r3+13,r5=r4+13;writeDashboardProductBlock_(sh,r1,'ТОП-10 по выручке',byRevenue);writeDashboardProductBlock_(sh,r2,'ТОП-10 по чистой прибыли',byProfit);writeDashboardProductBlock_(sh,r3,'ТОП-10 по реализованному количеству',byQty);writeDashboardProductBlock_(sh,r4,'Низкая маржинальность',low);
  const sold={};Object.values(total.products).forEach(p=>{if(p.internalId&&(Math.abs(p.qty)>0||Math.abs(p.revenue)>0))sold[p.internalId]=true;});const noSales=stock.rows.filter(x=>!sold[x.internalId]).slice(0,30).map(x=>[(x.wbNm&&x.ozOffer)?'WB + Ozon':(x.wbNm?'WB':'Ozon'),x.name,0,0,0,0,0]);writeDashboardProductBlock_(sh,r5,'Нет продаж за выбранный период',noSales);
}
function writeDashboardProductBlock_(sh,row,title,rows){sh.getRange(row,1,1,7).merge().setValue(title).setFontWeight('bold').setBackground(APP.COLORS.SECTION);sh.getRange(row+1,1,1,7).setValues([['Маркетплейс','Товар','Выручка','Количество','Себестоимость','Прибыль','Маржинальность']]);styleHeaderAt_(sh,row+1,7);if(rows.length)sh.getRange(row+2,1,rows.length,7).setValues(rows);sh.getRange(row+2,3,Math.max(1,rows.length),4).setNumberFormat('#,##0.00');sh.getRange(row+2,7,Math.max(1,rows.length),1).setNumberFormat('0.0%');}
function buildDashboardCharts_(sh,seriesCount){
  sh.getCharts().forEach(c=>sh.removeChart(c));if(!seriesCount)return;
  const n=seriesCount+1;
  const chart1=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,3)).setPosition(3,10,0,0).setOption('title','Выручка WB / Ozon').setOption('legend',{position:'bottom'}).build();
  const chart2=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,1)).addRange(sh.getRange(22,4,n,2)).setPosition(19,10,0,0).setOption('title','Чистая прибыль WB / Ozon').setOption('legend',{position:'bottom'}).build();
  const chart3=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,1)).addRange(sh.getRange(22,6,n,2)).setPosition(35,10,0,0).setOption('title','Реализовано, шт.').setOption('legend',{position:'bottom'}).build();
  const chart4=sh.newChart().asLineChart().addRange(sh.getRange(22,1,n,1)).addRange(sh.getRange(22,8,n,2)).setPosition(51,10,0,0).setOption('title','Маржинальность').setOption('legend',{position:'bottom'}).build();
  [chart1,chart2,chart3,chart4].forEach(c=>sh.insertChart(c));
}
