export type KeybindActionId =
  | "center_board"
  | "clear_selection"
  | "confirm_menu"
  | "open_load_menu"
  | "open_pause_menu"
  | "open_save_menu"
  | "pan_down"
  | "pan_left"
  | "pan_right"
  | "pan_up"
  | "reset_focused_tile"
  | "sell_focused_tile"
  | "set_speed_half"
  | "set_speed_one"
  | "set_speed_three"
  | "set_speed_two"
  | "toggle_mute"
  | "toggle_pause"
  | "upgrade_focused_tile"
  | "zoom_in"
  | "zoom_out";

export interface KeybindActionDefinition {
  description: string;
  group: "Core" | "Navigation";
  id: KeybindActionId;
  label: string;
}

export type KeybindMap = Record<KeybindActionId, string>;

const KEYBINDS_STORAGE_KEY = "coin-chain-keybinds-v1";

export const keybindActionDefinitions: KeybindActionDefinition[] = [
  {
    description: "Pause or resume the current run.",
    group: "Core",
    id: "toggle_pause",
    label: "Pause / Resume"
  },
  {
    description: "Set the game speed to 0.5x.",
    group: "Core",
    id: "set_speed_half",
    label: "Speed 0.5x"
  },
  {
    description: "Set the game speed to 1x.",
    group: "Core",
    id: "set_speed_one",
    label: "Speed 1x"
  },
  {
    description: "Set the game speed to 2x.",
    group: "Core",
    id: "set_speed_two",
    label: "Speed 2x"
  },
  {
    description: "Set the game speed to 3x.",
    group: "Core",
    id: "set_speed_three",
    label: "Speed 3x"
  },
  {
    description: "Open or close the pause menu.",
    group: "Core",
    id: "open_pause_menu",
    label: "Pause Menu"
  },
  {
    description: "Reset the focused tile back to its default properties.",
    group: "Core",
    id: "reset_focused_tile",
    label: "Reset Focused Tile"
  },
  {
    description: "Sell the currently focused tile.",
    group: "Core",
    id: "sell_focused_tile",
    label: "Sell Focused Tile"
  },
  {
    description: "Upgrade the currently focused tile.",
    group: "Core",
    id: "upgrade_focused_tile",
    label: "Upgrade Focused Tile"
  },
  {
    description: "Clear the current selection or inspection focus.",
    group: "Core",
    id: "clear_selection",
    label: "Clear Selection"
  },
  {
    description: "Center the board camera.",
    group: "Core",
    id: "center_board",
    label: "Center Board"
  },
  {
    description: "Open the save slots panel.",
    group: "Core",
    id: "open_save_menu",
    label: "Save Game"
  },
  {
    description: "Open the load panel.",
    group: "Core",
    id: "open_load_menu",
    label: "Load Game"
  },
  {
    description: "Toggle all audio on or off.",
    group: "Core",
    id: "toggle_mute",
    label: "Toggle Mute"
  },
  {
    description: "Confirm the current menu action.",
    group: "Core",
    id: "confirm_menu",
    label: "Confirm"
  },
  {
    description: "Zoom the board camera in.",
    group: "Navigation",
    id: "zoom_in",
    label: "Zoom In"
  },
  {
    description: "Zoom the board camera out.",
    group: "Navigation",
    id: "zoom_out",
    label: "Zoom Out"
  },
  {
    description: "Pan the board upward.",
    group: "Navigation",
    id: "pan_up",
    label: "Pan Up"
  },
  {
    description: "Pan the board downward.",
    group: "Navigation",
    id: "pan_down",
    label: "Pan Down"
  },
  {
    description: "Pan the board left.",
    group: "Navigation",
    id: "pan_left",
    label: "Pan Left"
  },
  {
    description: "Pan the board right.",
    group: "Navigation",
    id: "pan_right",
    label: "Pan Right"
  }
];

export const defaultKeybinds: KeybindMap = {
  center_board: "KeyF",
  clear_selection: "KeyQ",
  confirm_menu: "Enter",
  open_load_menu: "KeyL",
  open_pause_menu: "Escape",
  open_save_menu: "KeyS",
  pan_down: "ArrowDown",
  pan_left: "ArrowLeft",
  pan_right: "ArrowRight",
  pan_up: "ArrowUp",
  reset_focused_tile: "KeyR",
  sell_focused_tile: "Delete",
  set_speed_half: "Backquote",
  set_speed_one: "Digit1",
  set_speed_three: "Digit3",
  set_speed_two: "Digit2",
  toggle_mute: "KeyM",
  toggle_pause: "Space",
  upgrade_focused_tile: "KeyE",
  zoom_in: "Equal",
  zoom_out: "Minus"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActionId(value: string): value is KeybindActionId {
  return keybindActionDefinitions.some((definition) => definition.id === value);
}

export function normalizeKeyCode(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  switch (trimmed) {
    case " ":
      return "Space";
    case "Esc":
      return "Escape";
    case "+":
      return "Equal";
    case "-":
      return "Minus";
    default:
      return trimmed;
  }
}

export function normalizeKeybinds(value: unknown): KeybindMap {
  const nextBindings: KeybindMap = { ...defaultKeybinds };

  if (!isRecord(value)) {
    return nextBindings;
  }

  Object.entries(value).forEach(([actionId, keyCode]) => {
    if (!isActionId(actionId) || typeof keyCode !== "string") {
      return;
    }

    const normalizedCode = normalizeKeyCode(keyCode);

    if (!normalizedCode) {
      return;
    }

    nextBindings[actionId] = normalizedCode;
  });

  return nextBindings;
}

export function readKeybinds(): KeybindMap {
  try {
    const raw = window.localStorage.getItem(KEYBINDS_STORAGE_KEY);

    if (!raw) {
      return { ...defaultKeybinds };
    }

    return normalizeKeybinds(JSON.parse(raw));
  } catch {
    return { ...defaultKeybinds };
  }
}

export function writeKeybinds(keybinds: KeybindMap) {
  try {
    window.localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(keybinds));
  } catch {
    // Ignore storage failures and keep input responsive.
  }
}

export function getActionForKeyCode(
  keybinds: KeybindMap,
  keyCode: string
): KeybindActionId | null {
  const normalizedCode = normalizeKeyCode(keyCode);

  return (
    keybindActionDefinitions.find(
      (definition) => keybinds[definition.id] === normalizedCode
    )?.id ?? null
  );
}

export function formatKeybindLabel(keyCode: string): string {
  switch (keyCode) {
    case "ArrowDown":
      return "Down";
    case "ArrowLeft":
      return "Left";
    case "ArrowRight":
      return "Right";
    case "ArrowUp":
      return "Up";
    case "Backquote":
      return "`";
    case "Backspace":
      return "Backspace";
    case "Delete":
      return "Delete";
    case "Digit0":
      return "0";
    case "Digit1":
      return "1";
    case "Digit2":
      return "2";
    case "Digit3":
      return "3";
    case "Enter":
      return "Enter";
    case "Equal":
      return "+";
    case "Escape":
      return "Esc";
    case "KeyE":
      return "E";
    case "KeyF":
      return "F";
    case "KeyL":
      return "L";
    case "KeyM":
      return "M";
    case "KeyQ":
      return "Q";
    case "KeyR":
      return "R";
    case "KeyS":
      return "S";
    case "Minus":
      return "-";
    case "Space":
      return "Space";
    default:
      return keyCode;
  }
}
