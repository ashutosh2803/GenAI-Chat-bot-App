function plainKey(event, key) {
  return (
    event.key === key &&
    !event.shiftKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.isComposing
  );
}

export function isSendShortcut(event) {
  return event.key === "Enter" && !event.shiftKey && !event.altKey && !event.isComposing;
}

export function isClearShortcut(event) {
  return plainKey(event, "Escape");
}

export function isRecallShortcut(event) {
  return plainKey(event, "ArrowUp");
}

export function isFocusComposerShortcut(event) {
  return (
    event.key.toLowerCase() === "k" &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    !event.isComposing
  );
}

export function isAltLetter(event, letter) {
  return (
    event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.isComposing &&
    event.key.toLowerCase() === letter
  );
}

export function composerShortcutHint(signedIn) {
  const shared = "Enter send · Shift+Enter new line · Esc clear · ↑ last message · Ctrl+K focus";
  if (signedIn) return `${shared} · Alt+N new chat · Alt+↑/↓ switch chat`;
  return `${shared} · Alt+L login · Alt+R register`;
}
