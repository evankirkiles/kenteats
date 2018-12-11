// Filesystem for read and write
var mysql = require('mysql')
// Import the vault for file locations
var VAULT = require('../config/vault.json')

// Using an ES6 class to maintain the MySQL connection.
class SQLInterface {
	// Constructor initializes the MySQL connection
	constructor() {
		// Initialize the params
		this.conParams = {
			host: VAULT.mysql.host,
			user: VAULT.mysql.username,
			password: VAULT.mysql.password,
			dateStrings: true,
			database: 'kenteats'
		}

		// Build the connection now
		this.handleDisconnect()
	}

	// Handle disconnect function simply rebuilds the connection with the same params
	handleDisconnect() {
		// Initialize the connection
		this.con = mysql.createConnection(this.conParams)
		// On error, handle it
		this.con.on('error', (err) => {
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				console.log('Database error, restoring session.')
				this.handleDisconnect()
			} else {
				throw err
			}
		})
	}

	// Controller for analytics MySQL database which will keep track of data on each user.
	// Data will include, but not be limited to:
	// 	- name, dorm, phone number, aggregate spending, number of orders, number of orders at each different store
	// Each receipt will be processed to see if it is a new user (based on phone number), and if it is it returns a message
	// to send back to the user welcoming them as well as a console log telling the information of the new user.
	processReceipt(receipt, test, callback) {
		// Set the table name to test if using test
		let table = test ? 'testanalytics' : 'useranalytics'
		// Format the number
		let number = '+1' + receipt[15][0].replace(/\D+/g, '')

		// Process the financials at the same time
		this.processFinancials(receipt, test)

		// Check if number exists in database and if it does, update the name. Also,
		// parse through the items ordered in the receipt and add the price and 1 to corresponding columns.
		this.con.query('SELECT * FROM ' + table +' WHERE phone=' + number, (err, results) => {
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
				this.con.query('INSERT INTO ' + table + ' (name, phone, dorm) VALUES (\'' + 
					userObject.username + '\', \'' + userObject.phone + '\', \'' + userObject.dorm + '\')', (err, results) => {
						// If there was en error, return it
						if (err) { console.log(err); return }

					// Now that new unique row was created with the phone number, update the orders/spending
					this.con.query(this.interpretOrdersFromReceipt(receipt, table), (err, results) => {
						// If there was en error, return it
						if (err) { console.log(err); return }	
					})
				})
			} else {
				// Update spending and orders from the receipt
				this.con.query(this.interpretOrdersFromReceipt(receipt, table), (err, results) => {
					// If there was en error, return it
					if (err) { console.log(err); return }	
				})
			}
		})
	}

	// Retrieves all the numbers from the database and returns it in an array for the announce command to iterate through.
	pullNumbers(callback) {
		// Query all numbers
		this.con.query('SELECT phone FROM useranalytics', (err, results) => {
			// Make sure no error occured
			if (err) { return err }
			// Otherwise return the results
			callback(results)
		})
	}

	// Adds a number to the database
	addNumber(number) {
		// Simply insert the number into the database
		this.con.query('INSERT INTO useranalytics (name,phone) VALUES ("","' + number + '")', (err, results) => {
			// Make sure no error occurred
			if (err) { return err }
			// Otherwise notify that a user was added
			console.log('Added number to database: ' + number)
		})
	}

	// Processes a receipt for the financial trackings. Needs to combine the stats of all the receipts so must retain
	// an object over multiple calls, hence it being a separate function.
	processFinancials(receipt, test) {
		// Set the table name to test if using test
		let table = test ? 'testfinancials' : 'financials'
		// Format the number
		let number = '+1' + receipt[15][0].replace(/\D+/g, '')
		// Save expenditures here so do not need to do it in mysql
		let expenditures = parseFloat(receipt[20][1].replace('$', '')) - parseFloat(receipt[18][1].replace('$', ''))
		// Get the date to eventually fill in
		let currDay = new Date();
		currDay = currDay.getFullYear() + '-' + (currDay.getMonth() + 1) + '-' + currDay.getDate()
		// Checks if the column exists in the database. If it doesn't, then create the column
		this.con.query('SHOW COLUMNS FROM ' + table + ' LIKE "' + number + '"', (err, results) => {
			// Make sure no error occurred
			if (err) { console.log(err); return err }
			// Check the size of the results, if the column doesn't exist then make it
			if (results.length == 0) {
				// Create the column if it doesn't exist
				this.con.query('ALTER TABLE `' + table + '` ADD COLUMN `' + number + '` DOUBLE NOT NULL DEFAULT 0', (err, results) => {
					// If there was an error, say it
					if (err) { console.log(err); return err }
					// Otherwise continue on to update the spending for the user (and add )
					this.con.query('SELECT * FROM ' + table + ' WHERE day=`' + currDay + '` LIMIT 1', (err, returns) => {
						// If there was an error, say it
						if (err) { console.log(err); return err }
						// Otherwise perform check on the size of return, if 0 then row does not exist
						if (returns.length > 0) {
							this.con.query('UPDATE ' + table + ' SET `profit`=`profit`+' + receipt[18][1].replace('$', '') + ',`revenue`=`revenue`+' + receipt[20][1].replace('$', '') + ',`expenditures`=`expenditures`+' + expenditures.toFixed(2) +  ',`' + number + '`=`' + number + '`+' + receipt[20][1].replace('$', '') + ' WHERE day="' + currDay + '"')
						// If row doesn't exist, then simply insert this one
						} else {
							this.con.query('INSERT INTO ' + table + ' (`profit`,`revenue`,`expenditures`,`day`, `' + number + '`) VALUES (' + receipt[18][1].replace('$', '') + ',' + receipt[20][1].replace('$', '') + ',' + expenditures.toFixed(2) + ',"' + currDay + '", ' + receipt[20][1].replace('$', '') + ')')
						}
					}) 
				})
			// If column does exist, go straight to adding the day
			} else {
				this.con.query('SELECT * FROM ' + table + ' WHERE day="' + currDay + '" LIMIT 1', (err, returns) => {
					// If there was an error, say it
					if (err) { console.log(err); return err }
					// Otherwise perform check on the size of return, if 0 then row does not exist
					if (returns.length > 0) {
						this.con.query('UPDATE ' + table + ' SET `profit`=`profit`+' + receipt[18][1].replace('$', '') + ',`revenue`=`revenue`+' + receipt[20][1].replace('$', '') + ',`expenditures`=`expenditures`+' + expenditures.toFixed(2) +  ',`' + number + '`=`' + number + '`+' + receipt[20][1].replace('$', '') + ' WHERE day="' + currDay + '"')
					// If row doesn't exist, then simply insert this one
					} else {
						this.con.query('INSERT INTO ' + table + ' (`profit`,`revenue`,`expenditures`,`day`, `' + number + '`) VALUES (' + receipt[18][1].replace('$', '') + ',' + receipt[20][1].replace('$', '') + ',' + expenditures.toFixed(2) + ',"' + currDay + '", ' + receipt[20][1].replace('$', '') + ')')
					}
				}) 
			}
		})
	}

	// Interprets a receipt to find out how much was spent on each store and how many orders were placed.
	// Returns the information in a SQL formatted string for updating.
	interpretOrdersFromReceipt(receipt, table) {
		// Now add the specifics of the user's spending and orders
		let toReturn = 'UPDATE ' + table + ' SET '
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

		// Update the name and dorm with those on the receipt
		toReturn += 'name="' + receipt[0] + '",dorm="' + receipt[11][0] + '",'

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