'use strict';

var path = require('path');

module.exports = function(web, server) {

    server.route({
        method: 'GET',
        path: '/assets/{param*}',
        handler: {
            directory: {
                path: path.join(__dirname, '../../../../client/build')
            }
        }
    });

};
