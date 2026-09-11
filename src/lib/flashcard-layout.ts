/** Fixed chrome inside a flip face: badge + hint + horizontal padding (px). */
const FACE_CHROME = 92;
const MIN_SCENE_HEIGHT = 120;
const FACE_HORIZONTAL_PADDING = 32;

const FRONT_TEXT_CLASS =
  "text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap text-center";
const BACK_TEXT_CLASS =
  "text-sm leading-relaxed text-foreground whitespace-pre-wrap text-left";

export type FlashcardSceneLayout = {
  height: number;
  scrollable: boolean;
  contentMaxHeight: number | undefined;
};

let measureNode: HTMLDivElement | null = null;

function getMeasureNode(): HTMLDivElement {
  if (!measureNode) {
    measureNode = document.createElement("div");
    measureNode.setAttribute("aria-hidden", "true");
    measureNode.style.cssText =
      "position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;";
    document.body.appendChild(measureNode);
  }
  return measureNode;
}

export function maxSceneHeight(): number {
  if (typeof window === "undefined") return 400;
  return Math.min(400, Math.round(window.innerHeight * 0.55));
}

function measureTextHeight(text: string, width: number, textClassName: string): number {
  if (typeof window === "undefined" || width <= 0) return 0;

  const node = getMeasureNode();
  node.style.width = `${Math.max(0, width - FACE_HORIZONTAL_PADDING)}px`;
  node.className = textClassName;
  node.textContent = text.trim() || " ";
  return node.scrollHeight;
}

function layoutFromContentHeight(contentHeight: number): FlashcardSceneLayout {
  const maxScene = maxSceneHeight();
  const natural = contentHeight + FACE_CHROME;

  if (natural <= maxScene) {
    return {
      height: Math.max(MIN_SCENE_HEIGHT, natural),
      scrollable: false,
      contentMaxHeight: undefined,
    };
  }

  return {
    height: maxScene,
    scrollable: true,
    contentMaxHeight: maxScene - FACE_CHROME,
  };
}

export function measureFlashcardScene(contentEl: HTMLElement | null): FlashcardSceneLayout {
  if (!contentEl) {
    return { height: MIN_SCENE_HEIGHT, scrollable: false, contentMaxHeight: undefined };
  }
  return layoutFromContentHeight(contentEl.scrollHeight);
}

export function measureFlashcardSides(
  frontText: string,
  backText: string,
  containerWidth: number,
  flipped: boolean,
): FlashcardSceneLayout {
  const frontHeight = measureTextHeight(
    frontText || "Empty prompt",
    containerWidth,
    FRONT_TEXT_CLASS,
  );
  const backHeight = measureTextHeight(
    backText || "No answer yet",
    containerWidth,
    BACK_TEXT_CLASS,
  );
  return layoutFromContentHeight(flipped ? backHeight : frontHeight);
}

export function pickFlashcardSceneLayout(
  frontEl: HTMLElement | null,
  backEl: HTMLElement | null,
  flipped: boolean,
): FlashcardSceneLayout {
  return measureFlashcardScene(flipped ? backEl : frontEl);
}
