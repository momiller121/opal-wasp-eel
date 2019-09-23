'use strict';

const Path = require('path');
const Pack = require(Path.join(__dirname, '..', 'package'));
const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pino = require('pino');
const HapiPino = require('hapi-pino');
const Moment = require('moment');

const logger = Pino({ level: process.env.PINO_LOG_LEVEL || 'info' }); // one of: 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'.

const AirportCode = Joi.string().regex(/^[A-Z]{3}$/, 'Uppercase 3 letter IATA Airport Code').required();

const dateDaysFromNow = (daysOut = 0) => {

    const now = Moment();
    return now.add(daysOut, 'days').format('YYYY-MM-DD');
};

const Handlers = require('./westjet/handlers.js');

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
});

server.route({
    method: 'GET',
    path: '/',
    options: {
        description: 'Say hello',
        notes: 'offers a personalized greeting',
        tags: ['no-api'], // exclude from Swagger docs
        validate: {
            query: {
                name: Joi.string()
                    .optional()
                    .description('greeting name')
            }
        },
        handler: function (request, h) {

            return request.query.name ? `Hello ${request.query.name}` : 'Hello World!';
        }
    }
});

server.route([
    {
        method: 'GET',
        path: '/pricing/static/{ORIG}/{DEST}/{START_DATE}/{END_DATE}/{MIN}/{MAX}/{EXCLUSIONS?}',
        options: {
            description: 'fixed (static) date prices',
            notes: 'POC example exploring what might be required on a flexible price service endpoint',
            plugins: {
                'hapi-swagger': {
                    order: 1
                }
            },
            tags: ['api'], // ADD THIS TAG to include in Swagger docs
            validate: {
                params: {
                    ORIG: Joi.string().uppercase().required().description('Origin IATA Code').default('YYC'),
                    DEST: Joi.string().uppercase().required().description('Destination IATA Code').default('YYZ'),
                    START_DATE: Joi.string().required().description('Start date').default(dateDaysFromNow(15)),
                    END_DATE: Joi.string().required().description('End date').default(dateDaysFromNow(30)),
                    MIN: Joi.number().required().description('Minimum price value').default(100),
                    MAX: Joi.number().required().description('Maximum price value').default(700),
                    EXCLUSIONS: Joi.string().optional().description('Exclusions List').default('Mon,Tue'),
                },
                // eslint-disable-next-line handle-callback-err
                failAction: (request, h, error) => {

                    console.error(error);
                    const response = h.response({ validationError: true, error });
                    return response.takeover();
                }
            },
            handler: Handlers.filteredResultsHandler
        }
    }, {
        method: 'GET',
        path: '/pricing/rolling/{ORIG}/{DEST}/{ROLLING_START}/{ROLLING_END}/{MIN}/{MAX}/{EXCLUSIONS?}',
        options: {
            description: 'rolling date prices',
            notes: 'provides support for dynamically rolling date range',
            plugins: {
                'hapi-swagger': {
                    order: 2
                }
            },
            tags: ['api'], // ADD THIS TAG to include in Swagger docs
            validate: {
                params: Joi.object().keys({
                    ORIG: Joi.string().uppercase().required().description('Origin IATA Code').default('YYC'),
                    DEST: Joi.string().uppercase().required().description('Destination IATA Code').default('YYZ'),
                    ROLLING_START: Joi.number().integer().required().min(0).max(120).default(10),
                    ROLLING_END: Joi.number().integer().required().min(0).max(330).default(30).when('ROLLING_START', {
                        is: Joi.exist(),
                        then: Joi.number().greater(Joi.ref('ROLLING_START')),
                    }),
                    MIN: Joi.number().required().description('Minimum price value').default(100),
                    MAX: Joi.number().required().description('Maximum price value').default(700),
                    EXCLUSIONS: Joi.string().optional().description('Exclusions List'),
                }),
                failAction: (request, h, error) => {

                    const response = h.response({ validationError: true, error });
                    return response.takeover();
                }
            },
            handler: Handlers.filteredResultsHandler
        }
    },
    {
        method: 'GET',
        path: '/v1',
        options: {
            description: 'marketing price points',
            notes: 'POC example exploring what might be required on a flexible price service endpoint',
            plugins: {
                'hapi-swagger': {
                    order: 1
                }
            },
            tags: ['api'], // ADD THIS TAG to include in Swagger docs
            validate: {
                query: {
                    o: AirportCode.description('Origin airport code'),
                    d: Joi.alternatives().try(
                        Joi.array()
                            .max(12)
                            .items(AirportCode)
                            .description('Destination airport code(s) (multiple values allowed)'), AirportCode),
                    rangeStartDate: Joi.date()
                        .optional()
                        .description('Range Start Date (YYYY-MM-DD)')
                        .default(dateDaysFromNow(15)),
                    rangeEndDate: Joi.date()
                        .optional()
                        .description('Range End Date (YYYY-MM-DD)')
                        .default(dateDaysFromNow(30)),
                    rangeStartOffset: Joi.number()
                        .integer()
                        .min(0)
                        .max(120)
                        .description('Offset Days to Range Start Date (integer value)'),
                    rangeEndOffset: Joi.number()
                        .integer()
                        .min(0)
                        .max(120)
                        .description('Offset Days to Range End Date (integer value)'),
                    cabin: Joi.string()
                        .allow('econo')
                        .optional()
                        .default('econo')
                        .description('Cabin Type'),
                    minPrice: Joi.number()
                        .integer()
                        .optional()
                        .description('Minimum price value (integer value only)'),
                    maxPrice: Joi.number()
                        .integer()
                        .optional()
                        .description('Maximum price value (integer value only)'),
                    de: Joi.alternatives()
                        .try(Joi.array()
                            .items(Joi.date())
                            .description('Date Exclusion - Exclude specific date to exclude from results (YYYY-MM-DD)'), Joi.date())
                        .optional(),
                    dre: Joi.alternatives()
                        .try(Joi.array()
                            .items()
                            .description('Date Range Exclusion - Exclude a specific date range (start|end ie. YYYY-DD-MM|YYYY-MM-DD)'), Joi.string()),
                    iwe: Joi.alternatives()
                        .try(Joi.array()
                            .items(Joi.number()
                                .integer()
                                .min(1)
                                .max(7))
                            .description('ISO Weekday Exclusion - Exclude a specific weekday by it\'s ISO weekday number (1 for Monday)'), Joi.number()
                            .integer()
                            .min(1)
                            .max(7)),
                },

                failAction: (request, h, error) => {

                    console.error(error);
                    const response = h.response({ validationError: true, error });
                    return response.takeover();
                }
            },
            handler: (request, h) => {

                console.log(request.query);
                return { foo: 'bar' };
            }
        }
    }]);

const swaggerOptions = {
    info: {
        title: `${Pack.name} API Docs` || 'Test API Documentation',
        version: Pack.version,
        description: 'This is a collaboration space - not an active API implementation.'
    },
    sortEndpoints: 'ordered'
};

const registerPlugins = async () => {

    await server.register([{
        plugin: HapiPino,
        options: {
            prettyPrint: process.env.NODE_ENV !== 'production',
            // Redact Authorization headers, see https://getpino.io/#/docs/redaction
            redact: ['req.headers.authorization']
        }
    },
    Inert,
    Vision,
    {
        plugin: HapiSwagger,
        options: swaggerOptions
    }
    ]);
};

exports.init = async () => {

    await registerPlugins();
    await server.initialize();
    return server;
};

exports.start = async () => {

    await registerPlugins();
    await server.start();
    return server;
};

exports.stop = () => {

    server.stop({ timeout: 10000 }).then((err) => {

        if (err) {
            logger.fatal(err, 'error during server stop');
        }
        else {
            logger.info('server stop');
        }

        setTimeout(() => {

            process.exit((err) ? 1 : 0);
        }, 750);

    });
};

process.on('unhandledRejection', (err) => {

    logger.fatal(err, 'unhandledRejection');
    setTimeout(() => {

        process.exit(1);
    }, 750);
});

process.on('uncaughtException', (err) => {

    logger.fatal(err, 'uncaughtException');
    setTimeout(() => {

        process.exit(1);
    }, 750);
});
