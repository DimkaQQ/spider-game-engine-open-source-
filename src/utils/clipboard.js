/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — copy text to the clipboard without ever throwing.
 * The async Clipboard API is refused on plain http, in some webviews and when permission is denied;
 * then a hidden textarea and execCommand("copy") is the fallback. Resolves true when the text was copied.
 */
export async function copyText(text) {
  const value = String(text ?? "");
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext !== false) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the textarea route */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
