import type { TileId } from "../game/types";

function getTileSvg(tileId: TileId): string {
  switch (tileId) {
    case "miner":
      return '<path d="M6.5 17.5 12 12"/><path d="m11 6 7 7"/><path d="M8.5 8.5h8"/><path d="M9.5 14.5 6 18" />';
    case "rich_miner":
      return '<path d="M6.5 17.5 12 12"/><path d="m11 6 7 7"/><path d="M8.5 8.5h8"/><path d="M9.5 14.5 6 18" /><circle cx="17.2" cy="6.8" r="1.8" fill="currentColor" stroke="none"/>';
    case "booster":
      return '<circle cx="12" cy="12" r="6.5"/><path d="M12 8v8"/><path d="M8 12h8"/>';
    case "doubler":
      return '<rect x="5" y="7" width="6.5" height="10" rx="1.2"/><rect x="12.5" y="7" width="6.5" height="10" rx="1.2"/>';
    case "tripler":
      return '<rect x="4.5" y="7" width="4.2" height="10" rx="1"/><rect x="9.9" y="7" width="4.2" height="10" rx="1"/><rect x="15.3" y="7" width="4.2" height="10" rx="1"/>';
    case "bank":
      return '<rect x="6" y="7" width="12" height="3" rx="1.2"/><rect x="5" y="11" width="14" height="3" rx="1.2"/><rect x="7" y="15" width="10" height="3" rx="1.2"/>';
    case "vault":
      return '<path d="M7 7h10v10H7z"/><circle cx="12" cy="12" r="2.2"/><path d="M12 10v4"/><path d="M10 12h4"/>';
    case "investment":
      return '<path d="M6.5 15.5 10 12l2.2 2.2L17.5 8.5"/><path d="M17.5 8.5h-3"/><path d="M17.5 8.5v3"/>';
    case "splitter":
      return '<path d="M12 6v5"/><path d="M12 11 7.5 18"/><path d="M12 11 16.5 18"/><circle cx="12" cy="6" r="1.4"/>';
    case "relay":
      return '<path d="M6 12h10"/><path d="m12 8 4 4-4 4"/><path d="M6 8v8"/>';
    case "chain":
      return '<circle cx="9" cy="12" r="3.2"/><circle cx="15" cy="12" r="3.2"/><path d="M11.4 10.3h1.2"/><path d="M11.4 13.7h1.2"/>';
    case "edge":
      return '<path d="M7 6v12"/><path d="M7 6h10"/><path d="M11 10h4"/><path d="M11 14h4"/>';
    case "corner":
      return '<path d="M7 7v10h10"/><path d="M7 7h6"/><path d="M11 11h4"/><path d="M11 15h6"/>';
    case "risk":
      return '<path d="M12 6.5 18 17H6Z"/><path d="M12 10.2v3.8"/><circle cx="12" cy="15.8" r=".7" fill="currentColor" stroke="none"/>';
    case "decay":
      return '<path d="M8 8c1.5 2.8 1.5 5.2 0 8"/><path d="M12 6c2 3.5 2 7 0 12"/><path d="M16 8c1.5 2.8 1.5 5.2 0 8"/>';
    case "cleaner":
      return '<path d="M7 17h10"/><path d="M9 17V8h6v9"/><path d="M8 8h8"/><path d="M10 5h4"/>';
    case "anchor":
      return '<path d="M12 5v12"/><circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none"/><path d="M7 13c0 3 2.2 5 5 5s5-2 5-5"/><path d="M7 13H4"/><path d="M17 13h3"/>';
  }
}

export function createTileVisual(tileId: TileId, size: "board" | "shop" = "board"): HTMLElement {
  const tile = document.createElement("div");
  tile.className = `tile-visual tile-visual--${size}`;
  tile.dataset.tileId = tileId;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("tile-visual__icon");
  svg.innerHTML = getTileSvg(tileId);

  tile.append(svg);

  return tile;
}
