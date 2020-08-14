const { Sequelize, DataTypes, Model } = require('sequelize');

const ENUMS = require('./Enums');

const config = require('../config');

class Note extends Model {
    getData() {
        return {
            id: this.id,
            cifRange: this.cifRange,
            text: this.text
        }
    }
}

module.exports = {
    model: Note,
    init: sequelize => Note.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        cfiRange: {
            type: DataTypes.STRING,
            allowNull: false
        },
        text: {
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        modelName: 'Note'
    }),
    create: data => {
        return Note.create(data);
    },
    findID: id => {
        return Note.findByPk(id);
    },
}

