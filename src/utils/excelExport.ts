import * as XLSX from 'xlsx';
import type { MealRecord, ExcelRow } from '../lib/types';
import { format } from 'date-fns';

/**
 * Convert meal records to the required Excel format and trigger download.
 * 
 * Excel columns (in exact order):
 * Date | Day | Main meal | Time | Very Happy imoji | happy imoji | Normal imoji | sad imoji
 */
export function exportToExcel(records: MealRecord[]): void {
  // Sort records by date then meal order
  const mealOrder: Record<string, number> = {
    'Breakfast': 1,
    'Lunch': 2,
    'Evening Snack': 3,
  };

  const sorted = [...records].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (mealOrder[a.meal] || 0) - (mealOrder[b.meal] || 0);
  });

  const rows: ExcelRow[] = sorted.map((record) => {
    // Format last_vote_time to HH:MM:SS
    let timeStr = '';
    if (record.last_vote_time) {
      try {
        const voteDate = new Date(record.last_vote_time);
        timeStr = format(voteDate, 'HH:mm:ss');
      } catch {
        timeStr = '';
      }
    }

    return {
      'Date': record.date,
      'Day': record.day,
      'Main meal': record.meal,
      'Time': timeStr,
      'Very Happy imoji': record.very_happy_count,
      'happy imoji': record.happy_count,
      'Normal imoji': record.normal_count,
      'sad imoji': record.sad_count,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 12 },  // Date
    { wch: 12 },  // Day
    { wch: 16 },  // Main meal
    { wch: 10 },  // Time
    { wch: 18 },  // Very Happy imoji
    { wch: 14 },  // happy imoji
    { wch: 14 },  // Normal imoji
    { wch: 12 },  // sad imoji
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Meal Feedback');

  // Generate filename with current date
  const fileName = `meal_feedback_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
