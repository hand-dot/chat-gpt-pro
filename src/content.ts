import Split from "split.js";
import { monaco } from "./editor";
import { MarkdownExtension } from "./extensions";
import codicon from "./codicon.ttf";

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
    "main .w-full.h-32.flex-shrink-0"
  ) as HTMLDivElement | null;
  if (spacer) spacer.style.display = "none";
};

const submitInput = (editor: monaco.editor.IStandaloneCodeEditor) => {
  removeSpacer();
  const value = editor.getValue();
  const textarea = document.querySelector(
    "main textarea"
  ) as HTMLTextAreaElement;
  if (!textarea) return;
  textarea.value = value;
  const enterKeyEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  textarea.dispatchEvent(enterKeyEvent);
  editor.setValue("");
};

const init = () => {
  const chatArea = document.querySelector(
    "main > div.flex-1.overflow-hidden"
  ) as HTMLDivElement;
  if (!chatArea) return setTimeout(init, 1000);

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
  const editor = monaco.editor.create(editorElem, {
    automaticLayout: true,
    fontSize: 16,
    language: "markdown",
    minimap: { enabled: false },
  });

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
    "main > div.absolute.bottom-0.left-0.w-full"
  ) as HTMLDivElement | null;
  if (formWrapper) formWrapper.style.cssText = `position: relative;`;

  const textAreaWrapper = document.querySelector(
    "main > div.absolute.bottom-0.left-0.w-full > form > div > div.flex.flex-col.w-full.py-2.flex-grow"
  ) as HTMLDivElement | null;
  if (textAreaWrapper) textAreaWrapper.style.display = "none";

  const sizesStr = localStorage.getItem("split-sizes");
  const sizes: [number, number] = sizesStr ? JSON.parse(sizesStr) : [50, 50];

  Split([chatArea, editorElem], {
    sizes,
    direction: "vertical",
    minSize: 60,
    onDragStart: () => {
      if (formWrapper) formWrapper.style.cssText = `position: absolute;`;
    },
    onDragEnd: (sizes) => {
      if (formWrapper) formWrapper.style.cssText = `position: relative;`;
      localStorage.setItem("split-sizes", JSON.stringify(sizes));
    },
  });

  removeSpacer();
};

let href = location.href;
const observer = new MutationObserver(() => {
  if (
    href !== location.href &&
    document.getElementsByClassName("split").length === 0
  ) {
    href = location.href;
    init();
  }
});
observer.observe(document, { childList: true, subtree: true });

createStyleElement();
init();
