function installMasterTrigger(){
  const exists=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='masterScheduler');
  if(!exists) ScriptApp.newTrigger('masterScheduler').timeBased().everyMinutes(5).create();
}
function periodMinutes_(s){ const m={'5 минут':5,'10 минут':10,'15 минут':15,'30 минут':30,'1 час':60,'3 часа':180,'6 часов':360,'12 часов':720,'1 день':1440}; return m[String(s)]||null; }
function masterScheduler(){
  const sh=sheet_(APP.SHEETS.REGULATIONS), n=sh.getLastRow()-1; if(n<=0)return;
  const rows=sh.getRange(2,1,n,12).getValues(); const now=Date.now();
  rows.forEach((r,i)=>{ if(!r[2]) return; const mins=periodMinutes_(r[3]); if(!mins)return; const last=r[4]?new Date(r[4]).getTime():0; if(!last || now-last>=mins*60000-30000) runRegulationById_(r[0],'Автоматический',i+2); });
}
function runRegulationById_(id,runType,row){
  const map={orders_wb:()=>processWbOrders(),orders_ozon:()=>processOzonOrders(),stocks_sync:()=>syncStocks(),prices_sync:()=>syncPrices(runType==='Автоматический'),actions_sync:()=>manageActions(runType==='Автоматический'),dashboard_refresh:()=>refreshDashboard(runType==='Автоматический'),forecast_refresh:()=>refreshForecast(runType==='Автоматический')};
  if(!map[id]) return;
  const sh=sheet_(APP.SHEETS.REGULATIONS), started=Date.now();
  try{ if(row) sh.getRange(row,7).setValue('Выполняется'); const result=map[id]()||{}; const duration=Math.round((Date.now()-started)/1000);
    if(row){sh.getRange(row,5).setValue(now_()); const mins=periodMinutes_(sh.getRange(row,4).getValue()); sh.getRange(row,6).setValue(new Date(Date.now()+mins*60000)); sh.getRange(row,7).setValue('Работает'); sh.getRange(row,8).setValue(''); sh.getRange(row,9).setValue(result.processed||0); sh.getRange(row,10).setValue(result.errors||0); sh.getRange(row,11).setValue(duration); sh.getRange(row,12).setValue('Успешно');}
    logEvent_({regulation:id,runType:runType,result:'Успешно',processed:result.processed||0,success:result.success||0,errors:result.errors||0,duration:duration});
  }catch(e){ const duration=Math.round((Date.now()-started)/1000); if(row){sh.getRange(row,7).setValue(e.protectionStop?'Остановлен защитой':'Ошибка'); sh.getRange(row,8).setValue(e.message); sh.getRange(row,11).setValue(duration); sh.getRange(row,12).setValue('Ошибка');}
    logEvent_({regulation:id,runType:runType,result:'Ошибка',errors:1,error:e.message,duration:duration}); notify_({level:'Критическая ошибка',type:e.protectionStop?'Остановлен защитой':'Ошибка регламента',regulation:id,message:e.message}); }
}
function manualRun_(id){ const sh=sheet_(APP.SHEETS.REGULATIONS); const vals=sh.getRange(2,1,Math.max(1,sh.getLastRow()-1),1).getValues().flat(); const idx=vals.indexOf(id); runRegulationById_(id,'Ручной',idx>=0?idx+2:null); }
function manualOrdersWb(){manualRun_('orders_wb')} function manualOrdersOzon(){manualRun_('orders_ozon')} function manualStocksSync(){manualRun_('stocks_sync')} function manualPricesSync(){manualRun_('prices_sync')} function manualActionsSync(){manualRun_('actions_sync')} function manualDashboardRefresh(){manualRun_('dashboard_refresh')} function manualForecastRefresh(){manualRun_('forecast_refresh')}
function manualRunAll(){['orders_wb','orders_ozon','stocks_sync','prices_sync','actions_sync','dashboard_refresh','forecast_refresh'].forEach(manualRun_);}
