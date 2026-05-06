import axios from 'axios';

const PRONUNCIATION_URL =
  process.env.PRONUNCIATION_SERVICE_URL ||
  'http://127.0.0.1:3000/api/v1/pronunciation';

export async function evaluatePronunciation(
  token: string,
  data: {
    word: string;
    expectedText: string;
    transcribedText?: string;
  }
) {
  try {
    const res = await axios.post(
      `${PRONUNCIATION_URL}/evaluate`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.error('❌ pronunciation error:', error?.response?.data || error.message);
    throw new Error('Pronunciation service failed');
  }
}