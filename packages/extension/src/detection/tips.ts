export const tipsByLabel: Record<string, string[]> = {
  move_off_platform_invite: [
    'Keep conversations in the same app. Switching can hide their identity.',
    'Ask a trusted adult before moving chats somewhere new.',
  ],
  secrecy_isolation: [
    'If someone asks you to hide a chat, that is a red flag—tell a trusted adult.',
    'You never have to keep secrets that make you uncomfortable.',
  ],
  pii_request: [
    'Never share your phone number or address with someone you only know online.',
    'If someone pushes for personal info, stop the chat and report it.',
  ],
  age_gap_romance_pattern: [
    'Age gaps online are risky. You deserve friends your own age.',
    'If someone says “age is just a number,” talk to a trusted adult.',
  ],
};

export function getTipsForLabel(label: string): string[] {
  return tipsByLabel[label] ?? ['Stay cautious and talk to a trusted adult if something feels off.'];
}
