:: 1. Create all directories (CMD handles nested paths automatically)
mkdir src\modules\users src\modules\auth src\modules\messages src\middlewares src\config src\utils db\migrations db\seeders db\models config

:: 2. Create all files using 'type nul >'
type nul > src\modules\users\user.controller.js & type nul > src\modules\users\user.service.js & type nul > src\modules\users\user.repository.js & type nul > src\modules\users\user.routes.js & type nul > src\modules\auth\auth.controller.js & type nul > src\modules\auth\auth.service.js & type nul > src\modules\auth\auth.routes.js & type nul > src\modules\messages\message.controller.js & type nul > src\modules\messages\message.service.js & type nul > src\modules\messages\message.repository.js & type nul > src\modules\messages\message.routes.js & type nul > src\middlewares\auth.middleware.js & type nul > src\middlewares\error.middleware.js & type nul > src\config\database.js & type nul > src\utils\jwt.js & type nul > src\app.js & type nul > src\server.js & type nul > db\models\user.model.js & type nul > db\models\message.model.js & type nul > config\config.js & type nul > .env



npm init -y
npm install express sequelize pg pg-hstore jsonwebtoken dotenv bcrypt
npm install --save-dev nodemon



npx sequelize-cli migration:generate --name create-messages

npx sequelize-cli seed:generate --name demo-user
npx sequelize-cli db:seed:all

npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo