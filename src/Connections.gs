function checkWbConnection() {
  try { const r=wbRequest_('/api/v1/seller-info','get',undefined,'Проверка подключения WB'); setSetting_('Статус WB','Подключено','OK'); setSetting_('Последняя проверка',formatDateTime_(now_())); toast_('WB: подключение успешно.'); return r.json; }
  catch(e){ setSetting_('Статус WB','Ошибка','Ошибка'); notify_({level:'Критическая ошибка',type:'Подключение WB',marketplace:'WB',message:e.message}); toast_('WB: ошибка подключения.'); return null; }
}
function checkOzonConnection() {
  try { const r=ozonRequest_('/v1/roles',{},'Проверка подключения Ozon'); setSetting_('Статус Ozon','Подключено','OK'); setSetting_('Последняя проверка',formatDateTime_(now_()));
    const exp=r.json&&r.json.expires_at; if(exp){ const days=Math.floor((new Date(exp)-new Date())/86400000); if(days<=30) notify_({level:'Предупреждение',type:'Срок API-ключа Ozon',marketplace:'Ozon',message:'API-ключ Ozon истекает через '+days+' дн. ('+exp+').'}); }
    toast_('Ozon: подключение успешно.'); return r.json; }
  catch(e){ setSetting_('Статус Ozon','Ошибка','Ошибка'); notify_({level:'Критическая ошибка',type:'Подключение Ozon',marketplace:'Ozon',message:e.message}); toast_('Ozon: ошибка подключения.'); return null; }
}
function checkAllConnections(){ if(boolText_(getSetting_('Использовать WB','Нет'))) checkWbConnection(); if(boolText_(getSetting_('Использовать Ozon','Нет'))) checkOzonConnection(); }
