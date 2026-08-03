import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { showToast } from '../components/Toast';

export interface ExportColumn<T = any> {
  header: string;
  key: string;
  transform?: (value: any, item: T) => string;
}

// Global cached access token in memory
let cachedAccessToken: string | null = null;

// Listen to auth changes to clear token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

// Function to handle Google OAuth login and token retrieval
async function getGoogleAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const provider = new GoogleAuthProvider();
  // Request spreadsheets and drive.file scopes as requested
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential || !credential.accessToken) {
      throw new Error('لم يتم استرجاع رمز الوصول من جوجل.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error: any) {
    console.error('Google OAuth Error:', error);
    // Standard user cancel / popup block check
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('تم حظر النافذة المنبثقة لتسجيل الدخول. يرجى تفعيل النوافذ المنبثقة للموقع.');
    }
    throw new Error('تم إلغاء تسجيل الدخول أو فشل الاتصال بحساب Google.');
  }
}

// Function to map prefixes to Arabic Spreadsheet titles and English sheet tab names
function getExportNames(prefix: string): { title: string; sheetName: string } {
  const mapping: Record<string, { title: string; sheetName: string }> = {
    students: { title: 'أكاديمية ناجي - قائمة الطلاب', sheetName: 'Students' },
    courses: { title: 'أكاديمية ناجي - قائمة الدورات الدراسية', sheetName: 'Courses' },
    bookings: { title: 'أكاديمية ناجي - قائمة الحجوزات والطلبات', sheetName: 'Bookings' },
    teachers: { title: 'أكاديمية ناجي - طاقم التدريس والأساتذة', sheetName: 'Teachers' },
    enrolled_students: { title: 'أكاديمية ناجي - قائمة المنخرطين والمقبوضات', sheetName: 'Enrollments' },
    attendance: { title: 'أكاديمية ناجي - كشف الحضور والغياب', sheetName: 'Attendance' },
    daily_lessons: { title: 'أكاديمية ناجي - كشف ملخصات الدروس اليومية', sheetName: 'Lessons' },
    subscriptions: { title: 'أكاديمية ناجي - باقات واشتراكات الطلاب', sheetName: 'Subscriptions' },
    logs: { title: 'أكاديمية ناجي - سجل الأحداث البرمجي', sheetName: 'System Logs' },
    rooms: { title: 'أكاديمية ناجي - قاعات ومرافق التدريس', sheetName: 'Rooms' },
    schedules: { title: 'أكاديمية ناجي - جدول الحصص والتوقيت الزمني', sheetName: 'Schedules' },
    analytics_report: { title: 'أكاديمية ناجي - تقرير الإحصائيات والتحليلات', sheetName: 'Analytics' }
  };
  return mapping[prefix] || { title: `أكاديمية ناجي - تصدير ${prefix}`, sheetName: 'Export' };
}

// Helper to check if a string matches ISO date format
function isIsoDateString(val: string): boolean {
  if (val.length >= 10 && val.includes('-') && (val.includes('T') || val.includes(':'))) {
    if (val.match(/^[a-zA-Z0-9_-]{15,}$/)) return false; 
    return !isNaN(Date.parse(val));
  }
  return false;
}

// Format date to readable format YYYY-MM-DD HH:mm:ss
function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export async function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filenamePrefix: string
): Promise<void> {
  if (!data || data.length === 0) {
    showToast('لا توجد بيانات للتصدير حالياً', 'warning');
    return;
  }

  showToast('جاري التحقق من تسجيل الدخول بـ Google...', 'success');

  try {
    const accessToken = await getGoogleAccessToken();
    showToast('جاري إنشاء ملف Google Spreadsheet جديد...', 'success');

    const { title: spreadsheetTitle, sheetName } = getExportNames(filenamePrefix);

    // 1. Create Spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: spreadsheetTitle
        },
        sheets: [
          {
            properties: {
              title: sheetName
            }
          }
        ]
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`فشل إنشاء جدول البيانات: ${errorText}`);
    }

    const createdSpreadsheet = await createResponse.json();
    const spreadsheetId = createdSpreadsheet.spreadsheetId;
    const spreadsheetUrl = createdSpreadsheet.spreadsheetUrl;
    const sheetId = createdSpreadsheet.sheets[0].properties.sheetId;

    showToast('جاري كتابة البيانات وتنسيق الجدول...', 'success');

    // 2. Prepare grid of headers and values
    const headers = columns.map(col => col.header);
    const rows = data.map(item => {
      return columns.map(col => {
        let val = (item as any)[col.key];
        if (col.transform) {
          val = col.transform(val, item);
        }

        if (val === null || val === undefined) {
          return '';
        }

        if (val instanceof Date) {
          val = formatDate(val);
        } else if (typeof val === 'string' && isIsoDateString(val)) {
          val = formatDate(new Date(val));
        }

        return String(val);
      });
    });

    const values = [headers, ...rows];

    // 3. Write data values
    const writeResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `${sheetName}!A1`,
          majorDimension: 'ROWS',
          values: values
        })
      }
    );

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      throw new Error(`فشل حفظ البيانات بالملف: ${errorText}`);
    }

    // 4. BatchUpdate to:
    //    a) Freeze first row (frozenRowCount: 1)
    //    b) Style headers (Navy background, bold gold text, centered)
    //    c) Auto-resize columns
    const batchUpdateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            // a) Freeze first row
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheetId,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                },
                fields: 'gridProperties.frozenRowCount'
              }
            },
            // b) Style headers
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: columns.length
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 17 / 255,   // Navy #112a4a
                      green: 42 / 255,
                      blue: 74 / 255
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 212 / 255,  // Gold #d4af37
                        green: 175 / 255,
                        blue: 55 / 255
                      },
                      bold: true,
                      fontSize: 11,
                      fontFamily: 'Inter'
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
              }
            },
            // Align other cells to Center/Middle and set a readable font size
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 1,
                  endRowIndex: values.length,
                  startColumnIndex: 0,
                  endColumnIndex: columns.length
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      fontFamily: 'Inter',
                      fontSize: 10
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)'
              }
            },
            // c) Auto-resize column widths
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: sheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: columns.length
                }
              }
            }
          ]
        })
      }
    );

    if (!batchUpdateResponse.ok) {
      console.warn('Batch update styling failed, continuing...', await batchUpdateResponse.text());
    }

    showToast('✓ تم التصدير إلى Google Sheets بنجاح! جاري فتح الملف...', 'success');

    // 5. Open spreadsheet in new tab
    const win = window.open(spreadsheetUrl, '_blank');
    if (!win) {
      showToast('⚠️ تم حظر فتح النافذة تلقائياً. يرجى الضغط على الرابط في الأعلى أو تفعيل النوافذ المنبثقة.', 'warning');
      
      // Fallback: Add a temporary centered floating element or direct dialog so they can click it manually
      const linkContainer = document.createElement('div');
      linkContainer.id = 'sheets-fallback-link';
      linkContainer.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
      linkContainer.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl border border-slate-100" style="direction: rtl;">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </div>
          <h4 class="font-extrabold text-navy text-sm">تم تجهيز ملف Google Sheet الخاص بك!</h4>
          <p class="text-xs text-slate-500">تم حظر فتح التبويب الجديد تلقائياً بواسطة متصفحك. الرجاء الضغط على الزر أدناه لفتح جدول البيانات:</p>
          <a href="${spreadsheetUrl}" target="_blank" class="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md">
            فتح جدول البيانات في Google Sheets
          </a>
          <button onclick="document.getElementById('sheets-fallback-link').remove()" class="text-xs text-slate-400 hover:text-slate-600 cursor-pointer pt-2 block mx-auto underline font-bold">
            إغلاق التنبيه
          </button>
        </div>
      `;
      document.body.appendChild(linkContainer);
    }

  } catch (error: any) {
    console.error('Sheets Export Error:', error);
    showToast(error.message || 'فشل التصدير إلى Google Sheets', 'error');
  }
}
