const googleapi = require('./app/googleapi')
const SQLInterface = require('./app/analytics').SQLInterface
const database = new SQLInterface()

let ind = 1
googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Breakfast', (data) => {
	for (let i = 0; i < data.length; i++) {
		// Update the receipt database
		database.processReceipt(data[i], ind, false, (returned) => {})
		ind++
	}
})