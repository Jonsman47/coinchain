import { formatCoins, formatCompactNumber } from "../game/formatting";
import type { AppStore } from "../app/store";

export function createControlsPanel(store: AppStore): HTMLElement {
  const section = document.createElement("section");
  section.className = "side-card controls-panel";

  const label = document.createElement("span");
  label.className = "side-card__label";
  label.textContent = "Day";

  const buttonRow = document.createElement("div");
  buttonRow.className = "controls-panel__buttons";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "control-button";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => {
    store.reset();
  });

  buttonRow.append(resetButton);

  const skipDayButton = document.createElement("button");
  skipDayButton.type = "button";
  skipDayButton.className = "control-button control-button--primary";
  skipDayButton.textContent = "Skip Day";
  skipDayButton.addEventListener("click", () => {
    store.skipDay();
  });

  buttonRow.append(skipDayButton);

  const summary = document.createElement("div");
  summary.className = "controls-panel__summary";

  const timeLine = document.createElement("span");
  timeLine.className = "controls-panel__line";

  const goalLine = document.createElement("span");
  goalLine.className = "controls-panel__line";

  const statusLine = document.createElement("span");
  statusLine.className = "controls-panel__line controls-panel__line--soft";

  const actionRow = document.createElement("div");
  actionRow.className = "controls-panel__actions";

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "control-button";
  retryButton.addEventListener("click", () => {
    store.retryLevel();
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "control-button control-button--primary";
  nextButton.addEventListener("click", () => {
    store.nextLevel();
  });

  actionRow.append(retryButton, nextButton);
  summary.append(timeLine, goalLine, statusLine);
  section.append(label, buttonRow, summary, actionRow);

  store.subscribe(
    ({
      bestCycleIncome,
      boardColumns,
      boardRows,
      campaignDifficultyName,
      currentLevelIndex,
      dayClockLabel,
      dayRemainingLabel,
      endlessScore,
      goalPaceLabel,
      goalProgressLabel,
      lastCycleIncome,
      lastResolvedCycle,
      levelRunState,
      mode,
      nextExpansionCost,
      pressureCost,
      showGoalPrediction,
      skipDayAvailable,
      statusMessage
    }) => {
      const isPlaying = levelRunState === "playing";
      const isEndless = mode === "endless";

      section.dataset.state = levelRunState;
      section.dataset.mode = mode;

      label.textContent = isEndless
        ? "Run"
        : `${campaignDifficultyName ?? "Easy"} / Day ${currentLevelIndex + 1}`;
      resetButton.disabled = false;
      skipDayButton.hidden = isEndless || !isPlaying || !skipDayAvailable;

      if (!isPlaying) {
        timeLine.textContent = isEndless
          ? `Final score ${formatCompactNumber(endlessScore)}`
          : levelRunState === "set_complete"
            ? "Normal mode clear"
            : "Day ended";
        goalLine.textContent = isEndless
          ? `Grid ${boardRows}x${boardColumns} / Best +${formatCompactNumber(bestCycleIncome)}`
          : statusMessage;
        statusLine.textContent = isEndless
          ? `Cycles ${lastResolvedCycle ?? 0} / Upkeep -${formatCompactNumber(pressureCost)}`
          : nextExpansionCost === null
            ? `Grid ${boardRows}x${boardColumns} / Expansion maxed`
            : `Grid ${boardRows}x${boardColumns} / Next edge on board`;
      } else if (isEndless) {
        timeLine.textContent =
          lastResolvedCycle === null
            ? `Cycle 0 / Score ${formatCompactNumber(endlessScore)}`
            : `Cycle ${lastResolvedCycle} / +${formatCompactNumber(lastCycleIncome ?? 0)} / Score ${formatCompactNumber(endlessScore)}`;
        goalLine.textContent =
          nextExpansionCost === null
            ? `Grid ${boardRows}x${boardColumns} / Expansion maxed`
            : `Grid ${boardRows}x${boardColumns} / Next edge ${formatCoins(nextExpansionCost)}`;
        statusLine.textContent = `Best +${formatCompactNumber(bestCycleIncome)} / Upkeep -${formatCompactNumber(pressureCost)}`;
      } else {
        timeLine.textContent = `Clock ${dayClockLabel} / ${dayRemainingLabel} left`;
        goalLine.textContent = goalProgressLabel;
        statusLine.textContent = showGoalPrediction
          ? `Grid ${boardRows}x${boardColumns} / ${goalPaceLabel}`
          : nextExpansionCost === null
            ? `Grid ${boardRows}x${boardColumns} / Expansion maxed`
            : `Grid ${boardRows}x${boardColumns} / Next edge ${formatCoins(nextExpansionCost)}`;
      }

      retryButton.hidden = levelRunState !== "failed";
      retryButton.textContent = isEndless ? "Retry Run" : "Retry Day";

      nextButton.hidden = levelRunState !== "set_complete";
      nextButton.textContent = "Restart Set";
      actionRow.hidden = retryButton.hidden && nextButton.hidden;
    }
  );

  return section;
}
