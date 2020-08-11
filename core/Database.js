const { Sequelize } = require('sequelize');

const User = require('../models/User');
const Class = require('../models/Class');
const ClassUser = require('../models/ClassUser');

const config = require('../config');

class Database {
    constructor () {
        this.sequelize = new Sequelize(config.databaseConfig);

        this.models = {
            User,
            Class,
            ClassUser
        };

        this.sequelize.authenticate();

        User.init(this.sequelize);
        Class.init(this.sequelize);
        ClassUser.init(this.sequelize);

        User.model.belongsToMany(Class.model, { through: ClassUser.model });
        Class.model.belongsToMany(User.model, { through: ClassUser.model });

        this.sequelize.sync();
    }
}

module.exports = Database;