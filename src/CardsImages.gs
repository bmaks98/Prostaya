/** Фото новых карточек: изображения хранятся непосредственно в ячейках Google Sheets. */
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
    try{return asText_(value.getContentUrl());}catch(e){throw new Error('Не удалось получить изображение из ячейки: '+e.message);}
  }
  const s=asText_(value);return /^https?:\/\//i.test(s)?s:'';
}
function cardHasMainImage_(sh,row,h){const col=h['Фото 1'];if(!col)return false;return !!cardImageContentUrl_(sh.getRange(row,col).getValue());}
function wbUploadCardMedia_(nmId,urls){
  if(!nmId||!urls||!urls.length)return;
  wbContentRequest_('/content/v3/media/save','post',{nmId:Number(nmId),data:urls},'Фото новой карточки WB');
}
