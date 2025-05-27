import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTheme, getTheme, setTheme } from './theme' // Adjust path as necessary
import BrowserStorage from '@/utils/api/storage' 
import { COLOR_THEME_KEY } from '@/utils/const' 

// Mock BrowserStorage
vi.mock('@/utils/api/storage', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  style: {
    setProperty: vi.fn(),
  },
  dataset: {},
} as unknown as DocumentElement & { dataset: { theme?: string } } // Added dataset for theme

// Mock window.matchMedia
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: false, // Default value
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  addListener: vi.fn(), // deprecated but jsdom might expect it
  removeListener: vi.fn(), // deprecated but jsdom might expect it
}));

describe('Theme Utilities', () => {
  let originalDocumentElement: any
  let originalMatchMedia: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Save original objects and assign mocks
    originalDocumentElement = Object.getOwnPropertyDescriptor(global, 'document')
    originalMatchMedia = Object.getOwnPropertyDescriptor(global, 'window')

    Object.defineProperty(global, 'document', {
      value: { documentElement: mockDocumentElement },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(global, 'window', {
      value: { matchMedia: mockMatchMedia },
      writable: true,
      configurable: true,
    })

    // Reset dataset theme
    delete mockDocumentElement.dataset.theme
    // Reset style color scheme
    mockDocumentElement.style.colorScheme = ''

  })

  afterEach(() => {
    // Restore original objects
    if (originalDocumentElement) {
      Object.defineProperty(global, 'document', originalDocumentElement)
    }
    if (originalMatchMedia) {
      Object.defineProperty(global, 'window', originalMatchMedia)
    }
  })

  describe('getTheme', () => {
    it('should return the stored theme from BrowserStorage', async () => {
      (BrowserStorage.get as vi.Mock).mockResolvedValue('dark')
      const theme = await getTheme()
      expect(theme).toBe('dark')
      expect(BrowserStorage.get).toHaveBeenCalledWith(COLOR_THEME_KEY)
    })

    it('should return "system" if no theme is stored', async () => {
      (BrowserStorage.get as vi.Mock).mockResolvedValue(undefined)
      const theme = await getTheme()
      expect(theme).toBe('system')
    })
  })

  describe('setTheme', () => {
    it('should save the theme using BrowserStorage', async () => {
      await setTheme('light')
      expect(BrowserStorage.set).toHaveBeenCalledWith(COLOR_THEME_KEY, 'light')
    })
  })

  describe('useTheme', () => {
    it('should apply "light" theme correctly', async () => {
      (BrowserStorage.get as vi.Mock).mockResolvedValue('light')
      await useTheme()
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark')
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light')
      expect(mockDocumentElement.dataset.theme).toBe('light')
      expect(mockDocumentElement.style.colorScheme).toBe('light')
    })

    it('should apply "dark" theme correctly', async () => {
      (BrowserStorage.get as vi.Mock).mockResolvedValue('dark')
      await useTheme()
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light')
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark')
      expect(mockDocumentElement.dataset.theme).toBe('dark')
      expect(mockDocumentElement.style.colorScheme).toBe('dark')
    })

    describe('System Theme', () => {
        it('should apply system dark theme if preferred', async () => {
            (BrowserStorage.get as vi.Mock).mockResolvedValue('system');
            // Ensure the specific mock call for this test returns the desired `matches` value
            mockMatchMedia.mockImplementationOnce(query => ({
              matches: true, // System prefers dark
              media: query,
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
              dispatchEvent: vi.fn(),
              addListener: vi.fn(),
              removeListener: vi.fn(),
            }));
            await useTheme();
            expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
            expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
            expect(mockDocumentElement.dataset.theme).toBe('dark');
            expect(mockDocumentElement.style.colorScheme).toBe('dark');
        });

        it('should apply system light theme if preferred', async () => {
            (BrowserStorage.get as vi.Mock).mockResolvedValue('system');
            // Mock matchMedia to return false for dark, implying light is preferred
            mockMatchMedia.mockImplementationOnce((query) => ({ // mockImplementationOnce so it doesn't affect other tests
                matches: false, // System prefers light
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            }));
            await useTheme();
            expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
            expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');
            expect(mockDocumentElement.dataset.theme).toBe('light');
            expect(mockDocumentElement.style.colorScheme).toBe('light');
        });


        it('should add a listener for system theme changes', async () => {
            (BrowserStorage.get as vi.Mock).mockResolvedValue('system');
            // mockMatchMedia is already returning an object with addEventListener
            await useTheme();

            expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
            // Check if the addEventListener on the object returned by mockMatchMedia was called
            const mqlInstance = mockMatchMedia.mock.results[mockMatchMedia.mock.results.length -1].value; // Get the last returned MQL object
            expect(mqlInstance.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should update theme when system preference changes', async () => {
            let capturedChangeCallback: ((e: { matches: boolean }) => void) | null = null;
            const mqlInstance = {
                matches: false, // Initially system prefers light
                media: '(prefers-color-scheme: dark)',
                addEventListener: vi.fn((event, cb) => {
                    if (event === 'change') {
                        capturedChangeCallback = cb;
                    }
                }),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(), // Added for completeness if SUT uses it
                addListener: vi.fn(),   // deprecated
                removeListener: vi.fn(),// deprecated
            };
            // Use mockReturnValue to ensure this specific mqlInstance is used by useTheme
            mockMatchMedia.mockReturnValue(mqlInstance);

            (BrowserStorage.get as vi.Mock).mockResolvedValue('system');
            await useTheme(); // Apply initial (light)

            expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');
            expect(mockDocumentElement.dataset.theme).toBe('light');

            // Clear mock history before the next interaction within the same test
            mockDocumentElement.classList.remove.mockClear();
            mockDocumentElement.classList.add.mockClear();

            // Simulate system theme change to dark
            expect(capturedChangeCallback).not.toBeNull();
            if (capturedChangeCallback) capturedChangeCallback({ matches: true }); // System now prefers dark
            

            expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light'); 
            expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark'); 
            expect(mockDocumentElement.dataset.theme).toBe('dark');
            expect(mockDocumentElement.style.colorScheme).toBe('dark');

            // Clear mock history again for the next interaction
            mockDocumentElement.classList.remove.mockClear();
            mockDocumentElement.classList.add.mockClear();

             // Simulate system theme change back to light
            expect(capturedChangeCallback).not.toBeNull();
            if (capturedChangeCallback) capturedChangeCallback({ matches: false }); // System now prefers light
            
            expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark'); 
            expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light'); 
            expect(mockDocumentElement.dataset.theme).toBe('light');
            expect(mockDocumentElement.style.colorScheme).toBe('light');
        });
    });

    it('should default to system light theme if stored theme is invalid', async () => {
      (BrowserStorage.get as vi.Mock).mockResolvedValue('funky'); // Invalid theme
      mockMatchMedia.mockImplementationOnce(query => ({ // System prefers light
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
      await useTheme();
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');
      expect(mockDocumentElement.dataset.theme).toBe('light');
      expect(mockDocumentElement.style.colorScheme).toBe('light');
    });
  })
})
