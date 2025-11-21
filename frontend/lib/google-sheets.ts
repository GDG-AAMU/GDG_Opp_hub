import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']

interface FeedbackRow {
  id: string
  user_name: string
  user_email: string | null
  feedback_type: string
  subject: string
  description: string
  page_url: string | null
  status: string
  created_at: string
}

// Get authenticated Google Sheets client
function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !privateKey) {
    throw new Error('Missing Google service account credentials')
  }

  // Replace escaped newlines with actual newlines
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: formattedPrivateKey,
    },
    scopes: SCOPES,
  })

  return google.sheets({ version: 'v4', auth })
}

// Get authenticated Google Drive client
function getGoogleDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !privateKey) {
    throw new Error('Missing Google service account credentials')
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: formattedPrivateKey,
    },
    scopes: SCOPES,
  })

  return google.drive({ version: 'v3', auth })
}

// Create a new Google Sheet for feedback
export async function createFeedbackSheet(): Promise<string> {
  const sheets = getGoogleSheetsClient()

  // Create new spreadsheet
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'GDG Opportunities Hub - Feedback',
      },
      sheets: [
        {
          properties: {
            title: 'Feedback',
            gridProperties: {
              frozenRowCount: 1, // Freeze header row
            },
          },
        },
      ],
    },
  })

  const spreadsheetId = response.data.spreadsheetId

  if (!spreadsheetId) {
    throw new Error('Failed to create spreadsheet')
  }

  // Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Feedback!A1:I1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        [
          'ID',
          'User Name',
          'User Email',
          'Type',
          'Subject',
          'Description',
          'Page URL',
          'Status',
          'Created At',
        ],
      ],
    },
  })

  // Format header row (bold, background color)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.58,
                  green: 0.44,
                  blue: 0.86,
                },
                textFormat: {
                  foregroundColor: {
                    red: 1,
                    green: 1,
                    blue: 1,
                  },
                  bold: true,
                },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
      ],
    },
  })

  // Make sheet publicly viewable (optional - for easier sharing)
  try {
    const drive = getGoogleDriveClient()
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })
  } catch (error) {
    console.warn('Could not set public permissions:', error)
  }

  console.log(`Created feedback sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`)

  return spreadsheetId
}

// Get or create feedback sheet ID
async function getSheetId(): Promise<string> {
  let sheetId = process.env.GOOGLE_SHEETS_FEEDBACK_ID

  if (!sheetId) {
    // Create new sheet and update environment variable
    sheetId = await createFeedbackSheet()
    console.log('⚠️  Add this to your .env.local file:')
    console.log(`GOOGLE_SHEETS_FEEDBACK_ID=${sheetId}`)
  }

  return sheetId
}

// Append feedback to Google Sheet
export async function appendFeedbackToSheet(feedback: FeedbackRow): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient()
    const spreadsheetId = await getSheetId()

    // Format the row data
    const row = [
      feedback.id,
      feedback.user_name,
      feedback.user_email || '',
      feedback.feedback_type,
      feedback.subject,
      feedback.description,
      feedback.page_url || '',
      feedback.status,
      new Date(feedback.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    ]

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Feedback!A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    })

    console.log(`✅ Appended feedback to Google Sheet: ${feedback.id}`)
  } catch (error) {
    console.error('❌ Failed to append feedback to Google Sheet:', error)
    // Don't throw - we don't want to fail the feedback submission if Sheets fails
  }
}

// Export all feedback to Google Sheets (for manual export)
export async function exportAllFeedbackToSheet(feedbackList: FeedbackRow[]): Promise<string> {
  const sheets = getGoogleSheetsClient()
  const spreadsheetId = await getSheetId()

  // Clear existing data (except header)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Feedback!A2:I',
  })

  // Prepare all rows
  const rows = feedbackList.map((feedback) => [
    feedback.id,
    feedback.user_name,
    feedback.user_email || '',
    feedback.feedback_type,
    feedback.subject,
    feedback.description,
    feedback.page_url || '',
    feedback.status,
    new Date(feedback.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  ])

  // Append all rows
  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Feedback!A2:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    })
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
}
