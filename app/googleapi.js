const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const VAULT = require('../config/vault.json')
const FuzzySet = require('fuzzyset')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

function runAuthorizeFunction(funcToRun, args, callback) {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), (auth) => {
      funcToRun(auth, callback, args)
    })
  })
}

module.exports.runAuthorizeFunction = runAuthorizeFunction

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function asdasd(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1KKfMseFC2xg0FzYmnTuTukTnqY4UUbhEIvZ2xjyHbNA',
    range: 'Sheet1!A2:F',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Codename, First Name, Last Name:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[1]}, ${row[2]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

module.exports.asdasd = asdasd

/**
 * Fills in the bookkeeping sheet with the necessary information at the end of the day. (FULL-DAY ORDER STATISTICS)
 */
function fillFullDayBookkeeping(auth, callback, data) {
  // If the data is undefined, then do nothing
  if (data == undefined) { return }
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1Gxg4E_WcXnN-x21fIA3yr3msZ1XPEZm-RW4FoeKBRTg',
    range: 'Sheet1!A1:A999',
  }, (err, result) => {
    if (err) return console.log('The API returned an error: ' + err);
    // Cycle through the results to find the first empty cell to begin the range with
    let range = 'Sheet1!A' + (result.data.values.length + 1) + ':T'
    // With the range in hand, use the data to perform another query which updates the spreadsheet
    sheets.spreadsheets.values.update({
      spreadsheetId: '1Gxg4E_WcXnN-x21fIA3yr3msZ1XPEZm-RW4FoeKBRTg',
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: data
      },
    }, (err, result) => {
      if (err) return console.log('The API returned an error: ' + err);
      // Log the updated books
      console.log('Updated full-day financal tracking Google Sheet!')
      callback(result)
    })
  })
}

/**
 * Fills in the bookkeeping sheet for each order at the end of the day. (SINGLE ORDER STATISTICS)
 */
function fillSingleOrderBookkeeping(auth, callback, data) {
  // If the data is undefined, then do nothing
  if (data == undefined) { return }
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '13Etz5yHco9C4x07RVSXboZ2j4sk8WK66Fw8CjbnfJoM',
    range: 'Sheet1!A1:A999'
  }, (err, result) => {
    if (err) return console.log('The API returned an error: ' + err)
      // Cycle through the results to find the first empty cell to begin the range with
    let range = 'Sheet1!A' + (result.data.values.length + 1) + ':T' + (result.data.values.length + 1 + data.length)
    // With the range in hand, use the data to perform another query which updates the spreadsheet
    sheets.spreadsheets.values.update({
      spreadsheetId: '13Etz5yHco9C4x07RVSXboZ2j4sk8WK66Fw8CjbnfJoM',
      range: range, 
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: data
      }
    }, (err, result) => {
      if (err) return console.log('The API returned an error: ' + err)
      // Log the updated books
      console.log('Updated single-order financial tracking Google Sheet!')
      callback(result)
    })
  })
}

module.exports.fillSingleOrderBookkeeping = fillSingleOrderBookkeeping
module.exports.fillFullDayBookkeeping = fillFullDayBookkeeping

/**
 * Returns the receipts for a given time
 */
function getReceipts(auth, callback, type) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '13RBFxTLfO7bCwFgvyxp3K4QVDI82Y-JJXA6sJyEyBas',
    range: 'Complete ' + type + ' Receipt!A1:AD137',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    // Build an array which will hold each message to be sent
    let messages = []
    const rows = res.data.values;
    if (rows.length) {
      // This array keeps track of the starting points of each receipt
      let receiptStarts = []
      let numreceits = 0
      let fuzzyStores = FuzzySet(Object.keys(VAULT.stores))
      // This index keeps track of which row is currently being read
      let index = 0
      rows.map((row) => {
        if (index == 0) {
          index++
        } else if (index == 1) {
      		for (let j = 0; j < row.length; j++) {
      			if (row[j] != undefined && row[j] != '' && row[j] != '#REF!') {
      				receiptStarts.push(j)
      				messages.push([row[j]])
      			}
      		}
          index++
      	} else if (index == 22 || index == 45 || index == 68 || index == 91 || index == 114 || index == 137 || index == 160 || index == 183) {
          receiptStarts = []
          numreceits = messages.length
          index = 0
        } else {
          // At this point the number of receipts is known
      		index++

          // CAREFUL: VERY SPECIFIC CODE BASED ON THE POSITION OF EACH RECEIPT COMPONENT
          // If the index is the profit or price index, make sure to add the fee correctly (not always 5)
           if (index == 19) {
            for (let j = 0; j < receiptStarts.length; j++) {
              // The delivery fee needs to be set by the code
                messages[numreceits+j].push([undefined, VAULT.deliveryfee, undefined])
            }
          } else if (index == 21) {
            for (let j = 0; j < receiptStarts.length; j++) {
              // Add the delivery fee difference with the 5 default
                messages[numreceits+j].push([row[receiptStarts[j]], row[receiptStarts[j]+1] + VAULT.deliveryfee - 5, undefined])
            }
          } else {
            for (let j = 0; j < receiptStarts.length; j++) {
                messages[numreceits+j].push([row[receiptStarts[j]], row[receiptStarts[j]+1], row[receiptStarts[j]+2]])
            }
          }
      	}
      });

      // Once all the receipts are built, reformat the stores
      for (let i = 0; i < messages.length; i++) {
        for (let j = 2; j < 10; j++) {
          if (messages[i][j][0] != '#VALUE!') {
            messages[i][j][1] = fuzzyStores.get(messages[i][j][0].match(/\(([^)]+)\)/)[1])[0][1]
          } else {
            break;
          }
        }
      }
	   callback(messages)
    } else {
      callback('No data found.')
    }
  });
}

module.exports.getReceipts = getReceipts

/*
*   Creates a readable format for a receipt based on its existing values.
*/
function receiptToString(receipt, admin, index) {
  // First element is always the name
  var toReturn = "-- Receipt for " + receipt[0] + " --\n"
  toReturn += (index != undefined ? ('Order Number: ' + index + '\n') : '') + "Items: \n"
  // Iterate through items and add each one that exists
  for (let i = 0; i < 8; i++) {
    if (receipt[2 + i][0] != '#VALUE!' && receipt[2 + i][0] != '#REF!') {
      let item = i == 0 ? receipt[2 + i][0].slice(0, -1) : receipt[2 + i][0]
      toReturn += "[" + item + ": $" + receipt[2 + i][2] + "\n"
    }
  }
  // Next comes payment method and drop off location
  if (admin) {
    toReturn += "Payment Method: " + receipt[10][0] + (receipt[10][0] == 'Venmo' ? ('\nVenmo: ' + receipt[14][0]) : '')
  } else {
    toReturn += "Payment Method: " + receipt[10][0] + (receipt[10][0] == 'Venmo' ? '\nPay to: Brady_McGowan' : '')
  }
  toReturn += "\nLocation: " + receipt[11][0] + "\nPhone: " + receipt[15][0] +
                "\nTotal Without Fee: " + receipt[17][1] + "\nFee: " + receipt[18][1] + "\nTotal: " + receipt[20][1]
  // Finally return this string
  return toReturn
}

/*
* Creates a readable order format for a receipt (only includes items and the total price)
*/
function orderToString(receipt, ordernum) {
  // First element is always the name
  var toReturn = "- Order #" + ordernum + " for " + receipt[0] + " -\nItems:\n"
  // Iterate through the items and add each one that eixsts
  for (let i = 0; i < 8; i++) {
    if (receipt[2 + i][0] != '#VALUE!' && receipt[2 + i][0] != '#REF!') {
      let item = i == 0 ? receipt[2 + i][0].slice(0, -1) : receipt[2 + i][0]
      toReturn += "[" + item + "\n"
    }
  }
  // Next comes total price
  toReturn += "Total: " + receipt[20][1] + "\nPay with: " + receipt[10][0]
  return toReturn
}

module.exports.receiptToString = receiptToString
module.exports.orderToString = orderToString