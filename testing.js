const googleapi = require('./app/googleapi')
const SQLInterface = require('./app/analytics').SQLInterface
const database = new SQLInterface()

let currentDayOrders = 0;
let currentDay = new Date();

// First validate the current day's orders
let currDayTemp = new Date();
currDayTemp = currDayTemp.getFullYear() + '-' + (currDayTemp.getMonth() + 1) + '-' + currDayTemp.getDate()
if (currDayTemp != currentDay) {
	currentDayOrders = 0
	currentDay = currDayTemp
}

// Get the type and convert it into the right format
googleapi.runAuthorizeFunction(googleapi.getReceipts, 'Afternoon', (data) => {

	// For each string, send a message to the recipient containing their receipt
	for (let i = 0; i < data.length; i++) {
		// Update the running total of orders in the day
		currentDayOrders++

		// Make sure the number exists
		if (data[i][15][0] == undefined) { continue; }

		// Update the receipt database
		database.processReceipt(data[i], currentDayOrders, false, (returned) => {})
	}
})


