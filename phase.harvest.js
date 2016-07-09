
var harvester = require('harvester');
var upgrader  = require('upgrader');

/**
 * The harvest phase :
 * - needs at least initialized sources (phase.start)
 * - spawn harvesters and upgraders until all the sources access terrains capacity is used
 * - harvesters work on sources and bring the energy back to the spawn
 * - upgraders work on sources and bring the energy to the room controller
 */
module.exports.run = function()
{
	var count = { harvester: 0, upgrader: 0 };
	var creeps = _.filter(Game.creeps, creep => ((creep.memory.role == 'harvester') || (creep.memory.role == 'upgrader')));
	for (var name in creeps) {
		var creep = creeps[name];
		if (creep.memory.role == 'harvester') harvester.work(creep);
		if (creep.memory.role == 'upgrader')  upgrader.work(creep);
		count[creep.memory.role] ++;
	}
	if (count['harvester'] < Math.min(Sources.terrainsCount(), 2)) {
		harvester.spawn();
	}
	else if (count['upgrader'] < (Sources.terrainsCount() - count['harvester']) * 1.5) {
		upgrader.spawn();
	}
};
