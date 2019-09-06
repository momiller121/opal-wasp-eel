'use strict';

const Validator = require( './validation.js' );
const Util = require( './Utils.js' );
const Filter = require( './filter.js' );


const filteredResultsHandler = async function ( request, h ){

    if ( !Validator.validateAirport( request.params.ORIG, request.params.DEST ) ){
        return { 'status' : 'error', 'message' : 'Error: Conflict in Airport Code present' };
    }

    if ( !Validator.validateDates( request.params.START, request.params.END ) ){
        return { 'status' : 'error', 'message' : 'Error: Start and End dates are in conflict' };
    }

    if ( !Validator.validatePrice( request.params.MIN, request.params.MAX ) ){
        return { 'status' : 'error', 'message' : 'Error: min and max prices are in conflict' };
    }

    const months = Util.getMonthsFromRange( request.params.START, request.params.END );
    const urls = Util.getPricingAPIUrls( request.params.ORIG, request.params.DEST, months );

    const proms = [];
    for ( let i = 0; i < urls.length; ++i ){
        const url =  urls[ i ];
        console.log( url );
        proms.push( Util.get( url ) );
    }

    const results = await Promise.all( proms ).then(
        ( result ) => {

            const pricing = Filter.filterPricingAPIResults( result, request.params.START, request.params.END, request.params.MIN, request.params.MAX, request.params.EXCLUSIONS, true );
            const data = {
                'status' : 'succes',
                'data' : pricing
            };
            return data;
        });

    return results;
    // return { "status" : "success", "message" : "date coming soon..." };
};



module.exports.filteredResultsHandler = filteredResultsHandler;
