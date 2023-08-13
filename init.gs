const scriptProperties = PropertiesService.getScriptProperties()
const FORM_URL = scriptProperties.getProperty('FORM_URL')
const FIRESTORE_EMAIL = scriptProperties.getProperty('FIRESTORE_EMAIL')
const FIRESTORE_PROJECT_ID = scriptProperties.getProperty('FIRESTORE_PROJECT_ID')
const FIRESTORE_PRIVATE_KEY_1 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_1')
const FIRESTORE_PRIVATE_KEY_2 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_2')
const FIRESTORE_PRIVATE_KEY_3 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_3')
const FIRESTORE_PRIVATE_KEY_4 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_4')
const FIRESTORE_PRIVATE_KEY_5 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_5')
const FIRESTORE_PRIVATE_KEY_6 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_6')
const FIRESTORE_PRIVATE_KEY_7 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_7')
const FIRESTORE_PRIVATE_KEY_8 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_8')
const FIRESTORE_PRIVATE_KEY_9 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_9')
const FIRESTORE_PRIVATE_KEY_10 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_10')
const FIRESTORE_PRIVATE_KEY_11 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_11')
const FIRESTORE_PRIVATE_KEY_12 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_12')
const FIRESTORE_PRIVATE_KEY_13 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_13')
const FIRESTORE_PRIVATE_KEY_14 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_14')
const FIRESTORE_PRIVATE_KEY_15 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_15')
const FIRESTORE_PRIVATE_KEY_16 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_16')
const FIRESTORE_PRIVATE_KEY_17 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_17')
const FIRESTORE_PRIVATE_KEY_18 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_18')
const FIRESTORE_PRIVATE_KEY_19 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_19')
const FIRESTORE_PRIVATE_KEY_20 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_20')
const FIRESTORE_PRIVATE_KEY_21 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_21')
const FIRESTORE_PRIVATE_KEY_22 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_22')
const FIRESTORE_PRIVATE_KEY_23 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_23')
const FIRESTORE_PRIVATE_KEY_24 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_24')
const FIRESTORE_PRIVATE_KEY_25 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_25')
const FIRESTORE_PRIVATE_KEY_26 = scriptProperties.getProperty('FIRESTORE_PRIVATE_KEY_26')

const token = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_KEY');
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

const LEADERS_SOPRANO = ["U04DKNUDZ5E"]
const LEADERS_ALTO = ["U04CY8S381J"]
const LEADERS_TENOR = ["U04F7DX2SSJ"]
const LEADERS_BASS = ["U04C48AN0V6", "U04KCE45VDK"]
const parts = {
  soprano: {
    partName: "ソプラノ",
    leaders: LEADERS_SOPRANO,
  },
  alto: {
    partName: "アルト",
    leaders: LEADERS_ALTO,
  },
  tenor: {
    partName: "テナー",
    leaders: LEADERS_TENOR,
  },
  bass: {
    partName: "ベース",
    leaders: LEADERS_BASS,
  }
}
