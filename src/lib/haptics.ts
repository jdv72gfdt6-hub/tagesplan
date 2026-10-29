let label: HTMLLabelElement | null = null;

/**
 * Kurzes, leichtes Vibrieren. Safari kennt navigator.vibrate nicht;
 * ab iOS 18 löst das Umschalten eines <input switch> eine Haptik aus.
 */
export function haptic() {
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(8);
    return;
  }
  if (!label) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.id = 'haptic-switch';
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;
    input.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;left:-9px';
    label = document.createElement('label');
    label.htmlFor = input.id;
    label.style.display = 'none';
    document.body.append(input, label);
  }
  label.click();
}
