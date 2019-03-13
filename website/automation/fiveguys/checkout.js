// Require Selenium for checking out
const {Builder, By, Capabilities, Key, until} = require('selenium-webdriver')
// Require requests for adding products to cart
const request = require('request')

// Example products array
// let SAMPLE_prods = [
// 	{'prodID': '3761993', 'sectionID': '9025', 'attributedTo': 0, 'quantity': 2, 'options': [{'id': '446047454'}, {'id': '446047434', 'quantity': 2}, {'id': '446047445', 'quantity': 0}]},
// 	{'prodID': '3762001', 'sectionID': '9027', 'attributedTo': 1, 'quantity': 3, 'options': [{'id': '446048037', 'quantity': 0}, {'id': '446048044', 'quantity': 2}]},
// ]

let SAMPLE_ORDER = [
 	{'prodID': '9351754', 'sectionID': '8476', 'attributedTo': 0, 'quantity': 1, 'options': []},
]

// Example user info array
let SAMPLE_userinfo = {
	'firstname': '',
	'lastname': '',
	'emailaddress': '@gmail.com',
	'phone': '',
	'creditcardnumber': '',
	'expirymonth': '',
	'expiryyear': '',
	'securitycode': '',
	'postalcode': ''
}

// Sleep function for waiting for pgae to reload
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

class FiveGuysCheckout {
	// Constructor builds the driver
	constructor() {
		this.driver = new Builder().withCapabilities(Capabilities.chrome()).build()
		this.currentURL = ''
	}

	// Adds products to cart
	// Products must be formatted as so:
	// { prodID, sectionID, attributedTo, quantity, options (id, quantity(optional)) }
	async addToCart(products, callback) {
		// Go to New Milford FG page
		this.driver.get('https://order.fiveguys.com/menu/five-guys-new-milford').then(async () => {
			// For each product, order asynchronously
			for (let i = 0; i < products.length; i++) {
				// Click on the product subsection and wait for the product to be available
				const categoryEl = By.css('#CategoryItem' + products[i]['sectionID']);
				await this.driver.wait(until.elementLocated(categoryEl))
				const whatEl = this.driver.findElement(categoryEl);
				await this.driver.wait(until.elementIsVisible(whatEl), 5 * 1000).click()
				// await driver.wait(until.elementLocated(By.css('#CategoryItem' + products[i]['sectionID'])), 5 * 1000)
				await this.driver.findElement(By.css('#CategoryItem' + products[i]['sectionID'])).click()
				await this.driver.wait(until.elementLocated(By.css('li[data-product-id="' + products[i]['prodID'] + '"] > a')), 5 * 1000)
				await this.driver.findElement(By.css('li[data-product-id="' + products[i]['prodID'] + '"] > a')).click()

				// Also add each option once customization options are available
				await this.driver.wait(until.elementLocated(By.css('.product-customize__attribute--price')), 5 * 1000)
				for (let j = 0; j < products[i]['options'].length; j++) {
					await this.driver.findElement(By.css('#chk_' + products[i]['options'][j]['id'])).click()

					if (products[i]['options'][j]['quantity'] != null) {
						// Add the quantity based on the specification: 0: lite, 1: regular, 2: extra
						await this.driver.wait(until.elementLocated(By.css('#multinest_' + products[i]['options'][j]['id'])), 5 * 1000)
						let buttons = await this.driver.findElements(By.css('#multinest_' + products[i]['options'][j]['id'] + ' ul > li'))
						switch(products[i]['options'][j]['quantity']) {
							case 0: // Lite
								await buttons[1].click()
								break
							case 2: // Extra
								await buttons[2].click()
								break
							default: // Regular
								await buttons[0].click()
						}
					}
				}

				// Set the quantity as well
				if (products[i]['quantity'] != 1) { await this.driver.findElement(By.css('#qty')).sendKeys('\b' + products[i]['quantity']) }
				// Finally add the customized product to cart
				await this.driver.findElement(By.css('button[onclick="OLO.Customize.saveInlineCustomize()"]')).click()
				await sleep(1000)
			}

			// Once all products are ordered, make sure to set the basket ID for use in returning to cart
			this.driver.findElement(By.css('#BasketNavItem > a')).getAttribute('href').then((data) => {
				this.currentURL = data
				callback()
			})
		})
	}

	// Performs the checkout given the time and name
	// NOTE: THE TIME MUST BE GIVEN IN 24 HR TIME, HH:MM ON EVERY 15 MIN INCREMENT OF THE HOUR (:00, :15, :30, :45)
	async performCheckout(time, name, userinfo, callback) {
		// Go to New Milford FG page
		this.driver.get(this.currentURL).then(async () => {
			// Try to set the time, if the time is unavailable, return the invalid time error
			await this.driver.wait(until.elementLocated(By.css('#TimeWantedLater')))
			let elem = this.driver.findElement(By.css('#TimeWantedLater'))
			await this.driver.wait(until.elementIsVisible(elem))
			await elem.click()
			let elems = await this.driver.findElements(By.css('#selTimeWanted > option[value="' + time + '"]'))
			if (elems.length <= 0) { callback('Invalid time.', undefined); return }
			// If the time is valid, click it
			await elems[0].click()
			await this.driver.findElement(By.css('#selectTimeWanted')).click()
			// Proceed to checkout
			await sleep(500)
			await this.driver.findElement(By.css('#proceedButton')).click()
			await this.driver.wait(until.elementLocated(By.css('#CancelUpsell')))
			await this.driver.findElement(By.css('#CancelUpsell')).click()

			// Proceed as guest
			await this.driver.findElement(By.css('#UserType_Guest > span.UserTypeTitle')).click()
			// Send the user info to the webpage to finalize payment
			await this.driver.findElement(By.css('.GuestField > #firstname')).sendKeys(userinfo['firstname'])
			await this.driver.findElement(By.css('.GuestField > #lastname')).sendKeys(userinfo['lastname'])
			await this.driver.findElement(By.css('.GuestField > #emailaddress')).sendKeys(userinfo['emailaddress'])
			await this.driver.findElement(By.css('.GuestField > #txtContactNumber')).sendKeys(userinfo['phone'])
			elem = this.driver.findElement(By.css('#rdo_1'))
			await this.driver.wait(until.elementIsVisible(elem))
			await elem.click()
			// Wait for credit card inputs to be visible
			await this.driver.wait(until.elementLocated(By.css('#txtNumber')))
			elem = this.driver.findElement(By.css('#txtNumber'))
			await this.driver.wait(until.elementIsVisible(elem))
			await elem.sendKeys(userinfo['creditcardnumber'])
			await this.driver.findElement(By.css('#selExpiryMonth > option[value="' + userinfo['expirymonth'] + '"]')).click()
			await this.driver.findElement(By.css('#selExpiryYear > option[value="' + userinfo['expiryyear'] + '"]')).click()
			await this.driver.findElement(By.css('#txtCvv')).sendKeys(userinfo['securitycode'])
			await this.driver.findElement(By.css('#txtZip')).sendKeys(userinfo['postalcode'])
			// Click the place order button
			await this.driver.findElement(By.css('#MvcCheckoutPlaceOrder')).click()
		})
	}

	// Gets the price of the current cart and of each listing of items
	async getCartPrice(callback) {
		// Go to New Milford FG page
		this.driver.get(this.currentURL).then(async () => {
			var returnObj = {'objects': [], 'tax': 0, 'total': 0}
			// Retrieve the price of the order and each of its items in dictionary form
			let objs = await this.driver.findElements(By.css('#BasketProducts > li'))
			for (let i = 0; i < objs.length; i++) {
				let qty = await objs[i].findElement(By.css('.quantity')).getText()
				let product = await objs[i].findElement(By.css('.product')).getText()
				let cost = await objs[i].findElement(By.css('.money')).getText()
				cost = parseFloat(cost.substr(1))
				let options = await objs[i].findElement(By.css('.options')).getText()
				// With all the item components in hand, build the dictionary
				returnObj['objects'].push({
					'quantity': qty,
					'product': product,
					'cost': cost,
					'options': options
				})
			}

			// Also add the tax and total
			let tax = await this.driver.findElement(By.css('.taxRow > .money')).getText()
			returnObj['tax'] = parseFloat(tax.substr(1))
			let total = await this.driver.findElement(By.css('.total > .money')).getText()
			returnObj['total'] = parseFloat(total.substr(1))

			// Return the return object
			callback(returnObj)
		})
	}
}

let fgc = new FiveGuysCheckout()
fgc.addToCart(SAMPLE_ORDER, () => { 
	fgc.performCheckout('18:45', 'asdds', SAMPLE_userinfo, (err, res) => {
		console.log(err)
	})
})


