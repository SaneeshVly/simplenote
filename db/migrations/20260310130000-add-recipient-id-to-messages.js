'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Messages', 'recipientId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    })

    await queryInterface.addIndex('Messages', ['recipientId'])
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Messages', ['recipientId'])
    await queryInterface.removeColumn('Messages', 'recipientId')
  }
}
