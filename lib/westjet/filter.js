
const config = {
    "days-of-week" : [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ]
}


const filterDateBasedOnExcludes = function( date, excludes ){
    console.log( '>> filterDateBasedOnExcludes( "' + date + '" )' );
    let excludeList = excludes.split( ',' );
    date = new Date( date.replace( /-/g, '/' ) );
    let included = true;

    for( var i = 0; i < excludeList.length && included; i++ ){

        // Figure out the type of exclusion rule, default is date
        let type = 'date';

        // "2019-10-01 to 2019-10-05"
        if( excludeList[ i ].indexOf( 'to' ) != -1 ){
            type = 'range';
        }
        // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
        if( excludeList[ i ].length == 3 ){
            type = 'day of week';
        }
        // TODO: Rolling range?

        console.log( '\t' + type + ': ' + excludeList[ i ] );

        // Do the filtering...
        switch( type ){
            case 'date' :
                let test = new Date( excludeList[ i ].replace( /-/g, '/' ) );
                if( date.getTime() == test.getTime() ){
                    included = false;
                }
                break;
            case 'range' :
                let start = new Date( excludeList[ i ].split( 'to' )[ 0 ].trim().replace( /-/g, '/' ) );
                let end = new Date( excludeList[ i ].split( 'to' )[ 1 ].trim().replace( /-/g, '/' ) );
                if( date.getTime() > start.getTime() && date.getTime() < end.getTime() ){
                    included = false;
                }
                break;
            case "day of week" :
                let pos = config[ 'days-of-week' ].indexOf( excludeList[ i ] );
                if( date.getDay() == pos ){
                    included = false;
                }
                break;
        }

    }
    console.log( '\tResult: ' + included );
    return included;
}

const filterPricingAPIResults = function( results, start, end, min, max, excludes, sort ){
    console.log( '>> filterPricingAPIResults()' );
    console.log( 'There are ' + results.length + ' results to handled' );

    let filteredResults = [];

    let startDate = new Date( start );
    let endDate = new Date( end );

    // TODO this can be optimized to look at the month lowest price and conditionally move on to daily lowest comparision if needed

    for( let i = 0; i < results.length; i++ ){
        if( results[ i ] == '' ){
            continue;
        }
        let month = JSON.parse( results[ i ] );
        console.log( 'Processing month: ' + month[ 0 ].date );

        let days = Object.keys( month[ 0 ].day );
        console.log( '\tThere are ' + days.length + ' to process' );
        for( let j = 0; j < days.length; j++ ){
            let day =  month[ 0 ].day[ days[ j ] ];

            if( day.status == 'available' ){
                let cur =  month[ 0 ].date + '-' + day.day.padStart( 2, '0' );

                console.log( '\t\t' + cur );

                // TODO: this can be optimized by creating the date objects a minimal amount of times
                // TODO: more clarification on same dates filtering in or out
                console.log( '\t\t\tGreater than start: ' + ( new Date( cur ).getTime() >= startDate.getTime() ) );
                console.log( '\t\t\tLess than end: ' + ( new Date( cur ).getTime() <= endDate.getTime() ) );
                if( new Date( cur ).getTime() >= startDate.getTime() && new Date( cur ).getTime() <= endDate.getTime() ){
                    console.log( '\t\t\tmeets date filter' );
                    // TODO: overall optimization maybe putting the price comparision before the date one is faster?
                    console.log( '\t\t\tMin: ' + min );
                    console.log( '\t\t\tMax: ' + max );
                    console.log( '\t\t\tPrice: ' + day.price );

                    // TODO: is this '>' and '<' or '<=' and '>='
                    if( parseInt( day.price ) > parseInt( min ) && parseInt( day.price ) < parseInt( max ) ){
                        console.log( '\t\t\tIn Price Range' );
                        if( filterDateBasedOnExcludes( cur, excludes ) ){
                            day.day = cur;
                            filteredResults.push( day );
                        }
                    }

                } else {
                    console.log( '\t\t\tdoes not meet date filter' );
                }
            } else {
                console.log( '\t\t\tnot available' );
            }
        }
    }

    if( sort ){
        filteredResults.sort( function(a, b){
                return a.price - b.price;
            });
    }
    return filteredResults;
}


module.exports.filterPricingAPIResults = filterPricingAPIResults;