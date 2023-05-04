![chat-gpt-pro](https://user-images.githubusercontent.com/24843808/235703116-edf34df5-a4f8-4751-a586-9410b28e7f0e.gif)

I created this extension because I was writing prompts for ChatGPT in VSCode and thought it would be nice to have a text input similar to VSCode on ChatGPT.  
By installing this extension, it replaces the regular textarea on https://chat.openai.com/ with VSCode (Monaco Editor).

- You can use VSCode shortcuts.
- The editor area can be freely resized.
- The Monaco Editor has a markdown extension installed, supporting markdown syntax input.
- You can send messages with Ctrl/Cmd + Enter.

Please report any bugs or feature requests in the [Issues](https://github.com/hand-dot/chat-gpt-pro/issues).

Enjoy a comfortable ChatGPT input experience.

---

## Information for developers

### Build 
*Ideally, I should run `tsc && vite build`, but due to an error, it is currently being executed in development mode with vite.
```
npm run dev
```

### Develop
```
npm run dev
```
ref: https://crxjs.dev/vite-plugin/getting-started/vanilla-js/dev-basics