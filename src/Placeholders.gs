// Функциональные модули следующих этапов. Команды уже подключены к меню,
// но до реализации не отправляют изменения на маркетплейсы.
function notReady_(name){ toast_(name+': модуль будет реализован на следующем этапе.'); return {processed:0,success:0,errors:0}; }
function checkWbActions(){return notReady_('Акции WB')} function checkOzonActions(){return notReady_('Акции Ozon')} function manageActions(){assertGuard_(APP.SAFE_GUARDS.MANAGE_ACTIONS); return notReady_('Управление акциями')}
function refreshForecast(){return notReady_('Прогноз закупок')} function refreshDashboard(){return notReady_('Дашборд')}
function createSupplierOrder(){return notReady_('Создание заказа поставщику')} function createSupplierOrderFromSelected(){return notReady_('Заказ из прогноза')} function acceptSupplierDelivery(){return notReady_('Приёмка поставки')}
function showActiveSupplierOrders(){ const sh=sheet_(APP.SHEETS.SUPPLIER_ORDERS); if(sh.getFilter()) sh.getFilter().remove(); if(sh.getLastRow()>1){ const f=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).createFilter(); const h=findHeaderMap_(sh); f.setColumnFilterCriteria(h['Статус'],SpreadsheetApp.newFilterCriteria().setHiddenValues(['Получен','Отменён']).build()); } }
function loadWbSubjects(){return notReady_('Категории WB')} function loadOzonTypes(){return notReady_('Типы Ozon')} function loadRequiredCardAttributes(){return notReady_('Обязательные характеристики')}
function generateBarcodes(){return notReady_('Генерация штрихкодов')} function validateSelectedCards(){return notReady_('Проверка карточек')} function createSelectedCards(){return notReady_('Создание карточек')}
function retryFailedWbCards(){return notReady_('Повтор WB')} function retryFailedOzonCards(){return notReady_('Повтор Ozon')}
