function checkSystemReadiness(){
  const issues=[]; const useWb=boolText_(getSetting_('Использовать WB','Нет')), useOzon=boolText_(getSetting_('Использовать Ozon','Нет'));
  if(!useWb&&!useOzon) issues.push('Не выбран ни один маркетплейс.');
  if(useWb&&!hasWbCredentials_()) issues.push('Не сохранён WB API Token.');
  if(useOzon&&!hasOzonCredentials_()) issues.push('Не сохранены Ozon Client ID / API Key.');
  if(useWb && getSetting_('Статус WB','')!=='Подключено') issues.push('WB не прошёл проверку подключения.');
  if(useOzon && getSetting_('Статус Ozon','')!=='Подключено') issues.push('Ozon не прошёл проверку подключения.');
  if(useWb && !asText_(getSetting_('WB склад для остатков',''))) issues.push('Не выбран WB склад для остатков.');
  if(useOzon && !asText_(getSetting_('Ozon склад для остатков',''))) issues.push('Не выбран Ozon склад для остатков.');
  const stock=sheet_(APP.SHEETS.STOCK); if(stock.getLastRow()<=1) issues.push('Склад пуст — каталог ещё не импортирован.');
  if(issues.length){ setSetting_('Статус системы','Требует настройки'); setSetting_('Последняя проверка системы',formatDateTime_(now_())); notify_({level:'Предупреждение',type:'Проверка системы',message:issues.join('\n'),email:false}); SpreadsheetApp.getUi().alert('Система требует настройки','• '+issues.join('\n• '),SpreadsheetApp.getUi().ButtonSet.OK); return false; }
  setSetting_('Статус системы','Готова'); setSetting_('Последняя проверка системы',formatDateTime_(now_())); toast_('Система готова. Защитные переключатели можно включать вручную.'); return true;
}
function assertGuard_(name){ if(!boolText_(getSetting_(name,'Нет'))) throw new Error('Операция заблокирована защитой. Включите «'+name+'» после проверки системы.'); }
