export class UserController {
  #userService;
  #userView;
  #events;
  constructor({ userView, userService, events }) {
    this.#userView = userView;
    this.#userService = userService;
    this.#events = events;
  }

  static init(deps) {
    return new UserController(deps);
  }

  async renderUsers(nonTrainedUser) {
    const users = await this.#userService.getDefaultUsers();

    this.#userService.addUser(nonTrainedUser);
    const defaultAndNonTrained = [nonTrainedUser, ...users];

    this.#userView.renderUserOptions(defaultAndNonTrained);
    this.setupCallbacks();
    this.setupGameObserver();

    this.#events.dispatchUsersUpdated({ users: defaultAndNonTrained });
  }

  setupCallbacks() {
    this.#userView.registerUserSelectCallback(this.handleUserSelect.bind(this));
    this.#userView.registerGameRemoveCallback(this.handleGameRemove.bind(this));
  }

  setupGameObserver() {
    this.#events.onGameAdded(async (...data) => {
      return this.handleGameAdded(...data);
    });
  }

  async handleUserSelect(userId) {
    const user = await this.#userService.getUserById(userId);
    this.#events.dispatchUserSelected(user);
    return this.displayUserDetails(user);
  }

  async handleGameAdded({ user, game }) {
    const updatedUser = await this.#userService.getUserById(user.id);
    updatedUser.games.push({
      ...game,
    });

    await this.#userService.updateUser(updatedUser);

    const lastGame = updatedUser.games[updatedUser.games.length - 1];
    this.#userView.addPastGame(lastGame);
    this.#events.dispatchUsersUpdated({
      users: await this.#userService.getUsers(),
    });
  }

  async handleGameRemove({ userId, game }) {
    const user = await this.#userService.getUserById(userId);
    const index = user.games.findIndex((item) => item.id === game.id);

    if (index !== -1) {
      user.games.splice(index, 1); // directly remove one item at the found index
      await this.#userService.updateUser(user);

      const updatedUsers = await this.#userService.getUsers();
      this.#events.dispatchUsersUpdated({ users: updatedUsers });
    }
  }

  async displayUserDetails(user) {
    this.#userView.renderUserDetails(user);
    this.#userView.renderPastGames(user.games);
  }

  getSelectedUserId() {
    return this.#userView.getSelectedUserId();
  }
}
