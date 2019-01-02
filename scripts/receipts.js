const {google} = require('googleapis');


/**
 * Prints the receipts for the afternoon
 # Currently uses old receipt sheets, need to update to current one.
 */
function sendAfternoonReceipts(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1uL4TKwHW3EUpRUSPUZokcVRdsHUfk3iYmsITI6biya4',
    range: 'Afternoon Main!A21:AR',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    // Build an array which will hold each message to be sent
    let messages = []
    const rows = res.data.values;
    if (rows.length) {
      // This i value keeps track of the number of receipts there are
      let i = -1
      // This index keeps track of which row is currently being read
      let index = 0
      rows.map((row) => {
      	if (i == -1) {
      		i = 0
      		for (let j = 0; j < row.length; j+=2) {
      			if (row[j] != undefined) {
      				i++
      				messages[j/2] = [row[j]]
      			}
      		}
      	} else {
      		index++
      		// At this point the number of receipts is known
      		for (let j = 0; j < i; j++) {
      			if (index >= 9) {
      				messages[j].push(row[j*2] + ' ' + row[(j*2)+1])
      			} else {
      				messages[j].push(row[j*2])
      			}
      		}
      	}
      });
	console.log(messages)
    } else {
      console.log('No data found.');
    }
  });
}