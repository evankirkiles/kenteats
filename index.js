const Checkout = require('./scripts/checkout').Checkout
const Product = require('./scripts/products').ProductRetriever

// var checkout = new Checkout()
var product = new Product()

// Product for testing purposes
// let testproduct = { name: 'Caffè Americano',
//   formCode: 'Hot',
//   displayOrder: 1,
//   productNumber: 406,
//   productType: 'Beverage',
//   availability: 'Available',
//   sizes:
//    [ { sizeCode: 'Short' },
//      { sizeCode: 'Tall' },
//      { sizeCode: 'Grande' },
//      { sizeCode: 'Venti' } ],
//   uri: '/product/406/hot',
//   specifications: [ [ '1', '2', '5', '1' ], [ '5', '1', '1', '1' ] ]
// }

// // Go to product checkout
// let myOrder = new Checkout()
// myOrder.init().then(() => {
// 	myOrder.orderProduct(testproduct)
// })