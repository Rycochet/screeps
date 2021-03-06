
let objects = require('./objects');

module.exports.__proto__ = require('./creep');

/**
 * Body parts for a repairer
 * CARRY x 3, MOVE x 3, WORK x 3
 * - consumes 600 energy units
 */
module.exports.body_parts = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, WORK, WORK, WORK];

module.exports.role        = 'repairer';
module.exports.source_work = false;

/**
 * Job is done each time the creep energy is zero (new target) and if the target is fully repaired
 *
 * @param creep Creep
 * @return boolean
 */
module.exports.targetJobDone = function(creep)
{
	let target = objects.get(creep, creep.memory.target);
	if (this.DEBUG) console.log('t: target =', target);
	let result = !objects.wounded(target);
	if (this.DEBUG) console.log(
		result ? 't: target job done (target hits full)' : 't: target job continue (target hits not full)'
	);
	return result;
};

/**
 * Targets are construction sites
 * If there are no construction sites : the builder becomes an upgrader
 *
 * @param context RoomObject
 * @return ConstructionSite[]
 **/
module.exports.targets = function(context)
{
	let structures     = context.room.find(FIND_STRUCTURES, { filter: structure => objects.wounded(structure) });
	let min_hits_ratio = 1000;
	let targets        = [];
	for (let structure of structures) {
		let hits_ratio = Math.round(objects.hitsRatio(structure) * 100);
		if (hits_ratio < min_hits_ratio) {
			min_hits_ratio = hits_ratio;
			targets        = [structure];
		}
		else if (hits_ratio === min_hits_ratio) {
			targets.push(structure);
		}
	}
	if (targets.length) this.setTargetDuration(context, 20);
	return targets;
};
