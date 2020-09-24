const {createRunAllScriptsTask} = require('../package');

const tasks = {};
module.exports = {tasks};

createRunAllScriptsTask('compile', tasks);
createRunAllScriptsTask('compile:build', tasks);
