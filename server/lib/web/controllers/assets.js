'use strict';

var path = require('path');

module.exports = function(core, web) {

    web.server.route({
        method: 'GET',
        path: '/assets/{param*}',
        handler: {
            directory: {
                path: path.join(__dirname, '../../../../client/build')
            }
        }
    });

}