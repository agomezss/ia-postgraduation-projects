export class GameService {
  async getGames() {
    const response = await fetch("./data/games.json");
    return await response.json();
  }

  async getGameById(id) {
    const games = await this.getGames();
    return games.find((game) => game.id === id);
  }

  async getGamesByIds(ids) {
    const games = await this.getGames();
    return games.filter((game) => ids.includes(game.id));
  }
}
