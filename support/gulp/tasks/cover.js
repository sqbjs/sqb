const {createRunAllScriptsTask} = require('../package');

const tasks = {};
module.exports = {tasks};

createRunAllScriptsTask('cover', tasks);
