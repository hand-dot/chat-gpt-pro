import Split from "split.js";
import { monaco } from "./editor";
import { MarkdownExtension } from "./extensions";
import codicon from "./codicon.ttf";

const LS_KEY = "chat-gpt-pro:split-sizes";
const SELECTOR = {
  SPACER: "main .w-full.h-32.flex-shrink-0",
  TEXTAREA: "main textarea",
  TEXTAREA_WRAPPER:
    "main > div.absolute.bottom-0.left-0.w-full > form > div > div.flex.flex-col.w-full.py-2.flex-grow",
  THREAD_AREA: "main > div.flex-1.overflow-hidden",
  FORM_WRAPPER: "main > div.absolute.bottom-0.left-0.w-full",
};

const createElem = (tag: string, css: string, attrs: any = {}) => {
  const el = document.createElement(tag);
  el.style.cssText = css;
  Object.assign(el, attrs);
  return el;
};

const createStyleElement = () => {
  const style = createElem("style", "", {
    innerHTML: `@font-face {
      font-family: "codicon";
      font-display: block;
      src: url(${chrome.runtime.getURL(codicon)}) format("truetype");
    }
    .gutter { background-color: #eee; background-repeat: no-repeat; background-position: 50%; }
    .gutter.gutter-vertical { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII='); backgroud-color: #8e8ea0; cursor: row-resize; }`,
  });
  document.head.appendChild(style);
};

const removeSpacer = () => {
  const spacer = document.querySelector(
    SELECTOR.SPACER
  ) as HTMLDivElement | null;
  if (spacer) spacer.style.display = "none";
};

const submitInput = (editor: monaco.editor.IStandaloneCodeEditor) => {
  removeSpacer();
  const value = editor.getValue();
  const textarea = document.querySelector(
    SELECTOR.TEXTAREA
  ) as HTMLTextAreaElement;
  if (!textarea) return;
  textarea.value = value;
  // prettier-ignore
  const enterKeyEvent = new KeyboardEvent("keydown", {keyCode: 13, bubbles: true});
  textarea.dispatchEvent(enterKeyEvent);
  editor.setValue("");
};

const init = () => {
  const threadArea = document.querySelector(
    SELECTOR.THREAD_AREA
  ) as HTMLDivElement;
  if (!threadArea) return setTimeout(init, 1000);

  const main = document.getElementsByTagName("main")[0]!;
  main.classList.add("split");

  const editorElem = createElem(
    "div",
    `position: relative; height: 300px; width: 100%; bottom: 0px; background: #1e1e1e;`
  );
  const submitButton = createElem(
    "button",
    `position: fixed; font-size: 13px; bottom: 14px; right: 40px; padding: 0.5rem; background-color: #1e88e5; border-radius: 4px;`,
    { innerText: "Submit (Ctrl/Cmd + Enter)" }
  );

  // prettier-ignore
  const editor = monaco.editor.create(editorElem, {automaticLayout: true, fontSize: 14, language: "markdown", minimap: { enabled: false }});

  // @ts-ignore
  new MarkdownExtension().activate(editor);
  monaco.editor.setTheme("vs-dark");

  submitButton.addEventListener("click", () => submitInput(editor));
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
    submitInput(editor)
  );

  editorElem.appendChild(submitButton);
  main.appendChild(editorElem);
  editor.focus();

  const formWrapper = document.querySelector(
    SELECTOR.FORM_WRAPPER
  ) as HTMLDivElement | null;
  if (formWrapper) formWrapper.style.cssText = `position: relative;`;

  const textAreaWrapper = document.querySelector(
    SELECTOR.TEXTAREA_WRAPPER
  ) as HTMLDivElement | null;
  if (textAreaWrapper) textAreaWrapper.style.display = "none";

  const sizesStr = localStorage.getItem(LS_KEY);
  try {
    Split([threadArea, editorElem], {
      sizes: sizesStr ? JSON.parse(sizesStr) : [50, 50],
      direction: "vertical",
      minSize: 60,
      onDragStart: () => {
        if (formWrapper) formWrapper.style.cssText = `position: absolute;`;
      },
      onDragEnd: (sizes) => {
        if (formWrapper) formWrapper.style.cssText = `position: relative;`;
        localStorage.setItem(LS_KEY, JSON.stringify(sizes));
      },
    });
  } catch (e) {
    console.error(e);
    localStorage.removeItem(LS_KEY);
  }

  // setTimeout(removeSpacer, 1000);
};

createStyleElement();
init();

// Watch for changes in the DOM
let href = location.href;
const observer = new MutationObserver(() => {
  if (
    href !== location.href &&
    document.getElementsByClassName("split").length === 0 // if split is not already initialized
  ) {
    href = location.href;
    init();
  }
});
observer.observe(document, { childList: true, subtree: true });
