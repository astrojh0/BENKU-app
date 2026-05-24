export const Colors = {
  // Base
  bg: '#fafafa',
  card: '#ffffff',
  cardAccent: '#ffffff',

  // Primary (softer dark with subtle warmth)
  accent: '#1a1a1a',
  accentPressed: '#333333',
  accentBorder: '#e5e5e5',

  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#6b6b6b',
  textMuted: '#9b9b9b',
  textFurigana: '#666666',

  // Dividers & Borders - softer
  divider: 'rgba(0, 0, 0, 0.06)',
  border: 'rgba(0, 0, 0, 0.08)',

  // Input
  inputBg: '#f5f5f5',
  inputPlaceholder: '#9b9b9b',

  // Header
  headerBg: '#ffffff',
  headerBorder: 'rgba(0, 0, 0, 0.06)',
  headerTitle: '#1a1a1a',
  headerIcon: '#1a1a1a',

  // Bubbles - enhanced depth
  bubbleUser: '#1a1a1a',
  bubbleUserText: '#ffffff',
  bubbleAi: '#ffffff',
  bubbleAiText: '#1a1a1a',

  // Quick buttons
  quickBtnBg: '#f0f0f0',
  quickBtnActiveBg: '#1a1a1a',
  quickBtnText: '#6b6b6b',
  quickBtnActiveText: '#ffffff',

  // Send button
  sendBtn: '#1a1a1a',
  sendBtnDisabled: '#d4d4d4',

  // Overlay & Modal
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBg: '#ffffff',
  modalTitle: '#1a1a1a',
  modalInputBg: '#f5f5f5',
  modalInputBorder: 'rgba(0, 0, 0, 0.08)',
  modalInputText: '#1a1a1a',
  modalCancelBg: '#f0f0f0',
  modalCancelText: '#6b6b6b',
  modalConfirmBg: '#1a1a1a',
  modalConfirmText: '#ffffff',

  // Chips
  chipBg: '#f0f0f0',
  chipActiveBg: '#1a1a1a',
  chipText: '#6b6b6b',
  chipActiveText: '#ffffff',

  // Danger
  dangerBg: '#fef2f2',
  dangerText: '#dc2626',

  // Links
  link: '#1a1a1a',

  // Stars
  star: '#1a1a1a',
  masteredStar: '#fbbf24',

  // Player
  playerFab: '#1a1a1a',
  playerFabText: '#ffffff',
  nowPlayingBg: '#ffffff',
  nowPlayingBorder: 'rgba(0, 0, 0, 0.06)',

  // List items
  itemActiveBg: '#f5f5f5',
  itemActiveBorder: '#1a1a1a',
  itemText: '#1a1a1a',
  itemTranslation: '#6b6b6b',
  itemDate: '#9b9b9b',
  itemPressed: '#f0f0f0',
  itemBorder: 'rgba(0, 0, 0, 0.06)',

  // Switch
  switchTrack: '#e0e0e0',
  switchThumb: '#ffffff',

  // Stepper
  stepperBg: '#f0f0f0',
  stepperText: '#1a1a1a',

  // Clear button
  clearBtnBg: '#fef2f2',
  clearBtnText: '#dc2626',

  // About
  aboutText: '#6b6b6b',

  // Dots
  dotInactive: '#d4d4d4',
  dotActive: '#1a1a1a',

  // Parse
  parseItemBorder: 'rgba(0, 0, 0, 0.06)',
  parseActionBorder: 'rgba(0, 0, 0, 0.06)',
  parseActionText: '#6b6b6b',

  // Menu
  menuBg: '#ffffff',
  menuBorder: 'rgba(0, 0, 0, 0.08)',
  menuItemText: '#1a1a1a',
  menuDivider: 'rgba(0, 0, 0, 0.06)',

  // Selector
  selectorBg: '#ffffff',
  selectorText: '#1a1a1a',
  selectorArrow: '#6b6b6b',

  // Fallback icon
  fallbackIconBg: '#f0f0f0',
  fallbackIconText: '#1a1a1a',

  // Checkmark
  checkmark: '#1a1a1a',

  // History
  historyTitle: '#1a1a1a',
  historyItemText: '#1a1a1a',
  historyItemDate: '#9b9b9b',
  historySeparator: 'rgba(0, 0, 0, 0.06)',
  historyEmpty: '#9b9b9b',

  // Sheet
  sheetBg: '#ffffff',
  sheetTitle: '#1a1a1a',
  sheetDivider: 'rgba(0, 0, 0, 0.06)',
  sheetLabel: '#6b6b6b',
  sheetCancel: '#6b6b6b',

  // Folders
  folderChipBg: '#f0f0f0',
  folderChipActiveBg: '#1a1a1a',
  folderChipText: '#6b6b6b',
  folderChipActiveText: '#ffffff',

  // Sort button
  sortBtnBg: '#f0f0f0',
  sortBtnText: '#6b6b6b',

  // Add folder
  addFolderBg: '#f0f0f0',
  addFolderText: '#1a1a1a',

  // Text input
  textInputBg: '#ffffff',
  textInputBorder: 'rgba(0, 0, 0, 0.08)',
  textInputText: '#1a1a1a',

  // Link card
  linkCardBg: '#ffffff',
  linkCardBorder: 'rgba(0, 0, 0, 0.08)',
  linkText: '#1a1a1a',

  // About
  aboutTitle: '#1a1a1a',

  // Progress
  progressText: '#6b6b6b',

  // Now playing
  nowSentence: '#1a1a1a',
  nowKana: '#6b6b6b',
  nowTranslation: '#6b6b6b',
  passInfo: '#6b6b6b',

  // Empty
  emptyText: '#9b9b9b',

  // Control buttons
  ctrlBtnBg: '#f0f0f0',
  playBtnBg: '#1a1a1a',
  playBtnText: '#ffffff',

  // Section title
  sectionTitle: '#6b6b6b',

  // Row
  rowLabel: '#6b6b6b',
  rowValue: '#6b6b6b',

  // Close
  closeText: '#6b6b6b',
};

// 阴影配置
export const Shadows = {
  // 卡片阴影
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // 浮层阴影
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // 按钮悬浮
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // FAB 按钮
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const Spacing = {
  cardPaddingV: 14,
  cardPaddingH: 18,
  cardRadius: 14, // 更大的圆角，更现代
  accentBorderWidth: 1,
};

export const FontSize = {
  sentence: 16,
  translation: 14,
  furigana: 12,
  sectionTitle: 13,
  listItem: 15,
};
