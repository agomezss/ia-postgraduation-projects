import { View } from "./View.js";

export class ModelView extends View {
  #trainModelBtn = document.querySelector("#trainModelBtn");
  #gamesArrow = document.querySelector("#gamesArrow");
  #gamesDiv = document.querySelector("#gamesDiv");
  #allUsersGamesList = document.querySelector("#allUsersGamesList");
  #runRecommendationBtn = document.querySelector("#runRecommendationBtn");
  #onTrainModel;
  #onRunRecommendation;

  constructor() {
    super();
    this.attachEventListeners();
  }

  registerTrainModelCallback(callback) {
    this.#onTrainModel = callback;
  }
  registerRunRecommendationCallback(callback) {
    this.#onRunRecommendation = callback;
  }

  attachEventListeners() {
    this.#trainModelBtn.addEventListener("click", () => {
      this.#onTrainModel();
    });
    this.#runRecommendationBtn.addEventListener("click", () => {
      this.#onRunRecommendation();
    });

    this.#gamesDiv.addEventListener("click", () => {
      const gamesList = this.#allUsersGamesList;

      const isHidden = window.getComputedStyle(gamesList).display === "none";

      if (isHidden) {
        gamesList.style.display = "block";
        this.#gamesArrow.classList.remove("bi-chevron-down");
        this.#gamesArrow.classList.add("bi-chevron-up");
      } else {
        gamesList.style.display = "none";
        this.#gamesArrow.classList.remove("bi-chevron-up");
        this.#gamesArrow.classList.add("bi-chevron-down");
      }
    });
  }
  enableRecommendButton() {
    this.#runRecommendationBtn.disabled = false;
  }
  updateTrainingProgress(progress) {
    this.#trainModelBtn.disabled = true;
    this.#trainModelBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Training...';

    if (progress.progress === 100) {
      this.#trainModelBtn.disabled = false;
      this.#trainModelBtn.innerHTML = '<i class="bi bi-cpu"></i> Train Model';
    }
  }

  renderAllUsersGames(users) {
    const html = users
      .map((user) => {
        const gamesHtml = user.games
          .map((game) => {
            return `<span class="badge bg-light text-dark me-1 mb-1">${game.name}</span>`;
          })
          .join("");

        return `
                <div class="user-game-summary">
                    <h6>${user.name} (Age: ${user.age})</h6>
                    <div class="games-badges">
                        ${gamesHtml || '<span class="text-muted">No games</span>'}
                    </div>
                </div>
            `;
      })
      .join("");

    this.#allUsersGamesList.innerHTML = html;
  }
}
