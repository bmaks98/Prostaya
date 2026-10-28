from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
OUT = ROOT / 'Prostaya-All-in-One-dev8.gs'

ORDER = [
    'Config.gs','Utils.gs','Logging.gs','Settings.gs','ApiClient.gs','Connections.gs','Warehouses.gs',
    'Installer.gs','Menu.gs','Readiness.gs','Catalog.gs','Matching.gs','Orders.gs','Stocks.gs','Prices.gs',
    'ActionsHelpers.gs','ActionsCheck.gs','ActionsApply.gs','DashboardCore.gs','DashboardWB.gs','DashboardOzon.gs',
    'DashboardUI.gs','Procurement.gs','SupplierOrders.gs','CardsCore.gs','CardsImages.gs','CardsCategories.gs',
    'CardsAttributes.gs','CardsWB.gs','CardsOzon.gs','Scheduler.gs','Placeholders.gs'
]

def template_literal(text):
    return text.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

def patched_supplier(text):
    old1 = """  const tpl=HtmlService.createTemplateFromFile('SupplierOrderDialog');\n  tpl.data={mode:mode,products:supplierProductDirectory_(),lines:selected||[],today:supplierIsoDate_(new Date())};\n  SpreadsheetApp.getUi().showModalDialog(tpl.evaluate().setWidth(760).setHeight(mode==='forecast'?620:520),mode==='forecast'?'Создать заказ из прогноза':'Создать заказ поставщику');"""
    new1 = """  const data={mode:mode,products:supplierProductDirectory_(),lines:selected||[],today:supplierIsoDate_(new Date())};\n  const out=HtmlService.createHtmlOutput(prostayaRenderHtml_(PROSTAYA_SUPPLIER_ORDER_HTML_,data)).setWidth(760).setHeight(mode==='forecast'?620:520);\n  SpreadsheetApp.getUi().showModalDialog(out,mode==='forecast'?'Создать заказ из прогноза':'Создать заказ поставщику');"""
    old2 = """  const tpl=HtmlService.createTemplateFromFile('ReceiveDeliveryDialog');tpl.data={lines:lines,today:supplierIsoDate_(new Date())};\n  SpreadsheetApp.getUi().showModalDialog(tpl.evaluate().setWidth(680).setHeight(560),'Принять поставку');"""
    new2 = """  const data={lines:lines,today:supplierIsoDate_(new Date())};\n  const out=HtmlService.createHtmlOutput(prostayaRenderHtml_(PROSTAYA_RECEIVE_DELIVERY_HTML_,data)).setWidth(680).setHeight(560);\n  SpreadsheetApp.getUi().showModalDialog(out,'Принять поставку');"""
    if old1 not in text or old2 not in text:
        raise SystemExit('SupplierOrders.gs no longer matches the expected dialog code; update builder safely.')
    return text.replace(old1, new1).replace(old2, new2)

def main():
    supplier_html = template_literal((SRC / 'SupplierOrderDialog.html').read_text(encoding='utf-8'))
    receive_html = template_literal((SRC / 'ReceiveDeliveryDialog.html').read_text(encoding='utf-8'))
    chunks = [
        '/** Prostaya All-in-One dev8. Generated from bmaks98/Prostaya src. */',
        f'const PROSTAYA_SUPPLIER_ORDER_HTML_ = `{supplier_html}`;',
        f'const PROSTAYA_RECEIVE_DELIVERY_HTML_ = `{receive_html}`;',
        """function prostayaRenderHtml_(html, data) {\n  const json = JSON.stringify(data || {}).replace(/</g, '\\\\u003c');\n  return html.replace('<?!= JSON.stringify(data) ?>', json);\n}\nfunction installSystemFromTemplate(){ bindInstanceSpreadsheet_(); return installProject(); }"""
    ]
    for name in ORDER:
        text = (SRC / name).read_text(encoding='utf-8')
        if name == 'SupplierOrders.gs':
            text = patched_supplier(text)
        chunks.append(f'/* ===== {name} ===== */\n{text.rstrip()}')
    OUT.write_text('\n'.join(chunks) + '\n', encoding='utf-8')
    print(f'Built {OUT} ({OUT.stat().st_size} bytes)')

if __name__ == '__main__':
    main()
