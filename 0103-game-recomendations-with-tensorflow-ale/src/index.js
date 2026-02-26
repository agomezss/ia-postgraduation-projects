import { UserController } from "./controller/UserController.js";
import { GameController } from "./controller/GameController.js";
import { ModelController } from "./controller/ModelTrainingController.js";
import { TFVisorController } from "./controller/TFVisorController.js";
import { TFVisorView } from "./view/TFVisorView.js";
import { UserService } from "./service/UserService.js";
import { GameService } from "./service/GameService.js";
import { UserView } from "./view/UserView.js";
import { GameView } from "./view/GameView.js";
import { ModelView } from "./view/ModelTrainingView.js";
import Events from "./events/events.js";
import { WorkerController } from "./controller/WorkerController.js";

// Create shared services
const userService = new UserService();
const gameService = new GameService();

// Create views
const userView = new UserView();
const gameView = new GameView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();
const mlWorker = new Worker("/src/workers/modelTrainingWorker.js", {
  type: "module",
});

// Set up worker message handler
const w = WorkerController.init({
  worker: mlWorker,
  events: Events,
});

const users = await userService.getDefaultUsers();
w.triggerTrain(users);

ModelController.init({
  modelView,
  userService,
  events: Events,
});

TFVisorController.init({
  tfVisorView,
  events: Events,
});

GameController.init({
  gameView: gameView,
  userService,
  gameService,
  events: Events,
});

const userController = UserController.init({
  userView,
  userService,
  gameService,
  events: Events,
});

userController.renderUsers({
  id: 99,
  name: "Josézin da Silva",
  age: 30,
  games: [],
});
