export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function readSafeArea(): SafeArea {
  const style = getComputedStyle(document.documentElement);
  return {
    top: readInset(style, '--safe-top'),
    right: readInset(style, '--safe-right'),
    bottom: readInset(style, '--safe-bottom'),
    left: readInset(style, '--safe-left'),
  };
}

function readInset(style: CSSStyleDeclaration, name: string): number {
  const value = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : 0;
}
