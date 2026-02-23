import {
  applyTheme,
  applyFontSize,
  loadTemplate,
  displayLoadingMessage,
  convertMarkdownToHtml,
  getLanguageName
} from "./utils.js";

let content = "";

const copyContent = async () => {
  const operationStatus = document.getElementById("operation-status");
  let clipboardContent = `${content.replace(/\n+$/, "")}\n\n`;

  // Copy the content to the clipboard
  await navigator.clipboard.writeText(clipboardContent);

  // Display a message indicating that the content was copied
  operationStatus.textContent = chrome.i18n.getMessage("popup_copied");
  setTimeout(() => operationStatus.textContent = "", 1000);
};

const getSelectedText = () => {
  // Return the selected text
  return window.getSelection().toString();
};

const detectLanguage = async (text) => {
  let detector;

  try {
    // Create the language detector and monitor the download progress of the model
    detector = await self.LanguageDetector.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Language Detector: Downloaded ${Math.floor(e.loaded * 100)}%`);
        });
      },
    });
  } catch (error) {
    // If the language detector fails to load, provide a message with instructions to retry
    const runLabel = chrome.i18n.getMessage("popup_button_run");
    const retryMessage = chrome.i18n.getMessage("popup_error_gesture_detector", runLabel);
    throw new Error(`${error.message}\n\n${retryMessage}`, { cause: error });
  }

  try {
    const results = await detector.detect(text);
    return results[0]?.detectedLanguage || "en";
  } catch {
    return "en";
  }
};

const createTranslator = async (sourceLanguage, targetLanguage) => {
  let availability;

  // Skip availability check if source and target languages are the same
  if (sourceLanguage === targetLanguage) {
    availability = "unavailable";
  } else {
    availability = await self.Translator.availability({
      sourceLanguage,
      targetLanguage,
    });
  }

  if (availability === "unavailable") {
    const sourceLangName = getLanguageName(sourceLanguage);
    const targetLangName = getLanguageName(targetLanguage);
    const errorMessage = chrome.i18n.getMessage("popup_error_translation_unavailable", [sourceLangName, targetLangName]);
    throw new Error(errorMessage);
  }

  let translator;

  try {
    // Create the translator and monitor the download progress of the model
    translator = await self.Translator.create({
      sourceLanguage,
      targetLanguage,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Translator Model: Downloaded ${Math.floor(e.loaded * 100)}%`);
        });
      },
    });
  } catch (error) {
    // If the translator model fails to load, provide a message with instructions to retry
    const runLabel = chrome.i18n.getMessage("popup_button_run");
    const retryMessage = chrome.i18n.getMessage("popup_error_gesture_translator", runLabel);
    throw new Error(`${error.message}\n\n${retryMessage}`, { cause: error });
  }

  return translator;
};

const translateText = async (translator, text) => {
  const contentElement = document.getElementById("content");

  // Split text by paragraph breaks (2 or more newlines)
  const parts = text.split(/((?:\r?\n){2,})/);
  let fullResult = "";

  for (const part of parts) {
    if (!part) continue;

    // If the part is just newlines, append it directly
    if (/^(?:\r?\n)+$/.test(part)) {
      fullResult += part;
      contentElement.innerHTML = convertMarkdownToHtml(fullResult, false);
      continue;
    }

    // Skip translating whitespace-only paragraphs, just append them
    if (part.trim() === "") {
      fullResult += part;
      contentElement.innerHTML = convertMarkdownToHtml(fullResult, false);
      continue;
    }

    const stream = translator.translateStreaming(part);
    let partResult = "";

    for await (const chunk of stream) {
      partResult += chunk;
      contentElement.innerHTML = convertMarkdownToHtml(fullResult + partResult, false);
    }

    fullResult += partResult;
  }

  return fullResult;
};

const main = async (useCache) => {
  let displayIntervalId = 0;

  try {
    // Disable buttons and clear previous content
    document.getElementById("content").textContent = "";
    document.getElementById("status").textContent = "";
    document.getElementById("run").disabled = true;
    document.getElementById("languageCode").disabled = true;
    document.getElementById("copy").disabled = true;

    // Get the selected text
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let taskInput = "";

    try {
      taskInput = (await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getSelectedText
      }))[0].result;
    } catch (error) {
      throw new Error(chrome.i18n.getMessage("popup_error_injection_blocked"), { cause: error });
    }

    if (taskInput) {
      // Get the task cache and language code
      const taskCache = (await chrome.storage.session.get({ taskCache: "" })).taskCache;
      const languageCode = document.getElementById("languageCode").value;

      if (useCache && taskCache === JSON.stringify({ taskInput, languageCode })) {
        // Use the cached content
        content = (await chrome.storage.session.get({ contentCache: "" })).contentCache;
      } else {
        // Generate content by translating
        await chrome.storage.session.set({ taskCache: "", contentCache: "" });

        // Determine source and target languages
        displayIntervalId = setInterval(displayLoadingMessage, 500, "status", chrome.i18n.getMessage("popup_loading"));
        const sourceLanguage = await detectLanguage(taskInput);
        const targetLanguage = languageCode;

        // Display model loading message
        const translator = await createTranslator(sourceLanguage, targetLanguage);
        clearInterval(displayIntervalId);
        displayIntervalId = 0;

        // Display translating message
        displayIntervalId = setInterval(displayLoadingMessage, 500, "status", chrome.i18n.getMessage("popup_translating"));
        content = await translateText(translator, taskInput);
        clearInterval(displayIntervalId);
        displayIntervalId = 0;

        // Cache the task and content
        const taskData = JSON.stringify({ taskInput, languageCode });
        await chrome.storage.session.set({ taskCache: taskData, contentCache: content });
      }
    } else {
      content = chrome.i18n.getMessage("popup_error_no_selection");
    }
  } catch (error) {
    content = error.message;
    console.log(error);
  } finally {
    if (displayIntervalId) {
      clearInterval(displayIntervalId);
    }

    // Convert the content from Markdown to HTML
    document.getElementById("content").innerHTML = convertMarkdownToHtml(content, false);

    // Enable buttons and clear status
    document.getElementById("status").textContent = "";
    document.getElementById("run").disabled = false;
    document.getElementById("languageCode").disabled = false;
    document.getElementById("copy").disabled = false;
  }
};

const initialize = async () => {
  // Apply the theme
  applyTheme((await chrome.storage.local.get({ theme: "system" })).theme);

  // Apply font size
  applyFontSize((await chrome.storage.local.get({ fontSize: "medium" })).fontSize);

  // Load the language code template
  const languageCodeTemplate = await loadTemplate("languageCodeTemplate");
  document.getElementById("languageCodeContainer").appendChild(languageCodeTemplate);

  // Set the text direction of the body
  document.body.setAttribute("dir", chrome.i18n.getMessage("@@bidi_dir"));

  // Set the text of elements with the data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = chrome.i18n.getMessage(element.getAttribute("data-i18n"));
  });

  // Restore the language code from the local storage
  const { languageCode } = await chrome.storage.local.get({ languageCode: "en" });
  document.getElementById("languageCode").value = languageCode;

  main(true);
};

document.addEventListener("DOMContentLoaded", initialize);

document.getElementById("run").addEventListener("click", () => {
  main(false);
});

document.getElementById("copy").addEventListener("click", copyContent);

document.getElementById("options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage(() => {
    window.close();
  });
});
