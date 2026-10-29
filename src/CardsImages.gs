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
