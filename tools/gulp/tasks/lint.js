const {createRunAllScriptsTask} = require('../package');

const tasks = {};
module.exports = {tasks};

createRunAllScriptsTask('lint', tasks);
