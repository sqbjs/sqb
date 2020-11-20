const {createRunAllScriptsTask} = require('../package');

const tasks = {};
module.exports = {tasks};

createRunAllScriptsTask('test', tasks);
