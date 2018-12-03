// Require requests for accessing checkout HTTP endpoint
const request = require('request')
// Prompt for requesting from the user
const prompt = require('prompt-sync')()
// Require configuration for store number
const CONFIG = require('../config/config.json')

// Log function which can be repurposed to go to a file
function syslog(message) {
	console.log(getDate() + message)
}

// Gets the current readable date
function getDate() {
	var d = new Date()
	return '[' + d.toDateString() + ' ' + 
		(d.getHours() < 10 ? '0' + d.getHours() : d.getHours()) + ':' + 
		(d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()) + ':' + 
		(d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds()) + '] '
}

// Pulls the menu and saearches for products matching keyword. Then, prompts user to select from all found.
// Menu is pulled on construction so is able to be reused many times over.
class ProductRetriever {

	// Constructor initializes instance variables and gets the JSON array from the request
	constructor() {
		// Boolean blocks operations until products loaded
		this.ready = false
	}

	// Initialize pulls the menu first
	async initialize() {
		syslog('Retrieving menu...')
		await this.pullMenu()
	}

	// Get request to pull the menu
	pullMenu() {
		return new Promise(resolve => {
			request.get({
				url: 'https://app.starbucks.com/bff/ordering/menu?storeNumber=' + CONFIG.configuration.store_token,
			}, (err, resp, body) => {
				this.fullproducts = JSON.parse(body)
				this.ready = true
				this.products = []
				resolve()
			})
		})
	}

	// Prints the products object
	printProducts() {
		console.log(this.fullproducts.menus)
	}

	// Console-based iteration through the products and their types to eventually get product number
	askForProduct() {
		// Do not run if products not loaded
		if (!this.ready) { return }

		// First, ask, for which menu
		var iteration = {}
		var choice = -1
		while (choice == -1) {
			syslog('Please select a menu:\n    (1) Drinks\n    (2) Food\n    (3) At Home Coffee\n    (4) Shopping Bags')
			var choice = prompt(' - SELECTION: ')
			while (choice < 1 || choice > 4) { var choice = prompt(' - SELECTION: ') }
			iteration = this.fullproducts.menus[choice - 1]
			while (iteration.products.length == 0) {
				// Iterate through the options
				var optionsString = 'Select an option:\n    (-1) RETURN'
				for (var i = 1; i <= iteration.children.length; i++) {
					optionsString = optionsString + '\n    (' + i + ') ' + iteration.children[i - 1].name
				}
				syslog(optionsString)
				choice = prompt(' - SELECTION: ')
				while ((choice < 1 && choice != -1) || choice > iteration.children.length) {
					choice = prompt(' - SELECTION: ')
				}
				// If choice is -1 to return, then break out of the loops
				if (choice == -1) { break }
				iteration = iteration.children[choice - 1]
			}
			// If choice is -1 to return, then break out of the loops
			if (choice == -1) { continue }
			// Finally, check the products.
			var optionsString = 'Select a product:\n    (-1) RETURN'
			for (var i = 1; i <= iteration.products.length; i++) {
				optionsString = optionsString + '\n    (' + i + ') ' + iteration.products[i - 1].name + ' ' + (iteration.products[i - 1].availability == 'NotAvailableHere' ? 'UNAVAILABLE' : '')
			}
			syslog(optionsString)
			choice = choice = prompt(' - SELECTION: ')
			while ((choice < 1 && choice != -1) || choice > iteration.products.length) {
					choice = prompt(' - SELECTION: ')
			}		
		}

		// Once product is retrieved, return its information in callback
		return iteration.products[choice - 1]
	}

	// Console-based iteration through the product options for a product
	askForOptions(productinfo) {
		console.log(productinfo)
		// Pulls the product options as JSON
		syslog('Retrieving product options...')

		return new Promise(resolve => { 
			request.get({
				url: 'https://app.starbucks.com/bff/ordering/' + productinfo.uri.substr(9, productinfo.uri.length - 1) + '?store=' + CONFIG.configuration.store_token,
			}, (err, resp, body) => {
				// Now iterate through the product options received
				var prod_options = JSON.parse(body).products[0]
				// Cycle through the options and return them to console
				syslog('Acquired options for product named "' + prod_options.name + '"')
				var initialiteration = prod_options.productOptions
				var iteration = prod_options.productOptions
				var optionsString = 'Select an option:\n    (0) FINISHED'

				// Options all stored in an array as sub arrays themselves of the number selected at each step
				let options = []

				for (var i = 1; i <= iteration.length; i++) {
					optionsString = optionsString + '\n    (' + i + ') ' + iteration[i - 1].name
				}
				syslog(optionsString)
				var choice = -2
				while (choice < 0 || choice > iteration.length) {
						choice = prompt(' - SELECTION: ')
				}

				while (choice != 0) {
					if (choice > 0) {
						// In this case, an option is being considered
						let currentOption = [iteration[choice - 1].name]
						// Here we get the children next
						iteration = iteration[choice - 1].children
						optionsString = 'Please select a sub option:\n    (-1) RETURN'
						for (var i = 1; i <= iteration.length; i++) {
							optionsString = optionsString + '\n    (' + i + ') ' + iteration[i - 1].name
						}
						syslog(optionsString)
						choice = prompt(' - SELECTION: ')
						while (choice < -1 || choice > iteration.length) {
							choice = prompt(' - SELECTION: ')
						}
						// Finally get the product
						if (choice > 0) {
							// Add the new choice to the vector of options
							currentOption.push(iteration[choice - 1].name)

							// Continue on to product/option selection
							iteration = iteration[choice - 1].products
							optionsString = 'Please select a product:\n    (-1) RETURN'
							for (var i = 1; i <= iteration.length; i++) {
								optionsString = optionsString + '\n    (' + i + ') ' + iteration[i - 1].form.name
							}
							syslog(optionsString)
							choice = prompt(' - SELECTION: ')
							while (choice < -1 || choice > iteration.length) {
								choice = prompt(' - SELECTION: ')
							}
							// Choose a size now
							if (choice > 0) {
								// Add the new choice to the vector of options
								currentOption.push(iteration[choice - 1].form.name)

								// Continue on to quantity selection
								iteration = iteration[choice - 1].form.sizes
								optionsString = 'Please select a quantity:\n    (-1) RETURN'
								for (var i = 1; i <= iteration.length; i++) {
									optionsString = optionsString + '\n    (' + i + ') ' + iteration[i - 1].name
								}
								syslog(optionsString)
								choice = prompt(' - SELECTION: ')
								while (choice < -1 || choice > iteration.length) {
									choice = prompt(' - SELECTION: ')
								}

								// Now add this selection to the product options
								if (choice > 0) {
									// Add it to current option before pushing all into larger options array
									currentOption.push(iteration[choice - 1].name)
									options.push(currentOption)

									console.log(iteration)
									console.log('got here')
									// Set choice to -1 to simulate returning to beginning
									choice = -1
								}
							}
						}
					} else if (choice < 0 ) {
						// If the choice is to return, then go back to the initial options step
						iteration = initialiteration
						optionsString = 'Select an option:\n    (0) FINISHED'
						for (var i = 1; i <= iteration.length; i++) {
							optionsString = optionsString + '\n    (' + i + ') ' + iteration[i - 1].name
						}
						syslog(optionsString)
						choice = prompt(' - SELECTION: ')
					}
				}

				// At end return options
				resolve(options)
			})
		})
	}
}

// Export the class
module.exports.ProductRetriever = ProductRetriever