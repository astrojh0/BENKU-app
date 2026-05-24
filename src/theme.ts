export const Colors = {
  // Gradients (used in LinearGradient components)
  gradientPrimary: ['#38BDF8', '#6366F1'] as const,  // Sky blue to Indigo
  gradientSecondary: ['#06B6D4', '#3B82F6'] as const, // Cyan to Blue
  gradientAccent: ['#60A5FA', '#818CF8'] as const,    // Light blue to Purple-blue

  // Base backgrounds
  bg: '#F0F9FF',           // Light sky blue
  bgGradientStart: '#F0F9FF',
  bgGradientEnd: '#E0F2FE',
  card: 'rgba(255, 255, 255, 0.75)',
  cardAccent: 'rgba(255, 255, 255, 0.85)',
  cardBorder: 'rgba(255, 255, 255, 0.6)',

  // Primary accent colors
  accent: '#3B82F6',       // Blue
  accentPressed: '#2563EB',
  accentBorder: '#3B82F6',
  accentSecondary: '#6366F1', // Indigo

  // Text
  textPrimary: '#1E3A5F',  // Deep blue-gray
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textFurigana: '#475569',

  // Dividers & Borders
  divider: 'rgba(59, 130, 246, 0.15)',
  border: 'rgba(59, 130, 246, 0.2)',

  // Input
  inputBg: 'rgba(255, 255, 255, 0.8)',
  inputPlaceholder: '#94A3B8',

  // Header
  headerBg: 'rgba(255, 255, 255, 0.85)',
  headerBorder: 'rgba(59, 130, 246, 0.15)',
  headerTitle: '#1E3A5F',
  headerIcon: '#3B82F6',

  // Bubbles
  bubbleUser: 'rgba(59, 130, 246, 0.12)',
  bubbleUserText: '#1E3A5F',
  bubbleUserBorder: 'rgba(59, 130, 246, 0.25)',
  bubbleAi: 'rgba(255, 255, 255, 0.85)',
  bubbleAiText: '#1E3A5F',
  bubbleAiBorder: 'rgba(255, 255, 255, 0.6)',

  // Quick buttons
  quickBtnBg: 'rgba(255, 255, 255, 0.7)',
  quickBtnActiveBg: '#3B82F6',
  quickBtnText: '#64748B',
  quickBtnActiveText: '#ffffff',
  quickBtnBorder: 'rgba(59, 130, 246, 0.2)',

  // Send button
  sendBtn: '#3B82F6',
  sendBtnDisabled: '#CBD5E1',

  // Overlay & Modal
  overlay: 'rgba(30, 58, 95, 0.5)',
  modalBg: 'rgba(255, 255, 255, 0.95)',
  modalTitle: '#1E3A5F',
  modalInputBg: 'rgba(241, 245, 249, 0.8)',
  modalInputBorder: 'rgba(59, 130, 246, 0.2)',
  modalInputText: '#1E3A5F',
  modalCancelBg: 'rgba(241, 245, 249, 0.8)',
  modalCancelText: '#64748B',
  modalConfirmBg: '#3B82F6',
  modalConfirmText: '#ffffff',

  // Chips
  chipBg: 'rgba(255, 255, 255, 0.7)',
  chipActiveBg: '#3B82F6',
  chipText: '#64748B',
  chipActiveText: '#ffffff',
  chipBorder: 'rgba(59, 130, 246, 0.2)',

  // Danger
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  dangerText: '#DC2626',

  // Links
  link: '#3B82F6',

  // Stars
  star: '#F59E0B',
  masteredStar: '#F59E0B',

  // Player
  playerFab: '#3B82F6',
  playerFabText: '#ffffff',
  nowPlayingBg: 'rgba(255, 255, 255, 0.9)',
  nowPlayingBorder: 'rgba(59, 130, 246, 0.2)',

  // List items
  itemActiveBg: 'rgba(59, 130, 246, 0.1)',
  itemActiveBorder: '#3B82F6',
  itemText: '#1E3A5F',
  itemTranslation: '#64748B',
  itemDate: '#94A3B8',
  itemPressed: 'rgba(59, 130, 246, 0.08)',
  itemBorder: 'rgba(59, 130, 246, 0.15)',

  // Switch
  switchTrack: '#CBD5E1',
  switchTrackActive: '#3B82F6',
  switchThumb: '#ffffff',

  // Stepper
  stepperBg: 'rgba(255, 255, 255, 0.8)',
  stepperText: '#1E3A5F',

  // Clear button
  clearBtnBg: 'rgba(239, 68, 68, 0.1)',
  clearBtnText: '#DC2626',

  // About
  aboutText: '#64748B',

  // Dots
  dotInactive: '#CBD5E1',
  dotActive: '#3B82F6',

  // Parse
  parseItemBorder: 'rgba(59, 130, 246, 0.15)',
  parseActionBorder: 'rgba(59, 130, 246, 0.2)',
  parseActionText: '#64748B',

  // Menu
  menuBg: 'rgba(255, 255, 255, 0.95)',
  menuBorder: 'rgba(59, 130, 246, 0.15)',
  menuItemText: '#1E3A5F',
  menuDivider: 'rgba(59, 130, 246, 0.1)',

  // Selector
  selectorBg: 'rgba(255, 255, 255, 0.9)',
  selectorText: '#1E3A5F',
  selectorArrow: '#64748B',

  // Fallback icon
  fallbackIconBg: 'rgba(59, 130, 246, 0.1)',
  fallbackIconText: '#3B82F6',

  // Checkmark
  checkmark: '#3B82F6',

  // History
  historyTitle: '#1E3A5F',
  historyItemText: '#1E3A5F',
  historyItemDate: '#94A3B8',
  historySeparator: 'rgba(59, 130, 246, 0.15)',
  historyEmpty: '#94A3B8',

  // Sheet
  sheetBg: 'rgba(255, 255, 255, 0.98)',
  sheetTitle: '#1E3A5F',
  sheetDivider: 'rgba(59, 130, 246, 0.15)',
  sheetLabel: '#64748B',
  sheetCancel: '#64748B',

  // Folders
  folderChipBg: 'rgba(255, 255, 255, 0.7)',
  folderChipActiveBg: '#3B82F6',
  folderChipText: '#64748B',
  folderChipActiveText: '#ffffff',
  folderChipBorder: 'rgba(59, 130, 246, 0.2)',

  // Sort button
  sortBtnBg: 'rgba(255, 255, 255, 0.7)',
  sortBtnText: '#64748B',

  // Add folder
  addFolderBg: 'rgba(255, 255, 255, 0.7)',
  addFolderText: '#3B82F6',

  // Text input
  textInputBg: 'rgba(255, 255, 255, 0.8)',
  textInputBorder: 'rgba(59, 130, 246, 0.2)',
  textInputText: '#1E3A5F',

  // Link card
  linkCardBg: 'rgba(255, 255, 255, 0.8)',
  linkCardBorder: 'rgba(59, 130, 246, 0.15)',
  linkText: '#3B82F6',

  // About
  aboutTitle: '#1E3A5F',

  // Progress
  progressText: '#64748B',

  // Now playing
  nowSentence: '#1E3A5F',
  nowKana: '#64748B',
  nowTranslation: '#64748B',
  passInfo: '#94A3B8',

  // Empty
  emptyText: '#94A3B8',

  // Control buttons
  ctrlBtnBg: 'rgba(255, 255, 255, 0.8)',
  playBtnBg: '#3B82F6',
  playBtnText: '#ffffff',

  // Section title
  sectionTitle: '#64748B',

  // Row
  rowLabel: '#64748B',
  rowValue: '#1E3A5F',

  // Close
  closeText: '#64748B',

  // Glass effects
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
};

export const Spacing = {
  cardPaddingV: 14,
  cardPaddingH: 18,
  cardRadius: 16,
  accentBorderWidth: 1,
};

export const FontSize = {
  sentence: 16,
  translation: 14,
  furigana: 12,
  sectionTitle: 13,
  listItem: 15,
};

export const Shadows = {
  card: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};
