var Evaluation = artifacts.require("Evaluation");
var numSchedules = 27;
module.exports = function(deployer) {
	deployer.deploy(Evaluation, numSchedules);
}
