// Все функциональные модули утверждённого v1 реализованы.
// Файл оставлен для совместимости с установкой и будущих расширений.

/**
 * Ozon /v3/product/import хранит attribute.values[].value как string.
 * Для булевых характеристик (в т.ч. 23536 «Нужен код маркировки»)
 * допускаются только строковые значения "true" / "false".
 * В таблице пользователь по-прежнему может вводить Да/Нет, 1/0 и т.п.
 */
function ozonBooleanValue_(value,name){
  if(value===true)return 'true';
  if(value===false)return 'false';
  const s=asText_(value).toLowerCase();
  if(['true','1','да','yes','y','вкл'].indexOf(s)>=0)return 'true';
  if(['false','0','нет','no','n','выкл'].indexOf(s)>=0)return 'false';
  throw new Error('Ozon: «'+(name||'булева характеристика')+'» должно быть true/false. В таблице можно указать Да/Нет.');
}
