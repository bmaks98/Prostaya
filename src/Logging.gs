function logEvent_(o) {
  const sh=sheet_(APP.SHEETS.LOG);
  sh.appendRow([now_(),o.runId||uuid_(),o.regulation||'',o.marketplace||'',o.runType||'Системный',o.result||'',o.processed||0,o.success||0,o.errors||0,o.error||'',o.duration||0,o.info||'']);
}
function notify_(o) {
  const sh=sheet_(APP.SHEETS.NOTIFICATIONS); const email=asText_(getSetting_('Email получателя',''));
  let sent='Нет', sendStatus='Отключено';
  if (boolText_(getSetting_('Email-уведомления','Выкл')) && email && (o.email!==false)) {
    try { MailApp.sendEmail({to:email,subject:'['+APP.NAME+'] '+(o.level||'Уведомление')+': '+(o.type||''),htmlBody:'<b>'+escapeHtml_(o.message||'')+'</b><br><br>Маркетплейс: '+escapeHtml_(o.marketplace||'—')+'<br>Регламент: '+escapeHtml_(o.regulation||'—')+'<br>Объект: '+escapeHtml_(o.object||'—')}); sent='Да'; sendStatus='Отправлено'; }
    catch(e){ sendStatus='Ошибка: '+e.message; }
  }
  sh.appendRow([now_(),o.level||'Информация',o.type||'',o.marketplace||'',o.regulation||'',o.object||'',o.message||'',sent,email,sendStatus,false,o.comment||'']);
}
function escapeHtml_(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function sendTestNotification(){ notify_({level:'Информация',type:'Тест',message:'Тестовое уведомление. Email-настройка работает.'}); toast_('Тестовое уведомление создано.'); }
