const { Sequelize, DataTypes, Model } = require('sequelize');

const ENUMS = require('./Enums');

const config = require('../config');

class Class extends Model {
    async getData() {
        return {
            id: this.id,
            name: this.name,
            members: (await this.getUsers()).map(user => ({
                ...user.getData(),
                permission: user.ClassUser.permission
            }))
        };
    }
}

module.exports = {
    model: Class,
    init: sequelize => Class.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Class'
    }),
    create: data => {
        return Class.create(data);
    },
    findID: id => {
        return Class.findByPk(id);
    }
}

