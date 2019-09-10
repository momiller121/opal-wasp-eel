'use strict';

const Validator = require( './validation.js' );
const Util = require( './Utils.js' );
const Filter = require( './filter.js' );
const Moment = require('moment');

const filteredResultsHandler = async function ( request, h ){

    // I am reusing this handler to support the rolling dates idea. The following sets the dates:
    if (request.params.ROLLING_START && request.params.ROLLING_END){
        request.params.START_DATE = Moment().add(request.params.ROLLING_START, 'days').format('YYYY-MM-DD');
        request.params.END_DATE = Moment().add(request.params.ROLLING_END, 'days').format('YYYY-MM-DD');
    }

    if ( !Validator.validateAirport( request.params.ORIG, request.params.DEST ) ){
        return { 'status' : 'error', 'message' : 'Error: Conflict in Airport Code present' };
    }

    if ( !Validator.validateDates( request.params.START_DATE, request.params.END_DATE ) ){
        return { 'status' : 'error', 'message' : 'Error: Start and End dates are in conflict' };
    }

    if ( !Validator.validatePrice( request.params.MIN, request.params.MAX ) ){
        return { 'status' : 'error', 'message' : 'Error: min and max prices are in conflict' };
    }

    const months = Util.getMonthsFromRange( request.params.START_DATE, request.params.END_DATE );
    const urls = Util.getPricingAPIUrls( request.params.ORIG, request.params.DEST, months );

    const proms = [];
    for ( let i = 0; i < urls.length; ++i ){
        const url =  urls[ i ];
        console.log( url );
        proms.push( Util.get( url ) );
    }

    const results = await Promise.all( proms ).then(
        ( result ) => {

            const pricing = Filter.filterPricingAPIResults( result, request.params.START_DATE, request.params.END_DATE, request.params.MIN, request.params.MAX, request.params.EXCLUSIONS, true );
            const data = {
                'status' : 'success',
                'data' : pricing
            };
            return data;
        });

    return results;
    // return { "status" : "success", "message" : "date coming soon..." };
};



module.exports.filteredResultsHandler = filteredResultsHandler;
