// Public surface for the cto-brain gateway (OpenAI→Ollama bridge for jarvis).
export {
  startGateway,
  openAIModelsFromJarvis,
  ollamaToOpenAIChat,
  ollamaLineToSSE,
  ollamaToolCallsToOpenAI,
} from "./bridge.mjs";
