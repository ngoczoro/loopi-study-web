let current = null;

export function playAudio(url) {
  if (!url) return;
  current?.pause();
  current = new Audio(url);
  current.play().catch(() => {});
}

export function stopAudio() {
  current?.pause();
  current = null;
}
