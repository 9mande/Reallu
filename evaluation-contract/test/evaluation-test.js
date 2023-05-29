// use this by [ truffle test ./test/evaluation-test.js ]

const Evaluation = artifacts.require("Evaluation");

contract('Evaluation', function(accounts) {
    beforeEach('Setup contract for each test', async function(){
        evaluation = await Evaluation.new(26);
    });

    describe('', function() {
        beforeEach('', async function(){

        });
        it('getInstructorTest', async function() {
            var response = await evaluation.instructor();
            assert.equal(response, accounts[0], 'instructor is wrong');
        });
    })
});