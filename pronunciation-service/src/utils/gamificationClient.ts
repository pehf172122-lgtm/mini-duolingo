import axios from 'axios';

const GAMIFICATION_URL =
  process.env.GAMIFICATION_SERVICE_URL ||
  'http://127.0.0.1:3000/api/v1/gamification';

export async function sendUserAction(
  token: string,
  userId: string,
  actionType: string
) {
  try {
    const response = await axios.post(
      `${GAMIFICATION_URL}/action`,
      { actionType },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
   );

    return response.data;
  } catch (error: any) {
    console.error('❌ Gamification error:', error?.response?.data || error.message);
    return null;
  }
}