const bcrypt = require('bcrypt');
const { Sequelize, DataTypes, Model } = require('sequelize');

const ENUMS = require('./Enums');

const config = require('../config');

class User extends Model {
    checkPassword(enteredPassword) {
        return bcrypt.compareSync(enteredPassword, this.password);
    }

    getPermission() {
        return this.permission;
    }

    async getPermissionForClass(ClassId) {
        const classUser = await this.sequelize.models.ClassUser.findOne({ where: { ClassId, UserId: this.id }});

        return Math.max(classUser.getPermission(), this.getPermission());
    }

    getData() {
        return {
            id: this.id,
            name: this.name,
            permission: this.permission
        };
    }
}

module.exports = {
    model: User,
    init: sequelize => User.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        username: {
            unique: true,
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isAlphanumeric: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        permission: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isIn: [Object.values(ENUMS.PERMISSION)]
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'User'
    }),
    create: data => {
        return User.create({ ...data, password: bcrypt.hashSync(data.password, config.saltRounds) });
    },
    findID: id => {
        return User.findByPk(id);
    },
    findUsername: username => {
        return User.findOne({ where: { username } });
    }
}

