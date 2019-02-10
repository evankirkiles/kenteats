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
// Imessage module
const imessage = require('osa-imessage')

// Initialize the application
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))

// Keep track of the number of orders sent in the current day
let currentDayOrders = 0
let currentDay = undefined

// Announcement placeholder to handle segmented SMS's
let announcementHolder = ''
// Miles holder to hold mile start and mile end
let mileHolder = {
	'start': '',
	'starttime': '',
	'end': '',
	'endtime': ''
}

// Keep track of the last updated financial day
let lastFinanceUpdateDay = undefined

// Listen to console input
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
	let command = d.toString().trim()

	// CONSOLE COMMAND: Single-number text
	// USAGE: 'text +18609467150 "hi"'
	if (command.indexOf('text') > -1) {
		let params = command.trim().split(' ')
		// Create a message with the text between quotation marks
		client.messages.create({
			body: command.replace('  ', ' ').trim().split('"')[1],
			to: params[1],
			from: '+12038946844'
		})
		// Log the sent message
		console.log('Sent text message.')
	}

	// CONSOLE COMMAND: Set the number of orders in the day
	// USAGE: 'ordernums 9'
	if (command.indexOf('ordernums') > -1) {
		currentDayOrders = parseInt(command.split(' ')[1])
	}
});

// Function for solo announcing
function announce(message, database, twiml, res) {
	// Perform MySQL request to get the list of numbers
	database.pullNumbers((results) => {
		// With the list of numbers, use the client to send the message to each
		let someth = 0
		let failed = 0
		for (let i = 0; i < results.length; i++) {
			// If not muted, send the message
			if (results[i]['muted'] == 0) {
				// Depending on which number to use, send the messages
				if (VAULT.announcewithtwilio) {
					client.messages.create({
						body: message,
						to: results[i]['phone'],
						from: '+12038946844'
					})
					someth++
				} else {
					imessage.send(results[i]['phone'], message).catch((error) => {
						console.log('Conversation not started with ' + number + ' so they did not receive text.')
						failed++
						if (i == results.length - 1) {
							console.log('Number failed: ' + failed)
						}
					})
					someth++
				}
			}
		}

		// Respond with a message successful
		if (VAULT.announcewithtwilio) {
			twiml.message('Sent message with Twilio to all ' + someth + ' unmuted customers. Estimated total cost: $' + (0.0075 * someth * Math.ceil(message.length / 140)).toFixed(4))
			console.log('Sent message with Twilio to all ' + someth + ' unmuted customers. Estimated total cost: $' + (0.0075 * someth * Math.ceil(message.length / 140)).toFixed(4))
		} else {
			twiml.message('Tried to send message with iMessage to all ' + someth + ' unmuted customers. No cost.')
			console.log('Tried to send message with iMessage to all ' + someth + ' unmuted customers. No cost.')
		}
		// Add a content accepted header and send
		res.writeHead(200, { 'Content-Type': 'text/xml' })
		res.end(twiml.toString())
	})
}

// Function for texting a receipt
function textReceipt(data, database, req, name, number) {
	// Update the receipt database
	database.processReceipt(data, currentDayOrders, (!VAULT.evancansendreceipts && !(req.body.From == '+18609467150')), (returned) => {})

	if (req.body.From == '+18609467150') { console.log(data[21]); return}

	// If name is specified, check it against each data
	if ((name == undefined || data[i][0][0].toLowerCase().indexOf(name.toLowerCase()) > -1) && (req.body.From != '+18609467150' || VAULT.evancansendreceipts)) {
		// Do some cleanup on the receipts and then send the normalized messages to their corresponding recipients
		client.messages.create({
			body: googleapi.receiptToString(data, false),
			to: number,
			from: '+12038946844'
		})
		// If the user used a coupon, then also send the information about the coupon
		if (data[21][4]) {
			console.log(data[21][1])
			if (typeof data[21][1] == "number") {
				// This handles both credit and coupons, so swap between them
				if (data[21][0].toLowerCase().trim() == 'credit') {
					database.getCredit(number, (cred) => {
						client.messages.create({
							body: 'You used $' + data[21][1].toFixed(2) + ' of credit. You have $' + (cred - data[21][1]).toFixed(2) + ' of credit left.',
							to: number,
							from: '+12038946844'
						})
						// Use the credit in the database
						database.takeCredit(data[21][1], number)
					})
				} else {
					// Coupons
					client.messages.create({
						body: 'You used coupon "' + data[21][0] + '" to save $' + (data[21][1].toFixed(2)) + '.',
						to: number,
						from: '+12038946844'
					})
					// Also decrement the uses in the database
					database.useCoupon(data[21][0], data[0])
				}
			}
		}
		// If the payment method is Venmo, then also send a Venmo payment request
		if (data[10][0].toLowerCase() == 'venmo') {
			client.messages.create({
				body: 'Pay here: https://venmo.com/Brady_McGowan?txn=pay&amount=' + (parseFloat(data[20][1].replace('$','')) + VAULT.deliveryfee - 5).toFixed(2),
				to: number,
				from: '+12038946844'
			})
		}
	}
}

// Entire chatbot function
function chatBot(req, res) {
	const twiml = new MessagingResponse()
	const database = new SQLInterface()

	// Log the command to the console
	console.log("[" + new Date(Date.now()).toLocaleString() + "] (" + req.body.From + ") " + req.body.Body)

	// First check if the number exists in the database. If it does not, add it.
	database.pullNumbers((results) => {
		let numExists = false
		// Iterate through numbers pulled from SQL
		results.forEach((obj) => {
			if (obj['phone'] == req.body.From) { numExists = true }
		})
		// Add number if not found in array
		if (!numExists) { 
			database.addNumber(req.body.From) 
			// Message the user that they are new and send them the link to the order form
			twiml.message("Welcome to KentEats! If you would like to order, please follow the link to the form:")
			twiml.message("https://docs.google.com/forms/d/1nC2Hpm0AcTF00_PV5ugyusUHfAM_xb81Xh7hT2Faje0/edit")
			twiml.message("All order time announcements come through 12035868752, so text it anything to begin listening.")
		}

		// Make sure any announcements being built are terminated with the exit string ("//") if they are nto wanted to send.
		if (announcementHolder != '' && VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {

			let message1 = req.body.Body.replace('  ', ' ').trim().split(VAULT.messagedelim)
			if (req.body.Body == '//') {
				announcementHolder = ''
				// Message that user is waiting for next part of announcement or "//" to cancel
				twiml.message('Cancelled announcement.')
				// Add a content accepted header
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
				return
			}

			// Check if it is a completed annoucement. If it is not, then wait for other segments (quotation mark).
			if (announcementHolder != '') {
				announcementHolder += ' ' + message1[0]
				if (message1.length == 2) {
					announce(announcementHolder, database, twiml, res)
					announcementHolder = ''
				}
			} 

			return
		}


		// ? COMMAND
		// Pass in the name of an argument or type just "?" to get a list of arguments
		// USAGE: '?' or '? get receipts'
		if (req.body.Body.toLowerCase().indexOf('?') > -1) {
			let toPrint = ''
			let commands
			// Separate admin commands from others
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				commands = VAULT.admincommands
				toPrint = 'Admin Commands:\n'
			} else {
				commands = VAULT.normiecommands
				toPrint = 'Commands:\n'
			}

			// If there is a command after 'help', then check to see if more help can be provided
			if (req.body.Body.trim().toLowerCase() != '?') {
				let keyword = req.body.Body.replace('? ', '').toLowerCase().trim()

				// If they did '? COMMAND', tell them that COMMAND needs to be replaced with the command in question
				if (keyword.indexOf('command') > -1) {
					twiml.message('Replace COMMAND with the command you would like to learn more about!')
				} else {
					Object.keys(commands).forEach((key) => {
						if (key.indexOf(keyword) > -1) {
							twiml.message(commands[key])
						}
					})
				}

			} else {
				// Just list out all of the commands
				Object.keys(commands).forEach(function(key) {
			  		toPrint += "- " + key + "\n"
				})
				toPrint += "Type '? COMMAND' to see more info.\n"
				// Finally print the message
				twiml.message(toPrint)
			}
			// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())

		// ANNOUNCE COMMAND
		// Sends a text to everyone with a number registered in the database.
		// Usage: 'announce "sale coming soon!"'
		} else if (req.body.Body.toLowerCase().indexOf('announce') > -1) {
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {

				let message = req.body.Body.trim().split(VAULT.messagedelim)
				if (message.length == 2) {
					// Message that user is waiting for next part of announcement or "//" to cancel
					twiml.message('Waiting for next segments of announcement... end announcement with // to cancel or ' + VAULT.messagedelim + ' to finish.')
					// Add a content accepted header
					res.writeHead(200, { 'Content-Type': 'text/xml' })
					res.end(twiml.toString())
					announcementHolder = message[1]
				} else if (message.length == 1) {
					// Message that user is waiting for next part of announcement or "//" to cancel
					twiml.message('Please use the accepted message delimiter: ' + VAULT.messagedelim)
					// Add a content accepted header
					res.writeHead(200, { 'Content-Type': 'text/xml' })
					res.end(twiml.toString())
				} else if (message.length == 3) {
					announce(message[1], database, twiml, res)
					announcementHolder = ''
				}
			}

		// MASS MESSAGE COMMAND
		// Usage: 'Mass a message "My message here" DORM'
		} else if (req.body.Body.toLowerCase().indexOf('mass') > -1 && req.body.Body.toLowerCase().indexOf('message') > -1) {
			// This command checks all the receipts against the dorm (if specified) and sends the specified text to all
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {

				// Get the type and convert it into the right format
				let type = req.body.Body.replace('  ', ' ').trim().split(" ")[1].toLowerCase()
				// Get the receipts for the specified time to retrieve phone numbers, dorm, etc.
				googleapi.runAuthorizeFunction(googleapi.getReceipts, (type == 'b' ? 'Breakfast' : 'Afternoon'), (data) => {
					// Get the dorm if the last character is not a quotation mark
					let dorm = undefined
					if (req.body.Body.trim().charAt(req.body.Body.length - 1) != VAULT.messagedelim) {
						dorm = req.body.Body.replace('  ', ' ').trim().split(" ").pop().toLowerCase()
					}

					let sentAMessage = false
					let triedToSend = false
					
					// Make sure the message is not too long
					let message = req.body.Body.replace('  ', ' ').trim().split(VAULT.messagedelim)
					if (message.length == 2) {
						// Log the error
						twiml.message('Error reading mass message! Probably too long, try shortening it.')
						// Add a content accepted header
						res.writeHead(200, { 'Content-Type': 'text/xml' })
						res.end(twiml.toString())
						return
					} else if (message.length == 1) {
						// Log the error
						twiml.message('Error reading mass message! Delimiter was not found, make sure you use: ' + VAULT.messagedelim)
						// Add a content accepted header
						res.writeHead(200, { 'Content-Type': 'text/xml' })
						res.end(twiml.toString())
						return
					}

					// Check the dorm against all receipts. If there is a match, then send the message to that person
					for (let i = 0; i < data.length; i++) {
						triedToSend = true
						if ((dorm == undefined || (data[i][11][0] != undefined && data[i][11][0].toLowerCase().indexOf(dorm) > -1) ||  (data[i][12][0] != undefined && data[i][12][0].toLowerCase().indexOf(dorm) > -1)) && data[i][15][0] != undefined) {
							// Get the number without dashes or parentheses or spaces and add +1
							let number = '+1' + data[i][15][0].replace(/\D+/g, '')
							// Depending on which number to use, send the messages
							if (VAULT.announcewithtwilio) {
								// Send the message now
								client.messages.create({
									body: req.body.Body.replace('  ', ' ').trim().split(VAULT.messagedelim)[1],
									to: number,
									from: '+12038946844'
								})	
							} else {
								imessage.send(number, req.body.Body.replace('  ', ' ').trim().split(VAULT.messagedelim)[1]).catch((error) => {
									console.log('Conversation not started with ' + number + ' so they did not receive text.')
								})
							}
							sentAMessage = true
						} 
					}

					// Log this action to console and notify sender
					if (sentAMessage) {
						twiml.message('Sent ' + type + ' message.')
						if (dorm == undefined) {
							console.log('Sent all ' + type + ' orderers "' + req.body.Body.replace('  ', ' ').trim().split(VAULT.messagedelim)[1] + '"!')
						} else {
							console.log('Sent all ' + type + ' orderers  from ' + dorm + ' "' + req.body.Body.replace('  ', ' ').trim().split(VAULT.messagedelim)[1] + '"!')
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

		// COUPONS COMMAND
		// Gets all the existing coupons
		// Usage: 'coupons'
		} else if (req.body.Body.toLowerCase().trim() == 'coupons') {
			// Check if the phone number is a valid number
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// If it is, return a Twilio message containing all the coupons formatted nicely
				database.getCoupons((data) => {
					let index = 0
					data.map((coupon) => {
						index++
						twiml.message('- COUPON ' + index + ' -\nCode: ' + coupon['code'] + '\nAmount: ' + (coupon['percent'] == 1 ? (coupon['amount'] * 100).toFixed(0) + '%' : '$' + coupon['amount'].toFixed(2)) + '\nFrom: ' + (coupon['calcfrom'] == 'DELIVERYFEE' ? 'Delivery Fee' : 'Total') + '\nUses: ' + coupon['uses'])
					})
					// Add a content accepted header
					res.writeHead(200, { 'Content-Type': 'text/xml' })
					res.end(twiml.toString())
				})
			}

		// GET RECEIPT COMMAND
		// Gets the receipts for the given parameters
		// Usage: 'Get b receipts' or 'Get b receipts for Starbucks'
		} else if (req.body.Body.toLowerCase().indexOf('get') > -1 && req.body.Body.toLowerCase().indexOf('receipt') > -1) {
			// Check if the phone number is a valid number
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Get the type and convert it into the right format
				let type = req.body.Body.replace('  ', ' ').trim().split(" ")[1].toLowerCase()
				googleapi.runAuthorizeFunction(googleapi.getReceipts, (type == 'b' ? 'Breakfast' : 'Afternoon'), (data) => {

					for (let i = 0; i < data.length; i++) {
						// Do some cleanup on the receipts and then send the normalized message without accents
						twiml.message(googleapi.receiptToString(data[i], true, i+1).normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
					}

					// Log this action to console
					console.log('Retrieved all ' + type + ' receipts!')

					// Add a content accepted header
					res.writeHead(200, { 'Content-Type': 'text/xml' })
					res.end(twiml.toString())
				})
			} else {
				twiml.message('Invalid permission for this command!')
			}

		// SEND RECEIPT COMMAND
		// Usage: 'Send b receipts NAME' or 'Send b receipts'
		} else if (req.body.Body.toLowerCase().indexOf('send') > -1 && req.body.Body.toLowerCase().indexOf('receipt') > -1) {
			// First validate the current day's orders
			let currDayTemp = new Date();
			currDayTemp = currDayTemp.getFullYear() + '-' + (currDayTemp.getMonth() + 1) + '-' + currDayTemp.getDate()
			if (currDayTemp != currentDay) {
				currentDayOrders = 0
				currentDay = currDayTemp
			}

			// Check if the phone number is a valid number
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Get the type and convert it into the right format
				let type = req.body.Body.replace('  ', ' ').trim().split(" ")[1].toLowerCase()
				googleapi.runAuthorizeFunction(googleapi.getReceipts, (type == 'b' ? 'Breakfast' : 'Afternoon'), (data) => {
					
					// Update the receipt history sheet
					googleapi.runAuthorizeFunction(googleapi.fillReceiptHistory, data, () => {})

					// If there is a name given after the 'Send TYPE receipt', use it in filtering
					let name = req.body.Body.replace('  ', ' ').trim().split(" ")
					if (name.length > 3) { name = name[3] } else { name = undefined }

					// For each string, send a message to the recipient containing their receipt
					let sentAMessage = false
					for (let i = 0; i < data.length; i++) {
						// Update the running total of orders in the day
						currentDayOrders++

						// Make sure the number exists
						if (data[i][15][0] == undefined) { continue; }

						// Get the number without dashes or parentheses or spaces and add +1
						let number = '+1' + data[i][15][0].replace(/\D+/g, '')
						// If the user has not yet claimed their referral, do it now and give them X$ off first order
						database.getReferralAvailability(number, (availability, referrer) => {
							if (availability) {
								// Check how many referrals the person has left
								database.getNumReferrals(referrer, (numrefs) => {
										// If valid, then perform the referral
										database.performReferral(referrer, number, !(numrefs < VAULT.deals.referrals.maxreferrals || VAULT.deals.referrals.maxreferrals < 0), () => {
											// Give credit to the referree and tell them that the person referred them
											database.giveCredit(referrer, VAULT.deals.referrals.referredtoval, () => {
												client.messages.create({
													body: 'You received $' + VAULT.deals.referrals.referredtoval + ' in credit from referring ' + req.body.From + '.',
													to: referrer,
													from: '+12038946844'
												})
											})

											// Add a flat X$ to the coupon field off
											data[i][21][2] = VAULT.deals.referrals.referredtoval
											data[i][20][1] = '$' + (parseFloat(data[i][20][1].replace('$', '')) - parseFloat(VAULT.deals.referrals.referredtoval)).toFixed(2)
											// Text the receipts
											textReceipt(data[i], database, req, name, number)
											// Add a message about how much was saved from referral
											client.messages.create({
												body: 'You saved $' + VAULT.deals.referrals.referredtoval + ' by being referred.',
												to: number,
												from: '+12038946844'
											})
										})
								})
							} else {
								// Text the receipts
								textReceipt(data[i], database, req, name, number)
							}
						})
						sentAMessage = true
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

		// DORM/STORE ORDERS COMMAND
		// Shows orders for the given dorm or store
		// Usage: 'DORM TYPE orders' i.e. 'North b orders' or 'Chipotle b orders'
		} else if (req.body.Body.replace('  ', ' ').trim().split(" ").length == 3 && req.body.Body.toLowerCase().indexOf('orders') > -1) {
			// This command queries the dorm orders page in google sheets
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Get the type and convert it into the right format
				let type = req.body.Body.replace('  ', ' ').trim().split(" ")[1].toLowerCase()
				// Get the receipts for the specified time to retrieve phone numbers, dorm, etc.
				googleapi.runAuthorizeFunction(googleapi.getReceipts, (type == 'b' ? 'Breakfast' : 'Afternoon'), (data) => {
					// Get the dorm from the first section between split
					let dorm = req.body.Body.replace('  ', ' ').trim().split(" ")[0].toLowerCase()
					// Check if the dorm is actualy a store
					let isStore = false
					console.log(dorm.replace(/[^a-z]/gi, ''))
					Object.keys(VAULT.stores).forEach((key) => {
						if (key.toLowerCase().replace(/[^a-z]/gi, '').indexOf(dorm.replace(/[^a-z]/gi, '')) > -1) {
							isStore = true;
							dorm = key;
						}
					})

					// If it is a store, filter for store only
					if (isStore) {
						// Iterate through the data, and for each store match send the item to order
						let toReturn = '- ' + dorm + ' Orders -\n'
						for (let i = 0; i < data.length; i++) {
							let storeAdded = false
							// Iterate through items in each receipt
							for (let j = 2; j < 10; j++) {
								if (data[i][j][1].toLowerCase().indexOf(dorm.toLowerCase()) > -1) {
									if (!storeAdded) { toReturn += 'Order #' + i + ':\n'; storeAdded = true}
									toReturn += ' - ' + data[i][j][0].split(')')[1].trim() + '\n'
								}
							}
						}
						// When orders are acquired, then send the message
						twiml.message(toReturn)
					// Otherwise filter for dorm
					} else {
						// Iterate through the data, and for each dorm match send the order name and number
						for (let i = 0; i < data.length; i++) {
							if (data[i][11][0] != undefined && data[i][11][0].toLowerCase().indexOf(dorm) > -1 || 
								data[i][12][0] != undefined && data[i][12][0].toLowerCase().indexOf(dorm) > -1) {
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
		// Usage: 'Get TYPE stores' i.e. 'Get b stores'
		} else if (req.body.Body.toLowerCase().indexOf('get') > -1 && req.body.Body.toLowerCase().indexOf('stores') > -1) {
			// Validate user
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Get the type and convert it into the right format
				let type = req.body.Body.replace('  ', ' ').trim().split(" ")[1].toLowerCase()
				// Get the receipts for the specified time to retrieve the stores
				googleapi.runAuthorizeFunction(googleapi.getReceipts, (type == 'b' ? 'Breakfast' : 'Afternoon'), (data) => {
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

		// MILES COMMANDS
		// Start and end the miles counter (records for tax deductible)
		// Usage: 'miles start 12389' or 'miles end 39808'
		} else if (req.body.Body.toLowerCase().indexOf('mile') > -1) {
			// Validate user
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Make sure that there is a valid number
				if (isNaN(req.body.Body.trim().split(' ')[2])) { 
					// Add message
					twiml.message('Could not parse mile number.')
					// Add a content accepted header
					res.writeHead(200, { 'Content-Type': 'text/xml' })
					res.end(twiml.toString())
				} else {
					// Check if logging a start or an end
					if (req.body.Body.toLowerCase().indexOf('start') > -1) {
						// In the case of a start, create a new row for the MySQL database and push any existing records
						if (mileHolder['start'] != '') {
							// Push it to MySQL database
							database.pushMiles(mileHolder, () => {
								// Once in the MySQL database, push it to the Google Sheets
								googleapi.runAuthorizeFunction(googleapi.pushMiles, mileHolder, () => {
									// Tell Brady that the miles were logged
									twiml.message('Pushed miles to Google Sheets.')
									// Add a content accepted header
									res.writeHead(200, { 'Content-Type': 'text/xml' })
									res.end(twiml.toString())

									// Clar the mileHolder object
									mileHolder = {
										'start': parseInt(req.body.Body.trim().split(' ')[2]),
										'starttime': getStringDateTime(new Date()),
										'end': '',
										'endtime': ''
									}
								})
							})
						} else {
							// Otherwise just pull in the data of the start
							mileHolder['start'] = parseInt(req.body.Body.trim().split(' ')[2])
							mileHolder['starttime'] = getStringDateTime(new Date())
						}
					} else {
						// Simply push the current mile holder object and then clear it
						mileHolder['end'] = parseInt(req.body.Body.trim().split(' ')[2])
						mileHolder['endtime'] = getStringDateTime(new Date())

						// Push it to MySQL database
						database.pushMiles(mileHolder, () => {
							// Once in the MySQL database, push it to the Google Sheets
							googleapi.runAuthorizeFunction(googleapi.pushMiles, mileHolder, () => {
								// Tell Brady that the miles were logged
								twiml.message('Pushed miles to Google Sheets.')
								// Add a content accepted header
								res.writeHead(200, { 'Content-Type': 'text/xml' })
								res.end(twiml.toString())

								// Clear the mile holder
								mileHolder = {
									'start': '',
									'starttime': '',
									'end': '',
									'endtime': ''
								}
							})
						})
					}
				}
			}

		// UPDATE FINANCIALS COMMAND
		// Updates the financials (used to manually do what the scheduled command does)
		// Usage: 'update financials'
		} else if (req.body.Body.toLowerCase().indexOf('update') > -1 && req.body.Body.toLowerCase().indexOf('financials') > -1) {
			// Validate user
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Get the current day
				let currDay = new Date();
				currDay = currDay.getFullYear() + '-' + (currDay.getMonth() + 1) + '-' + currDay.getDate()
				lastFinanceUpdateDay = currDay

				// Run the MySQL query to determine if any data is available
				database.getFinancials((data) => {
					googleapi.runAuthorizeFunction(googleapi.fillFullDayBookkeeping, data, () => {
						database.notifyFinancialsUpdated('financials')
					}) })
				database.getSingleOrderFinancials((data) => {
					googleapi.runAuthorizeFunction(googleapi.fillSingleOrderBookkeeping, data, () => {
						database.notifyFinancialsUpdated('financialorders')
					}) })
				database.getStudentIDFinancials((data) => {
					googleapi.runAuthorizeFunction(googleapi.fillStudentIDOrders, data, () => {
						database.notifyFinancialsUpdated('studentidorders')
					}) })
				database.getVenmoFinancials((data) => {
					googleapi.runAuthorizeFunction(googleapi.fillVenmoOrders, data, () => {
						database.notifyFinancialsUpdated('venmoorders')
					}) })
			}

		// CLEAR INPUT COMMAND
		// Clears the input form for the Google Sheets, allowing new orders to be placed.
		// Usage: 'clear input'
		} else if (req.body.Body.toLowerCase().trim() == 'clear input') {
			// Validate user
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) > -1) {
				// Run the googleapi function to clear the sheets, and, upon doing so, notify the user
				googleapi.runAuthorizeFunction(googleapi.clearInputs, undefined, () => {
					// Add message
					twiml.message('Cleared the input sheet.')
					// Add a content accepted header
					res.writeHead(200, { 'Content-Type': 'text/xml' })
					res.end(twiml.toString())
				})
			}

		// FORM COMMAND
		// Simply responds with the link to the form
		// Usage: 'form'
		} else if (req.body.Body.toLowerCase().trim() == 'form') {
			// Send the user the link to the order form	
			twiml.message("https://docs.google.com/forms/d/1nC2Hpm0AcTF00_PV5ugyusUHfAM_xb81Xh7hT2Faje0/edit")
			// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())

		// ABOUT COMMAND
		// Provides more information about the business and the bot
		// Usage: 'about'
		} else if (req.body.Body.toLowerCase().trim() == 'about') {
			// Send the user the pre-set message
			twiml.message(VAULT.about)
			// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())

		// SUPPORT COMMAND
		// Provides Brady's number so the user can begin listening to announcements or ask Brady for something.
		// Usage: 'support'
		} else if (req.body.Body.toLowerCase.trim().indexOf('support') > -1) {
			// Send the user the pre-set message
			twiml.message(VAULT.support)
			// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())

		// MUTE COMMAND
		// Removes this user's phone number from the database
		// Usage: 'mute'
	    } else if (req.body.Body.toLowerCase().trim() == 'mute') {
	    	// Make sure the number is not an admin number
	    	if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) == -1) {
	    		// Perform the database number removal
	    		database.setNumberMuted(req.body.From, 1)
	    		// Notify the user that their number was dropped
	    		twiml.message('Your number has been muted from global announcements.')
	    	} 
	    	// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())

		// UNMUTE COMMAND
		// Removes this user's phone number from the database
		// Usage: 'unmute'
	    } else if (req.body.Body.toLowerCase().trim() == 'unmute') {
	    	// Make sure the number is not an admin number
	    	if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) == -1) {
	    		// Perform the database number removal
	    		database.setNumberMuted(req.body.From, 0)
	    		// Notify the user that their number was dropped
	    		twiml.message('You are no longer muted from global announcements.')
	    		console.log('Unmuted ' + req.body.From + ' from global anouncements.')
	    	} 
	    	// Add a content accepted header and send
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			res.end(twiml.toString())

		// REFERRAL COMMAND
		// Tells the bot who referred the user.
		// Usage: 'referred 8609467150'
		} else if (req.body.Body.toLowerCase().indexOf('refer') > -1) {
			// Make sure that the referral system is currently active right now
			if (VAULT.deals.referrals.active) {
				// Check if the user has already done their referral
				database.getReferralAvailability(req.body.From, (availability) => {
					// If they have, then notify them. Otherwise, set the phone number of who referred them
					if (availability) {
						let referree = '+1' + req.body.Body.replace(/\D+/g, '')
						database.setReferralNumber(req.body.From, referree, () => {
							// Notify the user of their ineligibility
							twiml.message('Updated your referrer to ' + referree + '.')
							// Add a content accepted header and send
							res.writeHead(200, { 'Content-Type': 'text/xml' })
							res.end(twiml.toString())
						})
					} else {
						// Notify the user of their ineligibility
						twiml.message('You have already used your referred-by token.')
						// Add a content accepted header and send
						res.writeHead(200, { 'Content-Type': 'text/xml' })
						res.end(twiml.toString())
					}
				})
			} else {
				// Notify user that referral code system is not active at the moment
				twiml.message('Referral system currently inactive. Sorry!')
				// Add a content accepted header and send
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			}

		// CREDIT COMMAND
		// Checks how much credit a user has and returns it.
		// Usage: 'credit'
		} else if (req.body.Body.toLowerCase().indexOf('credit') > -1) {
			// Perform the MySQL request to get the credit amount
			database.getCredit(req.body.From, (num) => {
				// Notify user that referral code system is not active at the moment
				twiml.message('You currently have $' + parseFloat(num).toFixed(2) + ' in credit. To use credit, type CREDIT into the coupon field on your next order.')
				// Add a content accepted header and send
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			})

		// EVERYTHING ELSE	
		} else {
			if (VAULT.twilio.allowedNumbers.indexOf(req.body.From) == -1) {
				if (req.body.Body.toLowerCase().trim() != 'hi') {
					twiml.message('Text "form" if you would like the link to the form to order! To see commands, text "?".')
				}
				// Add a content accepted header
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(twiml.toString())
			}
		} 
	})
}

function getStringDateTime(date) {
    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    let min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    let sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    let year = date.getFullYear();

    let month = date.getMonth() + 1;

    let day  = date.getDate();

    return month + "/" + day + "/" + year + " " + hour + ":" + min + ":" + sec;
}

// Listen for messages sent to Twilio
app.post('/', (req, res) => { chatBot(req, res) })

// Finally build the HTTP server for the bot
http.createServer(app).listen(1337, () => {
	console.log('Express server listening on port 1337')
})