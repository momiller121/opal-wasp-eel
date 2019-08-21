
const validator = require( './validation.js' );
const util = require( './utils.js' );
const filter = require( './filter.js' );


const filteredResultsHandler = async function( request, h ){

  if( !validator.validateAirport( request.params.ORIG, request.params.DEST ) ){
      return { "status" : "error", "message" : "Error: Conflict in Airport Code present" };
  }

  if( !validator.validateDates( request.params.START, request.params.END ) ){
      return { "status" : "error", "message" : "Error: Start and End dates are in conflict" };
  }

  if( !validator.validatePrice( request.params.MIN, request.params.MAX ) ){
      return { "status" : "error", "message" : "Error: min and max prices are in conflict" };
  }

  var months = util.getMonthsFromRange( request.params.START, request.params.END );
  var urls = util.getPricingAPIUrls( request.params.ORIG, request.params.DEST, months );

  let proms = [];
  for( var i = 0; i < urls.length; i++ ){
      let url =  urls[ i ];
      console.log( url );
      proms.push( util.get( url ) );
  }

   const results = await Promise.all( proms ).then(
        function( result ){
                let pricing = filter.filterPricingAPIResults( result, request.params.START, request.params.END, request.params.MIN, request.params.MAX, request.params.EXCLUSIONS, true );
                let data = {
                        "status" : "succes",
                        "data" : pricing
                    };
                return data;
            });

   return results;
  // return { "status" : "success", "message" : "date coming soon..." };
}



module.exports.filteredResultsHandler = filteredResultsHandler;