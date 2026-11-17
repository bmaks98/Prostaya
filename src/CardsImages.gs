/**
 * Фото новых карточек.
 * Пользователь хранит изображения непосредственно в ячейках Google Sheets.
 *
 * Ozon принимает URL изображений при /v3/product/import — для него используем
 * краткоживущий Google-hosted URL CellImage.getContentUrl() непосредственно
 * перед отправкой запроса.
 *
 * WB для /content/v3/media/save требует прямые публичные ссылки с именем файла.
 * Поэтому для WB изображение из ячейки сначала скачивается как Blob, после чего
 * загружается бинарно через /content/v3/media/file.
 */
function cardImageUrls_(sh,row,h){
  const urls=[];
  for(let i=1;i<=10;i++){
    const col=h['Фото '+i];if(!col)continue;
    const v=sh.getRange(row,col).getValue(),url=cardImageContentUrl_(v);
    if(url)urls.push(url);
  }
  return urls;
}
function cardImageContentUrl_(value){
  if(value&&typeof value.getContentUrl==='function'){
    try{return asText_(value.getContentUrl());}
    catch(e){throw new Error('Не удалось получить изображение из ячейки: '+e.message);}
  }
  return ''; // По ТЗ принимаем только изображение, вставленное непосредственно в ячейку.
}
function cardHasMainImage_(sh,row,h){
  const col=h['Фото 1'];if(!col)return false;
  return !!cardImageContentUrl_(sh.getRange(row,col).getValue());
}
function cardImageValues_(sh,row,h){
  const out=[];
  for(let i=1;i<=10;i++){
    const col=h['Фото '+i];if(!col)continue;
    const value=sh.getRange(row,col).getValue(),url=cardImageContentUrl_(value);
    if(url)out.push({number:i,value:value,url:url});
  }
  return out;
}
function cardImageBlob_(image,index){
  const url=image&&image.url?image.url:cardImageContentUrl_(image&&image.value!==undefined?image.value:image);
  if(!url)throw new Error('Фото '+index+': изображение отсутствует.');
  const resp=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true}),code=resp.getResponseCode();
  if(code<200||code>=300)throw new Error('Фото '+index+': Google вернул HTTP '+code+'.');
  let blob=resp.getBlob(),ct=asText_(blob.getContentType()).toLowerCase(),ext='jpg';
  if(ct.indexOf('png')>=0)ext='png';else if(ct.indexOf('webp')>=0)ext='webp';else if(ct.indexOf('gif')>=0)ext='gif';else if(ct.indexOf('bmp')>=0)ext='bmp';
  return blob.setName('card_photo_'+index+'.'+ext);
}
function wbUploadCardMediaFromCells_(nmId,sh,row,h){
  const images=cardImageValues_(sh,row,h);if(!nmId||!images.length)return {processed:0,success:0,errors:0};
  const token=secret_(APP.SECRET_KEYS.WB_TOKEN);if(!token)throw new Error('WB API Token не сохранён.');let success=0;
  images.forEach((img,pos)=>{
    const blob=cardImageBlob_(img,pos+1),resp=UrlFetchApp.fetch('https://content-api.wildberries.ru/content/v3/media/file',{method:'post',headers:{Authorization:token,'X-Nm-Id':String(nmId),'X-Photo-Number':String(pos+1)},payload:{uploadfile:blob},muteHttpExceptions:true,followRedirects:true}),code=resp.getResponseCode(),text=resp.getContentText();
    if(code<200||code>=300)throw new Error('WB: не удалось загрузить фото '+(pos+1)+'. HTTP '+code+': '+text.substring(0,500));
    const json=safeJson_(text);if(json&&json.error===true)throw new Error('WB: фото '+(pos+1)+': '+asText_(json.errorText||json.additionalErrors||text));success++;Utilities.sleep(650);
  });
  return {processed:images.length,success:success,errors:0};
}
function ozonCardImagePayload_(sh,row,h){const urls=cardImageUrls_(sh,row,h);if(!urls.length)return {primary_image:'',images:[]};return {primary_image:urls[0],images:urls.slice(1,10)};}

/** Окно быстрой загрузки локальных фото в «Фото 1…Фото 10». */
function showProductPhotoUploader(){
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh);
  let row=0;
  try{
    const active=ss_().getActiveSheet(),cell=active&&active.getActiveCell();
    if(active&&active.getName()===APP.SHEETS.NEW_CARDS&&cell&&cell.getRow()>=2)row=cell.getRow();
  }catch(_){}
  if(row<2&&sh.getLastRow()>=2){
    const rows=sh.getRange(2,1,sh.getLastRow()-1,Math.max(1,h['Создать']||1)).getValues(),selected=[];
    rows.forEach((r,i)=>{if(r[(h['Создать']||1)-1]===true)selected.push(i+2);});
    if(selected.length===1)row=selected[0];
  }
  if(row<2)throw new Error('Откройте лист «Новые карточки» и выделите любую ячейку строки товара либо отметьте ровно одну строку флажком «Создать».');
  const article=h['Артикул продавца']?asText_(sh.getRange(row,h['Артикул продавца']).getValue()):'',name=h['Название']?asText_(sh.getRange(row,h['Название']).getValue()):'';
  const data={row:row,article:article,name:name,maxPhotos:10};
  let out;
  if(typeof PROSTAYA_PHOTO_UPLOAD_HTML_!=='undefined')out=HtmlService.createHtmlOutput(prostayaRenderHtml_(PROSTAYA_PHOTO_UPLOAD_HTML_,data));
  else{const tpl=HtmlService.createTemplateFromFile('PhotoUploadDialog');tpl.data=data;out=tpl.evaluate();}
  SpreadsheetApp.getUi().showModalDialog(out.setWidth(720).setHeight(620),'Загрузить фото с ПК');
}

/** Принимает одно фото из HTML-окна и помещает его как настоящий CellImage. */
function uploadProductPhotoToCell(row,slot,payload){
  row=Number(row);slot=Number(slot);
  if(!Number.isInteger(row)||row<2)throw new Error('Некорректная строка карточки.');
  if(!Number.isInteger(slot)||slot<1||slot>10)throw new Error('Номер фото должен быть от 1 до 10.');
  if(!payload||!payload.dataUrl)throw new Error('Файл изображения не передан.');
  const m=String(payload.dataUrl).match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i);
  if(!m)throw new Error('Поддерживаются JPG, PNG, WEBP и GIF.');
  const mime=m[1].toLowerCase(),bytes=Utilities.base64Decode(m[2]);
  if(bytes.length>6*1024*1024)throw new Error('Фото после подготовки больше 6 МБ. Уменьшите изображение.');
  const sh=sheet_(APP.SHEETS.NEW_CARDS),h=findHeaderMap_(sh),col=h['Фото '+slot];
  if(!col)throw new Error('Не найдена колонка «Фото '+slot+'».');
  const safeName=(asText_(payload.name)||('photo_'+slot)).replace(/[^a-zA-Zа-яА-Я0-9._-]+/g,'_').substring(0,120),blob=Utilities.newBlob(bytes,mime,safeName);
  let temp=null;
  try{
    temp=DriveApp.createFile(blob);
    try{temp.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){throw new Error('Google Drive не разрешил временный доступ к изображению. Проверьте разрешение Drive для скрипта или ограничения аккаунта: '+e.message);}
    Utilities.sleep(250);
    const image=SpreadsheetApp.newCellImage().setSourceUrl(temp.getDownloadUrl()).setAltTextTitle(safeName).setAltTextDescription('Prostaya: фото товара '+slot).build();
    const cell=sh.getRange(row,col);cell.setValue(image);SpreadsheetApp.flush();Utilities.sleep(350);
    const inserted=cell.getValue();
    if(!inserted||inserted.valueType!==SpreadsheetApp.ValueType.IMAGE)throw new Error('Google Sheets не подтвердил вставку изображения в ячейку.');
    sh.setRowHeight(row,120);sh.setColumnWidth(col,120);
    return {ok:true,row:row,slot:slot,cell:cell.getA1Notation()};
  }finally{
    if(temp){try{Utilities.sleep(250);temp.setTrashed(true);}catch(_){} }
  }
}

/** Скачать фото по HTTPS-ссылкам и заменить их настоящими CellImage.
 * Обрабатываем только выделенные строки листа новых карточек.
 * Исходные ссылки сохраняем в примечаниях; флажок «Создать» не трогаем.
 */
function downloadProductPhotosFromLinks(){
  const ui=SpreadsheetApp.getUi(),ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getActiveSheet(),sel=sh.getActiveRange();
  if(sh.getName()!==APP.SHEETS.NEW_CARDS||!sel||sel.getRow()<2){ui.alert('Откройте «Новые карточки» и выделите ячейку или несколько строк товаров.');return;}
  if(sel.getNumRows()>10){ui.alert('Выделите не более 10 строк за один запуск.');return;}
  const h=findHeaderMap_(sh),lock=LockService.getDocumentLock();
  if(!lock.tryLock(1000)){ui.alert('Другая операция уже выполняется. Повторите позже.');return;}
  let ok=0,skipped=0,errors=[],remaining=false;
  const started=Date.now();
  try{
    scan: for(let row=sel.getRow();row<=sel.getLastRow();row++){
      for(let slot=1;slot<=10;slot++){
        if(Date.now()-started>225000){remaining=true;break scan;}
        const col=h['Фото '+slot];if(!col)continue;
        const cell=sh.getRange(row,col),value=cell.getValue();
        if(value&&value.valueType===SpreadsheetApp.ValueType.IMAGE){skipped++;continue;}
        const formula=cell.getFormula(),rich=cell.getRichTextValue(),note=cell.getNote();
        let link=typeof value==='string'&&/^https:\/\//i.test(value.trim())?value.trim():'';
        if(!link&&rich&&rich.getLinkUrl())link=String(rich.getLinkUrl()).trim();
        if(!link&&formula){const m=formula.match(/^=\s*(?:IMAGE|HYPERLINK)\s*\(\s*"(https:\/\/[^"]+)"/i);if(m)link=m[1];}
        if(!link){if(value!==''&&value!==null)errors.push(cell.getA1Notation()+': не найдена HTTPS-ссылка.');continue;}
        let attempted=false;
        try{
          const payload=cardDownloadPhotoLink_(link,slot);
          // Не заменяем ячейку, если пользователь уже изменил её во время скачивания.
          if(cell.getFormula()!==formula||String(cell.getValue())!==String(value))throw new Error('Ячейка изменена во время скачивания.');
          attempted=true;
          uploadProductPhotoToCell(row,slot,payload);
          const inserted=cell.getValue();
          if(!cardImageContentUrl_(inserted))throw new Error('Не удалось получить URL вставленного CellImage.');
          const backup='Исходная ссылка: '+link;
          if(!String(note||'').split('\n').includes(backup))cell.setNote(note?note+'\n'+backup:backup);
          ok++;
        }catch(e){
          if(attempted){
            try{if(formula)cell.setFormula(formula);else if(rich)cell.setRichTextValue(rich);else cell.setValue(value);cell.setNote(note||'');}
            catch(restoreError){errors.push(cell.getA1Notation()+': не удалось восстановить ссылку; '+link);}
          }
          errors.push(cell.getA1Notation()+': '+String(e.message||e).substring(0,240));
        }
      }
    }
  }finally{lock.releaseLock();}
  ui.alert('Загрузка фото по ссылкам','Вставлено: '+ok+'\nУже были изображениями: '+skipped+'\nОшибок: '+errors.length+(remaining?'\nДостигнут лимит времени. Повторите команду для оставшихся ссылок.':'')+(errors.length?'\n\n'+errors.slice(0,12).join('\n')+(errors.length>12?'\n… ещё '+(errors.length-12):''):''),ui.ButtonSet.OK);
}

/** Принимаем только HTTPS и реальные JPG/PNG/WEBP/GIF до 6 МБ.
 * Публичные ссылки Drive распознаются отдельно. Закрытый Drive-файл
 * не открываем публично; скачивание через Drive API только при доступе
 * «всем по ссылке» или «всем». Остальные запросы — без токенов.
 */
function cardDownloadPhotoLink_(link,slot){
  if(!/^https:\/\/[^/\s]+(?:[/?#]|$)/i.test(link))throw new Error('Поддерживаются только HTTPS-ссылки.');
  const drive=/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/i.exec(link)||(/^https:\/\/drive\.google\.com\/(?:uc|open)(?:\?|$)/i.test(link)?/[?&]id=([A-Za-z0-9_-]+)/i.exec(link):null);
  let bytes=null,source=link;
  if(drive){
    try{
      const f=DriveApp.getFileById(drive[1]),access=f.getSharingAccess();
      if(access===DriveApp.Access.ANYONE||access===DriveApp.Access.ANYONE_WITH_LINK){
        if(f.getSize()>6*1024*1024)throw new Error('Файл больше 6 МБ.');
        bytes=f.getBlob().getBytes();
      }
    }catch(_){}
    const key=/[?&]resourcekey=([A-Za-z0-9_-]+)/i.exec(link);
    source='https://drive.google.com/uc?export=download&id='+drive[1]+(key?'&resourcekey='+key[1]:'');
  }
  if(!bytes){
    const response=UrlFetchApp.fetch(source,{muteHttpExceptions:true,followRedirects:true});
    const code=response.getResponseCode();
    if(code<200||code>=300)throw new Error('HTTP '+code+'. Проверьте доступ по ссылке.');
    bytes=response.getContent();
  }
  if(!bytes.length||bytes.length>6*1024*1024)throw new Error('Пустой файл или размер больше 6 МБ.');
  const b=i=>(bytes[i]||0)&255;
  let mime='',ext='';
  if(b(0)===255&&b(1)===216&&b(2)===255){mime='image/jpeg';ext='jpg';}
  else if(b(0)===137&&b(1)===80&&b(2)===78&&b(3)===71&&b(4)===13&&b(5)===10&&b(6)===26&&b(7)===10){mime='image/png';ext='png';}
  else if(b(0)===71&&b(1)===73&&b(2)===70&&b(3)===56&&(b(4)===55||b(4)===57)&&b(5)===97){mime='image/gif';ext='gif';}
  else if(b(0)===82&&b(1)===73&&b(2)===70&&b(3)===70&&b(8)===87&&b(9)===69&&b(10)===66&&b(11)===80){mime='image/webp';ext='webp';}
  if(!mime)throw new Error('По ссылке получено не поддерживаемое изображение (возможно, HTML или страница входа).');
  return {name:'card_photo_'+slot+'.'+ext,dataUrl:'data:'+mime+';base64,'+Utilities.base64Encode(bytes)};
}

