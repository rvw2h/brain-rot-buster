import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : process.env.GROQ_API_KEY,
});

export default groq;
