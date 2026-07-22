import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { SessionReport } from '../types/quiz';

export const exportService = {
  exportToExcel(report: SessionReport) {
    const wb = XLSX.utils.book_new();

    // 1. Overview Sheet
    const overviewData = [
      ['Quiz Title', report.quizTitle],
      ['Session PIN', report.sessionPin],
      ['Trainer', report.trainerName],
      ['Date Hosted', new Date(report.date).toLocaleString()],
      ['Total Participants', report.totalParticipants],
      ['Average Score', report.averageScore],
      ['Average Accuracy', `${report.averageAccuracy}%`],
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'Session Summary');

    // 2. Participant Grades Sheet
    const participantRows = report.participantScores.map(p => ({
      'Rank': p.rank,
      'Participant Name': p.participantName,
      'Total Score': p.score,
      'Correct Answers': p.correctCount,
      'Total Questions': p.totalCount,
      'Accuracy (%)': `${p.accuracyPercent}%`,
    }));
    const participantSheet = XLSX.utils.json_to_sheet(participantRows);
    XLSX.utils.book_append_sheet(wb, participantSheet, 'Participant Leaderboard');

    // 3. Question Analytics Sheet
    const questionRows = report.questionBreakdown.map(q => ({
      'Q#': q.questionIndex,
      'Question Text': q.questionText,
      'Correct Answer': q.correctOptionText,
      'Submissions': q.totalSubmissions,
      'Correct Submissions': q.correctCount,
      'Accuracy (%)': `${q.accuracyPercent}%`,
      'Avg Response Time (s)': q.averageTimeSeconds,
    }));
    const questionSheet = XLSX.utils.json_to_sheet(questionRows);
    XLSX.utils.book_append_sheet(wb, questionSheet, 'Question Analytics');

    // Generate and download file
    const filename = `QuizPulse_Report_${report.sessionPin}_${report.quizTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
  },

  exportToPDF(report: SessionReport) {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    // Title & Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('QuizPulse Performance & Grade Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Session PIN: ${report.sessionPin}`, 14, 26);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 29, 196, 29);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 32, 182, 28, 'F');

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Quiz: ${report.quizTitle}`, 18, 39);
    doc.text(`Trainer: ${report.trainerName}`, 18, 45);
    doc.text(`Date Hosted: ${new Date(report.date).toLocaleDateString()}`, 18, 51);

    doc.text(`Total Participants: ${report.totalParticipants}`, 110, 39);
    doc.text(`Average Score: ${report.averageScore} pts`, 110, 45);
    doc.text(`Average Accuracy: ${report.averageAccuracy}%`, 110, 51);

    // Participant Leaderboard Section
    let y = 68;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Participant Leaderboard', 14, y);
    y += 6;

    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Rank', 18, y + 5.5);
    doc.text('Participant Name', 35, y + 5.5);
    doc.text('Score', 110, y + 5.5);
    doc.text('Correct / Total', 140, y + 5.5);
    doc.text('Accuracy', 172, y + 5.5);
    y += 8;

    doc.setFont('helvetica', 'normal');
    report.participantScores.forEach((p, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(`#${p.rank}`, 18, y + 5);
      doc.text(p.participantName.substring(0, 32), 35, y + 5);
      doc.text(`${p.score} pts`, 110, y + 5);
      doc.text(`${p.correctCount} / ${p.totalCount}`, 140, y + 5);
      doc.text(`${p.accuracyPercent}%`, 172, y + 5);
      y += 7;
    });

    // Question Analytics Section
    y += 10;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Question Breakdown & Item Analysis', 14, y);
    y += 6;

    report.questionBreakdown.forEach((q) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 16, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${q.questionIndex}: ${q.questionText.substring(0, 70)}${q.questionText.length > 70 ? '...' : ''}`, 18, y + 5);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Correct Choice: ${q.correctOptionText}`, 18, y + 11);
      doc.text(`Submissions: ${q.totalSubmissions} | Accuracy: ${q.accuracyPercent}% | Avg Response Time: ${q.averageTimeSeconds}s`, 100, y + 11);

      y += 19;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`QuizPulse Platform • Confidential Report • Page ${i} of ${totalPages}`, 14, 287);
    }

    const filename = `QuizPulse_Grade_Report_${report.sessionPin}.pdf`;
    doc.save(filename);
  }
};
