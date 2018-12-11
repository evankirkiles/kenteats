const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
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
      funcToRun(auth, args, callback)
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
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

/**
 * Returns the receipts for a given time
 */
function getReceipts(auth, type, callback) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '13RBFxTLfO7bCwFgvyxp3K4QVDI82Y-JJXA6sJyEyBas',
    range: 'Complete ' + type + ' Receipt!A1:AD91',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    // Build an array which will hold each message to be sent
    var messages = []
    const rows = res.data.values;
    if (rows.length) {
      // This array keeps track of the starting points of each receipt
      let receiptStarts = []
      let numreceits = 0
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
      	} else if (index == 22 || index == 45 || index == 68 || index == 91 || index == 112 || index == 134) {
          receiptStarts = []
          numreceits = messages.length
          index = 0
        } else if (index == 45) {
          receiptStarts = []
          numreceits = messages.length
          index = 0
        } else {
      		index++
      		// At this point the number of receipts is known
      		for (let j = 0; j < receiptStarts.length; j++) {
              messages[numreceits+j].push([row[receiptStarts[j]], row[receiptStarts[j]+1], row[receiptStarts[j]+2]])
      		}
      	}
      });
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