const { Sequelize, DataTypes, Model } = require('sequelize');

const ENUMS = require('./Enums');

const config = require('../config');

class Book extends Model {
    getData() {
        return {
            id: this.id,
            name: this.name,
            path: this.path
        };
    }
}

module.exports = {
    model: Book,
    init: sequelize => User.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Book'
    }),
    create: data => {
        return User.create(data);
    },
    findID: id => {
        return User.findByPk(id);
    }
}

