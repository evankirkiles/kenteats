// Require selenium for checking out
const {Builder, By, Capabilities, Key, until} = require('selenium-webdriver')
// Import the vault for password/username
var VAULT = require('../config/vault.json')

// Class to sleep execution
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// Checkout class to maintain selenium session
class Checkout {

	// Constructor does nothing because selenium needs to use init for asynchronous blocking
	constructor() {
		this.driver = new Builder().withCapabilities(Capabilities.chrome()).build()
	}

	// Init opens up starbucks login page waiting for signin
	async init() {
		// Open the Starbucks app sign in page
		await this.driver.get('https://app.starbucks.com/account/signin')
		// Block this aync thread/wait for user to sign in
		// await this.driver.wait(until.elementLocated(By.xpath('//*[@id="content"]/div[2]/div/div/div/div/div[1]/div/div/div[3]/span/a')))
	}
	
	// Orders a product with the given number and options
	async orderProduct(productspecifications) {
		// Opens the product page for the product
		await this.driver.get('https://app.starbucks.com/menu' + productspecifications['uri'])
		// Iterates through the product options and selects each one
		
	}
}

module.exports.Checkout = Checkout