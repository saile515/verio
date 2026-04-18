export function checkPromptLimit(count: number) {
    const MAX = 10;
  
    if (count >= MAX) {
      throw new Error("Prompt limit reached");
    }
  }