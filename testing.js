const googleapi = require('./app/googleapi')

let store = undefined

googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Afternoon', (data) => {
	for (let i = 0; i < data.length; i++) {
		// Do some cleanup on the receipts and then send the normalized message without accents
		if (store == undefined) {
			console.log(googleapi.receiptToString(data[i], true, i+1).normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
		} else {
			// Check if the store matches any of the items' store
			for (let j = 2; j < 10; j++) {
				if (data[i][j][1] != undefined && data[i][j][1] == store) {
					console.log(googleapi.receiptToString(data[i], true, i+1).normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
					j = 10
				}		
			}
		}
	}

	// Log this action to console
	if (store == undefined) {
		console.log('Retrieved all ' + type + ' receipts!')
	} else {
		console.log('Retrieved all ' + store + ' ' + type + ' receipts!')
	}	
})
