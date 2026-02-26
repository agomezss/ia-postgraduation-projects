import { View } from "./View.js";

export class GameView extends View {
  // DOM elements
  #gameList = document.querySelector("#gameList");

  #buttons;
  // Templates and callbacks
  #gameTemplate;
  #onBuyGame;

  constructor() {
    super();
    this.init();
  }

  async init() {
    this.#gameTemplate = await this.loadTemplate(
      "./src/view/templates/game-card.html",
    );
  }

  onUserSelected(user) {
    // Enable buttons if a user is selected, otherwise disable them
    this.setButtonsState(user.id ? false : true);
  }

  registerPlayGameCallback(callback) {
    this.#onBuyGame = callback;
  }

  render(games, disableButtons = true) {
    if (!this.#gameTemplate) return;
    const html = games
      .map((game) => {
        const score =
          typeof game.score === "number" ? game.score.toFixed(4) : "-";
        const reason = game.reason || "Sem explicação disponível.";

        return this.replaceTemplate(this.#gameTemplate, {
          id: game.id,
          name: game.name,
          category: game.category,
          metacritic: game.metacritic,
          score,
          reason,
          game: encodeURIComponent(JSON.stringify(game)),
        });
      })
      .join("");

    this.#gameList.innerHTML = html;
    this.attachPlayButtonListeners();

    // Disable all buttons by default
    this.setButtonsState(disableButtons);
  }

  setButtonsState(disabled) {
    if (!this.#buttons) {
      this.#buttons = document.querySelectorAll(".play-now-btn");
    }
    this.#buttons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  attachPlayButtonListeners() {
    this.#buttons = document.querySelectorAll(".play-now-btn");
    this.#buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const game = JSON.parse(decodeURIComponent(button.dataset.game));
        const originalText = button.innerHTML;

        button.innerHTML = '<i class="bi bi-check-circle-fill"></i> Added';
        button.classList.remove("btn-primary");
        button.classList.add("btn-success");
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove("btn-success");
          button.classList.add("btn-primary");
        }, 500);
        this.#onBuyGame(game, button);
      });
    });
  }
}
