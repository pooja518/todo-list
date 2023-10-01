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
    static addTodo({title,dueDate}){
      return this.create({title: title,dueDate: dueDate,completed: false});
    }

    static overdue_todos(today){
      const overdue = this.findAll({
        where:{
          dueDate:{
            [Op.lt]: today,
          },
          completed: false,
        },
      });
      return overdue;
    }

    static duetoday_todos(today){
      const duetoday = this.findAll({
        where:{
          dueDate:{
            [Op.eq]: today,
          },
          completed: false,  
        },
      });
      return duetoday;
    }


    static duelater_todos(today){
      const duelater = this.findAll({
        where:{
          dueDate:{
            [Op.gt]: today,
          },
          completed: false, 
        },
      });
      return duelater;
    }


    static completed_todos(){
      const completedItems = this.findAll({
        where:{
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

    deleteId(id){
      return this.destroy({where : {id}});
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