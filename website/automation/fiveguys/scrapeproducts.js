// Require Selenium for checking out
const chrome = require('selenium-webdriver/chrome')
let options = new chrome.Options()
// options.addArguments('headless')
const {Builder, By, Capabilities, Key, until} = require('selenium-webdriver')

// Sleep function for waiting for pgae to reload
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

// Go to New Milford store page and parse through all the options, building an object out of each one
let driver = new Builder().forBrowser('chrome').withCapabilities(Capabilities.chrome()).setChromeOptions(options).build()
function getProds(callback) {
	let toReturn = {}
	driver.get('https://order.fiveguys.com/menu/five-guys-new-milford').then(async () => {
		// Iterate through the product categories
		let cats = await driver.findElements(By.css('#ProductList > div'))
		for (let i = 0; i < cats.length; i++) {

			// Get the product ID and the title
			let id = await cats[i].getAttribute('data-category-id')
			let title = await cats[i].getAttribute('innerText')

			// Click the product ID to allow for getting condiment options
			await driver.findElement(By.css('#CategoryItem' + id)).click()

			// Use the product ID to get all of its sub-products
			let subProducts = {}
			let prods = await driver.findElements(By.css('#prods' + id + ' > li'))
			for (let j = 0; j < prods.length; j++) {
				let id2 = await prods[j].getAttribute('data-product-id')
				let title2 = await prods[j].findElement(By.css('.product-name')).getAttribute('innerText')
				let price = await prods[j].findElement(By.css('.product__attribute--price')).getAttribute('innerText')

				// Click the product to view all condiments
				await prods[j].findElement(By.css('a')).click()
				await sleep(100)

				// Iterate through the condiments
				let condis = {}
				let condims = await driver.findElements(By.css('#frmCustomize ul > li'))
				for (let k = 0; k < condims.length; k++) {
					let id3 = await condims[k].getAttribute('data-choice')
					let title3 = await condims[k].findElement(By.css('.option-group-choice-label__name')).getAttribute('innerText')

					// To determine if the condiment has quantities, click it (if it isnt clicked) and check if quantity appears
					let checked = await condims[k].findElements(By.css('#chk_' + id3))
					let temp = []
					if (checked.length != 0) {
						checked = await checked[0].getAttribute('aria-checked')
						if (checked != 'true') {
							await condims[k].click()
							await sleep(250)
						}
						temp = await driver.findElements(By.css('#multinest_' + id3))
						console.log(id3 + ' : ' + temp.length)
					}

					// Build the condiment map with this information
					condis[title3.trim()] = {
						'condid': id3,
						'quantities': temp.length != 0
					}
				}

				subProducts[title2.trim()] = {
					'prodid': id2,
					'price': price,
					'condiments': condis
				}
			}

			toReturn[title.trim()] = { 
				'id': id,
				'children': subProducts
			}
		}

		callback(toReturn)
	})
}

getProds((title) => {
	console.log(JSON.stringify(title))
})