// After an edit to the unlock ladder or XP rules, remind the agent to run the balance sim.
// Reads the hook event JSON from stdin; prints a message for Claude only when it matters.
let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw || '{}');
    const file = String(evt?.tool_input?.file_path ?? '');
    if (/src[\\/]core[\\/](exercises|rules)\.ts$/.test(file)) {
      const msg = 'MaxFit: you changed the game rules (' + file.split(/[\\/]/).pop() + '). Before reporting done, run `npm run balance` and `npm run balance -- casual`, then `TZ=Asia/Manila npm test` (skill: game-balance).';
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } }));
    }
  } catch {
    /* never block the edit */
  }
});
