'use strict';
const {
  Model,Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User,{
        foreignKey: 'userId'
      })
      // define association here
    }
    static addTodo({title,dueDate,userId}){
      return this.create({title: title,dueDate: dueDate,completed: false,userId});
    }

    static overdue_todos(today,userId){
      const overdue = this.findAll({
        where:{
          dueDate:{
            [Op.lt]: today,
          },
          userId,
          completed: false,
        },
      });
      return overdue;
    }

    static duetoday_todos(today,userId){
      const duetoday = this.findAll({
        where:{
          dueDate:{
            [Op.eq]: today,
          },
          userId,
          completed: false,  
        },
      });
      return duetoday;
    }


    static duelater_todos(today,userId){
      const duelater = this.findAll({
        where:{
          dueDate:{
            [Op.gt]: today,
          },
          userId,
          completed: false, 
        },
      });
      return duelater;
    }


    static completed_todos(userId){
      const completedItems = this.findAll({
        where:{
          userId,
          completed: true
        },
      });
      return completedItems;
    }


    static getTodos(){
      return this.findAll();
    }


    setCompletionStatus(status){
      return this.update({completed : !status});
    }

    deleteId(id,userId){
      return this.destroy({where : {id,userId}});
    }




  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};