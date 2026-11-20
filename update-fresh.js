const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'Bill Generator.html');
let html = fs.readFileSync(srcFile, 'utf8');

console.log('Original file length:', html.length);

// 1. Remove Sheet Status banner
const sheetStatusRegex = /<div class="status-bar" id="sheetStatus">[\s\S]*?<\/div>\s*<\/div>/i;
if (sheetStatusRegex.test(html)) {
    html = html.replace(sheetStatusRegex, '');
    console.log('Removed #sheetStatus');
} else {
    // Alternate match if nested differently
    const altRegex = /<div class="status-bar" id="sheetStatus">[\s\S]*?<\/div>/i;
    html = html.replace(altRegex, '');
    console.log('Removed #sheetStatus (alt)');
}

// 2. Remove Quick Start card
const quickStartRegex = /<!-- QUICK START -->[\s\S]*?<\/div>\s*<\/div>/i;
if (quickStartRegex.test(html)) {
    html = html.replace(quickStartRegex, '');
    console.log('Removed Quick Start card');
}

// 3. Update company phone display in HTML
html = html.replace(
    /<span id="companyMobDisplay">[^<]*<\/span>/,
    '<span id="companyMobDisplay">Mob. No.: +91 9159432954</span>'
);
console.log('Updated companyMobDisplay in HTML');

// 4. Replace Order Tracker Sync card with clean Terms & Conditions card
const startMarker = '<!-- ORDER TRACKER SYNC';
const endMarker = '<div class="total-panel">';

const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker);

if (sIdx !== -1 && eIdx !== -1) {
    const cleanTermsCard = `<!-- TERMS & CONDITIONS -->
            <div class="card">
                <div class="card-title">📜 Terms &amp; Conditions</div>
                <div class="card-desc">Terms printed on the invoice / bill.</div>
                <div class="field" style="margin-top:8px;">
                    <textarea class="input" id="dg-terms" rows="3">• 50% advance payment required before print begins.
• Balance due on delivery.
• Prices include material, machine time & labour.</textarea>
                </div>
            </div>

            `;
    html = html.substring(0, sIdx) + cleanTermsCard + html.substring(eIdx);
    console.log('Successfully replaced Order Tracker Sync card with clean Terms & Conditions card!');
} else {
    console.log('Error: Could not find start or end marker for Order Tracker Sync card!');
}

// 5. Replace "Save & Sync to Google Sheet" button with "Save Invoice"
html = html.replace(
    /<button class="btn primary" onclick="saveAndSyncOrder\(\)">⚡ Save & Sync to Google Sheet<\/button>/g,
    '<button class="btn primary" onclick="saveOrderLocal()">💾 Save Invoice</button>'
);
console.log('Updated Save Invoice button');

// 6. Remove "Refresh From Sheet" button
html = html.replace(
    /<button class="btn ghost small" onclick="refreshFromSheet\(\)">🔄 Refresh From Sheet<\/button>\s*/g,
    ''
);
console.log('Removed refreshFromSheet button');

// 7. Update JS constants and configuration
// Replace storage keys
html = html.replace(/const STORAGE_KEY = '[^']*';/g, "const STORAGE_KEY = 'vj3d_invoices_v2';");
html = html.replace(/const LEGACY_STORAGE_KEY = '[^']*';/g, "");
html = html.replace(/const LOGO_STORAGE_KEY = '[^']*';/g, "const LOGO_STORAGE_KEY = 'vj3d_logo_v2';");
html = html.replace(/const COMPANY_STORAGE_KEY = '[^']*';/g, "const COMPANY_STORAGE_KEY = 'vj3d_company_v2';");
html = html.replace(/const LEGACY_COMPANY_KEY = '[^']*';/g, "");

// Replace GOOGLE_SCRIPT_URL
html = html.replace(/const GOOGLE_SCRIPT_URL = '[^']*';/g, "");

// Update initial nextOrderNumber
html = html.replace(/let nextOrderNumber = \d+;/g, "let nextOrderNumber = 1;");

// Update companyDetails mobile
html = html.replace(/mobile: '\+91 93708 01296, \+91 88304 54829',/g, "mobile: '+91 9159432954',");

// Update DOMContentLoaded handler
html = html.replace(
    /document\.addEventListener\("DOMContentLoaded", \(\) => {[\s\S]*?}\);/i,
    `document.addEventListener("DOMContentLoaded", () => {
            loadLogo();
            loadCompanyDetails();
            loadOrders();
            addProduct();
            initInvoiceDefaults();
            renderSummaryPage();
        });`
);
console.log('Updated DOMContentLoaded listener');

// 8. Replace saveAndSyncOrder function with clean saveOrderLocal function
const saveOrderOldRegex = /\/\* ---------- SAVE & SYNC ---------- \*\/[\s\S]*?(?=\/\* ---------- STORAGE & RENDERING ---------- \*\/)/i;
const saveOrderNew = `/* ---------- SAVE INVOICE (LOCAL & PERMANENT) ---------- */
        function saveOrderLocal() {
            const orderNo = document.getElementById('dg-orderno')?.value || ('Order-' + pad4(nextOrderNumber));
            const orderDate = document.getElementById('dg-orderdate')?.value || todayDMY();
            const custName = document.getElementById('dg-cust-name')?.value || 'Customer';

            const totalQty = products.reduce((s, p) => s + (p.qty || 1), 0);
            const productSummary = products.map(p => \`\${p.name || 'Product'} (\${p.material ? p.material.toUpperCase() : 'PLA'} x\${p.qty || 1})\`).join(', ');

            const subtotal = products.reduce((s, p) => s + calcCost(p), 0);
            const labour = getLabourCost();
            const discount = getDiscount();
            const grandTotal = Math.max(0, subtotal + labour - discount);

            const orderObj = {
                id: 'ORD-' + Date.now(),
                srNo: ordersCache.length + 1,
                billNo: orderNo,
                date: orderDate,
                customer: custName,
                products: productSummary,
                quantity: totalQty,
                total: grandTotal,
                paymentStatus: 'Paid',
                status: 'Completed',
                itemsSnapshot: JSON.parse(JSON.stringify(products))
            };

            ordersCache.push(orderObj);
            saveOrders();
            nextOrderNumber = ordersCache.length + 1;
            initInvoiceDefaults();
            showToast(\`Invoice \${orderNo} saved successfully!\`);
            renderSummaryPage();
        }

        `;
if (saveOrderOldRegex.test(html)) {
    html = html.replace(saveOrderOldRegex, saveOrderNew);
    console.log('Replaced saveAndSyncOrder with saveOrderLocal');
} else {
    console.log('Warning: saveAndSyncOrder regex did not match');
}

// 9. Remove Google Sheet functions (setSheetStatus, refreshFromSheet, sheetRowToOrder)
const sheetFuncsRegex = /\/\* ---------- GOOGLE SHEET CONNECTION ---------- \*\/[\s\S]*?(?=function pad4)/i;
if (sheetFuncsRegex.test(html)) {
    html = html.replace(sheetFuncsRegex, '');
    console.log('Removed Google Sheet JS functions');
}

// 10. Remove Quick Start JS functions
const quickStartFuncsRegex = /\/\* ---------- QUICK START ---------- \*\/[\s\S]*?(?=\/\* ---------- CALCULATOR ENGINE ---------- \*\/)/i;
if (quickStartFuncsRegex.test(html)) {
    html = html.replace(quickStartFuncsRegex, '');
    console.log('Removed Quick Start JS functions');
}

// 11. Clean loadOrders and initInvoiceDefaults
const loadOrdersRegex = /function loadOrders\(\) {[\s\S]*?function saveOrders\(\)/i;
const loadOrdersNew = `function loadOrders() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                ordersCache = raw ? JSON.parse(raw) : [];
            } catch (e) {
                ordersCache = [];
            }
            if (!Array.isArray(ordersCache)) ordersCache = [];
            nextOrderNumber = ordersCache.length + 1;
        }
        function saveOrders()`;
html = html.replace(loadOrdersRegex, loadOrdersNew);

// Make sure buildDocHTML handles optional/removed fields safely
html = html.replace(
    /const status = document\.getElementById\('dg-orderstatus'\)\.value \|\| 'Pending';/g,
    "const status = document.getElementById('dg-orderstatus')?.value || 'Confirmed';"
);
html = html.replace(
    /const terms = document\.getElementById\('dg-terms'\)\.value;/g,
    "const terms = document.getElementById('dg-terms')?.value || '';"
);

// Save updated files
fs.writeFileSync(path.join(__dirname, 'Bill Generator.html'), html, 'utf8');
fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(__dirname, 'android/app/src/main/assets/index.html'), html, 'utf8');

console.log('Updated Bill Generator.html, index.html, and android assets/index.html successfully!');
