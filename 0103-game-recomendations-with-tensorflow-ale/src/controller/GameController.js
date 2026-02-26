export class GameController {
  #gameView;
  #currentUser = null;
  #events;
  #gameService;
  constructor({ gameView, events, gameService }) {
    this.#gameView = gameView;
    this.#gameService = gameService;
    this.#events = events;
    this.init();
  }

  static init(deps) {
    return new GameController(deps);
  }

  async init() {
    this.setupCallbacks();
    this.setupEventListeners();
    const games = await this.#gameService.getGames();
    this.#gameView.render(games, true);
  }

  setupEventListeners() {
    this.#events.onUserSelected((user) => {
      this.#currentUser = user;
      this.#gameView.onUserSelected(user);
      this.#events.dispatchRecommend(user);
    });

    this.#events.onRecommendationsReady(({ recommendations, user }) => {
      const ownedGameIds = new Set((user?.games || []).map((game) => game.id));
      const ownedGameNames = new Set(
        (user?.games || []).map((game) => game.name),
      );

      const filteredRecommendations = recommendations.filter((game) => {
        if (game.id != null) {
          return !ownedGameIds.has(game.id);
        }

        return !ownedGameNames.has(game.name);
      });

      this.#gameView.render(filteredRecommendations, false);
    });
  }

  setupCallbacks() {
    this.#gameView.registerPlayGameCallback(this.handlePlayGame.bind(this));
  }

  async handlePlayGame(game) {
    const user = this.#currentUser;
    this.#events.dispatchGameAdded({ user, game });
  }
}
