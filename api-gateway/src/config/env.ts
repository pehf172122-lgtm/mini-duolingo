import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  SERVICES: {
  USER: process.env.USER_SERVICE_URL!,
  CONTENT: process.env.CONTENT_SERVICE_URL!,
  VOCABULARY: process.env.VOCABULARY_SERVICE_URL!,
  PRONUNCIATION: process.env.PRONUNCIATION_SERVICE_URL!,
  GAMIFICATION: process.env.GAMIFICATION_SERVICE_URL!
  }
};

export default config;
