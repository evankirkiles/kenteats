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
				this.handleDisconnect()
			} else {
				throw err
			}
		})
	}

	// Function which pulls the financial data from the MySQL database and enters it into the Bookkeeping Google Sheet. 
	// Will be called every night at 9:30 P.M., although will only update the Google Sheet if orders existed that day.
	// The order of the columns goes as follows:
	// A: ${DATE}, B: ${TOTAL REVENUE}, E: ${TOTAL SPENDING}, H: ${TOTAL PROFIT}, P: ${TOTAL VENMO}, T: ${TOTAL SQUARE}
	getFinancials(callback) {
		// Perform a MySQL query on the financials table to get the row of financial data
		this.con.query('SELECT profit,revenue,expenditures,venmo,card,day FROM financials WHERE googlesheets=0', (err, results) => {
			// If there was an error, return it
			if (err) { console.log(err); return }
			// If there isn't any data for the day, then do nothing
			if (results.length > 0) {
				// Otherwise, change the financials into the cell format
				let cells = []
				for (let i = 0; i < results.length; i++) {
					cells.push([results[0]['day'], results[0]['revenue'], undefined, undefined, results[0]['expenditures'], undefined, undefined, results[0]['profit'], undefined, undefined, undefined, undefined, undefined, undefined, results[0]['venmo'], undefined, undefined, undefined, undefined, results[0]['card']])
				}
				callback(cells)
			} else {
				console.log('Tried to update financials, but no un-financed data.')
				callback(undefined)
			}
		})
	}

	// Function which pulls the financial data for single orders to enter into the second Bookkeeping Google Sheet. Called
	// at the same time as the other GetFinancials function, and again will only update the Google Sheet if orders existed.
	// The order of the columns is also the same.
	getSingleOrderFinancials(callback) {
		// Get the current day for which to update
		let currDay = new Date();
		currDay = currDay.getFullYear() + '-' + (currDay.getMonth() + 1) + '-' + currDay.getDate()
		// Perform a MySQL query on the financials table to get the row of financial data
		this.con.query('SELECT profit,revenue,expenditures,venmo,card,day FROM financialorders WHERE googlesheets=0', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// If there isn't any data for the day, then do nothing
			if (results.length > 0) {
				// Build the cells data to return
				let cells = []
				// Iterate through the results and build a row for each (each one is an order)
				for (let i = 0; i < results.length; i++) {
					cells.push([results[i]['day'], results[i]['revenue'], undefined, undefined, results[i]['expenditures'], undefined, undefined, results[i]['profit'], undefined, undefined, undefined, undefined, undefined, undefined, results[i]['venmo'], undefined, undefined, undefined, undefined, results[0]['card']])
				}
				callback(cells)
			}
		})
	}

	// Function which pulls the data for student ID orders to enter into the student ID Google Sheet. Again, called
	// at the same time as the other GetFinancials functions.
	getStudentIDFinancials(callback) {
		// Perform a MySQL query on the financials table to get the row of financial data
		this.con.query('SELECT name,amount,phone,day FROM studentidorders WHERE googlesheets=0', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// If there isn't any data for the day, then do nothing
			if (results.length > 0) {
				// Build the cells data to return
				let cells = []
				// Iterate through the results and build a row for each (each one is an order)
				for (let i = 0; i < results.length; i++) {
					cells.push([results[i]['day'], results[i]['name'], results[i]['amount'], undefined, undefined, results[i]['phone']])
				}
				callback(cells)
			}
		})
	}

	// Function which pulls the data for student ID orders to enter into the student ID Google Sheet. Again, called
	// at the same time as the other GetFinancials functions.
	getVenmoFinancials(callback) {
		// Perform a MySQL query on the financials table to get the row of financial data
		this.con.query('SELECT name,amount,phone,day FROM venmoorders WHERE googlesheets=0', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// If there isn't any data for the day, then do nothing
			if (results.length > 0) {
				// Build the cells data to return
				let cells = []
				// Iterate through the results and build a row for each (each one is an order)
				for (let i = 0; i < results.length; i++) {
					cells.push([results[i]['day'], results[i]['name'], results[i]['amount'], undefined, undefined, results[i]['phone']])
				}
				callback(cells)
			}
		})
	}

	// Function which is called after the Google Sheets are filled to set the googlesheets columns back to 1.
	notifyFinancialsUpdated(type, callback) {
		// Perform the MySQL queries all at once
		this.con.query('UPDATE ' + type + ' SET googlesheets=1')
	}

	// Pulls the usedreferral column from the useranalytics database for the given phone number, which is true or false
	getReferralAvailability(phone, callback) {
		// Perform the MySQL query on the analytics table
		this.con.query('SELECT usedreferral,referredby FROM useranalytics WHERE phone="' + phone + '" LIMIT 1', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// Otherwise return a boolean of the availability
			if (results.length > 1) {
				callback(VAULT.deals.referrals.active && results[0]['usedreferral'] == 0 && results[0]['referredby'] != '-', results[0]['referredby'])
			} else {
				callback(false, 'asdasd')
			}
		})
	}

	// Sets the referral number for a user
	setReferralNumber(p_for, p_to, callback) {
		// Perform the MySQL query on the analytics table
		this.con.query('UPDATE useranalytics SET `referredby`="' + p_to + '" WHERE phone="' + p_for + '"', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			callback()
		})
	}

	// Pulls the numreferred column from the useranalytics database for the given phone number.
	getNumReferrals(phone, callback) {
		// Perform the MySQL query
		this.con.query('SELECT numreferred FROM useranalytics WHERE phone="' + phone + '" LIMIT 1', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// Otherwise return a boolean of the availability
			callback(results[0]['numreferred'])
		})
	}

	// 'Refers' someone by incrementing 1's numreferrals and setting 2's usedreferral to 1
	performReferral(num1, num2, referralsout, callback) {
		// Perform the two successive MySQL queries
		this.con.query('UPDATE useranalytics SET usedreferral=1 WHERE phone="' + num2 + '"', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			if (!referralsout) {
				this.con.query('UPDATE useranalytics SET numreferred=numreferred+1 WHERE phone="' + num1 + '"', (err, results) => {
					// If there was an error, return
					if (err) { console.log(err); return }
					// Otherwise callback
					callback()
				})
			} else {
				callback()
			}
		})
	}

	// Adds credit to a user's analytics account to be used in place of coupons.
	// THE AMOUNT PARAMETER SHOULD BE A STRING
	giveCredit(phone, amount, callback) {
		// Simply add the amount to the specific cell in the database.
		this.con.query('UPDATE useranalytics SET `storedcredit`=`storedcredit`+' + amount + ' WHERE phone="' + phone + '"', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// Otherwise log the success
			console.log('Added $' + amount + ' to the credit of ' + phone + '.')
			callback()
		})
	}

	// Pulls the coupons from the MySQL database for use in building the receipts (coupons will be applied in get receipts function).
	// Can also be used to check validity of coupons or view complete list of coupons as well.
	getCoupons(callback) {
		// Perform the MYSQL query on the coupons table
		this.con.query('SELECT * FROM coupons', (err, results) => {
			// if there was an error, return
			if (err) { console.log(err); return }
			// Otherwise return the rows retrieved
			callback(results)
		})
	}

	// Decrements the uses of a coupon in the database
	useCoupon(code, name) {
		// Perform the MySQL query on the coupons table
		this.con.query('SELECT uses FROM coupons WHERE code="' + code + '" LIMIT 1', (err, results) => {
			// Just query it quickly first to see if the coupon exists. If it doesn't then do not try to update the uses
			if (err) { console.log(err); return err }
			if (results.length > 0 && results[0]['uses'] > 0) {
				// Run another query that updates the column
				this.con.query('UPDATE coupons SET `uses`=`uses`-1 WHERE code="' + code + '"', (err, results) => {
					if (err) { console.log(err); return err }
					// If no hitches, log the use of the coupon
					console.log('Coupon "' + code + '" used by ' + name)
				})
			}
		})
	}

	// Takes money out of someone's credit.
	takeCredit(amount, phone) {
		// Perform the MySQL query on the analytics table
		this.con.query('UPDATE useranalytics SET `storedcredit`=`storedcredit`-' + amount.toFixed(2) + ' WHERE phone="' + phone + '"', (err, results) => {
			// If there was an error, log it
			if (err) { console.log(err); return err }
		})
	}

	// Pulls the credit of a user from the database
	getCredit(phone, callback) {
		// Perform the MySQL query on the useranalytics table
		this.con.query('SELECT storedcredit FROM useranalytics WHERE phone="' + phone + '"', (err, results) => {
			// If there was an error, return
			if (err) { console.log(err); return }
			// Otherwise return the stored credit
			callback(results[0]['storedcredit'])
		})
	}

	// Controller for analytics MySQL database which will keep track of data on each user.
	// Data will include, but not be limited to:
	// 	- name, dorm, phone number, aggregate spending, number of orders, number of orders at each different store
	// Each receipt will be processed to see if it is a new user (based on phone number), and if it is it returns a message
	// to send back to the user welcoming them as well as a console log telling the information of the new user.
	processReceipt(receipt, index, test, callback) {
		// Set the table name to test if using test
		let table = test ? 'testanalytics' : 'useranalytics'
		// Format the number
		let number = '+1' + receipt[15][0].replace(/\D+/g, '')
		// Process the financials at the same time
		this.processFinancials(receipt, index, test)

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
		this.con.query('SELECT phone, muted FROM useranalytics', (err, results) => {
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

	// Mutes a number in the database
	setNumberMuted(number, setting) {
		// Remove the number from the database
		this.con.query('UPDATE useranalytics SET muted=' + setting + ' WHERE phone="' + number + '"', (err, results) => {
			// Make sure no error occurred
			if (err) { return err }
			// Notify admin about the mute
    		console.log('Muted ' + number + ' from global announcements.')
		})
	}

	// Processes a receipt for the financial trackings. Needs to combine the stats of all the receipts so must retain
	// an object over multiple calls, hence it being a separate function.
	processFinancials(receipt, index, test) {
		// Set the table name to test if using test
		let table = test ? 'testfinancials' : 'financials'
		let table1 = test ? 'testfinancialorders' : 'financialorders'
		// Format the number (the number of the order)
		let number = 'order' + index
		// Get the date to eventually fill in
		let currDay = new Date();
		currDay = currDay.getFullYear() + '-' + (currDay.getMonth() + 1) + '-' + currDay.getDate()
		// Get the payment method first
		let paymentMethod = receipt[10][0].toLowerCase().replace(' ', '')

		// Check if the receipt is a student id order, for which it is necessary to add it to student id database
		if (paymentMethod.indexOf('stud') > -1) {
			this.con.query('INSERT INTO studentidorders (`day`,`name`,`amount`,`phone`) VALUES ("' + 
				currDay + '","' + receipt[0] + '",' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ',"' + receipt[15][0].replace(/\D+/g, '') + '")', (err, results) => {
				// If there was an error, log it
				if (err) { console.log(err); return err }
			})
		// Check if the receipt is a venmo order, for which it is necessary to add it to student id database
		} else if (paymentMethod.indexOf('venmo') > -1) {
			this.con.query('INSERT INTO venmoorders (`day`,`name`,`amount`,`phone`) VALUES ("' + 
				currDay + '","' + receipt[0] + '",' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ',"' + receipt[15][0].replace(/\D+/g, '') + '")', (err, results) => {
				// If there was an error, log it
				if (err) { console.log(err); return err }
			})
		}

		// Adds a row to represent the order
		let expenditures = parseFloat(receipt[20][1].replace('$', '')) - receipt[22]
		this.con.query('INSERT INTO ' + table1 + '(`day`,`profit`, `revenue`,`expenditures`,`venmo`,`card`,`phone`) VALUES ("' + 
			currDay + '",' +                                                         // The day
			receipt[22].toFixed(2) + ',' +           // The profit
			parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ',' +           // The total transaction
			expenditures.toFixed(2) + ',' +                                          // The money spent on food
			(paymentMethod.indexOf('venmo') > -1 ? parseFloat(receipt[20][1].replace('$', '')).toFixed(2) : '0.00') + ',' +
			(paymentMethod.indexOf('square') > -1 || paymentMethod.indexOf('card') > -1 ? parseFloat(receipt[20][1].replace('$', '')).toFixed(2) : '0.00') + ',"+1' +
			receipt[15][0].replace(/\D+/g, '') + '")',                               // The phone number of whoever placed order
			(err, results) => {
				// If there was an error, log it
				if (err) { console.log(err); return err }
			}
		)

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
					this.con.query('SELECT * FROM ' + table + ' WHERE day="' + currDay + '" LIMIT 1', (err, returns) => {
						// If there was an error, say it
						if (err) { console.log(err); return err }
						// Update the financials
						this.updateFinancials(receipt, table, number, currDay, returns, (err, returns2) => {
							// Update the running totals for type of transaction
							let returnString = 'UPDATE ' + table  + ' SET `'
							// Choose payment type to increment based on the receipt
							let paymentMethod = receipt[10][0].toLowerCase().replace(' ', '')
							if (paymentMethod.indexOf('cash') > -1 || paymentMethod.indexOf('square') > -1) {
								returnString += 'cash`=`cash`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
							} else if (paymentMethod.indexOf('card') > -1) {
								returnString += 'card`=`card`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
							} else if (paymentMethod.indexOf('venmo') > -1) {
								returnString += 'venmo`=`venmo`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
							} else if (paymentMethod.indexOf('id') > -1) {
								returnString += 'studentid`=`studentid`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
							}
							// Finish the return string
							returnString += ' WHERE day="' + currDay + '"'
							// Finally, run the query
							this.con.query(returnString)
						})
					}) 
				})
			// If column does exist, go straight to adding the day
			} else {
				this.con.query('SELECT * FROM ' + table + ' WHERE day="' + currDay + '" LIMIT 1', (err, returns) => {
					// If there was an error, say it
					if (err) { console.log(err); return err }
					// Update the financials
					this.updateFinancials(receipt, table, number, currDay, returns, () => {

						// Update the running totals for type of transaction
						let returnString = 'UPDATE ' + table  + ' SET `'
						// Choose payment type to increment based on the receipt
						let paymentMethod = receipt[10][0].toLowerCase().replace(' ', '')
						if (paymentMethod.indexOf('cash') > -1 || paymentMethod.indexOf('square') > -1) {
							returnString += 'cash`=`cash`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
						} else if (paymentMethod.indexOf('card') > -1) {
							returnString += 'card`=`card`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
						} else if (paymentMethod.indexOf('venmo') > -1) {
							returnString += 'venmo`=`venmo`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
						} else if (paymentMethod.indexOf('id') > -1) {
							returnString += 'studentid`=`studentid`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2)
						}

						// Finish the return string
						returnString += ' WHERE day="' + currDay + '"'
						// Finally, run the query
						this.con.query(returnString)
					})
				}) 
			}
		})
	}

	//  Updates financial table (necessary so don't repeat code much)
	updateFinancials(receipt, table, number, currDay, returns, callback) {
		let expenditures = parseFloat(receipt[20][1].replace('$', '')) - receipt[22]
		// Otherwise perform check on the size of return, if 0 then row does not exist
		if (returns.length > 0) {
			this.con.query('UPDATE ' + table + ' SET `profit`=`profit`+' + receipt[22].toFixed(2) + ',`revenue`=`revenue`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ',`expenditures`=`expenditures`+' + expenditures.toFixed(2) +  ',`' + number + '`=`' + number + '`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ' WHERE day="' + currDay + '"', callback())
		// If row doesn't exist, then simply insert this one
		} else {
			this.con.query('INSERT INTO ' + table + ' (`profit`,`revenue`,`expenditures`,`day`, `' + number + '`) VALUES (' + receipt[22].toFixed(2) + ',' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ',' + expenditures.toFixed(2) + ',"' + currDay + '", ' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ')', (err, result) => {
				if (err) {
					// If the inputs got backed up, then just reroute the request again
					if (err.code == 'ER_DUP_ENTRY') {
						this.con.query('UPDATE ' + table + ' SET `profit`=`profit`+' + receipt[22].toFixed(2) + ',`revenue`=`revenue`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ',`expenditures`=`expenditures`+' + expenditures.toFixed(2) +  ',`' + number + '`=`' + number + '`+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + ' WHERE day="' + currDay + '"', callback())
					} else {
						console.log(err); return err 
					}
				} else {
					callback()
				}
			})
		}
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
		toReturn += 'name="' + receipt[0] + '",' 
		if (receipt[11][0] != undefined) { 
			toReturn += 'dorm="' + receipt[11][0] + '",' 
		} else {
			for (let i = 0; i < VAULT.dorms.length; i++) {
				if (receipt[12][0].toLowerCase().indexOf(VAULT.dorms[i].toLowerCase()) > -1) {
					toReturn += 'dorm="' + VAULT.dorms[i] + '",'
					break
				}
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
					',spending=spending+' + parseFloat(receipt[20][1].replace('$', '')).toFixed(2) + 
					',profit=profit+' + receipt[22].toFixed(2) +
					' WHERE phone=\'+1' + receipt[15][0].replace(/\D+/g, '') + '\''
		return toReturn
	}
}



module.exports.SQLInterface = SQLInterface