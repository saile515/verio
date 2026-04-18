function getSession(sessionId: string) {
    if (!sessions[sessionId]) {
      const session = {
        client: new Anthropic(),
        state: createInitialState(),
      };
      session.client.apiKey = claudeKey;
      sessions[sessionId] = session;
    }
  
    return sessions[sessionId];
  }