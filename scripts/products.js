// Require requests for accessing checkout HTTP endpoint
const request = require('request')
// Prompt for requesting from the user
const prompt = require('prompt-sync')()

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
		syslog('Retrieving menu...')
		request.get({
			url: 'https://app.starbucks.com/bff/ordering/menu?storeNumber=10190',
		}, (err, resp, body) => {
			this.products = JSON.parse(body)
			this.ready = true
			this.iterateProducts()
		})
	}

	// Prints the products object
	printProducts() {
		console.log(this.products.menus)
	}

	// Console-based iteration through the products and their types to eventually get product number
	iterateProducts() {
		// Do not run if products not loaded
		if (!this.ready) { return }

		// First, ask, for which menu
		syslog('Please select a menu:\n    (1) Drinks\n    (2) Food\n    (3) At Home Coffee\n    (4) Shopping Bags')
		var choice = prompt(' - SELECTION: ')
		while (choice < 1 || choice > 4) { var choice = prompt(' - SELECTION: ') }
		var iteration = this.products.menus[choice - 1]
		while (iteration.products.length == 0) {
			// Iterate through the options
			var optionsString = 'Select an option:'
			for (var i = 1; i <= iteration.children.length; i++) {
				optionsString = optionsString + '\n    (' + i + ') ' + iteration.children[i - 1].name
			}
			syslog(optionsString)
			choice = prompt(' - SELECTION: ')
			while (choice < 1 || choice > iteration.children.length) {
				choice = prompt(' - SELECTION: ')
			}
			iteration = iteration.children[choice - 1]
		}
		// Finally, check the products.
		var optionsString = 'Select a product: '
		for (var i = 1; i <= iteration.products.length; i++) {
			optionsString = optionsString + '\n    (' + i + ') ' + iteration.products[i - 1].name + ' ' + (iteration.products[i - 1].availability == 'NotAvailableHere' ? 'UNAVAILABLE' : '')
		}
		syslog(optionsString)
		choice = choice = prompt(' - SELECTION: ')
		while (choice < 1 || choice > iteration.products.length) {
				choice = prompt(' - SELECTION: ')
		}
		// Once product is retrieved, just print its information
		console.log(iteration.products[choice - 1])
	}
}

// Export the class
module.exports.ProductRetriever = ProductRetriever