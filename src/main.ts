import "./styles/app.css";
import { createGameShell } from "./app/createGameShell";

const rootElement = document.querySelector<HTMLDivElement>("#app");

if (!rootElement) {
  throw new Error("Coin Chain root element was not found.");
}

rootElement.append(createGameShell());

