const fs = require('fs');
const path = 'D:/Vj 3d Works/Bill Generator.html';
let content = fs.readFileSync(path, 'utf8');

const logoB64 = fs.readFileSync('D:/Vj 3d Works/logo.base64.txt', 'utf8').trim();

// 1. Title
content = content.replace(/<title>.*?<\/title>/i, '<title>VJ-3D-WORKS — Billing &amp; Invoice App</title>\n    <link rel="icon" type="image/png" href="icons/icon-64.png">');

// 2. Local scripts for offline support
content = content.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@[^\/]+\/dist\/chart\.umd\.min\.js/g, 'libs/chart.umd.min.js');
content = content.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/xlsx@[^\/]+\/dist\/xlsx\.full\.min\.js/g, 'libs/xlsx.full.min.js');

// 3. Brand Colors - update root vars to VJ-3D-WORKS royal blue & amber theme
content = content.replace(/--red:\s*#c0392b;/g, '--red: #1e3a8a;');
content = content.replace(/--red-deep:\s*#8e2418;/g, '--red-deep: #0f172a;');
content = content.replace(/--gold:\s*#b8860b;/g, '--gold: #d97706;');
content = content.replace(/--border:\s*#e8dfc8;/g, '--border: #cbd5e1;');
content = content.replace(/--surface-soft:\s*#faf6ec;/g, '--surface-soft: #f8fafc;');
content = content.replace(/--bg:\s*#f4efe3;/g, '--bg: #f1f5f9;');
content = content.replace(/--label:\s*#8a7a4a;/g, '--label: #475569;');

// 4. Header branding
content = content.replace(/alt="FDM Tech Lab"/g, 'alt="VJ-3D-WORKS"');
content = content.replace(/<div class="app-title">FDM TECH LAB<\/div>/g, '<div class="app-title"><span style="color:#1e3a8a">VJ-</span><span style="color:#d97706">3D-</span><span style="color:#1e3a8a">WORKS</span></div>');
content = content.replace(/<div class="app-subtitle">INVOICE \/ BILL GENERATOR<\/div>/g, '<div class="app-subtitle">3D PRINTING &amp; FABRICATION BILLING</div>');

// 5. Replace FDM in Company details and defaults
content = content.replace(/id="companyNameDisplay">FDM Tech Lab<\/div>/g, 'id="companyNameDisplay">VJ-3D-WORKS</div>');
content = content.replace(/id="companyEmailDisplay">Email: fdmtechlab@email\.com<\/span>/g, 'id="companyEmailDisplay">Email: vj3dworks@gmail.com</span>');
content = content.replace(/id="dg-company-website" type="text" value="www\.fdmtechlab\.com"/g, 'id="dg-company-website" type="text" value="www.vj3dworks.com"');
content = content.replace(/FDM TECH LAB — INVOICE \/ BILL GENERATOR/g, 'VJ-3D-WORKS — BILLING & INVOICE APP');

// 6. Replace storage and constants
content = content.replace(/name:\s*'FDM Tech Lab'/g, "name: 'VJ-3D-WORKS'");
content = content.replace(/email:\s*'fdmtechlab@email\.com'/g, "email: 'vj3dworks@gmail.com'");
content = content.replace(/document\.getElementById\('edit-company-name'\)\.value \|\| 'FDM Tech Lab'/g, "document.getElementById('edit-company-name').value || 'VJ-3D-WORKS'");

// 7. Replace old logo base64
// Find the DEFAULT_LOGO_BASE64 definition and replace it
const oldLogoMatch = content.match(/const DEFAULT_LOGO_BASE64 = 'data:image\/jpeg;base64,[^']+';/);
if (oldLogoMatch) {
    content = content.replace(oldLogoMatch[0], `const DEFAULT_LOGO_BASE64 = '${logoB64}';`);
    console.log("Successfully replaced DEFAULT_LOGO_BASE64");
}

// Replace in header img src
const headerImgMatch = content.match(/<div class="brand">\s*<img src="data:image\/jpeg;base64,[^"]+"/);
if (headerImgMatch) {
    content = content.replace(headerImgMatch[0], `<div class="brand">\n            <img src="${logoB64}" id="appBrandLogo"`);
    console.log("Successfully replaced header brand image");
}

// 8. Replace export file names
content = content.replace(/FDM_Invoices\.csv/g, 'VJ_3D_WORKS_Invoices.csv');
content = content.replace(/FDM_Invoices\.xlsx/g, 'VJ_3D_WORKS_Invoices.xlsx');
content = content.replace(/fdm_invoices_backup\.json/g, 'vj3d_invoices_backup.json');

// 9. Storage fallback logic
content = content.replace(
    /const STORAGE_KEY = 'fdm_orders_v4';/,
    `const STORAGE_KEY = 'vj3d_orders_v1';\n        const LEGACY_STORAGE_KEY = 'fdm_orders_v4';`
);
content = content.replace(
    /const COMPANY_STORAGE_KEY = 'fdm_company_details_v1';/,
    `const COMPANY_STORAGE_KEY = 'vj3d_company_details_v1';\n        const LEGACY_COMPANY_KEY = 'fdm_company_details_v1';`
);

// In loadCompanyDetails:
content = content.replace(
    /const saved = localStorage\.getItem\(COMPANY_STORAGE_KEY\);/,
    `const saved = localStorage.getItem(COMPANY_STORAGE_KEY) || localStorage.getItem(LEGACY_COMPANY_KEY);`
);

// In loadOrders:
content = content.replace(
    /const saved = localStorage\.getItem\(STORAGE_KEY\);/,
    `const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);`
);

// 10. Update printDoc to support AndroidBridge
const oldPrintDoc = `function printDoc() {
            const html = buildDocHTML();
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast('Please allow pop-ups to print or save the document as PDF.');
                return;
            }
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        }`;

const newPrintDoc = `function printDoc() {
            const html = buildDocHTML();
            const docNo = document.getElementById('dg-orderno')?.value || ('Order-' + pad4(nextOrderNumber));
            const title = 'VJ-3D-WORKS_' + docNo;
            
            // Check for native Android Bridge
            if (window.AndroidBridge && typeof window.AndroidBridge.printInvoice === 'function') {
                window.AndroidBridge.printInvoice(html, title);
                return;
            }

            // Standard browser fallback
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast('Please allow pop-ups to print or save the document as PDF.');
                return;
            }
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        }

        function shareInvoice() {
            const docNo = document.getElementById('dg-orderno')?.value || ('Order-' + pad4(nextOrderNumber));
            const total = document.getElementById('grand-total')?.textContent || '0.00';
            const cust = document.getElementById('dg-cust-name')?.value || 'Customer';
            const text = \`VJ-3D-WORKS Invoice #\${docNo}\\nClient: \${cust}\\nTotal Amount: ₹\${total}\\nGenerated via VJ-3D-WORKS Billing App\`;
            
            if (window.AndroidBridge && typeof window.AndroidBridge.shareText === 'function') {
                window.AndroidBridge.shareText('VJ-3D-WORKS Invoice #' + docNo, text);
            } else if (navigator.share) {
                navigator.share({ title: 'VJ-3D-WORKS Invoice #' + docNo, text }).catch(() => {});
            } else {
                navigator.clipboard.writeText(text);
                showToast('Invoice summary copied to clipboard!');
            }
        }`;

if (content.includes('function printDoc()')) {
    content = content.replace(oldPrintDoc, newPrintDoc);
    console.log("Successfully updated printDoc with AndroidBridge");
} else {
    console.warn("Could not find exact printDoc pattern");
}

// 11. Add Share button in action row
content = content.replace(
    `<button class="btn solid" onclick="printDoc()">🖨️ Print / Save as PDF</button>`,
    `<button class="btn solid" onclick="printDoc()">🖨️ Print / Save as PDF</button>\n                <button class="btn" style="background:#0284c7;color:#fff;border-color:#0284c7;" onclick="shareInvoice()">📤 Share Invoice</button>`
);

// 12. Update print styling in buildDocHTML: replace #c0392b with #1e3a8a
content = content.replace(/border-bottom:3px solid #c0392b;/g, 'border-bottom:3px solid #1e3a8a;');
content = content.replace(/color:#c0392b;/g, 'color:#1e3a8a;');
content = content.replace(/background:#c0392b;/g, 'background:#1e3a8a;');

fs.writeFileSync('D:/Vj 3d Works/Bill Generator.html', content, 'utf8');
fs.writeFileSync('D:/Vj 3d Works/index.html', content, 'utf8');
console.log("Finished rebranding Bill Generator.html and created index.html");