const PDFDocument = require("pdfkit");

/**
 * Streams a monthly report as a PDF directly into the HTTP response.
 */
function streamReportPDF(report, res) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=monthly-report.pdf");

  doc.pipe(res);

  doc.fontSize(20).text("Monthly Finance Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  doc.moveDown(1.5);

  doc.fillColor("black").fontSize(14).text("Summary");
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Total Income: Rs. ${report.totals.income}`);
  doc.text(`Total Expense: Rs. ${report.totals.expense}`);
  doc.text(`Highest Category: ${report.highestCategory}`);
  doc.text(`Lowest Category: ${report.lowestCategory}`);
  doc.text(`Potential Savings: Rs. ${report.potentialSavings}`);
  doc.text(`Predicted Next Month Expense: Rs. ${report.prediction.predictedAmount}`);
  doc.moveDown(1);

  doc.fontSize(14).text("Financial Health");
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Rating: ${report.financialHealth.healthRating}`);
  doc.text(`Reason: ${report.financialHealth.reason}`);
  doc.moveDown(1);

  doc.fontSize(14).text("Category Breakdown");
  doc.moveDown(0.5);
  report.categoryBreakdown.forEach((b) => {
    doc.fontSize(11).text(`${b.category}: Rs. ${b.total} (${b.percentage}%)`);
  });
  doc.moveDown(1);

  doc.fontSize(14).text("Monthly Trend (Last 6 Months)");
  doc.moveDown(0.5);
  report.monthlyTrend.forEach((m) => {
    doc.fontSize(11).text(`${m.month}: Rs. ${m.total}`);
  });

  doc.end();
}

module.exports = { streamReportPDF };