import BrowserStorage from '../../../utils/api/storage'
import {
  COLOR_THEME_KEY,
  SETTINGS_MAX_STORED_TABS_KEY,
  SETTINGS_CHROME_SYNC_ENABLED_KEY,
} from '../../../utils/const'

// Get DOM Elements
const themeSelect = document.getElementById('theme') as HTMLSelectElement
const maxTabsInput = document.getElementById('max-tabs') as HTMLInputElement
const enableSyncCheckbox = document.getElementById(
  'enable-sync'
) as HTMLInputElement
const saveButton = document.querySelector('button[type="button"]') as HTMLButtonElement // Assuming this is the save button

// Default values
const DEFAULT_THEME = 'system'
const DEFAULT_MAX_TABS = 100
const DEFAULT_SYNC_ENABLED = false

// Load Settings Function
async function loadSettings() {
  try {
    // Load sync enabled status (always from local)
    let syncEnabled = await BrowserStorage.get<boolean>(
      SETTINGS_CHROME_SYNC_ENABLED_KEY,
      'local'
    )
    if (syncEnabled === undefined) syncEnabled = DEFAULT_SYNC_ENABLED
    enableSyncCheckbox.checked = syncEnabled

    const storageArea = syncEnabled ? 'sync' : 'local'

    // Load theme
    let theme = await BrowserStorage.get<string>(COLOR_THEME_KEY, storageArea)
    if (theme === undefined) theme = DEFAULT_THEME
    themeSelect.value = theme

    // Load max stored tabs
    let maxTabs = await BrowserStorage.get<number>(
      SETTINGS_MAX_STORED_TABS_KEY,
      storageArea
    )
    if (maxTabs === undefined) maxTabs = DEFAULT_MAX_TABS
    maxTabsInput.value = maxTabs.toString()

    console.log('Settings loaded successfully.')
  } catch (error) {
    console.error('Error loading settings:', error)
    // Optionally, display an error message to the user
    alert('Error loading settings. Please try again.')
  }
}

// Save Settings Function
async function saveSettings() {
  try {
    const selectedTheme = themeSelect.value
    const currentMaxTabs = parseInt(maxTabsInput.value, 10)
    const syncEnabled = enableSyncCheckbox.checked

    // Validate maxTabsInput
    if (isNaN(currentMaxTabs) || currentMaxTabs < 1) {
        alert('Max Stored Tabs must be a number greater than or equal to 1.');
        // Restore to previous valid value or a default
        loadSettings(); // Reload settings to revert to previous state
        return;
    }


    // Save sync enabled status (always to local)
    await BrowserStorage.set(
      SETTINGS_CHROME_SYNC_ENABLED_KEY,
      syncEnabled,
      'local'
    )

    const storageArea = syncEnabled ? 'sync' : 'local'

    // Save theme
    await BrowserStorage.set(COLOR_THEME_KEY, selectedTheme, storageArea)

    // Save max stored tabs
    await BrowserStorage.set(
      SETTINGS_MAX_STORED_TABS_KEY,
      currentMaxTabs,
      storageArea
    )

    if (saveButton) {
        const originalButtonText = saveButton.textContent
        saveButton.textContent = 'Settings Saved!'
        setTimeout(() => {
            saveButton.textContent = originalButtonText
        }, 2000) // Revert after 2 seconds
    }
    console.log('Settings saved successfully to', storageArea, 'storage.')

  } catch (error) {
    console.error('Error saving settings:', error)
    if (saveButton) {
        saveButton.textContent = 'Save Failed!'
        saveButton.classList.add('bg-red-600', 'hover:bg-red-700');
        saveButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        setTimeout(() => {
            saveButton.textContent = 'Save Settings';
            saveButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            saveButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        }, 3000);
    }
    alert('Error saving settings. Please try again.')
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings()

  themeSelect.addEventListener('change', saveSettings)
  maxTabsInput.addEventListener('change', saveSettings)
  maxTabsInput.addEventListener('input', () => { // Basic validation while typing
    if (parseInt(maxTabsInput.value, 10) < 1 && maxTabsInput.value !== '') {
        maxTabsInput.value = '1';
    }
  });

  enableSyncCheckbox.addEventListener('change', async () => {
    // When sync setting changes, we need to potentially move settings.
    // 1. Get current values from UI (or re-load them but that might be confusing if user made unsaved changes)
    const selectedTheme = themeSelect.value
    const currentMaxTabs = parseInt(maxTabsInput.value, 10)
    const oldSyncEnabled = !enableSyncCheckbox.checked // The value *before* the change
    const newSyncEnabled = enableSyncCheckbox.checked

    if (isNaN(currentMaxTabs) || currentMaxTabs < 1) {
        alert('Max Stored Tabs must be a number greater than or equal to 1 before changing sync status.');
        enableSyncCheckbox.checked = oldSyncEnabled; // Revert checkbox
        return;
    }


    const oldStorageArea = oldSyncEnabled ? 'sync' : 'local'
    const newStorageArea = newSyncEnabled ? 'sync' : 'local'

    try {
      // Save the new sync state first (always to local)
      await BrowserStorage.set(
        SETTINGS_CHROME_SYNC_ENABLED_KEY,
        newSyncEnabled,
        'local'
      )

      // If storage area actually changed, move the settings
      if (oldStorageArea !== newStorageArea) {
        // Save theme to new area
        await BrowserStorage.set(COLOR_THEME_KEY, selectedTheme, newStorageArea)
        // Remove theme from old area
        await BrowserStorage.remove(COLOR_THEME_KEY, oldStorageArea)

        // Save max stored tabs to new area
        await BrowserStorage.set(
          SETTINGS_MAX_STORED_TABS_KEY,
          currentMaxTabs,
          newStorageArea
        )
        // Remove max stored tabs from old area
        await BrowserStorage.remove(SETTINGS_MAX_STORED_TABS_KEY, oldStorageArea)
        console.log(`Settings migrated from ${oldStorageArea} to ${newStorageArea}.`);
      } else {
        // If storage area didn't change (e.g. user toggled off then on again before settings saved),
        // just ensure current values are in the correct place.
        await BrowserStorage.set(COLOR_THEME_KEY, selectedTheme, newStorageArea)
        await BrowserStorage.set(
          SETTINGS_MAX_STORED_TABS_KEY,
          currentMaxTabs,
          newStorageArea
        )
      }


    if (saveButton) {
        const originalButtonText = saveButton.textContent
        saveButton.textContent = 'Settings Saved!'
        setTimeout(() => {
            saveButton.textContent = originalButtonText
        }, 2000)
    }
      console.log('Sync status changed and settings saved.');
    } catch (error) {
      console.error('Error changing sync status or moving settings:', error)
      alert('Error updating sync status. Please try again.')
      // Revert checkbox on error
      enableSyncCheckbox.checked = oldSyncEnabled
       await BrowserStorage.set( // try to revert sync key as well
        SETTINGS_CHROME_SYNC_ENABLED_KEY,
        oldSyncEnabled,
        'local'
      )
    }
  })

  // Save button listener (optional, if you want an explicit save button)
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings)
  }
})
