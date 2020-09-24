const {createRunAllScriptsTask} = require('../package');

const tasks = {};
module.exports = {tasks};

createRunAllScriptsTask('clean', tasks);
createRunAllScriptsTask('clean:src', tasks);
createRunAllScriptsTask('clean:dist', tasks);
