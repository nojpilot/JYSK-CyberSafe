const PDFDocument = require('pdfkit');

function createCertificate(res, name) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const safeName = (name || 'Účastník/Účastnice kurzu').substring(0, 40);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="jysk-cybersafe-certifikat.pdf"');

  doc.pipe(res);
  doc.fontSize(28).text('Certifikát o absolvování', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18).text('JYSK CyberSafe', { align: 'center' });
  doc.moveDown(1.5);
  doc.fontSize(14).text('Tento certifikát potvrzuje, že', { align: 'center' });
  doc.moveDown();
  doc.fontSize(24).text(safeName, { align: 'center', underline: true });
  doc.moveDown();
  doc.fontSize(14).text('úspěšně dokončil/a mikro-kurz kybernetické bezpečnosti pro prodejnu.', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(12).text(`Datum: ${new Date().toLocaleDateString('cs-CZ')}`, { align: 'center' });
  doc.moveDown();
  doc.text('Obsah: phishing, vishing, USB, sdílený počítač, ochrana zákaznických údajů.', { align: 'center' });

  doc.end();
}

module.exports = { createCertificate };
