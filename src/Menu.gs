function onOpen() {
  const ui = SpreadsheetApp.getUi();

  const startMenu = ui.createMenu('Начало работы')
    .addItem('🟢 УСТАНОВИТЬ СИСТЕМУ','installSystemFromTemplate')
    .addSeparator()
    .addItem('Открыть лист «Начало работы»','openStartSheet')
    .addSeparator()
    .addItem('Проверить подключение WB','checkWbConnection')
    .addItem('Проверить подключение Ozon','checkOzonConnection')
    .addItem('Проверить подключения','checkAllConnections')
    .addItem('Обновить список складов','refreshWarehouseSettings')
    .addSeparator()
    .addItem('Импортировать каталог','importCatalogs')
    .addItem('Проверить сопоставление','runMatching')
    .addItem('Проверить готовность системы','checkSystemReadiness');

  const stockMenu = ui.createMenu('Склад')
    .addItem('Обновить каталог WB','updateWbCatalog')
    .addItem('Обновить каталог Ozon','updateOzonCatalog')
    .addItem('Синхронизировать остатки','syncStocks');

  const cardsMenu = ui.createMenu('Карточки')
    .addItem('Загрузить категории WB','loadWbSubjects')
    .addItem('Загрузить типы Ozon','loadOzonTypes')
    .addItem('Загрузить обязательные характеристики','loadRequiredCardAttributes')
    .addSeparator()
    .addItem('Сгенерировать штрихкоды','generateBarcodes')
    .addItem('Проверить отмеченные карточки','validateSelectedCards')
    .addItem('Создать отмеченные карточки','createSelectedCards')
    .addSeparator()
    .addItem('Повторить ошибочные WB','retryFailedWbCards')
    .addItem('Повторить ошибочные Ozon','retryFailedOzonCards');

  const pricesMenu = ui.createMenu('Цены')
    .addItem('Пересчитать цены','calculatePrices')
    .addItem('Отправить цены WB','sendWbPrices')
    .addItem('Отправить цены Ozon','sendOzonPrices')
    .addSeparator()
    .addItem('Открыть лист «Маржинальность»','openMarginsSheet')
    .addItem('Открыть лист «Цены»','openPricesSheet');

  const actionsMenu = ui.createMenu('Акции')
    .addItem('Проверить акции WB','checkWbActions')
    .addItem('Проверить акции Ozon','checkOzonActions')
    .addItem('Управлять акциями автоматически','manageActions')
    .addSeparator()
    .addItem('Открыть лист «Акции»','openActionsSheet');

  const procurementMenu = ui.createMenu('Закупки')
    .addItem('Открыть прогноз закупок','openForecastSheet')
    .addItem('Обновить прогноз','refreshForecast')
    .addSeparator()
    .addItem('Создать заказ поставщику','createSupplierOrder')
    .addItem('Создать заказ из выбранных товаров','createSupplierOrderFromSelected')
    .addItem('Принять поставку','acceptSupplierDelivery')
    .addItem('Показать только активные','showActiveSupplierOrders')
    .addItem('Открыть лист «Заказы поставщикам»','openSupplierOrdersSheet');

  const dashboardMenu = ui.createMenu('Дашборд')
    .addItem('Обновить дашборд','refreshDashboard')
    .addItem('Открыть лист «Дашборд»','openDashboardSheet');

  const regulationsMenu = ui.createMenu('Регламенты')
    .addItem('Проверить заказы WB','manualOrdersWb')
    .addItem('Проверить заказы Ozon','manualOrdersOzon')
    .addItem('Синхронизировать остатки','manualStocksSync')
    .addItem('Пересчитать и отправить цены','manualPricesSync')
    .addItem('Проверить и обновить акции','manualActionsSync')
    .addItem('Обновить дашборд','manualDashboardRefresh')
    .addItem('Обновить прогноз закупок','manualForecastRefresh')
    .addSeparator()
    .addItem('Обновить всё','manualRunAll')
    .addItem('Открыть лист «Регламенты»','openRegulationsSheet');

  const journalMenu = ui.createMenu('Уведомления и журнал')
    .addItem('Отправить тестовое email-уведомление','sendTestNotification')
    .addItem('Открыть лист «Уведомления»','openNotificationsSheet')
    .addItem('Открыть лист «Журнал»','openLogSheet');

  const settingsMenu = ui.createMenu('Настройки')
    .addItem('Открыть лист «Настройки»','openSettingsSheet')
    .addItem('Сохранить API-ключи','saveApiCredentials')
    .addItem('Обновить список складов','refreshWarehouseSettings')
    .addItem('Проверить систему','checkSystemReadiness')
    .addSeparator()
    .addItem('Повторно выполнить первичную настройку','installSystemFromTemplate')
    .addItem('Сбросить только служебные настройки','resetServiceState')
    .addSeparator()
    .addItem('🧹 Подготовить мастер-шаблон к копированию','prepareTemplateForCopy');

  ui.createMenu('Prostaya')
    .addSubMenu(startMenu)
    .addSubMenu(stockMenu)
    .addSubMenu(cardsMenu)
    .addSubMenu(pricesMenu)
    .addSubMenu(actionsMenu)
    .addSubMenu(procurementMenu)
    .addSubMenu(dashboardMenu)
    .addSubMenu(regulationsMenu)
    .addSubMenu(journalMenu)
    .addSubMenu(settingsMenu)
    .addToUi();
}

function activate_(name){ ss_().setActiveSheet(sheet_(name)); }
function openStartSheet(){activate_(APP.SHEETS.START)} function openMarginsSheet(){activate_(APP.SHEETS.MARGINS)}
function openPricesSheet(){activate_(APP.SHEETS.PRICES)} function openActionsSheet(){activate_(APP.SHEETS.ACTIONS)}
function openForecastSheet(){activate_(APP.SHEETS.FORECAST)} function openSupplierOrdersSheet(){activate_(APP.SHEETS.SUPPLIER_ORDERS)}
function openDashboardSheet(){activate_(APP.SHEETS.DASHBOARD)} function openRegulationsSheet(){activate_(APP.SHEETS.REGULATIONS)}
function openNotificationsSheet(){activate_(APP.SHEETS.NOTIFICATIONS)} function openLogSheet(){activate_(APP.SHEETS.LOG)} function openSettingsSheet(){activate_(APP.SHEETS.SETTINGS)}
