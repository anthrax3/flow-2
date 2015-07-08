'use strict';

var _ = require('lodash'),
    Agenda = require('agenda'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    yaml = require('js-yaml'),
    all = require('require-tree');

function Services(core, options) {

    this.options = options;

    this.core  = core;

    this.tasks = [];

    this.store = {};

    this.availableServices = _.mapValues(all(path.join(__dirname, './built-in'), {
        index: 'preserve'
    }), function(val) {
        return val.index;
    });

    this.agenda = new Agenda({
        db: {
            address: 'localhost:27017/flow-agenda'
        },
        defaultLockLifetime: 30 * 1000
    });

}

Services.prototype.save = function(id, data) {

    this.store[id] = data;

    this.core.emit('task:data', data, {
        id: id
    });

};

Services.prototype.loadServices = function() {

    var that = this;

    glob(path.join(__dirname, '../../../tasks/*.yml'), function(err, files) {

        if (err) {
            console.error('Error loading tasks:', err);
            return;
        }

        _.each(files, function(file) {

            var context = yaml.safeLoad(fs.readFileSync(file, 'utf8')),
                Service = that.availableServices[context.service],
                service = new Service(context);

            console.log('Loaded: ' + (context.service + '/' + context.id).magenta);

            that.agenda.define(context.id, function(job, done) {
                service.fetch(function(err, data) {
                    done();
                    if (err) {
                        console.error(err);
                        return;
                    }
                    that.save(context.id, data);
                });
            });

            that.agenda.every(context.interval, context.id);

            that.agenda.now(context.id);

            that.agenda.on('fail:' + context.id, function(err) {
                console.log('[%s] Job failed with error: %s', context.id, err.message);
            });

            that.tasks.push(service);

        });

    });

};

Services.prototype.start = function(cb) {

    this.loadServices();

    this.agenda.start();

    typeof cb === 'function' && cb();

};

module.exports = Services;
