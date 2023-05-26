import React, { useState, useEffect } from 'react'
import ReactDOM from "react-dom/client";
import Split from "split.js";
import { ThemeProvider, BaseStyles, Box, Text, Button, IconButton, ActionMenu, ActionList, Textarea, TextInput } from '@primer/react'
import { Dialog } from '@primer/react/drafts'
import { PencilIcon, TrashIcon } from '@primer/octicons-react'
import { monaco } from "./editor";
import { MarkdownExtension } from "./extensions";
import codicon from "./codicon.ttf";
import "./content.css"


interface Template {
  name: string;
  content: string;
}


const moveAndBreakEditorBottom = (editor: monaco.editor.IStandaloneCodeEditor) => {
  const model = editor.getModel();
  if (!model) return;

  const lineCount = model.getLineCount();
  editor.revealLine(lineCount);

  editor.setPosition({ lineNumber: lineCount, column: model.getLineMaxColumn(lineCount) });
  editor.trigger('', 'type', { text: '\n' });

  setTimeout(() => {
    editor.focus();
  }, 100);
}

const Template = ({ editor }: { editor: monaco.editor.IStandaloneCodeEditor }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Template>({
    name: "",
    content: ""
  })
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    chrome.storage.sync.get(['templates'], (result) => {
      setTemplates(result.templates || [])
    });
  }, [])

  const openDialog = React.useCallback(() => setIsOpen(true), [setIsOpen])
  const closeDialog = React.useCallback(() => setIsOpen(false), [setIsOpen])

  return <ThemeProvider>
    <BaseStyles>
      {isOpen && (
        <Dialog
          title="Register a new template"

          footerButtons={[{
            content: 'OK', onClick: () => {
              if (!newTemplate.name || !newTemplate.content) {
                alert("Name and content are required.")
                return
              }

              const newTemplateIndex = templates.findIndex(t => t.name === newTemplate.name)
              const updatedTemplates = newTemplateIndex !== -1
                ? [...templates.slice(0, newTemplateIndex), newTemplate, ...templates.slice(newTemplateIndex + 1)]
                : [...templates, newTemplate];

              chrome.storage.sync.set({ templates: updatedTemplates }, () => {
                setTemplates(updatedTemplates)
                setNewTemplate({ name: "", content: "" })
                closeDialog()
              });
            }

          }]}
          onClose={closeDialog}
        >
          <Box>
            <Text as="label" display="flex" mb={2} htmlFor="name">
              Name
            </Text>
            <TextInput id="name" block name="name" value={newTemplate.name}
              onChange={
                (e) => setNewTemplate({ ...newTemplate, name: e.target.value })
              } />
          </Box>

          <Box mt={4}>
            <Text as="label" display="flex" mb={2} htmlFor="content">
              Content
            </Text>
            <Textarea id="content" block name="content" value={newTemplate.content} onChange={
              (e) => setNewTemplate({ ...newTemplate, content: e.target.value })
            } />
          </Box>
        </Dialog>
      )}

      <div style={{ position: "fixed", bottom: 14, right: 240, }} >
        <ActionMenu>
          <ActionMenu.Button title='The template can be accessed using the ⌘+⌥+{1~9} shortcuts.'>Template</ActionMenu.Button>

          <ActionMenu.Overlay>
            <ActionList style={{ width: 310 }}>

              {templates.map((template, i) => (
                <ActionList.Item key={template.name} onSelect={() => {
                  editor.setValue(template.content)
                  moveAndBreakEditorBottom(editor)
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {i < 9 ? `${i + 1}. ` : "・ "}
                    {template.name}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <IconButton style={{ marginRight: '0.25rem' }} aria-label="Edit" icon={PencilIcon} onClick={() => {
                        setNewTemplate(template)
                        openDialog()
                      }} />
                      <IconButton aria-label="Remove" icon={TrashIcon} onClick={() => {
                        window.confirm("Are you sure you want to delete this template?") &&
                          chrome.storage.sync.set({ templates: templates.filter(t => t.name !== template.name) }, () => {
                            setTemplates(templates.filter(t => t.name !== template.name))
                          });
                      }} />
                    </div>

                  </div>
                </ActionList.Item>
              ))}
              {templates.length === 0 && <ActionList.Item disabled>No template.</ActionList.Item>}
              <ActionList.Divider />
              <ActionList.Item onSelect={openDialog}>New template.</ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </div>
    </BaseStyles>
  </ThemeProvider>
}


const markdownExtension = new MarkdownExtension();

const LS_KEY = "chat-gpt-pro:split-sizes";
const SELECTOR = {
  SPACER: "main .w-full.h-32.flex-shrink-0",
  TEXTAREA: "main textarea",
  TEXTAREA_WRAPPER:
    "main > div.absolute.bottom-0.left-0.w-full > form > div > div.flex.flex-col.w-full.py-2.flex-grow",
  THREAD_AREA: "main > div.flex-1.overflow-hidden",
  FORM_WRAPPER: "main > div.absolute.bottom-0.left-0.w-full",
};

const createElem = (tag: string, attrs: any = {}) => {
  const el = document.createElement(tag);
  Object.assign(el, attrs);
  return el;
};

const createStyleElement = () => {
  const style = createElem("style", {
    innerHTML: `@font-face {
      font-family: "codicon";
      font-display: block;
      src: url(${chrome.runtime.getURL(codicon)}) format("truetype");
    }`,
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
  const enterKeyEvent = new KeyboardEvent("keydown", { keyCode: 13, bubbles: true });
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

  const editorElem = createElem("div", { className: "chat-gpt-pro-editor" });
  const submitButton = createElem("button", { innerText: "Submit (Ctrl/Cmd + Enter)", className: "submit-button" });


  // prettier-ignore
  const editor = monaco.editor.create(editorElem, { automaticLayout: true, fontSize: 14, language: "markdown", minimap: { enabled: false } });

  const keyCodes = [
    monaco.KeyCode.Digit1,
    monaco.KeyCode.Digit2,
    monaco.KeyCode.Digit3,
    monaco.KeyCode.Digit4,
    monaco.KeyCode.Digit5,
    monaco.KeyCode.Digit6,
    monaco.KeyCode.Digit7,
    monaco.KeyCode.Digit8,
    monaco.KeyCode.Digit9,
  ];

  keyCodes.forEach((keyCode, i) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | keyCode, () => {
      chrome.storage.sync.get(['templates'], (result) => {
        const templates = result.templates || []
        if (templates.length > i) {
          editor.setValue(templates[i].content)
          moveAndBreakEditorBottom(editor)
        }
      });
    });
  })


  // @ts-ignore
  markdownExtension.activate(editor);
  monaco.editor.setTheme("vs-dark");

  submitButton.addEventListener("click", () => submitInput(editor));
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
    submitInput(editor)
  );

  editorElem.appendChild(submitButton);
  const templateButton = document.createElement("div");

  ReactDOM.createRoot(templateButton).render(
    <React.StrictMode>
      <Template editor={editor} />
    </React.StrictMode>
  );

  editorElem.appendChild(templateButton)
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

  setTimeout(removeSpacer, 1000);
  return 0;
};

(() => {
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

})()