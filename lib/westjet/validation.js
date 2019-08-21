const airportCodes = [ 'YYC', 'YOW', 'YYZ', 'BGI' ];

const validateAirport = function( airportOriginCode, airportDestinationCode ){
    console.log( '>> validateAirport( "' + airportOriginCode + '", "' + airportDestinationCode + '" )' );
    // Is the origin and destination the same
    if( airportOriginCode == airportDestinationCode ){
        return false;
    }

    // Is the origin code in the airport list
    if( airportCodes.indexOf( airportOriginCode ) == -1 ){
        return false;
    }

    // Is the destination code in the airport list
    if( airportCodes.indexOf( airportDestinationCode ) == -1 ){
        return false;
    }

    return true;
}


const validateDates = function( start, end ){
    console.log( '>> validateDates( "' + start + '", "' + end + '" )' );
    let startDate = new Date( start );
    let endDate = new Date( end );
    return startDate < endDate;
}


const validatePrice = function( min, max ){
    return min < max;
}



module.exports.validateAirport = validateAirport;
module.exports.validateDates = validateDates;
module.exports.validatePrice = validatePrice;
