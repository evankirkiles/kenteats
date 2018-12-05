// Filesystem for read and write
var mysql = require('mysql')
// Import the vault for file locations
var VAULT = require('../config/vault.json')

// Using an ES6 class to maintain the MySQL connection.
class SQLInterface {
	// Constructor initializes the MySQL connection
	constructor() {
		this.con = mysql.createConnection({
			host: VAULT.mysql.host,
			user: VAULT.mysql.username,
			password: VAULT.mysql.password,
			database: 'kenteats'
		})
	}

	// Controller for analytics MySQL database which will keep track of data on each user.
	// Data will include, but not be limited to:
	// 	- name, dorm, phone number, aggregate spending, number of orders, number of orders at each different store
	// Each receipt will be processed to see if it is a new user (based on phone number), and if it is it returns a message
	// to send back to the user welcoming them as well as a console log telling the information of the new user.
	processReceipt(receipt, callback) {
		// Format the number
		let number = '+1' + receipt[15][0].replace(/\D+/g, '')
		// Check if number exists in database and if it does, update the name. Also,
		// parse through the items ordered in the receipt and add the price and 1 to corresponding columns.
		this.con.query('SELECT * FROM useranalytics WHERE phone=' + number, (err, results) => {
			// If there was en error, return it
			if (err) { console.log(err); return }
			let userObject = {}
			// Phone numbers in the database are unique, so result can only have 1 or 0 elements
			if (results.length == 0) {
				// Create the userObject based on the receipt and then add it into the MySQL database
				userObject.username = receipt[0]
				console.log('Processing receipt for \'' + userObject.username + '\'')
				userObject.phone = '+1' + receipt[15][0].replace(/\D+/g, '')
				userObject.dorm = receipt[11][0] != undefined ? receipt[11][0] : receipt[12][0]
				// Perform the insert of the new userobject with the spending and orders as the initial values
				this.con.query('INSERT INTO useranalytics (name, phone, dorm) VALUES (\'' + 
					userObject.username + '\', \'' + userObject.phone + '\', \'' + userObject.dorm + '\')', (err, results) => {
						// If there was en error, return it
						if (err) { console.log(err); return }

					// Now that new unique row was created with the phone number, update the orders/spending
					this.con.query(this.interpretOrdersFromReceipt(receipt), (err, results) => {
						// If there was en error, return it
						if (err) { console.log(err); return }	
					})
				})
			} else {
				// Update spending and orders from the receipt
				this.con.query(this.interpretOrdersFromReceipt(receipt), (err, results) => {
					// If there was en error, return it
					if (err) { console.log(err); return }	
				})
			}
		})
	}

	// Processes a receipt for the financial trackings. Needs to combine the stats of all the receipts so must retain
	// an object over multiple calls, hence it being a separate function.

	// Interprets a receipt to find out how much was spent on each store and how many orders were placed.
	// Returns the information in a SQL formatted string for updating.
	interpretOrdersFromReceipt(receipt) {
		// Now add the specifics of the user's spending and orders
		let toReturn = 'UPDATE useranalytics SET '
		let updateObj = {
			"Chipotle": { orders: 0, spending: 0.0 } ,
	        "Chick-A": { orders: 0, spending: 0.0 } ,
	        "Taco Bell": { orders: 0, spending: 0.0 } ,
	        "Five Guys": { orders: 0, spending: 0.0 } ,
	        "Panera": { orders: 0, spending: 0.0 } ,
	        "Wendys": { orders: 0, spending: 0.0 } ,
	        "McDonalds": { orders: 0, spending: 0.0 } ,
	        "Starbucks": { orders: 0, spending: 0.0 } ,
	        "Dunkin": { orders: 0, spending: 0.0 } ,
	        "Dominos": { orders: 0, spending: 0.0 } 
		}

		// Totals need to be tracked as well
		let totalOrders = 0
		for (let i = 2; i < 10; i++) {
			// If the item exists, add its spending and order to the updateObject
			if (receipt[i][0] != '#VALUE!' && receipt[i][0] != '#REF!' && receipt[i][2] != '') {
				// Only update for items which have a price
				updateObj[receipt[i][1]].orders += 1
				totalOrders += 1
				updateObj[receipt[i][1]].spending += parseFloat(receipt[i][2]) * 1.06
			}
		}

		// Now return the full MySQL update string for all stores
		Object.keys(updateObj).forEach((key) => {
			// Increment the orders and the spending for each
			toReturn += key.toLowerCase().replace(' ', '').replace(/-/g, '') + 'orders=' + 
				key.toLowerCase().replace(' ', '').replace(/-/g, '') + 'orders+' + updateObj[key].orders + ',' 
					 + key.toLowerCase().replace(' ', '').replace(/-/g, '') + 'spending=' + 
				key.toLowerCase().replace(' ', '').replace(/-/g, '') + 'spending+' + updateObj[key].spending.toFixed(2) + ',' 
		})

		// Finally add total orders and total spending, as well as profit
		toReturn += 'itemsordered=itemsordered+' + totalOrders + 
					',spending=spending+' + receipt[20][1].replace('$', '') + 
					',profit=profit+' + receipt[18][1].replace('$', '') +
					' WHERE phone=\'+1' + receipt[15][0].replace(/\D+/g, '') + '\''
		return toReturn
	}
}



module.exports.SQLInterface = SQLInterface