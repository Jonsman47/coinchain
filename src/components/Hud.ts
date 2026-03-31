import type { AppStore } from "../app/store";
import { formatCoins, formatCompactNumber } from "../game/formatting";
import type { SpeedMultiplier } from "../game/types";

const speedOptions: Exclude<SpeedMultiplier, 0>[] = [0.5, 1, 2, 3];

function createChip(label: string, value: string, compact = false): {
  element: HTMLElement;
  labelElement: HTMLSpanElement;
  valueElement: HTMLSpanElement;
} {
  const chip = document.createElement("div");
  chip.className = compact ? "top-chip top-chip--compact" : "top-chip";

  const labelElement = document.createElement("span");
  labelElement.className = "top-chip__label";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "top-chip__value";
  valueElement.textContent = value;

  chip.append(labelElement, valueElement);

  return {
    element: chip,
    labelElement,
    valueElement
  };
}

function createBackIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("stroke-width", "1.9");
  svg.setAttribute("aria-hidden", "true");

  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "path");
  chevron.setAttribute("d", "M14.5 6.5 9 12l5.5 5.5");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", "M10 12h9");

  svg.append(chevron, line);

  return svg;
}

export function createHud(store: AppStore, onBackToMenu: () => void): HTMLElement {
  const header = document.createElement("header");
  header.className = "game-topbar";

  const leftControls = document.createElement("div");
  leftControls.className = "game-topbar__side game-topbar__side--left";

  const centerStack = document.createElement("div");
  centerStack.className = "game-topbar__center";

  const chipsRow = document.createElement("div");
  chipsRow.className = "game-topbar__chips";

  const controlRow = document.createElement("div");
  controlRow.className = "game-topbar__controls";

  const spacer = document.createElement("div");
  spacer.className = "game-topbar__side game-topbar__side--spacer";

  const dayChip = createChip("Day", "1", true);
  const difficultyChip = createChip("Diff", "Easy", true);
  const clockChip = createChip("Clock", "0:00", true);
  const moneyChip = createChip("Money / Goal", "0 / 0");
  const incomeChip = createChip("Money/s", "+0", true);

  chipsRow.append(
    difficultyChip.element,
    dayChip.element,
    clockChip.element,
    moneyChip.element,
    incomeChip.element
  );

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "back-button";
  backButton.setAttribute("aria-label", "Back to main menu");
  backButton.append(createBackIcon());
  backButton.addEventListener("click", () => {
    onBackToMenu();
  });

  const pauseButton = document.createElement("button");
  pauseButton.type = "button";
  pauseButton.className = "time-button";
  pauseButton.textContent = "Pause";
  pauseButton.addEventListener("click", () => {
    store.togglePause();
  });

  const speedButtons = new Map<Exclude<SpeedMultiplier, 0>, HTMLButtonElement>();
  const speedRow = document.createElement("div");
  speedRow.className = "speed-control";

  speedOptions.forEach((speed) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "time-button speed-button";
    button.textContent = `${speed}x`;
    button.addEventListener("click", () => {
      store.setSpeed(speed);
    });
    speedButtons.set(speed, button);
    speedRow.append(button);
  });

  leftControls.append(backButton);
  controlRow.append(pauseButton, speedRow);
  centerStack.append(chipsRow, controlRow);
  header.append(leftControls, centerStack, spacer);

  store.subscribe(
    ({
      campaignDifficultyName,
      coins,
      currentLevelIndex,
      dayClockLabel,
      dayGoalShortLabel,
      endlessScore,
      lastResolvedCycle,
      mode,
      projectedIncome,
      speedMultiplier
    }) => {
      if (mode === "endless") {
        difficultyChip.element.hidden = true;
        dayChip.labelElement.textContent = "Mode";
        dayChip.valueElement.textContent = "Endless";
        clockChip.labelElement.textContent = "Cycle";
        clockChip.valueElement.textContent = String(lastResolvedCycle ?? 0);
        moneyChip.labelElement.textContent = "Money / Score";
        moneyChip.valueElement.textContent = `${formatCoins(coins)} / ${formatCompactNumber(endlessScore)}`;
      } else {
        difficultyChip.element.hidden = false;
        difficultyChip.labelElement.textContent = "Diff";
        difficultyChip.valueElement.textContent = campaignDifficultyName ?? "Easy";
        dayChip.labelElement.textContent = "Day";
        dayChip.valueElement.textContent = String(currentLevelIndex + 1);
        clockChip.labelElement.textContent = "Clock";
        clockChip.valueElement.textContent = dayClockLabel;
        moneyChip.labelElement.textContent = "Money / Goal";
        moneyChip.valueElement.textContent = `${formatCoins(coins)} / ${dayGoalShortLabel}`;
      }

      incomeChip.valueElement.textContent =
        projectedIncome >= 0
          ? `+${formatCompactNumber(projectedIncome)}`
          : formatCompactNumber(projectedIncome);
      pauseButton.textContent = speedMultiplier === 0 ? "Resume" : "Pause";
      pauseButton.classList.toggle("is-active", speedMultiplier === 0);

      speedButtons.forEach((button, speed) => {
        button.classList.toggle("is-active", speedMultiplier === speed);
      });
    }
  );

  return header;
}
