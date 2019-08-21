const Wreck = require( '@hapi/wreck' );

const getMonthsFromRange = function( start, end ){

    // No clue why, but js dates...
    // https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off
    let startDate = start.replace( /-/g, '/' );
    let endDate = end.replace( /-/g, '/' );

    console.log( '>> getMonthsFromRange( "' + startDate + '", "' + endDate + '" )' );
    let months = [];

    // TODO: need to understand if the comparision should include equals... so does 2019-10-01 to 2019-11-01 include 2019-11 as a month
    for( let i = new Date( startDate ); i <= new Date( endDate ); i = new Date( i.getFullYear(), i.getMonth() + 1, 1 ) ){
        let month = i.getFullYear() + '-' + ( i.getMonth() + 1 ).toString().padStart( 2, '0' );
        months.push(  month );
    }
    return months;
}

const getPricingAPIUrls = function( orig, dest, months ){
    let urls = [];
    // https://api.westjet.com/retail/pricingDetails?origin=YYC&destination=YYZ&date=2019-08,2019-09"
    for( var i = 0; i < months.length; i++ ){
        urls.push( 'https://api.westjet.com/retail/pricingDetails?oneWay=true&origin=' + orig + '&destination=' + dest + '&date=' + months[ i ] );
    }
    return urls;
}


const get = async function ( url ) {
       const { res, payload } = await Wreck.get( url );
       return payload.toString();
}



module.exports.getMonthsFromRange = getMonthsFromRange;
module.exports.getPricingAPIUrls = getPricingAPIUrls;
module.exports.get = get;