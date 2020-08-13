const { Sequelize, DataTypes, Model } = require('sequelize');

const ENUMS = require('./Enums');

const config = require('../config');

class Annotations extends Model {
    async getData () {
        return {
            id: this.id,
            notes: (await this.getNotes()).map(annotation => annotation.getData())
        }
    }
}

module.exports = {
    model: Annotations,
    init: sequelize => Annotations.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4
        }
    }, {
        sequelize,
        modelName: 'Annotations'
    }),
    create: data => {
        return Annotations.create(data);
    },
    findAnnotations: (ClassUserId, BookId) => {
        return Annotations.findOne({ where: { ClassUserId, BookId } });
    }
}

