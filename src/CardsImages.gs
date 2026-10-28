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
