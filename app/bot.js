// Import the vault for password/username
var VAULT = require('../config/vault.json')
// Google API for getting receipts and other data
var googleapi = require('./googleapi')
// Analytics for user data
var SQLInterface = require('./analytics').SQLInterface
// Twilio / http imports
const http = require('http')
const express = require('express')
const MessagingResponse = require('twilio').twiml.MessagingResponse
const bodyParser = require('body-parser')
// Twilio number-specific messaging
const client = require('twilio')(VAULT.twilio.accountSid, VAULT.twilio.authToken)

// Initialize the application
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))

// Listen for messages sent to Twilio
app.post('/', (req, res) => {
	const twiml = new MessagingResponse()
	const database = new SQLInterface()

	// Log the command to the console
	console.log("[" + new Date(Date.now()).toLocaleString() + "] (" + req.body.From + ") " + req.body.Body)

	// HELP COMMAND
	// Pass in the name of an argument or type just "help" to get a list of arguments
	// USAGE: 'help' or 'help get receipts'
	if (req.body.Body.toLowerCase().indexOf('?') > -1) {
		// Separate admin commands from others
		if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
			let commands = VAULT.admincommands
			// If there is a command after 'help', then check to see if more help can be provided
			if (req.body.Body.trim().toLowerCase() != '?') {
				let keyword = req.body.Body.replace('? ', '').toLowerCase()
				Object.keys(commands).forEach((key) => {
					if (key.indexOf(keyword) > -1) {
						twiml.message(commands[key])
					}
				})
			} else {
				let toPrint = ""
				// Otherwise, just list out all of the commands
				toPrint += "Admin commands:\n"
				Object.keys(commands).forEach(function(key) {
			  		toPrint += "- " + key + "\n"
				})
				toPrint += "Type '? [COMMAND]' to see more info.\n"
				// Finally print the message
				twiml.message(toPrint)
			}
			// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())
		} else {
			twiml.message('No commands yet for non-admins! Sorry!')
			// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())
		}

	// GET RECEIPT COMMAND
	// Gets the receipts for the given parameters
	// Usage: 'Get breakfast receipts' or 'Get breakfast receipts for Starbucks'
	} else if (req.body.Body.toLowerCase().indexOf('get') > -1 && req.body.Body.toLowerCase().indexOf('receipt') > -1) {
		// Check if the phone number is a valid number
		if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
			// Get the type and convert it into the right format
			let type = req.body.Body.split(" ")[1].toLowerCase()
			type = type.charAt(0).toUpperCase() + type.slice(1)
			googleapi.runAuthorizeFunction(googleapi.getReceipts, type, (data) => {
				// Get the store name as well and convert it into the right format, if specified
				let store = undefined
				if (req.body.Body.toLowerCase().indexOf('for') > -1) {
					console.log('asdad')
					store = req.body.Body.split(" ")
					store = store[store.length - 1].toLowerCase()
					store = store.charAt(0).toUpperCase() + store.slice(1)
				}

				for (let i = 0; i < data.length; i++) {
					// Do some cleanup on the receipts and then send the normalized message without accents
					if (store == undefined) {
						twiml.message(googleapi.receiptToString(data[i]).normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
						
					} else {
						// Check if the store matches any of the items' store
						for (let j = 2; j < 10; j++) {
							if (data[i][j][1] != undefined && data[i][j][1] == store) {
								twiml.message(googleapi.receiptToString(data[i]).normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
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

				// Add a content accepted header
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			})
		} else {
			twiml.message('Invalid permission for this command!')
		}

	// SEND RECEIPT COMMAND
	// Usage: 'Send breakfast receipts NAME' or 'Send breakfast receipts'
	} else if (req.body.Body.toLowerCase().indexOf('send') > -1 && req.body.Body.toLowerCase().indexOf('receipt') > -1) {
		// Check if the phone number is a valid number
		if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
			// Get the type and convert it into the right format
			let type = req.body.Body.split(" ")[1].toLowerCase()
			type = type.charAt(0).toUpperCase() + type.slice(1)
			googleapi.runAuthorizeFunction(googleapi.getReceipts, type, (data) => {
				// If there is a name given after the 'Send TYPE receipt', use it in filtering
				let name = req.body.Body.split(" ")
				if (name.length > 3) { name = name[3] } else { name = undefined }

				// For each string, send a message to the recipient containing their receipt
				let sentAMessage = false
				for (let i = 0; i < data.length; i++) {
					// Update the receipt
					database.processReceipt(data[i], (returned) => {})
					// If name is specified, check it against each data
					if (name == undefined || data[i][0][0].toLowerCase().indexOf(name.toLowerCase()) > -1) {
						// Get the number without dashes or parentheses or spaces and add +1
						let number = '+1' + data[i][15][0].replace(/\D+/g, '')
						// Do some cleanup on the receipts and then send the normalized messages to their corresponding recipients
						client.messages.create({
							body: googleapi.receiptToString(data[i]),
							to: number,
							from: '+12038946844'
						})
						sentAMessage = true
					}
				}

				// Log this action to console and notify sender
				if (sentAMessage) {
					twiml.message('Sent the ' + type + ' receipts.')
					if (name == undefined) {
						console.log('Sent all ' + type + ' receipts!')	
					} else {
						console.log('Sent ' + name + '\'s ' + type + ' receipt!')
					}
				} else {
					// Error logging
					twiml.message('No receipts were sent.')
				}

				// Add a content accepted header
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			})
		} else {
			twiml.message('Invalid permission for this command!')

			// Add a content accepted header
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())
		}

	// MASS MESSAGE COMMAND
	// Usage: 'Mass Breakfast message "My message here" DORM'
	} else if (req.body.Body.toLowerCase().indexOf('mass') > -1 && req.body.Body.toLowerCase().indexOf('message') > -1) {
		// This command checks all the receipts against the dorm (if specified) and sends the specified text to all
		if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {

			// Get the type and convert it into the right format
			let type = req.body.Body.split(" ")[1].toLowerCase()
			type = type.charAt(0).toUpperCase() + type.slice(1)
			// Get the receipts for the specified time to retrieve phone numbers, dorm, etc.
			googleapi.runAuthorizeFunction(googleapi.getReceipts, type, (data) => {
				// Get the dorm if the last character is not a quotation mark
				let dorm = undefined
				if (req.body.Body.trim().charAt(req.body.Body.length - 1) != '"') {
					dorm = req.body.Body.split(" ").pop().toLowerCase()
				}

				let sentAMessage = false
				let triedToSend = false
				// Check the dorm against all receipts. If there is a match, then send the message to that person
				for (let i = 0; i < data.length; i++) {
					triedToSend = true
					if (dorm == undefined || data[i][11][0].toLowerCase().indexOf(dorm) > -1) {
						// Get the number without dashes or parentheses or spaces and add +1
						let number = '+1' + data[i][15][0].replace(/\D+/g, '')
						// Send the message now
						client.messages.create({
							body: req.body.Body.split('"')[1],
							to: number,
							from: '+12038946844'
						})
						sentAMessage = true
					} 
				}

				// Log this action to console and notify sender
				if (sentAMessage) {
					twiml.message('Sent ' + type + ' message.')
					if (dorm == undefined) {
						console.log('Sent all ' + type + ' orderers "' + message + '"!')	
					} else {
						console.log('Sent all ' + type + ' orderers  from ' + dorm + ' "' + message + '"!')
					}
				} else {
					// Error logging
					if (triedToSend) {
						twiml.message('No receipts matched dorm query, so no messages were sent.')
					} else {
						twiml.message('No receipts retrieved, so no messages were sent.')
					}
				}

				// Add a content accepted header
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			})
		} else {
			twiml.message('Invalid permission for this command!')
			// Add a content accepted header
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())
		}

	// DORM ORDERS COMMAND
	// Shows orders for the given dorm
	// Usage: 'DORM TYPE CURBSIDE/DOORSIDE orders' i.e. 'North breakfast curbside orders'
	} else if (req.body.Body.trim().split(" ").length == 4 && req.body.Body.toLowerCase().indexOf('orders') > -1) {
		// This command queries the dorm orders page in google sheets
		if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
			// Get the type and convert it into the right format
			let type = req.body.Body.split(" ")[1].toLowerCase()
			type = type.charAt(0).toUpperCase() + type.slice(1)
			// Get the receipts for the specified time to retrieve phone numbers, dorm, etc.
			googleapi.runAuthorizeFunction(googleapi.getReceipts, type, (data) => {
				// Get the dorm from the first section between split
				let dorm = req.body.Body.split(" ")[0].toLowerCase()
				let location = req.body.Body.split(" ")[2].toLowerCase()
				// Iterate through the data, and for each dorm match send the order name and number
				for (let i = 0; i < data.length; i++) {
					// In case of curbside, then the 12th element in receipt is the dorm
					if (location.indexOf('curb') > -1) {
						if (data[i][11][0] != undefined && data[i][11][0].toLowerCase().indexOf(dorm) > -1) {
							twiml.message(googleapi.orderToString(data[i], i + 1))
						}
					// Otherwise, try the 13th element which shuold be the doorstop dorm
					} else {
						if (data[i][12][0] != undefined && data[i][12][0].toLowerCase().indexOf(dorm) > -1) {
							twiml.message(googleapi.orderToString(data[i], i + 1))
						}
					}
				}
				// Add a content accepted header to send
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			})
		} else {
			// If not verified number, then tell the user
			twiml.message('Insufficient priveleges to do that!')
			// Add a content accepted header
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())
		}

	// GET STORES COMMAND
	// Returns a list of the stores needed for the given time of orders
	// Usage: 'Get TYPE stores' i.e. 'Get breakfast stores'
	} else if (req.body.Body.toLowerCase().indexOf('get') > -1 && req.body.Body.toLowerCase().indexOf('stores') > -1) {
		// Validate user
		if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
			// Get the type and convert it into the right format
			let type = req.body.Body.split(" ")[1].toLowerCase()
			type = type.charAt(0).toUpperCase() + type.slice(1)
			// Get the receipts for the specified time to retrieve the stores
			googleapi.runAuthorizeFunction(googleapi.getReceipts, type, (data) => {
				// Retrieve the ordered list of stores from the JSON
				let orderedStores = VAULT.stores
				// Iterate through the data and set the ones which are found to true
				for (let i = 0; i < data.length; i++) {
					// Need to iterate through the items as well
					for (let j = 2; j < 10; j++) {
						let storename = data[i][j][1]
						if (storename != 'UNKNOWN' && storename != '#REF!' && storename != '#VAL!') {
							orderedStores[storename] = true
						}
					}
				}
				// Once all items have been iterated over, return the message of the stores needed to visit
				let toPrint = 'Store Schedule:\n'
				Object.keys(orderedStores).forEach(function(key) {
					if (orderedStores[key]) {
				  		toPrint += key + "\n"
					}
				})
				// Return the stores
				twiml.message(toPrint)
				// Add a content accepted header
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			})
		} else {
			// If not verified number, then tell the user
			twiml.message('Insufficient priveleges to do that!')
			// Add a content accepted header
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())
		}

	// EVERYTHING ELSE	
	} else {
		if (req.body.Body == 'hello') {
			twiml.message('Hi!')
		} else if (req.body.Body == 'bye') {
			twiml.message('Goodbye!')
		} else {
			twiml.message('No parameter match. Try "help" for list of commands!')
		}
		// Add a content accepted header
		res.writeHead(200, { 'Content-Type': 'text/xml' })
		res.end(twiml.toString())
	} 
})

// Finally build the HTTP server for the bot
http.createServer(app).listen(1337, () => {
	console.log('Express server listening on port 1337')
})