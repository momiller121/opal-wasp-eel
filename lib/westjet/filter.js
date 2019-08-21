

// TODO: all of this...
const filterDateBasedOnExcludes = function( date, excludes ){
    return true;
}

const filterPricingAPIResults = function( results, start, end, min, max, excludes, sort ){
    console.log( '>> filterPricingAPIResults()' );
    console.log( 'There are ' + results.length + ' results to handled' );

    let filteredResults = [];

    let startDate = new Date( start );
    let endDate = new Date( end );

    // TODO this can be optimized to look at the month lowest price and conditionally move on to daily lowest comparision if needed

    for( let i = 0; i < results.length; i++ ){
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
                console.log( '\t\t\tGreater than start: ' + ( new Date( cur ) > startDate ) );
                console.log( '\t\t\tLess than end: ' + ( new Date( cur ) < endDate ) );
                if( new Date( cur ) >= startDate && new Date( cur ) <= endDate ){
                    console.log( '\t\t\tmeets date filter' );
                    // TODO: overall optimization maybe putting the price comparision before the date one is faster?
                    console.log( '\t\t\tMin: ' + min );
                    console.log( '\t\t\tMax: ' + max );
                    console.log( '\t\t\tPrice: ' + day.price );

                    if( day.price > min && day.price < max ){
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