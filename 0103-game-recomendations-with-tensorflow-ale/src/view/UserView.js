import { View } from "./View.js";

export class UserView extends View {
  #userSelect = document.querySelector("#userSelect");
  #userAge = document.querySelector("#userAge");
  #pastGamesList = document.querySelector("#pastGamesList");

  #gameTemplate;
  #onUserSelect;
  #onGameRemove;
  #pastGameElements = [];

  constructor() {
    super();
    this.init();
  }

  async init() {
    this.#gameTemplate = await this.loadTemplate(
      "./src/view/templates/past-game.html",
    );
    this.attachUserSelectListener();
  }

  registerUserSelectCallback(callback) {
    this.#onUserSelect = callback;
  }

  registerGameRemoveCallback(callback) {
    this.#onGameRemove = callback;
  }

  renderUserOptions(users) {
    const options = users
      .map((user) => {
        return `<option value="${user.id}">${user.name}</option>`;
      })
      .join("");

    this.#userSelect.innerHTML += options;
  }

  renderUserDetails(user) {
    this.#userAge.value = user.age;
  }

  renderPastGames(pastGames) {
    if (!this.#gameTemplate) return;

    if (!pastGames || pastGames.length === 0) {
      this.#pastGamesList.innerHTML = "<p>No past games found.</p>";
      return;
    }

    const html = pastGames
      .map((game) => {
        return this.replaceTemplate(this.#gameTemplate, {
          ...game,
          game: encodeURIComponent(JSON.stringify(game)),
        });
      })
      .join("");

    this.#pastGamesList.innerHTML = html;
    this.attachGameClickHandlers();
  }

  addPastGame(game) {
    if (this.#pastGamesList.innerHTML.includes("No past games found")) {
      this.#pastGamesList.innerHTML = "";
    }

    const gameHtml = this.replaceTemplate(this.#gameTemplate, {
      ...game,
      game: encodeURIComponent(JSON.stringify(game)),
    });

    this.#pastGamesList.insertAdjacentHTML("afterbegin", gameHtml);

    const newGame =
      this.#pastGamesList.firstElementChild.querySelector(".past-game");
    newGame.classList.add("past-game-highlight");

    setTimeout(() => {
      newGame.classList.remove("past-game-highlight");
    }, 1000);

    this.attachGameClickHandlers();
  }

  attachUserSelectListener() {
    this.#userSelect.addEventListener("change", (event) => {
      const userId = event.target.value ? Number(event.target.value) : null;

      if (userId) {
        if (this.#onUserSelect) {
          this.#onUserSelect(userId);
        }
      } else {
        this.#userAge.value = "";
        this.#pastGamesList.innerHTML = "";
      }
    });
  }

  attachGameClickHandlers() {
    this.#pastGameElements = [];

    const gameElements = document.querySelectorAll(".past-game");

    gameElements.forEach((gameElement) => {
      this.#pastGameElements.push(gameElement);

      gameElement.onclick = (event) => {
        const game = JSON.parse(decodeURIComponent(gameElement.dataset.game));
        const userId = this.getSelectedUserId();
        const element = gameElement.closest(".col-md-6");

        this.#onGameRemove({ element, userId, game });

        element.style.transition = "opacity 0.5s ease";
        element.style.opacity = "0";

        setTimeout(() => {
          element.remove();

          if (document.querySelectorAll(".past-game").length === 0) {
            this.renderPastGames([]);
          }
        }, 500);
      };
    });
  }

  getSelectedUserId() {
    return this.#userSelect.value ? Number(this.#userSelect.value) : null;
  }
}
