import Split from "split.js";
import { monaco } from "./editor";
import { MarkdownExtension } from "./extensions";
import codicon from "./codicon.ttf";

const style = document.createElement("style");
style.innerHTML = `@font-face {
	font-family: "codicon";
	font-display: block;
	src: url(${chrome.runtime.getURL(codicon)}) format("truetype");
}

.gutter {
    background-color: #eee;
    background-repeat: no-repeat;
    background-position: 50%;
}

.gutter.gutter-vertical {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
    backgroud-color: #8e8ea0;
    cursor: row-resize;
}`;
document.head.appendChild(style);

function removeSpacer() {
  const spacer = document.querySelector(
    "main .w-full.h-32.flex-shrink-0"
  ) as HTMLDivElement | null;
  if (spacer) {
    spacer.style.display = "none";
  }
}

function init() {
  const chatArea = document.querySelector(
    "main > div.flex-1.overflow-hidden"
  ) as HTMLDivElement;

  if (!chatArea) {
    // retry
    setTimeout(init, 1000);
    return;
  }

  chatArea.id = "split-0";

  const main = document.getElementsByTagName("main")[0]!;
  main.classList.add("split");

  const editorElem = document.createElement("div");
  editorElem.id = "split-1";
  editorElem.style.cssText = `position: relative;
  height: 300px;
  width: 100%;
  bottom: 0px;
  background: #1e1e1e;`;

  const editor = monaco.editor.create(editorElem, {
    autoIndent: "full",
    automaticLayout: true,
    fontSize: 15,
    language: "markdown",
    lineDecorationsWidth: 0,
    lineHeight: 1.6,
    minimap: { enabled: false },
    padding: { top: 16, bottom: 16 },
    quickSuggestions: false,
    wordWrap: "on",
  });

  const extension = new MarkdownExtension();
  // @ts-ignore
  extension.activate(editor);
  monaco.editor.setTheme("vs-dark");

  const submitButton = document.createElement("button");
  submitButton.innerText = "Submit (Ctrl/Cmd + Enter)";
  submitButton.style.cssText = `position: fixed;
  font-size: 13px;
  bottom: 14px;
  right: 40px;
  padding: 0.5rem;
  background-color: #1e88e5;
  border-radius: 4px;
  `;

  function submitInput() {
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
  }

  submitButton.addEventListener("click", submitInput);
  // cmd + enter to submit
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, submitInput);

  editorElem.appendChild(submitButton);

  main.appendChild(editorElem);

  editor.focus();

  const formWrapper = document.querySelector(
    "main > div.absolute.bottom-0.left-0.w-full"
  )! as HTMLDivElement;
  formWrapper.style.cssText = `position: relative;`;

  const textAreaWrapper = document.querySelector(
    "main > div.absolute.bottom-0.left-0.w-full > form > div > div.flex.flex-col.w-full.py-2.flex-grow"
  )! as HTMLDivElement;
  textAreaWrapper.style.display = "none";

  removeSpacer();

  try {
    let sizes: any = localStorage.getItem("split-sizes");
    if (sizes) {
      sizes = JSON.parse(sizes);
    } else {
      sizes = [50, 50]; // default sizes
    }

    Split(["#split-0", "#split-1"], {
      sizes,
      direction: "vertical",
      minSize: 60,
      onDragStart: function () {
        formWrapper.style.cssText = `position: absolute;`;
      },
      onDragEnd: function (sizes) {
        formWrapper.style.cssText = `position: relative;`;
        localStorage.setItem("split-sizes", JSON.stringify(sizes));
      },
    });
  } catch (e) {
    console.error(e);
    localStorage.removeItem("split-sizes");
  }
}

let href = location.href;
const observer = new MutationObserver(() => {
  if (href !== location.href) {
    if (!document.getElementById("split-0")) {
      href = location.href;
      init();
    }
  }
});
observer.observe(document, { childList: true, subtree: true });

init();
