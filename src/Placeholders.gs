// Функциональные модули следующих этапов. Команды уже подключены к меню,
// но до реализации не отправляют изменения на маркетплейсы.
function notReady_(name){ toast_(name+': модуль будет реализован на следующем этапе.'); return {processed:0,success:0,errors:0}; }
function loadWbSubjects(){return notReady_('Категории WB')} function loadOzonTypes(){return notReady_('Типы Ozon')} function loadRequiredCardAttributes(){return notReady_('Обязательные характеристики')}
function generateBarcodes(){return notReady_('Генерация штрихкодов')} function validateSelectedCards(){return notReady_('Проверка карточек')} function createSelectedCards(){return notReady_('Создание карточек')}
function retryFailedWbCards(){return notReady_('Повтор WB')} function retryFailedOzonCards(){return notReady_('Повтор Ozon')}
