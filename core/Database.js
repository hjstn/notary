const { Sequelize } = require('sequelize');

const Book = require('../models/Book');
const User = require('../models/User');
const Note = require('../models/Note');
const Class = require('../models/Class');
const ClassUser = require('../models/ClassUser');
const Annotations = require('../models/Annotations');

const config = require('../config');

class Database {
    constructor () {
        this.sequelize = new Sequelize(config.databaseConfig);

        this.models = {
            Book,
            User,
            Note,
            Class,
            ClassUser,
            Annotations
        };

        this.sequelize.authenticate();

        Book.init(this.sequelize);
        User.init(this.sequelize);
        Class.init(this.sequelize);
        ClassUser.init(this.sequelize);
        Note.init(this.sequelize);
        Annotations.init(this.sequelize);

        User.model.belongsToMany(Class.model, { through: ClassUser.model });
        Class.model.belongsToMany(User.model, { through: ClassUser.model });

        Book.model.belongsToMany(ClassUser.model, { through: Annotations.model });
        ClassUser.model.belongsToMany(Book.model, { through: Annotations.model });

        Annotations.model.hasMany(Note.model);

        this.sequelize.sync();
    }
}

module.exports = Database;