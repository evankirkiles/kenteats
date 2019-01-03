let d = 2
let toReturn = 'UPDATE kenteats.financials SET `profit`=`profit`/' + d + ',`revenue`=`revenue`/' + d + ',`expenditures`=`expenditures`/' + d + ',`cash`=`cash`/' + d + ',`card`=`card`/' + d + ',`venmo`=`venmo`/' + d + ',`studentid`=`studentid`/' + d + ','
for (let j = 1; j < 58; j++) {
	toReturn += '`order' + j + '`=`order' + j + '`/' + d + ','
}
console.log(toReturn)