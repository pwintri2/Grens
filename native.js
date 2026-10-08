/* Native platform bridge. In a normal browser every method falls back cleanly. */
(function () {
  'use strict';

  function tauri() {
    return window.__TAURI__ || null;
  }

  function nativeAvailable() {
    var api = tauri();
    return Boolean(api && api.core);
  }

  async function copyText(text) {
    var api = tauri();
    if (!nativeAvailable() || !api.clipboardManager || !api.clipboardManager.writeText) return false;
    await api.clipboardManager.writeText(text);
    return true;
  }

  async function saveTextFile(fileName, contents) {
    var api = tauri();
    if (!nativeAvailable() || !api.dialog || !api.fs) return { handled: false };
    var path = await api.dialog.save({
      title: 'Grens-back-up opslaan',
      defaultPath: fileName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (!path) return { handled: true, saved: false };
    await api.fs.writeTextFile(path, contents);
    return { handled: true, saved: true };
  }

  async function openTextFile(maxBytes) {
    var api = tauri();
    if (!nativeAvailable() || !api.dialog || !api.fs) return { handled: false };
    var path = await api.dialog.open({
      title: 'Grens-back-up kiezen',
      multiple: false,
      directory: false,
      pickerMode: 'document',
      fileAccessMode: 'scoped',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (!path) return { handled: true, opened: false };
    var metadata = await api.fs.stat(path);
    if (metadata.size > maxBytes) throw new Error('too-large');
    return { handled: true, opened: true, text: await api.fs.readTextFile(path) };
  }

  if (nativeAvailable()) document.documentElement.classList.add('native-app');
  window.GrensNative = {
    get isNative() { return nativeAvailable(); },
    copyText: copyText,
    saveTextFile: saveTextFile,
    openTextFile: openTextFile
  };
})();
