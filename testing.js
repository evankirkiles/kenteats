const googleapi = require('./app/googleapi')
const SQLInterface = require('./app/analytics').SQLInterface

// Run the MySQL query to determine if any data is available
let financeData = new SQLInterface()
financeData.getFinancials((data) => {
	// With the data in hand, fill the books with it
	googleapi.runAuthorizeFunction(googleapi.fillBookkeeping, data, () => {})
})
