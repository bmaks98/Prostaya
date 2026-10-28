function apiFetchWithRetry_(cfg) {
  const retryCodes={408:true,429:true,500:true,502:true,503:true,504:true}; let lastErr=null;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const resp=UrlFetchApp.fetch(cfg.url,{method:cfg.method||'get',headers:cfg.headers||{},payload:cfg.payload===undefined?undefined:(typeof cfg.payload==='string'?cfg.payload:JSON.stringify(cfg.payload)),contentType:cfg.contentType||'application/json',muteHttpExceptions:true});
      const code=resp.getResponseCode(), text=resp.getContentText();
      if(code>=200 && code<300) return {ok:true,code:code,text:text,json:safeJson_(text),headers:resp.getAllHeaders()};
      const err=new Error('HTTP '+code+': '+text.substring(0,1000)); err.httpCode=code;
      if(!retryCodes[code]) throw err;
      lastErr=err; if(attempt<3) Utilities.sleep(attempt*1500);
    } catch(e){
      lastErr=e; const code=e.httpCode||0; if(code && !retryCodes[code]) break; if(attempt<3) Utilities.sleep(attempt*1500);
    }
  }
  const msg=(lastErr&&lastErr.message)||'Неизвестная ошибка API';
  logEvent_({regulation:cfg.regulation||'API',marketplace:cfg.marketplace||'',result:'Ошибка',errors:1,error:msg});
  notify_({level:'Критическая ошибка',type:'Ошибка API после 3 попыток',marketplace:cfg.marketplace||'',regulation:cfg.regulation||'',message:msg});
  throw lastErr||new Error(msg);
}

function wbRequestAt_(base, path, method, payload, regulation) {
  const token=secret_(APP.SECRET_KEYS.WB_TOKEN); if(!token) throw new Error('WB API Token не сохранён.');
  return apiFetchWithRetry_({url:base+path,method:method||'get',payload:payload,headers:{Authorization:token},marketplace:'WB',regulation:regulation||'WB API'});
}
function wbRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://common-api.wildberries.ru',path,method,payload,regulation);
}
function wbMarketplaceRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://marketplace-api.wildberries.ru',path,method,payload,regulation||'WB Marketplace API');
}
function wbContentRequest_(path, method, payload, regulation) {
  return wbRequestAt_('https://content-api.wildberries.ru',path,method,payload,regulation||'WB Content API');
}
function ozonRequest_(path, payload, regulation) {
  const cid=secret_(APP.SECRET_KEYS.OZON_CLIENT_ID), key=secret_(APP.SECRET_KEYS.OZON_API_KEY); if(!cid||!key) throw new Error('Ozon Client ID / API Key не сохранены.');
  return apiFetchWithRetry_({url:'https://api-seller.ozon.ru'+path,method:'post',payload:payload||{},headers:{'Client-Id':cid,'Api-Key':key},marketplace:'Ozon',regulation:regulation||'Ozon API'});
}
