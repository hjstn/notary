const { Sequelize, DataTypes, Model } = require('sequelize');

const ENUMS = require('./Enums');

const config = require('../config');

class ClassUser extends Model {
    getPermission() {
        return this.permission;
    }
}

module.exports = {
    model: ClassUser,
    init: sequelize => ClassUser.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        permission: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isIn: [Object.values(ENUMS.PERMISSION)]
            }
        }
    }, {
        sequelize,
        modelName: 'ClassUser'
    }),
    create: data => {
        return ClassUser.create(data);
    },
    findClassUser: (ClassId, UserId) => {
        return ClassUser.findOne({ where: { ClassId, UserId } });
    }
}

