
var base_creep = require('./creep');
var builder    = require('./creep.builder');
var carrier    = require('./creep.carrier');
var harvester  = require('./creep.harvester');
var creeps     = require('./creeps');
var repairer   = require('./creep.repairer');
var rooms      = require('./rooms');
var start      = require('./phase.start');
var tasks      = require('./tasks');
var tower      = require('./structure.tower');
var upgrader   = require('./creep.upgrader');

/**
 * @type object|base_creep[]
 */
var creep_of = {
	base_creep:      base_creep,
	harvester:       harvester,
	source_carrier:  carrier,
	upgrade_carrier: carrier,
	repairer:        repairer,
	builder:         builder,
	upgrader:        upgrader
};

/**
 * @type object|tower[]
 */
var structure_of = {
	STRUCTURE_TOWER: tower
};

module.exports.loop = function ()
{
	if (!rooms.memorized()) rooms.memorize();

	// count existing creeps
	var count = creeps.count();

	// creeps work
	creeps.forEach(function(creep) {
		if (!creep.spawning && creep_of[creep.memory.role]) {
			creep_of[creep.memory.role].work(creep);
		}
	});

	// spawn creeps outside of tasks
	for (let role in creep_of) if (creep_of.hasOwnProperty(role)) {
		if (!count[role]) {
			console.log('- try to spawn a free ' + role);
			var creep = creep_of[role].spawn();
			if (creep) {
				creep.memory.role = role;
			}
		}
	}

	return;

	// start phase
	if (!Memory.phase) {
		start.run();
	}

	// spawn a base creep to start the map
	if (!count.creep && (!count.carrier || !count.harvester)) {
		base_creep.spawn(Game.spawns.Spawn.id);
	}

	// spawn creeps for tasks
	tasks.forEachUnaffected(function(task, task_key) {
		if (creep_of[task.role]) {
			console.log('- try to spawn a task ' + task.role);
			let creep = creep_of[task.role].spawn();
			if (creep) {
				creep.memory.task = task_key;
				if (task.source) creep.memory.source = task.source;
				if (task.target) creep.memory.target = task.target;
			}
		}
	});

	// structures work
	for (let structure in Game.structures) if (Game.structures.hasOwnProperty(structure)) {
		structure = Game.structures[structure];
		if (structure.my && structure_of[structure.structureType]) {
			structure_of[structure.structureType].run(structure);
		}
	}

};
