import { campaignDifficulties, type CampaignDifficultyId } from "../game/campaignDifficulties";

export interface MainMenuActions {
  onContinue: () => void;
  onStartCampaign: (difficulty: CampaignDifficultyId) => void;
  onStartEndless: () => void;
}

export function createMainMenu(actions: MainMenuActions): {
  element: HTMLElement;
  setSavedRunAvailable: (available: boolean) => void;
  showRootView: () => void;
} {
  const menu = document.createElement("section");
  menu.className = "main-menu";

  const card = document.createElement("div");
  card.className = "main-menu__card";
  card.dataset.view = "root";

  const eyebrow = document.createElement("span");
  eyebrow.className = "main-menu__eyebrow";
  eyebrow.textContent = "Coin Chain";

  const title = document.createElement("h1");
  title.className = "main-menu__title";
  title.textContent = "Small board. Tight choices.";

  const subtitle = document.createElement("p");
  subtitle.className = "main-menu__subtitle";
  subtitle.textContent = "Pick a mode, place pieces, and build a board that can keep paying.";

  const showRootView = () => {
    card.dataset.view = "root";
    eyebrow.textContent = "Coin Chain";
    title.textContent = "Small board. Tight choices.";
    subtitle.textContent =
      "Pick a mode, place pieces, and build a board that can keep paying.";
  };

  const showDifficultyView = () => {
    card.dataset.view = "difficulty";
    eyebrow.textContent = "Choose Difficulty";
    title.textContent = "Normal Mode";
    subtitle.textContent = "Pick how strict the economy gets before you start the run.";
  };

  const buttons = document.createElement("div");
  buttons.className = "main-menu__actions";

  const rootActions = document.createElement("div");
  rootActions.className = "main-menu__action-group main-menu__action-group--root";

  const difficultyActions = document.createElement("div");
  difficultyActions.className = "main-menu__difficulty-list";

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.className = "main-menu__button main-menu__button--primary";
  continueButton.dataset.action = "continue-run";
  continueButton.textContent = "Continue";
  continueButton.addEventListener("click", () => {
    actions.onContinue();
  });

  const campaignButton = document.createElement("button");
  campaignButton.type = "button";
  campaignButton.className = "main-menu__button";
  campaignButton.dataset.action = "show-difficulties";
  campaignButton.textContent = "Normal";
  campaignButton.addEventListener("click", () => {
    showDifficultyView();
  });

  const endlessButton = document.createElement("button");
  endlessButton.type = "button";
  endlessButton.className = "main-menu__button";
  endlessButton.dataset.action = "start-endless";
  endlessButton.textContent = "Endless";
  endlessButton.addEventListener("click", () => {
    actions.onStartEndless();
  });

  const note = document.createElement("p");
  note.className = "main-menu__note";
  note.textContent = "Backing out saves your current run here.";

  rootActions.append(continueButton, campaignButton, endlessButton);

  campaignDifficulties.forEach((difficulty) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "main-menu__difficulty";
    button.dataset.difficulty = difficulty.id;
    button.addEventListener("click", () => {
      actions.onStartCampaign(difficulty.id);
    });

    const nameLine = document.createElement("span");
    nameLine.className = "main-menu__difficulty-name";
    nameLine.textContent = difficulty.name;

    const summaryLine = document.createElement("span");
    summaryLine.className = "main-menu__difficulty-summary";
    summaryLine.textContent = [
      difficulty.showPrediction ? "Forecast on" : "Forecast off",
      difficulty.keepMoneyBetweenDays ? "Money kept" : "Money wiped",
      difficulty.tileCostMultiplier === 1
        ? "Base prices"
        : `Prices +${Math.round((difficulty.tileCostMultiplier - 1) * 100)}%`
    ].join(" / ");

    const descriptionLine = document.createElement("span");
    descriptionLine.className = "main-menu__difficulty-description";
    descriptionLine.textContent = difficulty.description;

    button.append(nameLine, summaryLine, descriptionLine);
    difficultyActions.append(button);
  });

  const backToModesButton = document.createElement("button");
  backToModesButton.type = "button";
  backToModesButton.className = "main-menu__button";
  backToModesButton.dataset.action = "back-to-modes";
  backToModesButton.textContent = "Back";
  backToModesButton.addEventListener("click", () => {
    showRootView();
  });

  difficultyActions.append(backToModesButton);
  buttons.append(rootActions, difficultyActions);
  card.append(eyebrow, title, subtitle, buttons, note);
  menu.append(card);

  return {
    element: menu,
    setSavedRunAvailable(available) {
      continueButton.hidden = !available;
    },
    showRootView() {
      showRootView();
    }
  };
}
