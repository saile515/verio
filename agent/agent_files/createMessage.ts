async function createMessage(sessionId: string, prompt: string) {
    const session = getSession(sessionId);
  
    checkPromptLimit(session.state.promptCount);
  
    trackEvent(session.state.history, "prompt", prompt);
  
    const result = await runAgent(
      session.client,
      session.state,
      prompt
    );
  
    trackEvent(
      session.state.history,
      "response",
      result.text,
      result.mode
    );
  
    return result;
  }